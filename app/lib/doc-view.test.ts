import { describe, expect, it } from "vitest";
import { inlineHeaders, markdownDocumentHtml, viewKind } from "./doc-view";

describe("viewKind", () => {
  it("classifies by extension first, case-insensitively", () => {
    expect(viewKind({ filename: "deck.PDF", contentType: "application/octet-stream" })).toBe("pdf");
    expect(viewKind({ filename: "deck.html", contentType: "text/html" })).toBe("html");
    expect(viewKind({ filename: "page.htm", contentType: "" })).toBe("html");
    // Browsers upload .md without a usable type.
    expect(viewKind({ filename: "memo.md", contentType: "application/octet-stream" })).toBe("markdown");
    expect(viewKind({ filename: "memo.markdown", contentType: "" })).toBe("markdown");
  });

  it("falls back to the content type when the extension says nothing", () => {
    expect(viewKind({ filename: "download", contentType: "application/pdf" })).toBe("pdf");
    expect(viewKind({ filename: "x.bin", contentType: "text/html; charset=utf-8" })).toBe("html");
  });

  it("is null for download-only files and for URL entries", () => {
    expect(viewKind({ filename: "model.xlsx", contentType: "application/vnd.ms-excel" })).toBeNull();
    expect(viewKind({ filename: "cap-table.docx", contentType: "" })).toBeNull();
    expect(viewKind({ kind: "url", filename: "", contentType: "" })).toBeNull();
  });
});

describe("markdownDocumentHtml", () => {
  it("renders GitHub-flavoured Markdown into a complete page with an escaped title", () => {
    const html = markdownDocumentHtml(
      'Memo <"Q4">',
      "# Hello\n\n- one\n- **two**\n\n[site](https://2060.io)\n\n| a | b |\n|---|---|\n| 1 | 2 |",
    );
    expect(html).toMatch(/^<!doctype html>/);
    expect(html).toContain("<title>Memo &lt;&quot;Q4&quot;&gt;</title>");
    expect(html).toContain('<meta charset="utf-8">');
    expect(html).toContain("<h1>Hello</h1>");
    expect(html).toContain("<li><strong>two</strong></li>");
    expect(html).toContain('<a href="https://2060.io">site</a>');
    expect(html).toContain("<td>2</td>");
  });
});

describe("inlineHeaders", () => {
  it("sandboxes uploaded HTML with scripts, rendered Markdown without", () => {
    const html = inlineHeaders("html", "deck.html");
    expect(html["Content-Security-Policy"]).toContain("sandbox");
    expect(html["Content-Security-Policy"]).toContain("allow-scripts");
    expect(html["Content-Type"]).toBe("text/html; charset=utf-8");
    expect(html["Content-Disposition"]).toBe('inline; filename="deck.html"');

    const md = inlineHeaders("markdown", "memo.md");
    expect(md["Content-Security-Policy"]).toContain("sandbox");
    expect(md["Content-Security-Policy"]).not.toContain("allow-scripts");
    expect(md["Content-Disposition"]).toBe('inline; filename="memo.html"');
  });

  it("serves PDFs inline without a sandbox and never caches or sniffs", () => {
    const pdf = inlineHeaders("pdf", "Investor Deck.pdf");
    expect(pdf["Content-Type"]).toBe("application/pdf");
    expect(pdf["Content-Disposition"]).toBe('inline; filename="Investor-Deck.pdf"');
    expect(pdf["Content-Security-Policy"]).toBeUndefined();
    for (const h of [pdf, inlineHeaders("html", "a.html"), inlineHeaders("markdown", "a.md")]) {
      expect(h["Cache-Control"]).toBe("private, no-store");
      expect(h["X-Content-Type-Options"]).toBe("nosniff");
    }
  });
});
