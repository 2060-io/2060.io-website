import { describe, expect, it } from "vitest";
import { markdownToHtml, renderTemplateHtml } from "./doc-html";

describe("markdownToHtml", () => {
  it("renders headings, bold, rules and paragraphs", () => {
    const html = markdownToHtml("# Title\n\nHello **world**.\n\n---\n\ndone");
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<p>Hello <strong>world</strong>.</p>");
    expect(html).toContain("<hr />");
    expect(html).toContain("<p>done</p>");
  });

  it("escapes HTML in source text (no injection via signer values)", () => {
    const html = markdownToHtml('Evil <script>alert("x")</script>');
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("renders pipe tables", () => {
    const html = markdownToHtml("| A | B |\n|---|---|\n| 1 | 2 |");
    expect(html).toContain("<th>A</th>");
    expect(html).toContain("<td>2</td>");
  });
});

describe("renderTemplateHtml", () => {
  it("keeps placeholders literal and strips IF markers", () => {
    const html = renderTemplateHtml(
      "<!--IF:x-->A<!--ELSE-->B<!--ENDIF--> {{org_name}}",
    );
    expect(html).toContain("AB {{org_name}}");
  });
});
