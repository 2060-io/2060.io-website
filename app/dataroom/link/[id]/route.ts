import { notFound } from "next/navigation";
import { NextResponse } from "next/server";
import { vcDocumentAccess } from "@/app/lib/vc-access";
import { recordAccess } from "@/app/lib/documents";

export const dynamic = "force-dynamic";

/**
 * VC access to a URL entry: same gates as a document download (invited +
 * signed NDA; URL entries are always visible), the open is recorded in the
 * access trail, then a redirect sends the new window to the external URL.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await vcDocumentAccess(id, "url");
  if (!access?.doc.url) notFound();
  const { invite, doc } = access;

  await recordAccess({
    email: invite.email,
    documentId: doc.id,
    documentTitle: doc.title,
    action: "open",
  });

  return NextResponse.redirect(doc.url!, {
    status: 302,
    headers: { "Cache-Control": "private, no-store" },
  });
}
