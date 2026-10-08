import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { renderThumbnail, THUMB_WIDTH } from "./doc-thumbnail";
import { thumbnailSource } from "./doc-view";
import { docIcon } from "./doc-icon";

async function samplePdf(): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595.28, 841.89]);
  page.drawText("Investor memo", { x: 56, y: 760, size: 24, font, color: rgb(0.1, 0.1, 0.1) });
  page.drawRectangle({ x: 56, y: 400, width: 300, height: 200, color: rgb(0.2, 0.4, 0.9) });
  doc.addPage([595.28, 841.89]);
  return Buffer.from(await doc.save());
}

const file = (filename: string, contentType = "application/octet-stream") => ({
  kind: "file",
  filename,
  contentType,
});

describe("thumbnailSource", () => {
  it("knows what can be rendered", () => {
    expect(thumbnailSource(file("deck.pdf"))).toBe("pdf");
    expect(thumbnailSource(file("memo.md"))).toBe("markdown");
    expect(thumbnailSource(file("cover.PNG"))).toBe("image");
    expect(thumbnailSource(file("photo", "image/jpeg"))).toBe("image");
    expect(thumbnailSource(file("deck.html", "text/html"))).toBeNull();
    expect(thumbnailSource(file("model.xlsx"))).toBeNull();
    expect(thumbnailSource({ kind: "url", filename: "", contentType: "" })).toBeNull();
  });
});

describe("renderThumbnail", () => {
  it("rasterizes page 1 of a PDF into a 480 px WebP with real content", async () => {
    const webp = await renderThumbnail(file("deck.pdf"), await samplePdf());
    expect(webp).not.toBeNull();
    const meta = await sharp(webp!).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(THUMB_WIDTH);
    expect(meta.height).toBeGreaterThan(600); // A4 portrait at 480 wide ≈ 679
    // The blue rectangle must be there: some pixels are far from white.
    const stats = await sharp(webp!).stats();
    expect(Math.min(...stats.channels.map((c) => c.min))).toBeLessThan(120);
  }, 30_000);

  it("renders Markdown through the PDF renderer", async () => {
    const webp = await renderThumbnail(file("memo.md"), Buffer.from("# Memo\n\nHello **there**.\n"));
    expect(webp).not.toBeNull();
    const meta = await sharp(webp!).metadata();
    expect(meta.width).toBe(THUMB_WIDTH);
    const stats = await sharp(webp!).stats();
    expect(stats.channels[0].min).toBeLessThan(120); // text ink present
  }, 30_000);

  it("resizes images and flattens transparency onto white", async () => {
    const png = await sharp({
      create: { width: 1200, height: 600, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .png()
      .toBuffer();
    const webp = await renderThumbnail(file("cover.png"), png);
    const meta = await sharp(webp!).metadata();
    expect(meta.width).toBe(THUMB_WIDTH);
    expect(meta.height).toBe(240);
    const stats = await sharp(webp!).stats();
    expect(stats.channels[0].min).toBeGreaterThan(250); // transparent → white
  });

  it("has nothing for HTML or Office files", async () => {
    expect(await renderThumbnail(file("deck.html", "text/html"), Buffer.from("<h1>x</h1>"))).toBeNull();
    expect(await renderThumbnail(file("model.xlsx"), Buffer.from("PK"))).toBeNull();
  });
});

describe("docIcon", () => {
  it("picks a type icon by extension, a link icon for URL entries", () => {
    expect(docIcon("url", "")).toBe("fa-link");
    expect(docIcon("file", "Deck.PDF")).toBe("fa-file-pdf");
    expect(docIcon("file", "model.xlsx")).toBe("fa-file-excel");
    expect(docIcon("file", "deck.html")).toBe("fa-file-code");
    expect(docIcon("file", "notes.md")).toBe("fa-file-lines");
    expect(docIcon("file", "archive.tar.gz")).toBe("fa-file-zipper");
    expect(docIcon("file", "mystery")).toBe("fa-file");
  });
});
