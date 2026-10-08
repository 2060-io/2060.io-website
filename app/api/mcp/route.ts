import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import pkg from "@/package.json";
import { verifyApiToken } from "@/app/lib/api-tokens";
import { rateLimitAllow } from "@/app/lib/rate-limit";
import { isVcAdmin } from "@/app/lib/authz";
import { guessContentType } from "@/app/lib/documents";
import * as svc from "@/app/lib/dataroom-service";
import { mcpResourceUrl } from "@/app/lib/oauth";

/**
 * The data room's MCP server (same design as the Verana Foundation site):
 * Streamable HTTP at /api/mcp, stateless, authenticated with a personal access
 * token created in /account/settings. Every tool runs as the token's user
 * through the same service layer and role checks as the website — the owner
 * must hold the VC admin role (admins do) at the time of the call; `read`
 * tokens get the read tools only. Mutations are audited as made via the MCP.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const RATE_LIMIT = { limit: 120, windowMs: 60_000 };
/** Uploads ride JSON as base64; bigger files go through the web form. */
const MAX_MCP_UPLOAD_BYTES = 15 * 1024 * 1024;

// The validated token travels on the HTTP part of the handler context.
type ToolCtx = {
  http?: { authInfo?: { clientId?: string; scopes?: string[]; extra?: Record<string, unknown> } };
};
type ToolResult = { content: { type: "text"; text: string }[]; isError?: boolean };

function actorOf(ctx: ToolCtx): svc.Actor {
  const userId = ctx.http?.authInfo?.extra?.userId;
  const email = ctx.http?.authInfo?.extra?.email;
  if (typeof userId !== "string" || typeof email !== "string") {
    throw new svc.ForbiddenError("Not authenticated.");
  }
  return { id: userId, email, via: "mcp" };
}

const ok = (data: unknown): ToolResult => ({
  content: [{ type: "text", text: typeof data === "string" ? data : JSON.stringify(data, null, 2) }],
});
const fail = (message: string): ToolResult => ({
  content: [{ type: "text", text: `Error: ${message}` }],
  isError: true,
});

/** Runs a tool body with auth, scope, rate limit and error mapping. */
async function run(
  ctx: ToolCtx,
  write: boolean,
  body: (actor: svc.Actor) => Promise<unknown>,
): Promise<ToolResult> {
  try {
    const actor = actorOf(ctx);
    const rl = rateLimitAllow(`mcp:${ctx.http?.authInfo?.clientId ?? actor.id}`, RATE_LIMIT.limit, RATE_LIMIT.windowMs);
    if (!rl.allowed) {
      return fail(`Rate limit reached; try again in ${Math.ceil((rl.resetAt - Date.now()) / 1000)}s.`);
    }
    if (write && !ctx.http?.authInfo?.scopes?.includes("write")) {
      return fail("This access token is read-only. Create a read-write token in /account/settings to change things.");
    }
    const res = await body(actor);
    if (res && typeof res === "object" && "error" in res && (res as { error?: string }).error) {
      return fail((res as { error: string }).error);
    }
    return ok(res ?? { ok: true });
  } catch (e) {
    if (e instanceof svc.ForbiddenError) return fail(`${e.message} The data room's MCP is for VC admins and admins.`);
    console.error("[mcp] tool failed:", e);
    return fail(e instanceof Error ? e.message : String(e));
  }
}

/** Decode a base64 upload (plain or data: URL), within the MCP size cap. */
function decodeBase64(s: string, what: string): Buffer {
  const clean = s.replace(/^data:[^;]+;base64,/, "").replace(/\s+/g, "");
  if (!/^[A-Za-z0-9+/_-]*={0,2}$/.test(clean)) throw new Error(`${what} must be base64.`);
  const bytes = Buffer.from(clean.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  if (bytes.length === 0) throw new Error(`${what} is empty.`);
  if (bytes.length > MAX_MCP_UPLOAD_BYTES) {
    throw new Error(`${what} is too large for MCP (15 MB max decoded); use the web form for bigger files.`);
  }
  return bytes;
}

const documentId = z.string().min(1).describe("The document id, as returned by list_documents");
const inviteRef = z.string().min(1).describe("The invite id or the invited email");
const orderArg = z
  .number()
  .int()
  .nullable()
  .optional()
  .describe("Position in the lists, lowest first; null or omitted = after the ordered entries, newest first");

const handler = createMcpHandler(
  (server) => {
    // ── Read tools ───────────────────────────────────────────────────────────
    server.registerTool(
      "get_my_profile",
      {
        title: "Who am I",
        description: "The user behind this token: name, email, roles (vc-admin, admin) and the token's scope.",
        inputSchema: z.object({}),
      },
      async (_args, ctx) =>
        run(ctx, false, async (actor) => ({
          ...(await svc.profile(actor)),
          tokenScope: ctx.http?.authInfo?.scopes?.includes("write") ? "read-write" : "read",
        })),
    );

    server.registerTool(
      "list_documents",
      {
        title: "List repository documents",
        description:
          "Every entry of the data-room repository in display order: files and URL entries, with id, size, version, order, visibility (always visible vs. per-email grants), whether it can be viewed in the browser, preview status, grant and access counts.",
        inputSchema: z.object({}),
      },
      async (_args, ctx) => run(ctx, false, (actor) => svc.listDocuments(actor)),
    );

    server.registerTool(
      "list_invites",
      {
        title: "List invited VCs",
        description:
          "Every invited email with its organization, NDA status (signed per org), grant count, access count, last sign-in / last seen, and status: never (never signed in), connected (signed in, nothing opened), active (opened or downloaded documents).",
        inputSchema: z.object({}),
      },
      async (_args, ctx) => run(ctx, false, (actor) => svc.listInvites(actor)),
    );

    server.registerTool(
      "get_invite",
      {
        title: "Invite details",
        description:
          "One invited email in detail: organization and NDA signature, the documents granted to it and the always-visible ones, its last 50 accesses (download / view / open) and its meetings.",
        inputSchema: z.object({ invite: inviteRef }),
      },
      async (args, ctx) =>
        run(ctx, false, async (actor) => (await svc.getInvite(actor, args.invite)) ?? { error: `No invite "${args.invite}".` }),
    );

    server.registerTool(
      "get_activity",
      {
        title: "Engagement summary",
        description:
          "Data-room engagement over a window (default 30 days): invited vs. connected emails, NDAs signed, accesses, top documents, accesses per email, and the 25 most recent events.",
        inputSchema: z.object({
          range_days: z.number().int().min(1).max(365).optional().describe("Window in days (default 30)"),
        }),
      },
      async (args, ctx) => run(ctx, false, (actor) => svc.activitySummary(actor, args.range_days ?? 30)),
    );

    server.registerTool(
      "get_invite_email_template",
      {
        title: "Invitation email template",
        description: "The current invitation email (subject + Markdown body), whether it was customized, and the {{placeholders}} it may use.",
        inputSchema: z.object({}),
      },
      async (_args, ctx) => run(ctx, false, (actor) => svc.getInviteTemplate(actor)),
    );

    server.registerTool(
      "get_meeting_settings",
      {
        title: "Meeting booking settings",
        description:
          "How VCs can book calls: enabled, open days (SUN..SAT), time windows (HH:MM-HH:MM, GMT), 2060-side attendees, horizon and minimum notice; plus whether Google is configured, whether booking is actually open, and attendee calendars the meetings account cannot read.",
        inputSchema: z.object({}),
      },
      async (_args, ctx) => run(ctx, false, (actor) => svc.getMeetingSettings(actor)),
    );

    server.registerTool(
      "list_meetings",
      {
        title: "List booked calls",
        description: "Calls booked by VCs (upcoming by default), with the booker, organization, times (ISO 8601 UTC) and Meet link.",
        inputSchema: z.object({
          include_past: z.boolean().optional().describe("Also list past calls"),
        }),
      },
      async (args, ctx) => run(ctx, false, (actor) => svc.listMeetings(actor, { upcomingOnly: !args.include_past })),
    );

    // ── Documents (write) ────────────────────────────────────────────────────
    server.registerTool(
      "add_document",
      {
        title: "Upload a document",
        description:
          "Add a file to the repository (version 1). Content as base64, 15 MB max — bigger files go through the web form. New documents are visible to no one until granted per invite (set_document_grants), unless always_visible.",
        inputSchema: z.object({
          title: z.string().min(1).max(200).describe("Title shown to VCs"),
          filename: z.string().min(1).describe("File name with extension (decides the type, e.g. deck.pdf)"),
          content_base64: z.string().min(1),
          always_visible: z.boolean().optional().describe("Visible to every invited email (default false)"),
          order: orderArg,
        }),
      },
      async (args, ctx) =>
        run(ctx, true, (actor) =>
          svc.addFileDocument(actor, {
            title: args.title,
            file: {
              filename: args.filename,
              contentType: guessContentType(args.filename),
              bytes: decodeBase64(args.content_base64, "content_base64"),
            },
            alwaysVisible: args.always_visible,
            sortOrder: args.order ?? null,
          }),
        ),
    );

    server.registerTool(
      "add_url_entry",
      {
        title: "Add a URL entry",
        description: "Add a labeled external link to the repository. URL entries are always visible to every invited email and open in a new window.",
        inputSchema: z.object({
          title: z.string().min(1).max(200).describe("Label shown to VCs"),
          url: z.string().url(),
          order: orderArg,
        }),
      },
      async (args, ctx) =>
        run(ctx, true, (actor) => svc.addUrlEntry(actor, { title: args.title, url: args.url, sortOrder: args.order ?? null })),
    );

    server.registerTool(
      "replace_document",
      {
        title: "Replace a document's content",
        description: "New content under the same id (version bump): grants and access history stay attached. Content as base64, 15 MB max.",
        inputSchema: z.object({
          document_id: documentId,
          filename: z.string().min(1),
          content_base64: z.string().min(1),
        }),
      },
      async (args, ctx) =>
        run(ctx, true, (actor) =>
          svc.replaceDocument(actor, args.document_id, {
            filename: args.filename,
            contentType: guessContentType(args.filename),
            bytes: decodeBase64(args.content_base64, "content_base64"),
          }),
        ),
    );

    server.registerTool(
      "remove_document",
      {
        title: "Remove a document",
        description: "Remove an entry from the repository: VCs lose access immediately; the access history keeps the title. Confirm with the user first.",
        inputSchema: z.object({ document_id: documentId }),
      },
      async (args, ctx) => run(ctx, true, (actor) => svc.removeDocument(actor, args.document_id)),
    );

    server.registerTool(
      "set_document_order",
      {
        title: "Set a document's position",
        description: "Position in every list, lowest first; null clears it (unordered entries follow the ordered ones, newest first).",
        inputSchema: z.object({ document_id: documentId, order: z.number().int().nullable() }),
      },
      async (args, ctx) => run(ctx, true, (actor) => svc.setDocumentOrder(actor, args.document_id, args.order)),
    );

    server.registerTool(
      "set_document_visibility",
      {
        title: "Set a document's visibility",
        description: "always_visible true = every invited email sees it; false = only the emails granted individually (set_document_grants).",
        inputSchema: z.object({ document_id: documentId, always_visible: z.boolean() }),
      },
      async (args, ctx) =>
        run(ctx, true, (actor) => svc.setDocumentVisibility(actor, args.document_id, args.always_visible)),
    );

    server.registerTool(
      "set_document_cover",
      {
        title: "Upload a cover image",
        description: "Use an image (PNG, JPEG, WebP…) as the preview tile of an entry — needed for HTML decks and Office files, which have no automatic preview. Kept when the content is replaced.",
        inputSchema: z.object({ document_id: documentId, image_base64: z.string().min(1) }),
      },
      async (args, ctx) =>
        run(ctx, true, (actor) =>
          svc.setDocumentCover(actor, args.document_id, decodeBase64(args.image_base64, "image_base64")),
        ),
    );

    server.registerTool(
      "remove_document_cover",
      {
        title: "Remove a cover image",
        description: "Drop the uploaded cover; the automatic preview takes over where possible (PDF, Markdown, images).",
        inputSchema: z.object({ document_id: documentId }),
      },
      async (args, ctx) => run(ctx, true, (actor) => svc.removeDocumentCover(actor, args.document_id)),
    );

    server.registerTool(
      "render_document_preview",
      {
        title: "Re-render a preview",
        description: "Render the automatic preview again from the current file (PDF / Markdown page 1, or the image).",
        inputSchema: z.object({ document_id: documentId }),
      },
      async (args, ctx) => run(ctx, true, (actor) => svc.renderDocumentPreview(actor, args.document_id)),
    );

    server.registerTool(
      "render_missing_previews",
      {
        title: "Render all missing previews",
        description: "Backfill: render a preview for every file that can have one and has none.",
        inputSchema: z.object({}),
      },
      async (_args, ctx) => run(ctx, true, (actor) => svc.renderMissingPreviews(actor)),
    );

    // ── Invitations (write) ──────────────────────────────────────────────────
    server.registerTool(
      "invite_vcs",
      {
        title: "Invite VCs",
        description:
          "Invite one or more emails under an organization (created on first use). Each new invite receives the invitation email immediately — confirm with the user first. Already-invited emails are reported as skipped.",
        inputSchema: z.object({
          org_name: z.string().min(1).max(200),
          emails: z.array(z.string().min(1)).min(1),
        }),
      },
      async (args, ctx) => run(ctx, true, (actor) => svc.inviteVcs(actor, { orgName: args.org_name, emails: args.emails })),
    );

    server.registerTool(
      "resend_invite",
      {
        title: "Re-send an invitation email",
        description: "Send the invitation email again to an existing invite.",
        inputSchema: z.object({ invite: inviteRef }),
      },
      async (args, ctx) => run(ctx, true, (actor) => svc.resendInvite(actor, args.invite)),
    );

    server.registerTool(
      "revoke_invite",
      {
        title: "Revoke an invite",
        description:
          "The email can no longer sign in and loses the data room on its next request; its upcoming calls are cancelled (attendees notified); its grants go, its access history stays. Confirm with the user first.",
        inputSchema: z.object({ invite: inviteRef }),
      },
      async (args, ctx) => run(ctx, true, (actor) => svc.revokeInvite(actor, args.invite)),
    );

    server.registerTool(
      "set_document_grants",
      {
        title: "Set the documents an invite sees",
        description:
          "Replace the per-email selection with exactly these document ids (always-visible documents need no grant and are left as they are). Use get_invite to see the current selection and list_documents for ids.",
        inputSchema: z.object({ invite: inviteRef, document_ids: z.array(z.string().min(1)) }),
      },
      async (args, ctx) => run(ctx, true, (actor) => svc.setGrants(actor, args.invite, args.document_ids)),
    );

    // ── Invitation email (write) ─────────────────────────────────────────────
    server.registerTool(
      "update_invite_email_template",
      {
        title: "Update the invitation email",
        description:
          "Replace the invitation email's subject and Markdown body. Placeholders: {{org_name}}, {{email}}, {{login_url}}; unknown placeholders are rejected. Use send_test_invite_email to check the result in a real inbox.",
        inputSchema: z.object({
          subject: z.string().min(1).max(300),
          body_markdown: z.string().min(1).max(20000),
        }),
      },
      async (args, ctx) =>
        run(ctx, true, (actor) => svc.saveInviteTemplate(actor, { subject: args.subject, bodyMarkdown: args.body_markdown })),
    );

    server.registerTool(
      "reset_invite_email_template",
      {
        title: "Reset the invitation email",
        description: "Back to the built-in default text.",
        inputSchema: z.object({}),
      },
      async (_args, ctx) => run(ctx, true, (actor) => svc.resetInviteTemplate(actor)),
    );

    server.registerTool(
      "send_test_invite_email",
      {
        title: "Send a test invitation",
        description: "Send the saved invitation email to the token owner's own address.",
        inputSchema: z.object({}),
      },
      async (_args, ctx) => run(ctx, true, (actor) => svc.sendTestInviteEmail(actor)),
    );

    // ── Meetings (write) ─────────────────────────────────────────────────────
    server.registerTool(
      "update_meeting_settings",
      {
        title: "Update meeting booking settings",
        description:
          "Change how VCs book calls. Omitted fields keep their current value. Days are SUN..SAT, windows are HH:MM-HH:MM in GMT, attendees are 2060-side emails whose calendars must be shared with the meetings account. Enabling requires at least one day, one window and one attendee.",
        inputSchema: z.object({
          enabled: z.boolean().optional(),
          open_days: z.array(z.string()).optional(),
          windows: z.array(z.string()).optional(),
          attendee_emails: z.array(z.string()).optional(),
          horizon_days: z.number().int().min(1).max(60).optional(),
          min_notice_hours: z.number().int().min(0).max(168).optional(),
        }),
      },
      async (args, ctx) =>
        run(ctx, true, async (actor) => {
          const cur = await svc.getMeetingSettings(actor);
          return svc.saveMeetingSettings(actor, {
            enabled: args.enabled ?? cur.enabled,
            openDays: args.open_days ?? cur.openDays,
            windows: args.windows ?? cur.windows.map((w) => `${w.start}-${w.end}`),
            attendeeEmails: args.attendee_emails ?? cur.attendeeEmails,
            horizonDays: args.horizon_days ?? cur.horizonDays,
            minNoticeHours: args.min_notice_hours ?? cur.minNoticeHours,
          });
        }),
    );

    server.registerTool(
      "cancel_meeting",
      {
        title: "Cancel a booked call",
        description: "Staff-side cancellation of a VC's call; Google notifies the attendees. Confirm with the user first.",
        inputSchema: z.object({ meeting_id: z.string().min(1).describe("From list_meetings") }),
      },
      async (args, ctx) => run(ctx, true, (actor) => svc.cancelMeetingAsStaff(actor, args.meeting_id)),
    );
  },
  {
    serverInfo: { name: "2060-dataroom", version: pkg.version },
    instructions:
      "The 2060 investor data room (VC admin console). You act as the VC admin who owns the access token; every change is recorded in the audit trail under their name. Dates are ISO 8601 UTC; meeting windows are GMT. Before invite_vcs (sends email at once), revoke_invite, remove_document and cancel_meeting, confirm with the user. Identify documents by the ids from list_documents and invites by id or email.",
  },
);

const authed = withMcpAuth(
  handler,
  async (_req, bearer) => {
    if (!bearer) return undefined;
    const v = await verifyApiToken(bearer);
    if (!v) return undefined;
    // An OAuth token minted for another resource is not valid here (RFC 8707).
    if (v.kind === "access" && v.resource && v.resource.replace(/\/+$/, "") !== mcpResourceUrl()) return undefined;
    // The role is resolved per request: a token outlives its owner's role only on paper.
    if (!(await isVcAdmin(v.user.email))) return undefined;
    return {
      token: bearer,
      clientId: v.tokenId,
      scopes: v.scope === "write" ? ["read", "write"] : ["read"],
      expiresAt: v.expiresAt ? Math.floor(v.expiresAt.getTime() / 1000) : undefined,
      extra: { userId: v.user.id, email: v.user.email },
    };
  },
  { required: true, resourceMetadataPath: "/.well-known/oauth-protected-resource" },
);

export { authed as GET, authed as POST, authed as DELETE };
