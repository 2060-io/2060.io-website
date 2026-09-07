import { describe, expect, it } from "vitest";
import { resolveNdaTemplate, type NdaContext } from "./nda-template";

const ctx: NdaContext = {
  orgName: "Acme Ventures",
  signerName: "Jane Doe",
  signerEmail: "jane@acme.vc",
  effectiveDate: new Date(Date.UTC(2026, 8, 7)), // 7 September 2026
};

describe("resolveNdaTemplate", () => {
  it("substitutes all placeholders", () => {
    const out = resolveNdaTemplate(
      "{{org_name}} / {{signer_name}} / {{signer_email}} / {{effective_date}} / {{effective_year}}",
      ctx,
    );
    expect(out).toBe(
      "Acme Ventures / Jane Doe / jane@acme.vc / 7 September 2026 / 2026",
    );
  });

  it("resolves IF/ELSE blocks against flags (none true today)", () => {
    // No flags are defined for the NDA context yet, so any flag is unknown.
    expect(() =>
      resolveNdaTemplate("<!--IF:is_fund-->A<!--ELSE-->B<!--ENDIF-->", ctx),
    ).toThrow(/unknown flag/);
  });

  it("throws on unknown placeholders", () => {
    expect(() => resolveNdaTemplate("{{nope}}", ctx)).toThrow(
      /unknown placeholder "nope"/,
    );
  });

  it("throws on unbalanced conditionals", () => {
    expect(() =>
      resolveNdaTemplate("<!--IF:is_fund-->A", ctx),
    ).toThrow(/unresolved token/);
  });

  it("trims context values", () => {
    const out = resolveNdaTemplate("{{org_name}}", {
      ...ctx,
      orgName: "  Acme Ventures  ",
    });
    expect(out).toBe("Acme Ventures");
  });
});
