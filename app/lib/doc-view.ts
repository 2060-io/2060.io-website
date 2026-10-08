import { marked } from "marked";
import { safeFilename } from "@/app/lib/documents";

/**
 * Viewing repository files in the browser instead of downloading them.
 *
 * PDFs open in the browser's own viewer. HTML (uploaded decks) and Markdown
 * (rendered here) are served under a Content-Security-Policy `sandbox`: the
 * document gets an opaque origin, so whatever scripts an uploaded file carries
 * cannot read the data-room cookies or call its authenticated endpoints, even
 * though the bytes come from our host. Uploaded HTML keeps its scripts (decks
 * need them); rendered Markdown gets none.
 */

export type ViewKind = "pdf" | "html" | "markdown";

const BY_EXTENSION: Record<string, ViewKind> = {
  pdf: "pdf",
  html: "html",
  htm: "html",
  md: "markdown",
  markdown: "markdown",
};

const BY_CONTENT_TYPE: Record<string, ViewKind> = {
  "application/pdf": "pdf",
  "text/html": "html",
  "text/markdown": "markdown",
};

/**
 * How a repository file can be shown in the browser, or null when it can only
 * be downloaded. The extension decides first — browsers upload `.md` as
 * `application/octet-stream` more often than not — the stored content type is
 * the fallback. URL entries are never "viewed" (they redirect).
 */
export function viewKind(doc: {
  kind?: string;
  filename: string;
  contentType: string;
}): ViewKind | null {
  if (doc.kind && doc.kind !== "file") return null;
  const ext = doc.filename.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  if (ext && BY_EXTENSION[ext]) return BY_EXTENSION[ext];
  const ct = doc.contentType.split(";")[0].trim().toLowerCase();
  return BY_CONTENT_TYPE[ct] ?? null;
}

/** File types the repository can render a preview thumbnail from. */
export type ThumbnailSource = "pdf" | "markdown" | "image";

const IMAGE_EXTENSIONS = new Set([
  "png", "jpg", "jpeg", "webp", "gif", "avif", "tif", "tiff", "svg",
]);

/**
 * Whether (and from what) an automatic thumbnail can be rendered: page 1 of a
 * PDF, page 1 of a Markdown file (via the PDF renderer), or the image itself.
 * Null for everything else — HTML decks included (no browser on the server),
 * those take an admin-uploaded cover instead.
 */
export function thumbnailSource(doc: {
  kind?: string;
  filename: string;
  contentType: string;
}): ThumbnailSource | null {
  if (doc.kind && doc.kind !== "file") return null;
  const vk = viewKind(doc);
  if (vk === "pdf" || vk === "markdown") return vk;
  const ext = doc.filename.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
  const ct = doc.contentType.split(";")[0].trim().toLowerCase();
  if (IMAGE_EXTENSIONS.has(ext) || (ct.startsWith("image/") && ct !== "image/x-icon")) {
    return "image";
  }
  return null;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const MARKDOWN_PAGE_CSS = `
:root { color-scheme: light dark; --fg: #1a1a1a; --muted: #5b5b5b; --border: #d9d9d9; --bg: #ffffff; --code: #f3f3f3; --accent: #0a5bd3; }
@media (prefers-color-scheme: dark) { :root { --fg: #e6e6e6; --muted: #a0a0a0; --border: #333; --bg: #111; --code: #1d1d1d; --accent: #7fb0ff; } }
html { background: var(--bg); }
body { margin: 0; padding: 2.5rem 1rem 4rem; color: var(--fg); background: var(--bg);
  font: 16px/1.65 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
main { max-width: 44rem; margin: 0 auto; }
h1, h2, h3, h4 { line-height: 1.25; margin: 1.6em 0 0.5em; font-weight: 650; }
h1 { font-size: 1.9rem; margin-top: 0; } h2 { font-size: 1.4rem; } h3 { font-size: 1.15rem; }
p, ul, ol, blockquote, pre, table { margin: 0.8em 0; }
a { color: var(--accent); }
blockquote { margin-left: 0; padding-left: 1em; border-left: 3px solid var(--border); color: var(--muted); }
code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.92em; background: var(--code); padding: 0.1em 0.3em; border-radius: 3px; }
pre { background: var(--code); padding: 0.9em 1em; overflow-x: auto; border-radius: 4px; } pre code { background: none; padding: 0; }
table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid var(--border); padding: 0.4em 0.6em; text-align: left; vertical-align: top; } th { font-weight: 650; }
img { max-width: 100%; height: auto; }
hr { border: 0; border-top: 1px solid var(--border); margin: 2em 0; }
`;

/**
 * A complete HTML page for a Markdown document — what the sandboxed viewer
 * shows. GitHub-flavoured Markdown via `marked`; raw HTML in the source is
 * passed through, which the script-less sandbox makes harmless.
 */
export function markdownDocumentHtml(title: string, markdown: string): string {
  const body = marked.parse(markdown, { async: false, gfm: true }) as string;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${escapeHtml(title)}</title>
<style>${MARKDOWN_PAGE_CSS}</style>
</head>
<body>
<main>
${body}
</main>
</body>
</html>
`;
}

/** Uploaded HTML: scripts allowed (decks need them); popups allowed and let out of the sandbox so external links open as normal windows. */
const HTML_SANDBOX = "sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox";
/** Rendered Markdown runs no script at all. */
const MARKDOWN_SANDBOX = "sandbox allow-popups allow-popups-to-escape-sandbox";

/**
 * Headers for serving a file inline. No CSP for PDFs: the browser's viewer
 * runs no document script against our origin, and Chrome refuses to render a
 * PDF under `sandbox`.
 */
export function inlineHeaders(kind: ViewKind, filename: string): Record<string, string> {
  const safe = safeFilename(filename);
  const common = {
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  };
  switch (kind) {
    case "pdf":
      return {
        ...common,
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${safe}"`,
      };
    case "html":
      return {
        ...common,
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="${safe}"`,
        "Content-Security-Policy": HTML_SANDBOX,
        "Referrer-Policy": "no-referrer",
      };
    case "markdown":
      return {
        ...common,
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `inline; filename="${safe.replace(/\.(md|markdown)$/i, "")}.html"`,
        "Content-Security-Policy": MARKDOWN_SANDBOX,
        "Referrer-Policy": "no-referrer",
      };
  }
}
