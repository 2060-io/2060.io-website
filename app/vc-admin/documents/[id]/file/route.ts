import { notFound } from "next/navigation";
import { db } from "@/app/lib/db";
import { currentUser, isVcAdmin } from "@/app/lib/authz";
import { getFile } from "@/app/lib/storage";
import { safeFilename } from "@/app/lib/documents";

export const dynamic = "force-dynamic";

/** Staff download of a repository document (latest version). Not audited as a
 *  VC download — DownloadEvent tracks VCs only. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user || !(await isVcAdmin(user.email))) notFound();

  const { id } = await params;
  const doc = await db.document.findUnique({ where: { id } });
  if (!doc?.storageKey) notFound();

  let bytes: Buffer;
  try {
    bytes = await getFile(doc.storageKey);
  } catch {
    notFound();
  }

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": doc.contentType,
      "Content-Disposition": `attachment; filename="${safeFilename(doc.filename)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
