import nodemailer from "nodemailer";
import { smtpServer, mailFrom } from "@/app/lib/smtp";

type Attachment = { filename: string; content: Buffer };

/**
 * Best-effort transactional email over SMTP (MAIL_* env). No-ops (logs) when
 * SMTP isn't configured, so flows that send mail don't fail in environments
 * without it.
 */
export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  attachments?: Attachment[];
}): Promise<void> {
  const server = smtpServer();
  if (!server) {
    console.warn(`[email] SMTP not configured — skipping email to ${opts.to}`);
    return;
  }
  const transporter = nodemailer.createTransport(server);
  await transporter.sendMail({
    from: mailFrom(),
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    replyTo: opts.replyTo,
    attachments: opts.attachments,
  });
}

export function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}
