import { notFound } from "next/navigation";
import { db } from "@/app/lib/db";
import { currentUser, isVcAdmin } from "@/app/lib/authz";
import { serveDocument } from "@/app/lib/doc-serve";

export const dynamic = "force-dynamic";

/** Staff view of a repository document in the browser — exactly what a VC gets
 *  from /dataroom/view/[id] (same headers, same sandbox), minus the trail. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user || !(await isVcAdmin(user.email))) notFound();

  const { id } = await params;
  const doc = await db.document.findUnique({ where: { id } });
  if (!doc?.storageKey) notFound();

  const res = await serveDocument(doc, "view");
  if (!res) notFound();
  return res;
}
