import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { sendEmail, escapeHtml } from "@/app/lib/email";
import { smtpServer } from "@/app/lib/smtp";
import { emailLayout } from "@/app/lib/email-layout";
import { alertOps } from "@/app/lib/ops-alert";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIN_MESSAGE = 50;
const MAX_MESSAGE = 4000;

// Naive in-memory rate limit. The deployment runs a single replica, so a
// per-process map is sufficient as a best-effort guard.
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_MAX;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Every admin + VC-admin email, deduplicated (both lists store lowercase). */
async function recipientEmails(): Promise<string[]> {
  const [admins, vcAdmins] = await Promise.all([
    db.adminAllowlistEntry.findMany({ select: { email: true } }),
    db.vcAdminEntry.findMany({ select: { email: true } }),
  ]);
  return [...new Set([...admins, ...vcAdmins].map((e) => e.email))];
}

function inquiryHtml(rows: [string, string][], message: string): string {
  const table = rows
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:2px 12px 2px 0;color:#525252;white-space:nowrap;">${k}</td>
         <td style="padding:2px 0;">${escapeHtml(v)}</td></tr>`,
    )
    .join("");
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;margin:0 0 16px;">${table}</table>
    <p style="margin:0 0 6px;color:#525252;">Message</p>
    <div style="border-left:2px solid #553C9A;padding:2px 0 2px 12px;white-space:pre-wrap;">${escapeHtml(message)}</div>
    <p style="margin:16px 0 0;color:#525252;font-size:12px;">Reply to this email to answer directly.</p>`;
}

export async function POST(req: NextRequest) {
  let data: Record<string, unknown>;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  // Honeypot: a filled hidden field means a bot. Pretend success, do nothing.
  if (typeof data.website_hp === "string" && data.website_hp.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  // Time-to-submit: human submissions take more than a couple of seconds.
  const renderedAt = Number(data.rendered_at);
  if (Number.isFinite(renderedAt) && Date.now() - renderedAt < 2500) {
    return NextResponse.json({ ok: true });
  }

  const topic = String(data.topic ?? "").trim();
  const name = String(data.name ?? "").trim();
  const email = String(data.email ?? "").trim();
  const message = String(data.message ?? "").trim();
  const consent =
    data.consent === true || data.consent === "on" || data.consent === "true";

  const fields: string[] = [];
  if (!topic) fields.push("topic");
  if (!name) fields.push("name");
  if (!EMAIL_RE.test(email)) fields.push("email");
  if (message.length < MIN_MESSAGE || message.length > MAX_MESSAGE)
    fields.push("message");
  if (!consent) fields.push("consent");
  if (fields.length > 0) {
    return NextResponse.json(
      { ok: false, error: "validation", fields },
      { status: 422 }
    );
  }

  const ip =
    (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const organization = String(data.organization ?? "").trim();
  const role = String(data.role ?? "").trim();
  const linkedin = String(data.linkedin ?? "").trim();
  const companyWebsite = String(data.company_website ?? "").trim();
  const source = String(data.source ?? "").trim();

  // If SMTP isn't configured (e.g. local dev), don't fail the user — log and
  // report success, mirroring the old CRM-unconfigured behavior.
  if (!smtpServer()) {
    console.warn("[contact] SMTP not configured; inquiry not delivered:", {
      topic, name, email, organization,
    });
    return NextResponse.json({ ok: true });
  }

  try {
    const to = await recipientEmails();
    if (to.length === 0) {
      throw new Error("no admin or VC-admin recipients configured");
    }
    await sendEmail({
      to,
      replyTo: `${name} <${email}>`,
      subject: `[2060.io contact] ${topic} — ${name}`,
      html: emailLayout({
        heading: "New contact inquiry",
        bodyHtml: inquiryHtml(
          [
            ["Topic", topic],
            ["Name", name],
            ["Email", email],
            ["Organization", organization],
            ["Role", role],
            ["LinkedIn", linkedin],
            ["Website", companyWebsite],
            ["Source", source],
            ["Consent", new Date().toISOString()],
          ],
          message,
        ),
      }),
    });
    console.info(`[contact] inquiry emailed to ${to.length} recipient(s)`);
  } catch (err) {
    console.error("[contact] delivery failed", err, { topic, name, email, organization });
    await alertOps(
      `Contact form (2060.io): email delivery failed for ${name} <${email}> (${topic}). ${String(
        err
      ).slice(0, 300)}`
    );
    // Surface the failure so the user sees an error and can resubmit.
    return NextResponse.json({ ok: false, error: "delivery" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
