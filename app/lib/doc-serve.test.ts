import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

// storage.ts resolves STORAGE_DIR when first imported, so point it at a
// scratch directory before loading the module under test.
const root = mkdtempSync(path.join(tmpdir(), "dataroom-serve-"));
process.env.STORAGE_DIR = root;

type Serve = typeof import("./doc-serve").serveDocument;
let serveDocument: Serve;

function put(key: string, content: string | Buffer) {
  const full = path.join(root, key);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, content);
}

const base = { kind: "file", title: "Doc" };

beforeAll(async () => {
  ({ serveDocument } = await import("./doc-serve"));
  put("documents/a/v1-deck.pdf", "%PDF-1.4 fake");
  put("documents/b/v1-deck.html", "<!doctype html><script>alert(1)</script><h1>Deck</h1>");
  put("documents/c/v1-memo.md", "# Memo\n\nHello **there**.\n");
  put("documents/d/v1-model.xlsx", "PK fake");
});

describe("serveDocument", () => {
  it("downloads are attachments with the stored type, never cached", async () => {
    const res = await serveDocument(
      { ...base, filename: "deck.pdf", contentType: "application/pdf", storageKey: "documents/a/v1-deck.pdf" },
      "download",
    );
    expect(res).not.toBeNull();
    expect(res!.headers.get("Content-Disposition")).toBe('attachment; filename="deck.pdf"');
    expect(res!.headers.get("Content-Type")).toBe("application/pdf");
    expect(res!.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await res!.text()).toBe("%PDF-1.4 fake");
  });

  it("views a PDF inline without a sandbox", async () => {
    const res = await serveDocument(
      { ...base, filename: "deck.pdf", contentType: "application/octet-stream", storageKey: "documents/a/v1-deck.pdf" },
      "view",
    );
    expect(res!.headers.get("Content-Disposition")).toBe('inline; filename="deck.pdf"');
    expect(res!.headers.get("Content-Type")).toBe("application/pdf");
    expect(res!.headers.get("Content-Security-Policy")).toBeNull();
  });

  it("views uploaded HTML byte-for-byte, sandboxed with scripts", async () => {
    const res = await serveDocument(
      { ...base, filename: "deck.html", contentType: "text/html", storageKey: "documents/b/v1-deck.html" },
      "view",
    );
    expect(res!.headers.get("Content-Type")).toBe("text/html; charset=utf-8");
    expect(res!.headers.get("Content-Security-Policy")).toBe(
      "sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox",
    );
    expect(await res!.text()).toContain("<script>alert(1)</script>"); // untouched; the sandbox is the control
  });

  it("renders Markdown into a page, sandboxed without scripts", async () => {
    const res = await serveDocument(
      { ...base, title: "Q4 memo", filename: "memo.md", contentType: "application/octet-stream", storageKey: "documents/c/v1-memo.md" },
      "view",
    );
    expect(res!.headers.get("Content-Type")).toBe("text/html; charset=utf-8");
    expect(res!.headers.get("Content-Security-Policy")).toBe("sandbox allow-popups allow-popups-to-escape-sandbox");
    expect(res!.headers.get("Content-Disposition")).toBe('inline; filename="memo.html"');
    const html = await res!.text();
    expect(html).toContain("<title>Q4 memo</title>");
    expect(html).toContain("<h1>Memo</h1>");
    expect(html).toContain("Hello <strong>there</strong>.");
  });

  it("falls back to a download for types it cannot show", async () => {
    const res = await serveDocument(
      { ...base, filename: "model.xlsx", contentType: "application/vnd.ms-excel", storageKey: "documents/d/v1-model.xlsx" },
      "view",
    );
    expect(res!.headers.get("Content-Disposition")).toBe('attachment; filename="model.xlsx"');
    expect(res!.headers.get("Content-Type")).toBe("application/vnd.ms-excel");
  });

  it("returns null when the file is missing on the volume", async () => {
    const res = await serveDocument(
      { ...base, filename: "gone.pdf", contentType: "application/pdf", storageKey: "documents/zz/v1-gone.pdf" },
      "view",
    );
    expect(res).toBeNull();
  });
});
