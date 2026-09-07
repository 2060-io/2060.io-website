import { notFound } from "next/navigation";
import { db } from "@/app/lib/db";
import { currentUser, isVcAdmin } from "@/app/lib/authz";
import { getFile } from "@/app/lib/storage";

export const dynamic = "force-dynamic";

/** Signed-NDA PDF download for staff (ADMIN and VC_ADMIN). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ signatureId: string }> },
) {
  const user = await currentUser();
  // isVcAdmin includes admins; VC admins need signature visibility for their
  // activity views too.
  if (!user || !(await isVcAdmin(user.email))) notFound();

  const { signatureId } = await params;
  const sig = await db.ndaSignature.findUnique({
    where: { id: signatureId },
    include: { org: true, ndaDocument: true },
  });
  if (!sig?.pdfPath) notFound();

  let bytes: Buffer;
  try {
    bytes = await getFile(sig.pdfPath);
  } catch {
    notFound();
  }

  const safeOrg = sig.org.name.replace(/[^A-Za-z0-9._-]+/g, "-");
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="2060-dataroom-nda-${safeOrg}-${sig.ndaDocument.version}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
