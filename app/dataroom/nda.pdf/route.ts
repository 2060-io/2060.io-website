import { notFound } from "next/navigation";
import { db } from "@/app/lib/db";
import { currentUser, vcInviteFor } from "@/app/lib/authz";
import { getFile } from "@/app/lib/storage";

export const dynamic = "force-dynamic";

/** A VC's copy of their organization's signed NDA. */
export async function GET() {
  const user = await currentUser();
  if (!user?.email) notFound();
  const invite = await vcInviteFor(user.email);
  if (!invite) notFound();

  const sig = await db.ndaSignature.findUnique({
    where: { orgId: invite.orgId },
    include: { ndaDocument: true },
  });
  if (!sig?.pdfPath) notFound();

  let bytes: Buffer;
  try {
    bytes = await getFile(sig.pdfPath);
  } catch {
    notFound();
  }

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="2060-dataroom-nda-${sig.ndaDocument.version}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
