import { db } from "@/app/lib/db";
import { sendEmail } from "@/app/lib/email";
import { emailLayout } from "@/app/lib/email-layout";
import { markdownToHtml } from "@/app/lib/doc-html";

const SITE_URL = process.env.AUTH_URL ?? "https://2060.io";

/**
 * The invitation email VC admins send to invited addresses. Subject and
 * markdown body are editable in /vc-admin/invite-email; this code default
 * applies until the first save. The dual-logo (2060 + Verana Foundation)
 * header comes from the shared email shell (email-layout.ts).
 */
export const DEFAULT_TEMPLATE = {
  subject: "Your access to the 2060 investor data room",
  bodyMarkdown: `You have been invited to the **2060 investor data room** on behalf of **{{org_name}}**.

The data room contains the confidential material supporting 2060's current round: company and product information, the investor memo, and the documents selected for you.

**How to get in**

Sign in at the link below using **this email address** ({{email}}) — with Google, GitHub, or a one-time code sent by email. Access is personal and by invitation only.

Before the documents open, one authorized person from {{org_name}} reviews and signs the data-room NDA online; it covers everyone from your organization who has been invited.

We look forward to the conversation.

The 2060 team`,
} as const;

/** Values available to the template. Keys are the {{placeholders}}. */
export function inviteValues(v: { orgName: string; email: string }): Record<string, string> {
  return {
    org_name: v.orgName.trim(),
    email: v.email.trim(),
    login_url: `${SITE_URL}/dataroom`,
  };
}

export function resolveInviteTemplate(
  text: string,
  values: Record<string, string>,
): string {
  const out = text.replace(/\{\{(\w+)\}\}/g, (_m, key: string) => {
    if (!(key in values)) throw new Error(`invite template: unknown placeholder "{{${key}}}"`);
    return values[key];
  });
  return out;
}

/** The stored template, or the code default when never saved. */
export async function loadInviteTemplate(): Promise<{
  subject: string;
  bodyMarkdown: string;
  customized: boolean;
}> {
  const row = await db.inviteEmailTemplate.findUnique({ where: { id: "default" } });
  if (!row) return { ...DEFAULT_TEMPLATE, customized: false };
  return { subject: row.subject, bodyMarkdown: row.bodyMarkdown, customized: true };
}

/** Render subject + wrapped HTML for one recipient (also used for previews). */
export async function renderInviteEmail(v: {
  orgName: string;
  email: string;
}): Promise<{ subject: string; html: string }> {
  const tpl = await loadInviteTemplate();
  const values = inviteValues(v);
  const subject = resolveInviteTemplate(tpl.subject, values);
  const bodyHtml = markdownToHtml(resolveInviteTemplate(tpl.bodyMarkdown, values));
  const html = emailLayout({
    heading: "You're invited",
    bodyHtml: `<div>${bodyHtml}</div>`,
    button: { label: "Open the data room", href: values.login_url },
  });
  return { subject, html };
}

/** Send the invitation to one address. Throws on template errors. */
export async function sendInviteEmail(v: {
  orgName: string;
  email: string;
}): Promise<void> {
  const { subject, html } = await renderInviteEmail(v);
  await sendEmail({ to: v.email, subject, html });
}
