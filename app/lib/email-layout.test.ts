import { describe, expect, it } from "vitest";
import { emailLayout } from "./email-layout";

describe("emailLayout", () => {
  it("carries both brand logos as hosted raster images", () => {
    const html = emailLayout({ heading: "Hi", bodyHtml: "<p>x</p>" });
    expect(html).toContain('alt="2060"');
    expect(html).toContain("/assets/email/2060-logo.png");
    expect(html).toContain('alt="Verana Foundation"');
    expect(html).toContain("/assets/email/verana-foundation-logo.png");
  });

  it("renders heading, body, and the optional button", () => {
    const html = emailLayout({
      heading: "Hello",
      bodyHtml: "<p>body</p>",
      button: { label: "Open", href: "https://2060.io/dataroom" },
    });
    expect(html).toContain("Hello");
    expect(html).toContain("<p>body</p>");
    expect(html).toContain('href="https://2060.io/dataroom"');
  });
});
