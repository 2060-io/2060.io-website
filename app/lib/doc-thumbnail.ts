import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { db } from "@/app/lib/db";
import { deleteFile, getFile, putFile } from "@/app/lib/storage";
import { thumbnailSource } from "@/app/lib/doc-view";
import { markdownToPdf } from "@/app/lib/doc-pdf";

/**
 * Preview thumbnails for repository documents — WebP, 480 px wide (twice what
 * the lists display), stored next to the document on the volume.
 *
 *   PDF       → page 1, rasterized with pdf.js on a @napi-rs/canvas (no
 *               system packages, no browser; prebuilt binaries incl. musl)
 *   Markdown  → page 1 of the existing markdownToPdf rendering, same path
 *   image     → the image itself, resized with sharp
 *   anything else (HTML decks, Office files…) → no automatic thumbnail; a VC
 *               admin can upload a cover ("custom"), which also survives
 *               content replacements.
 *
 * Everything here is best-effort: a failure logs and leaves the row without a
 * thumbnail (the lists show a type icon), it never fails an upload.
 */

export const THUMB_WIDTH = 480;
const THUMB_MAX_HEIGHT = 720;
const RENDER_TIMEOUT_MS = 20_000;
const MAX_CUSTOM_BYTES = 10 * 1024 * 1024;

export class ThumbnailError extends Error {}

function withTimeout<T>(p: Promise<T>, ms: number, what: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new ThumbnailError(`${what} timed out after ${ms} ms`)), ms);
    p.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); },
    );
  });
}

/**
 * pdf.js reads its standard fonts, CMaps, wasm decoders and ICC profiles from
 * disk; next.config.ts traces these directories into the standalone output.
 */
function pdfjsAssetDir(): string | null {
  const dir = path.join(process.cwd(), "node_modules", "pdfjs-dist");
  return existsSync(dir) ? dir + path.sep : null;
}

type NodeCanvas = { toBuffer(mime: "image/png"): Buffer };
type CanvasFactory = {
  create(w: number, h: number): { canvas: NodeCanvas; context: CanvasRenderingContext2D };
};

/** Rasterize page 1 of a PDF to a PNG buffer at thumbnail size. */
export async function rasterizePdfFirstPage(pdfBytes: Uint8Array): Promise<Buffer> {
  // pdf.js only warns when the canvas package is missing and then renders
  // nothing; load it first so a broken deployment fails loudly here instead.
  await import("@napi-rs/canvas");
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const assets = pdfjsAssetDir();
  const task = pdfjs.getDocument({
    data: new Uint8Array(pdfBytes), // copy: pdf.js takes ownership
    ...(assets
      ? {
          standardFontDataUrl: `${assets}standard_fonts/`,
          cMapUrl: `${assets}cmaps/`,
          cMapPacked: true,
          wasmUrl: `${assets}wasm/`,
          iccUrl: `${assets}iccs/`,
        }
      : {}),
    verbosity: 0,
  });
  try {
    const pdf = await task.promise;
    const page = await pdf.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(THUMB_WIDTH / base.width, THUMB_MAX_HEIGHT / base.height);
    const viewport = page.getViewport({ scale });
    const factory = pdf.canvasFactory as CanvasFactory;
    const { canvas, context } = factory.create(
      Math.ceil(viewport.width),
      Math.ceil(viewport.height),
    );
    await page.render({ canvasContext: context, canvas: canvas as unknown as HTMLCanvasElement, viewport, background: "#ffffff" }).promise;
    return canvas.toBuffer("image/png");
  } finally {
    await task.destroy();
  }
}

async function toWebp(image: Buffer): Promise<Buffer> {
  return sharp(image, { limitInputPixels: 80_000_000 })
    .flatten({ background: "#ffffff" })
    .resize({ width: THUMB_WIDTH, height: THUMB_MAX_HEIGHT, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
}

/**
 * Render the automatic thumbnail for a stored file, or null when the type has
 * none. Throws (ThumbnailError or the renderer's error) on failure.
 */
export async function renderThumbnail(
  doc: { kind: string; filename: string; contentType: string },
  bytes: Buffer,
): Promise<Buffer | null> {
  const source = thumbnailSource(doc);
  if (!source) return null;
  const render = async () => {
    if (source === "image") return toWebp(bytes);
    const pdf = source === "markdown" ? await markdownToPdf(bytes.toString("utf8")) : bytes;
    return toWebp(await rasterizePdfFirstPage(pdf));
  };
  return withTimeout(render(), RENDER_TIMEOUT_MS, `thumbnail of ${doc.filename}`);
}

export function thumbnailKey(docId: string, version: number, source: "auto" | "custom"): string {
  return `documents/${docId}/${source === "custom" ? "custom" : `v${version}`}-thumb.webp`;
}

export type RefreshResult = "generated" | "kept-custom" | "unsupported" | "failed";

/**
 * (Re)generate a document's automatic thumbnail from its current content and
 * store it. A custom cover is kept unless `replaceCustom`. Never throws.
 */
export async function refreshAutoThumbnail(
  docId: string,
  opts: { replaceCustom?: boolean } = {},
): Promise<RefreshResult> {
  const doc = await db.document.findUnique({ where: { id: docId } });
  if (!doc || doc.kind !== "file") return "unsupported";
  if (doc.thumbnailSource === "custom" && !opts.replaceCustom) return "kept-custom";

  const clear = async () => {
    if (doc.thumbnailKey) {
      await db.document.update({
        where: { id: docId },
        data: { thumbnailKey: null, thumbnailSource: null },
      });
    }
  };

  if (!thumbnailSource(doc)) {
    await clear();
    return "unsupported";
  }
  try {
    const bytes = await getFile(doc.storageKey);
    const webp = await renderThumbnail(doc, bytes);
    if (!webp) {
      await clear();
      return "unsupported";
    }
    const key = thumbnailKey(doc.id, doc.version, "auto");
    await putFile(key, webp);
    await db.document.update({
      where: { id: docId },
      data: { thumbnailKey: key, thumbnailSource: "auto" },
    });
    return "generated";
  } catch (e) {
    console.error(`[thumbnail] ${doc.filename} (${doc.id}):`, e);
    await clear(); // never show a stale preview of replaced content
    return "failed";
  }
}

/** Store an admin-uploaded cover (any raster image sharp reads) as the thumbnail. */
export async function setCustomThumbnail(docId: string, image: Buffer): Promise<void> {
  if (image.length > MAX_CUSTOM_BYTES) throw new ThumbnailError("Image too large (10 MB max).");
  const doc = await db.document.findUnique({ where: { id: docId } });
  if (!doc) throw new ThumbnailError("Document not found.");
  let webp: Buffer;
  try {
    webp = await toWebp(image);
  } catch {
    throw new ThumbnailError("That file is not an image we can read (PNG, JPEG, WebP, GIF, AVIF, SVG).");
  }
  const key = thumbnailKey(doc.id, doc.version, "custom");
  await putFile(key, webp);
  await db.document.update({
    where: { id: docId },
    data: { thumbnailKey: key, thumbnailSource: "custom" },
  });
}

/** Drop a custom cover and fall back to whatever can be rendered automatically. */
export async function removeCustomThumbnail(docId: string): Promise<RefreshResult> {
  const doc = await db.document.findUnique({ where: { id: docId } });
  if (!doc) return "unsupported";
  if (doc.thumbnailSource === "custom" && doc.thumbnailKey) {
    await deleteFile(doc.thumbnailKey);
    await db.document.update({
      where: { id: docId },
      data: { thumbnailKey: null, thumbnailSource: null },
    });
  }
  return refreshAutoThumbnail(docId, { replaceCustom: true });
}
