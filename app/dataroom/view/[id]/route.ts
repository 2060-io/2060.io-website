import { notFound } from "next/navigation";
import { vcDocumentAccess } from "@/app/lib/vc-access";
import { serveDocument } from "@/app/lib/doc-serve";
import { viewKind } from "@/app/lib/doc-view";
import { recordAccess } from "@/app/lib/documents";

export const dynamic = "force-dynamic";

/**
 * VC document view: the same gates as a download, but the file is shown in
 * the browser — PDFs in its viewer, HTML and Markdown sandboxed (doc-view.ts).
 * A type that cannot be viewed is downloaded instead. Recorded in the access
 * trail as "view" (or "download" for the fallback).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await vcDocumentAccess(id, "file");
  if (!access) notFound();
  const { invite, doc } = access;

  const res = await serveDocument(doc, "view");
  if (!res) notFound();

  await recordAccess({
    email: invite.email,
    documentId: doc.id,
    documentTitle: doc.title,
    action: viewKind(doc) ? "view" : "download",
  });
  return res;
}
