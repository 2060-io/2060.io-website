import { db } from "@/app/lib/db";
import { putFile } from "@/app/lib/storage";
import { sha384 } from "@/app/lib/nda-versions";
import { resolveNdaTemplate, type NdaContext } from "@/app/lib/nda-template";
import { markdownToPdf } from "@/app/lib/doc-pdf";
import { sendEmail, escapeHtml } from "@/app/lib/email";
import { emailLayout } from "@/app/lib/email-layout";

const SITE_URL = process.env.AUTH_URL ?? "https://2060.io";

/** Storage key for an org's signed NDA PDF. One signed copy per org. */
export function ndaKey(orgId: string): string {
  return `nda/${orgId}.pdf`;
}

/**
 * Render the personalised NDA PDF, write it to the storage volume, and record
 * its path + sha384 (SRI form) on the NdaSignature. Returns the bytes and hash
 * so the caller can attach the PDF to the confirmation email without
 * re-rendering.
 *
 * Persistence (volume + DB) is best-effort: a broken storage mount must not
 * cost the signer their signed copy — the rendered bytes are still returned so
 * the email attaches them. `persisted: false` means the in-app download will
 * 404 until the copy is re-persisted.
 */
export async function persistSignedNda(opts: {
  orgId: string;
  signatureId: string;
  ctx: NdaContext;
  template: string;
}): Promise<{ pdf: Buffer; hash: string; key: string; persisted: boolean }> {
  const pdf = await markdownToPdf(resolveNdaTemplate(opts.template, opts.ctx));
  const hash = sha384(pdf);
  const key = ndaKey(opts.orgId);
  let persisted = true;
  try {
    await putFile(key, pdf);
    await db.ndaSignature.update({
      where: { id: opts.signatureId },
      data: { pdfPath: key, pdfHash: hash },
    });
  } catch (e) {
    persisted = false;
    console.error(
      `[signed-nda] persist failed for org ${opts.orgId} — the email still attaches the PDF, but the in-app download will 404 until re-persisted`,
      e,
    );
  }
  return { pdf, hash, key, persisted };
}

/** Email the signer their executed NDA copy. Best-effort: never blocks signing. */
export async function sendExecutedNdaEmail(d: {
  to: string;
  orgName: string;
  signerName: string;
  signedAt: Date;
  ndaVersion: string;
  pdf: Buffer;
}): Promise<void> {
  try {
    const html = emailLayout({
      heading: "Your signed NDA",
      bodyHtml: `
      <p style="margin:0 0 12px;">This confirms that <strong>${escapeHtml(d.signerName)}</strong> signed the
      data-room Non-Disclosure Agreement (version ${escapeHtml(d.ndaVersion)}) on behalf of
      <strong>${escapeHtml(d.orgName)}</strong> on ${d.signedAt.toISOString().slice(0, 10)}.</p>
      <p style="margin:0;">Your signed copy is attached. It covers everyone from
      ${escapeHtml(d.orgName)} who has been invited to the data room.</p>`,
      button: { label: "Open the data room", href: `${SITE_URL}/dataroom` },
    });
    await sendEmail({
      to: d.to,
      subject: "2060 data room — your signed NDA",
      html,
      attachments: [
        { filename: `2060-dataroom-nda-${d.ndaVersion}.pdf`, content: d.pdf },
      ],
    });
  } catch (e) {
    console.error(`[signed-nda] confirmation email to ${d.to} failed`, e);
  }
}
