import { notFound } from "next/navigation";
import { vcDocumentAccess } from "@/app/lib/vc-access";
import { getFile } from "@/app/lib/storage";
import { thumbnailResponse } from "@/app/lib/doc-serve";

export const dynamic = "force-dynamic";

/** A document's preview thumbnail for the VC list: same gates as the document
 *  itself (any kind — URL entries may carry an uploaded cover), not recorded in
 *  the access trail. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await vcDocumentAccess(id);
  if (!access?.doc.thumbnailKey) notFound();

  let bytes: Buffer;
  try {
    bytes = await getFile(access.doc.thumbnailKey);
  } catch {
    notFound();
  }
  return thumbnailResponse(bytes);
}
