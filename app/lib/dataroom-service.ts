import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/app/lib/db";
import { currentUser, isAdmin, isVcAdmin } from "@/app/lib/authz";
import {
  createDocument,
  replaceDocumentContent,
  type UploadedFile,
} from "@/app/lib/documents";
import { DOCUMENT_LIST_ORDER } from "@/app/lib/document-order";
import { thumbnailSource, viewKind } from "@/app/lib/doc-view";
import {
  refreshAutoThumbnail,
  removeCustomThumbnail,
  setCustomThumbnail,
  ThumbnailError,
  type RefreshResult,
} from "@/app/lib/doc-thumbnail";
import {
  inviteValues,
  loadInviteTemplate,
  renderInviteEmail,
  resolveInviteTemplate,
  sendInviteEmail,
} from "@/app/lib/invite-email";
import { sendEmail } from "@/app/lib/email";
import {
  deleteMeetingEvent,
  freeBusy,
  meetConfigured,
  organizerEmail,
} from "@/app/lib/google-meet";
import { bookingOpen, loadMeetingConfig } from "@/app/lib/meetings";
import {
  normalizeMeetingSettings,
  parseEmailList,
  type MeetingSettingsInput,
} from "@/app/lib/dataroom-input";

export {
  normalizeMeetingSettings,
  parseEmailList,
  type EmailListResult,
  type MeetingSettings,
  type MeetingSettingsInput,
  type MeetingSettingsResult,
} from "@/app/lib/dataroom-input";

/**
 * The VC-admin operations of the data room, independent of how they are
 * invoked: the web server actions (session cookie) and the MCP tools (access
 * token) both call these with an `Actor`. Every function checks the role
 * itself (VC admin; admins hold it too), audits what it changes — MCP-made
 * changes carry `via: "mcp"` — and returns a `Result`. It never touches the
 * Next.js request: no redirect, no revalidation; callers do that.
 */

export type Actor = { id: string; email: string; via?: "web" | "mcp" };
export type Result = { ok?: boolean; error?: string; message?: string };

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** The signed-in user as an actor on the web channel, or null. */
export async function webActor(): Promise<Actor | null> {
  const user = await currentUser();
  if (!user?.id || !user.email) return null;
  return { id: user.id, email: user.email, via: "web" };
}

export async function assertVcAdmin(actor: Actor): Promise<void> {
  if (!(await isVcAdmin(actor.email))) {
    throw new ForbiddenError("You need the VC admin role for that.");
  }
}

/** For form actions: a thrown ForbiddenError becomes an error result. */
export async function asResult<T extends Result>(p: Promise<T>): Promise<T | Result> {
  try {
    return await p;
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: e.message };
    throw e;
  }
}

type Json = Record<string, unknown>;

async function audit(
  actor: Actor,
  action: string,
  target: { type: string; id: string },
  change: { before?: Json; after?: Json } = {},
): Promise<void> {
  const after = { ...(change.after ?? {}), ...(actor.via === "mcp" ? { via: "mcp" } : {}) };
  await db.adminAction.create({
    data: {
      actorUserId: actor.id,
      actorEmail: actor.email,
      action,
      targetType: target.type,
      targetId: target.id,
      before: change.before as Prisma.InputJsonValue | undefined,
      after: after as Prisma.InputJsonValue,
    },
  });
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export async function profile(actor: Actor) {
  const [admin, vcAdmin, user] = await Promise.all([
    isAdmin(actor.email),
    isVcAdmin(actor.email),
    db.user.findUnique({ where: { id: actor.id }, select: { name: true } }),
  ]);
  return {
    name: user?.name ?? null,
    email: actor.email,
    roles: [...(admin ? ["admin"] : []), ...(vcAdmin ? ["vc-admin"] : [])],
  };
}

// ─── Documents ───────────────────────────────────────────────────────────────

export const MAX_DOCUMENT_BYTES = 50 * 1024 * 1024;
const titleSchema = z.string().trim().min(1, "Enter a title.").max(200, "Title too long (200 max).");
const urlSchema = z
  .string()
  .trim()
  .url("Enter a valid http(s) URL.")
  .refine((u) => /^https?:\/\//i.test(u), "Enter a valid http(s) URL.");

export type DocumentRow = {
  id: string;
  kind: "file" | "url";
  title: string;
  filename: string | null;
  url: string | null;
  size: number;
  version: number;
  sortOrder: number | null;
  alwaysVisible: boolean;
  viewable: boolean;
  preview: "auto" | "custom" | "none";
  grants: number;
  accesses: number;
  updatedAt: string;
  updatedBy: string | null;
};

export async function listDocuments(actor: Actor): Promise<DocumentRow[]> {
  await assertVcAdmin(actor);
  const docs = await db.document.findMany({
    orderBy: DOCUMENT_LIST_ORDER,
    include: { _count: { select: { grants: true, downloads: true } } },
  });
  return docs.map((d) => ({
    id: d.id,
    kind: d.kind === "url" ? "url" : "file",
    title: d.title,
    filename: d.kind === "url" ? null : d.filename,
    url: d.url,
    size: d.size,
    version: d.version,
    sortOrder: d.sortOrder,
    alwaysVisible: d.alwaysVisible,
    viewable: viewKind(d) !== null,
    preview: d.thumbnailSource === "custom" ? "custom" : d.thumbnailSource === "auto" ? "auto" : "none",
    grants: d._count.grants,
    accesses: d._count.downloads,
    updatedAt: d.updatedAt.toISOString(),
    updatedBy: d.updatedBy,
  }));
}

function checkFile(file: UploadedFile): string | null {
  if (file.bytes.length === 0) return "The file is empty.";
  if (file.bytes.length > MAX_DOCUMENT_BYTES) return "File too large (50 MB max).";
  return null;
}

/** Upload a new document (version 1). Visible to no one until granted, unless always-visible. */
export async function addFileDocument(
  actor: Actor,
  input: { title: string; file: UploadedFile; alwaysVisible?: boolean; sortOrder?: number | null },
): Promise<Result & { id?: string }> {
  await assertVcAdmin(actor);
  const title = titleSchema.safeParse(input.title);
  if (!title.success) return { error: title.error.issues[0].message };
  const bad = checkFile(input.file);
  if (bad) return { error: bad };

  const doc = await createDocument({
    title: title.data,
    file: input.file,
    updatedBy: actor.email.toLowerCase(),
    sortOrder: input.sortOrder ?? null,
  });
  if (input.alwaysVisible) {
    await db.document.update({ where: { id: doc.id }, data: { alwaysVisible: true } });
  }
  await refreshAutoThumbnail(doc.id); // best-effort preview; never fails the upload
  await audit(actor, "document.add", { type: "Document", id: doc.id }, {
    after: {
      title: doc.title,
      filename: doc.filename,
      size: doc.size,
      alwaysVisible: !!input.alwaysVisible,
      sortOrder: doc.sortOrder,
    },
  });
  return { ok: true, id: doc.id, message: `Added "${doc.title}" (${doc.id}).` };
}

/** A labeled external link — always visible to every invited email. */
export async function addUrlEntry(
  actor: Actor,
  input: { title: string; url: string; sortOrder?: number | null },
): Promise<Result & { id?: string }> {
  await assertVcAdmin(actor);
  const title = titleSchema.safeParse(input.title);
  if (!title.success) return { error: title.error.issues[0].message };
  const url = urlSchema.safeParse(input.url);
  if (!url.success) return { error: url.error.issues[0].message };

  const doc = await db.document.create({
    data: {
      kind: "url",
      title: title.data,
      url: url.data,
      sortOrder: input.sortOrder ?? null,
      alwaysVisible: true,
      filename: "",
      contentType: "",
      size: 0,
      storageKey: "",
      updatedBy: actor.email.toLowerCase(),
    },
  });
  await audit(actor, "document.add-url", { type: "Document", id: doc.id }, {
    after: { title: doc.title, url: doc.url, sortOrder: doc.sortOrder },
  });
  return { ok: true, id: doc.id, message: `Added link "${doc.title}" (${doc.id}).` };
}

/** New content under the same id: version bump; grants and history untouched. */
export async function replaceDocument(actor: Actor, id: string, file: UploadedFile): Promise<Result> {
  await assertVcAdmin(actor);
  const before = await db.document.findUnique({ where: { id } });
  if (!before) return { error: "Document not found." };
  if (before.kind === "url") {
    return { error: "URL entries have no file — remove and re-add to change them." };
  }
  const bad = checkFile(file);
  if (bad) return { error: bad };

  const doc = await replaceDocumentContent({ documentId: id, file, updatedBy: actor.email.toLowerCase() });
  await refreshAutoThumbnail(id); // re-render from the new content; an uploaded cover is kept
  await audit(actor, "document.replace", { type: "Document", id }, {
    before: { filename: before.filename, version: before.version },
    after: { filename: doc.filename, version: doc.version, size: doc.size },
  });
  return { ok: true, message: `"${doc.title}" is now version ${doc.version}.` };
}

/** The row (and its grants) go; files stay on the volume, access history keeps the title. */
export async function removeDocument(actor: Actor, id: string): Promise<Result> {
  await assertVcAdmin(actor);
  const doc = await db.document.findUnique({ where: { id } });
  if (!doc) return { error: "Document not found." };
  await db.document.delete({ where: { id } });
  await audit(actor, "document.remove", { type: "Document", id }, {
    before: { title: doc.title, filename: doc.filename, version: doc.version },
  });
  return { ok: true, message: `Removed "${doc.title}".` };
}

/** Position in the lists; null = after the ordered entries, newest first. */
export async function setDocumentOrder(actor: Actor, id: string, sortOrder: number | null): Promise<Result> {
  await assertVcAdmin(actor);
  const doc = await db.document.findUnique({ where: { id } });
  if (!doc) return { error: "Document not found." };
  if (doc.sortOrder === sortOrder) return { ok: true, message: "Unchanged." };
  await db.document.update({ where: { id }, data: { sortOrder } });
  await audit(actor, "document.reorder", { type: "Document", id }, {
    before: { sortOrder: doc.sortOrder },
    after: { sortOrder, title: doc.title },
  });
  return { ok: true, message: `"${doc.title}" order set to ${sortOrder ?? "none"}.` };
}

/** Everyone (all invited emails) vs. manual per-email sharing. */
export async function setDocumentVisibility(actor: Actor, id: string, alwaysVisible: boolean): Promise<Result> {
  await assertVcAdmin(actor);
  const doc = await db.document.findUnique({ where: { id } });
  if (!doc) return { error: "Document not found." };
  if (doc.kind === "url") return { error: "URL entries are always visible to everyone." };
  if (doc.alwaysVisible === alwaysVisible) return { ok: true, message: "Unchanged." };
  await db.document.update({ where: { id }, data: { alwaysVisible } });
  await audit(actor, "document.visibility", { type: "Document", id }, {
    before: { alwaysVisible: doc.alwaysVisible },
    after: { alwaysVisible, title: doc.title },
  });
  return {
    ok: true,
    message: alwaysVisible
      ? `"${doc.title}" is now visible to every invited email.`
      : `"${doc.title}" is now shared per email only.`,
  };
}

export async function toggleDocumentVisibility(actor: Actor, id: string): Promise<Result> {
  await assertVcAdmin(actor);
  const doc = await db.document.findUnique({ where: { id } });
  if (!doc) return { error: "Document not found." };
  return setDocumentVisibility(actor, id, !doc.alwaysVisible);
}

const PREVIEW_MESSAGE: Record<RefreshResult, string> = {
  generated: "Preview rendered.",
  "kept-custom": "An uploaded cover is in place; remove it first to use the automatic preview.",
  unsupported: "No automatic preview for this type — upload a cover image instead.",
  failed: "Rendering failed (see the server log).",
};

export async function setDocumentCover(actor: Actor, id: string, image: Buffer): Promise<Result> {
  await assertVcAdmin(actor);
  const doc = await db.document.findUnique({ where: { id } });
  if (!doc) return { error: "Document not found." };
  try {
    await setCustomThumbnail(id, image);
  } catch (e) {
    return { error: e instanceof ThumbnailError ? e.message : "Could not process that image." };
  }
  await audit(actor, "document.thumbnail", { type: "Document", id }, {
    before: { thumbnailSource: doc.thumbnailSource },
    after: { thumbnailSource: "custom", title: doc.title },
  });
  return { ok: true, message: `Cover set on "${doc.title}".` };
}

export async function removeDocumentCover(actor: Actor, id: string): Promise<Result> {
  await assertVcAdmin(actor);
  const doc = await db.document.findUnique({ where: { id } });
  if (!doc) return { error: "Document not found." };
  const result = await removeCustomThumbnail(id);
  await audit(actor, "document.thumbnail", { type: "Document", id }, {
    before: { thumbnailSource: doc.thumbnailSource },
    after: { thumbnailSource: result === "generated" ? "auto" : null, title: doc.title },
  });
  return { ok: true, message: `Cover removed. ${PREVIEW_MESSAGE[result]}` };
}

export async function renderDocumentPreview(actor: Actor, id: string): Promise<Result> {
  await assertVcAdmin(actor);
  const doc = await db.document.findUnique({ where: { id } });
  if (!doc) return { error: "Document not found." };
  const result = await refreshAutoThumbnail(id);
  return result === "failed" ? { error: PREVIEW_MESSAGE.failed } : { ok: true, message: PREVIEW_MESSAGE[result] };
}

/** Backfill: render previews for every file that can have one and has none. */
export async function renderMissingPreviews(actor: Actor): Promise<Result & { rendered?: number; failed?: number }> {
  await assertVcAdmin(actor);
  const docs = await db.document.findMany({ where: { kind: "file", thumbnailKey: null } });
  let rendered = 0;
  let failed = 0;
  for (const d of docs) {
    if (!thumbnailSource(d)) continue;
    const r = await refreshAutoThumbnail(d.id);
    if (r === "generated") rendered++;
    else if (r === "failed") failed++;
  }
  return {
    ok: true,
    rendered,
    failed,
    message: `${rendered} preview${rendered === 1 ? "" : "s"} rendered${
      failed ? `, ${failed} failed (see the server log)` : ""
    }.`,
  };
}

// ─── Invitations ─────────────────────────────────────────────────────────────

const orgNameSchema = z.string().trim().min(1, "Enter the organization name.").max(200);

/**
 * Invite emails under an organization (created on first use). Each new invite
 * gets the invitation email — best-effort: the invite stands even if SMTP is
 * down (use resend).
 */
export async function inviteVcs(
  actor: Actor,
  input: { orgName: string; emails: string[] },
): Promise<Result & { created?: string[]; skipped?: string[] }> {
  await assertVcAdmin(actor);
  const orgName = orgNameSchema.safeParse(input.orgName);
  if (!orgName.success) return { error: orgName.error.issues[0].message };
  const parsed = parseEmailList(input.emails);
  if (!parsed.ok) return { error: parsed.error };
  if (parsed.emails.length === 0) return { error: "Enter at least one email." };

  const org = await db.org.upsert({
    where: { name: orgName.data },
    update: {},
    create: { name: orgName.data },
  });

  const created: string[] = [];
  const skipped: string[] = [];
  for (const email of parsed.emails) {
    const existing = await db.vcInvite.findUnique({ where: { email } });
    if (existing) {
      skipped.push(existing.orgId === org.id ? email : `${email} (already invited under another org)`);
      continue;
    }
    await db.vcInvite.create({ data: { email, orgId: org.id, invitedByUserId: actor.id } });
    created.push(email);
    try {
      await sendInviteEmail({ orgName: org.name, email });
    } catch (e) {
      console.error(`[invite] email to ${email} failed — use resend`, e);
    }
  }

  await audit(actor, "invite.add", { type: "Org", id: org.id }, {
    after: { org: org.name, created, skipped },
  });
  const parts = [];
  if (created.length) parts.push(`Invited ${created.join(", ")}.`);
  if (skipped.length) parts.push(`Already invited: ${skipped.join(", ")}.`);
  return { ok: true, message: parts.join(" "), created, skipped };
}

/** An invite by id or by email. */
export async function findInvite(ref: string) {
  const byId = await db.vcInvite.findUnique({ where: { id: ref }, include: { org: true } });
  if (byId) return byId;
  const email = z.string().trim().toLowerCase().email().safeParse(ref);
  if (!email.success) return null;
  return db.vcInvite.findUnique({ where: { email: email.data }, include: { org: true } });
}

export async function resendInvite(actor: Actor, ref: string): Promise<Result> {
  await assertVcAdmin(actor);
  const invite = await findInvite(ref);
  if (!invite) return { error: "Invite not found." };
  try {
    await sendInviteEmail({ orgName: invite.org.name, email: invite.email });
  } catch (e) {
    console.error(`[invite] resend to ${invite.email} failed`, e);
    return { error: "Sending failed — check the SMTP configuration." };
  }
  return { ok: true, message: `Invitation re-sent to ${invite.email}.` };
}

/**
 * Revoke an invite: the email can no longer sign in and an existing session
 * loses the data room on its next request. Upcoming meetings are cancelled on
 * Google first (attendees notified); grants cascade away; history is kept.
 */
export async function revokeInvite(actor: Actor, ref: string): Promise<Result> {
  await assertVcAdmin(actor);
  const invite = await findInvite(ref);
  if (!invite) return { error: "Invite not found." };

  const meetings = await db.meeting.findMany({
    where: { inviteId: invite.id, startAt: { gte: new Date() } },
  });
  for (const m of meetings) {
    if (m.googleEventId) {
      await deleteMeetingEvent(m.googleEventId).catch((e) =>
        console.error("[invite] cancelling meeting on revoke failed", e),
      );
    }
  }

  await db.vcInvite.delete({ where: { id: invite.id } });
  await audit(actor, "invite.revoke", { type: "VcInvite", id: invite.id }, {
    before: { email: invite.email, org: invite.org.name },
  });
  return { ok: true, message: `Revoked ${invite.email} (${invite.org.name}).` };
}

/**
 * Replace the set of documents this invite sees. Always-visible documents are
 * frozen: they never enter the selection, and a manual grant they already
 * carry is preserved (it applies again if the flag is turned off).
 */
export async function setGrants(actor: Actor, ref: string, documentIds: string[]): Promise<Result> {
  await assertVcAdmin(actor);
  const invite = await findInvite(ref);
  if (!invite) return { error: "Invite not found." };

  const wanted = new Set(documentIds);
  const docs = await db.document.findMany({ select: { id: true, alwaysVisible: true } });
  const valid = new Set(docs.map((d) => d.id));
  for (const id of wanted) {
    if (!valid.has(id)) return { error: `Unknown document in selection: ${id}` };
  }
  const frozen = new Set(docs.filter((d) => d.alwaysVisible).map((d) => d.id));

  const current = await db.documentGrant.findMany({ where: { inviteId: invite.id } });
  const have = new Set(current.map((g) => g.documentId));
  const toAdd = [...wanted].filter((id) => !have.has(id) && !frozen.has(id));
  const toRemove = current
    .filter((g) => !wanted.has(g.documentId) && !frozen.has(g.documentId))
    .map((g) => g.id);

  await db.$transaction([
    db.documentGrant.deleteMany({ where: { id: { in: toRemove } } }),
    db.documentGrant.createMany({
      data: toAdd.map((documentId) => ({
        inviteId: invite.id,
        documentId,
        grantedBy: actor.email.toLowerCase(),
      })),
      skipDuplicates: true,
    }),
  ]);

  await audit(actor, "invite.grants", { type: "VcInvite", id: invite.id }, {
    after: { email: invite.email, documents: [...wanted] },
  });
  return { ok: true, message: "Selection saved." };
}

export type InviteRow = {
  id: string;
  email: string;
  org: string;
  invitedAt: string;
  lastLoginAt: string | null;
  lastSeenAt: string | null;
  ndaSigned: boolean;
  grants: number;
  accesses: number;
  status: "active" | "connected" | "never";
};

export async function listInvites(actor: Actor): Promise<InviteRow[]> {
  await assertVcAdmin(actor);
  const [invites, accesses] = await Promise.all([
    db.vcInvite.findMany({
      include: { org: { include: { ndaSignature: true } }, _count: { select: { documentGrants: true } } },
      orderBy: [{ org: { name: "asc" } }, { email: "asc" }],
    }),
    db.downloadEvent.groupBy({ by: ["email"], _count: { _all: true }, _max: { at: true } }),
  ]);
  const byEmail = new Map(accesses.map((a) => [a.email, { count: a._count._all, last: a._max.at }]));
  return invites.map((i) => {
    const a = byEmail.get(i.email);
    const lastSeen =
      [i.lastLoginAt, a?.last].filter((x): x is Date => !!x).sort((x, y) => y.getTime() - x.getTime())[0] ?? null;
    return {
      id: i.id,
      email: i.email,
      org: i.org.name,
      invitedAt: i.invitedAt.toISOString(),
      lastLoginAt: i.lastLoginAt?.toISOString() ?? null,
      lastSeenAt: lastSeen?.toISOString() ?? null,
      ndaSigned: !!i.org.ndaSignature,
      grants: i._count.documentGrants,
      accesses: a?.count ?? 0,
      status: a?.count ? "active" : i.lastLoginAt ? "connected" : "never",
    };
  });
}

export async function getInvite(actor: Actor, ref: string) {
  await assertVcAdmin(actor);
  const invite = await findInvite(ref);
  if (!invite) return null;
  const [nda, grants, alwaysVisible, accesses, meetings] = await Promise.all([
    db.ndaSignature.findUnique({ where: { orgId: invite.orgId }, include: { ndaDocument: true } }),
    db.documentGrant.findMany({ where: { inviteId: invite.id }, include: { document: { select: { id: true, title: true } } } }),
    db.document.findMany({ where: { alwaysVisible: true }, select: { id: true, title: true }, orderBy: DOCUMENT_LIST_ORDER }),
    db.downloadEvent.findMany({ where: { email: invite.email }, orderBy: { at: "desc" }, take: 50 }),
    db.meeting.findMany({ where: { inviteId: invite.id }, orderBy: { startAt: "desc" }, take: 10 }),
  ]);
  return {
    id: invite.id,
    email: invite.email,
    org: invite.org.name,
    invitedAt: invite.invitedAt.toISOString(),
    lastLoginAt: invite.lastLoginAt?.toISOString() ?? null,
    nda: nda
      ? { version: nda.ndaDocument.version, signedBy: nda.signerName, signedAt: nda.signedAt.toISOString() }
      : null,
    grantedDocuments: grants.map((g) => g.document),
    alwaysVisibleDocuments: alwaysVisible,
    recentAccesses: accesses.map((a) => ({ document: a.documentTitle, action: a.action, at: a.at.toISOString() })),
    meetings: meetings.map((m) => ({ id: m.id, startAt: m.startAt.toISOString(), endAt: m.endAt.toISOString(), meetUrl: m.meetUrl })),
  };
}

// ─── Invitation email template ───────────────────────────────────────────────

export const INVITE_PLACEHOLDERS = ["org_name", "email", "login_url"] as const;

const templateSchema = z.object({
  subject: z.string().trim().min(1, "Enter a subject.").max(300),
  bodyMarkdown: z.string().trim().min(1, "Enter the email body.").max(20000),
});

export async function getInviteTemplate(actor: Actor) {
  await assertVcAdmin(actor);
  const tpl = await loadInviteTemplate();
  return { ...tpl, placeholders: [...INVITE_PLACEHOLDERS] };
}

export async function saveInviteTemplate(
  actor: Actor,
  input: { subject: string; bodyMarkdown: string },
): Promise<Result> {
  await assertVcAdmin(actor);
  const parsed = templateSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the template." };

  // Catch unknown {{placeholders}} before anything is sent to a real VC.
  const sample = inviteValues({ orgName: "Sample Ventures", email: "sample@fund.vc" });
  try {
    resolveInviteTemplate(parsed.data.subject, sample);
    resolveInviteTemplate(parsed.data.bodyMarkdown, sample);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Template error." };
  }

  await db.inviteEmailTemplate.upsert({
    where: { id: "default" },
    update: { ...parsed.data, updatedBy: actor.email.toLowerCase() },
    create: { id: "default", ...parsed.data, updatedBy: actor.email.toLowerCase() },
  });
  await audit(actor, "invite-template.save", { type: "InviteEmailTemplate", id: "default" });
  return { ok: true, message: "Template saved." };
}

/** Back to the code default by deleting the stored row. */
export async function resetInviteTemplate(actor: Actor): Promise<Result> {
  await assertVcAdmin(actor);
  await db.inviteEmailTemplate.deleteMany({ where: { id: "default" } });
  await audit(actor, "invite-template.reset", { type: "InviteEmailTemplate", id: "default" });
  return { ok: true, message: "Template reset to the default." };
}

/** Send the SAVED template to the actor for a real-inbox check. */
export async function sendTestInviteEmail(actor: Actor): Promise<Result> {
  await assertVcAdmin(actor);
  try {
    const { subject, html } = await renderInviteEmail({ orgName: "Sample Ventures", email: actor.email });
    await sendEmail({ to: actor.email, subject: `[test] ${subject}`, html });
  } catch (e) {
    console.error("[invite-template] test send failed", e);
    return { error: "Sending failed — check the SMTP configuration." };
  }
  return { ok: true, message: `Test sent to ${actor.email}.` };
}

// ─── Meetings ────────────────────────────────────────────────────────────────

export async function saveMeetingSettings(actor: Actor, raw: MeetingSettingsInput): Promise<Result> {
  await assertVcAdmin(actor);
  const n = normalizeMeetingSettings(raw);
  if (!n.ok) return { error: n.error };
  const s = n.settings;
  const data = { ...s, updatedBy: actor.email.toLowerCase() };
  await db.meetingSettings.upsert({
    where: { id: "default" },
    update: data,
    create: { id: "default", ...data },
  });
  await audit(actor, "meeting-settings.save", { type: "MeetingSettings", id: "default" }, { after: { ...s } });
  return { ok: true, message: s.enabled ? "Booking is open." : "Settings saved; booking is closed." };
}

export async function getMeetingSettings(actor: Actor) {
  await assertVcAdmin(actor);
  const cfg = await loadMeetingConfig();
  let unreadableCalendars: string[] = [];
  if (meetConfigured() && cfg && cfg.attendeeEmails.length > 0) {
    try {
      unreadableCalendars = (await freeBusy(cfg.attendeeEmails, new Date(), new Date(Date.now() + 86400_000))).unreadable;
    } catch {
      /* best-effort probe */
    }
  }
  return {
    configured: !!cfg,
    enabled: cfg?.enabled ?? false,
    openDays: cfg?.openDays ?? [],
    windows: cfg?.windows ?? [],
    attendeeEmails: cfg?.attendeeEmails ?? [],
    horizonDays: cfg?.horizonDays ?? 14,
    minNoticeHours: cfg?.minNoticeHours ?? 24,
    googleConfigured: meetConfigured(),
    organizer: organizerEmail(),
    bookingOpen: bookingOpen(cfg),
    unreadableCalendars,
  };
}

export async function listMeetings(actor: Actor, opts: { upcomingOnly?: boolean } = {}) {
  await assertVcAdmin(actor);
  const meetings = await db.meeting.findMany({
    where: opts.upcomingOnly === false ? {} : { startAt: { gte: new Date() } },
    orderBy: { startAt: "asc" },
    include: { org: true },
    take: 200,
  });
  return meetings.map((m) => ({
    id: m.id,
    email: m.email,
    org: m.org.name,
    startAt: m.startAt.toISOString(),
    endAt: m.endAt.toISOString(),
    meetUrl: m.meetUrl,
  }));
}

/** Staff-side cancellation of a meeting (Google notifies the attendees). */
export async function cancelMeetingAsStaff(actor: Actor, meetingId: string): Promise<Result> {
  await assertVcAdmin(actor);
  const meeting = await db.meeting.findUnique({ where: { id: meetingId }, include: { org: true } });
  if (!meeting) return { error: "Meeting not found." };
  if (meeting.googleEventId) {
    try {
      await deleteMeetingEvent(meeting.googleEventId);
    } catch (e) {
      console.error("[meetings] Google cancellation failed", e);
    }
  }
  await db.meeting.delete({ where: { id: meetingId } });
  await audit(actor, "meeting.cancel-staff", { type: "Meeting", id: meetingId }, {
    before: { email: meeting.email, org: meeting.org.name, startAt: meeting.startAt.toISOString() },
  });
  return { ok: true, message: `Cancelled the call with ${meeting.email} on ${meeting.startAt.toISOString()}.` };
}

// ─── Activity ────────────────────────────────────────────────────────────────

export async function activitySummary(actor: Actor, rangeDays: number) {
  await assertVcAdmin(actor);
  const range = Math.min(365, Math.max(1, Math.round(rangeDays) || 30));
  const since = new Date(Date.now() - range * 86400_000);
  const [invites, orgCount, ndaCount, windowEvents, recent] = await Promise.all([
    db.vcInvite.findMany({ select: { email: true, lastLoginAt: true } }),
    db.org.count(),
    db.ndaSignature.count(),
    db.downloadEvent.findMany({ where: { at: { gte: since } }, select: { documentTitle: true, email: true, at: true } }),
    db.downloadEvent.findMany({ orderBy: { at: "desc" }, take: 25 }),
  ]);
  const byDoc = new Map<string, number>();
  const byEmail = new Map<string, { accesses: number; lastAt: Date }>();
  for (const e of windowEvents) {
    byDoc.set(e.documentTitle, (byDoc.get(e.documentTitle) ?? 0) + 1);
    const cur = byEmail.get(e.email);
    byEmail.set(e.email, { accesses: (cur?.accesses ?? 0) + 1, lastAt: cur && cur.lastAt > e.at ? cur.lastAt : e.at });
  }
  return {
    rangeDays: range,
    invitedEmails: invites.length,
    connectedEmails: invites.filter((i) => i.lastLoginAt).length,
    ndaSigned: ndaCount,
    organizations: orgCount,
    accesses: windowEvents.length,
    topDocuments: [...byDoc.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([title, count]) => ({ title, count })),
    perEmail: [...byEmail.entries()]
      .sort((a, b) => b[1].accesses - a[1].accesses)
      .map(([email, v]) => ({ email, accesses: v.accesses, lastAccessAt: v.lastAt.toISOString() })),
    recent: recent.map((e) => ({ email: e.email, action: e.action, document: e.documentTitle, at: e.at.toISOString() })),
  };
}
