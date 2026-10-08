import { getFile } from "@/app/lib/storage";
import { safeFilename } from "@/app/lib/documents";
import { inlineHeaders, markdownDocumentHtml, viewKind } from "@/app/lib/doc-view";

export type ServableDocument = {
  kind: string;
  title: string;
  filename: string;
  contentType: string;
  storageKey: string;
};

export type ServeMode = "download" | "view";

/**
 * The response that serves a stored repository file — the one place that sets
 * headers for every document route (VC and staff, download and view).
 * "download" is always an attachment; "view" is inline for PDF/HTML/Markdown
 * (see doc-view.ts) and falls back to an attachment for anything else.
 * Returns null when the file is missing on the volume.
 */
export async function serveDocument(
  doc: ServableDocument,
  mode: ServeMode,
): Promise<Response | null> {
  let bytes: Buffer;
  try {
    bytes = await getFile(doc.storageKey);
  } catch {
    return null;
  }

  const kind = mode === "view" ? viewKind(doc) : null;
  if (!kind) {
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": doc.contentType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${safeFilename(doc.filename)}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  const body =
    kind === "markdown"
      ? markdownDocumentHtml(doc.title, bytes.toString("utf8"))
      : new Uint8Array(bytes);
  return new Response(body, { headers: inlineHeaders(kind, doc.filename) });
}
