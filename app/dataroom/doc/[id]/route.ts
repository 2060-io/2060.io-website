import { notFound } from "next/navigation";
import { db } from "@/app/lib/db";
import { currentUser, vcInviteFor } from "@/app/lib/authz";
import { getFile } from "@/app/lib/storage";
import { safeFilename } from "@/app/lib/documents";

export const dynamic = "force-dynamic";

/**
 * VC document download. Serves the latest version only when the signed-in VC
 * (a) is invited, (b) has a grant for this document or the document is marked
 * always-visible, and (c) their org signed the NDA. Every successful download
 * is recorded in the audit trail.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user?.email) notFound();
  const invite = await vcInviteFor(user.email);
  if (!invite) notFound();

  const { id } = await params;
  // Access = (per-email grant OR always-visible) AND signed NDA.
  const [doc, nda] = await Promise.all([
    db.document.findFirst({
      where: {
        id,
        OR: [{ alwaysVisible: true }, { grants: { some: { inviteId: invite.id } } }],
      },
    }),
    db.ndaSignature.findUnique({ where: { orgId: invite.orgId } }),
  ]);
  if (!doc || !nda) notFound();
  let bytes: Buffer;
  try {
    bytes = await getFile(doc.storageKey);
  } catch {
    notFound();
  }

  await db.downloadEvent.create({
    data: {
      email: invite.email,
      documentId: doc.id,
      documentTitle: doc.title,
    },
  });

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": doc.contentType,
      "Content-Disposition": `attachment; filename="${safeFilename(doc.filename)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
