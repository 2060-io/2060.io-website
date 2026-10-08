import { notFound } from "next/navigation";
import { db } from "@/app/lib/db";
import { currentUser, isVcAdmin } from "@/app/lib/authz";
import { getFile } from "@/app/lib/storage";
import { thumbnailResponse } from "@/app/lib/doc-serve";

export const dynamic = "force-dynamic";

/** Staff view of a document's preview thumbnail. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user || !(await isVcAdmin(user.email))) notFound();

  const { id } = await params;
  const doc = await db.document.findUnique({ where: { id } });
  if (!doc?.thumbnailKey) notFound();

  let bytes: Buffer;
  try {
    bytes = await getFile(doc.thumbnailKey);
  } catch {
    notFound();
  }
  return thumbnailResponse(bytes);
}
