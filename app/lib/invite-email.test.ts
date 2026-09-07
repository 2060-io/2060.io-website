import { describe, expect, it } from "vitest";
import {
  DEFAULT_TEMPLATE,
  inviteValues,
  resolveInviteTemplate,
} from "./invite-email";

describe("invite email template", () => {
  const values = inviteValues({ orgName: "Acme Ventures", email: "jane@acme.vc" });

  it("resolves all placeholders in the default template", () => {
    const subject = resolveInviteTemplate(DEFAULT_TEMPLATE.subject, values);
    const body = resolveInviteTemplate(DEFAULT_TEMPLATE.bodyMarkdown, values);
    expect(subject).not.toContain("{{");
    expect(body).not.toContain("{{");
    expect(body).toContain("Acme Ventures");
    expect(body).toContain("jane@acme.vc");
  });

  it("exposes exactly the documented placeholders", () => {
    expect(Object.keys(values).sort()).toEqual(["email", "login_url", "org_name"]);
    expect(values.login_url).toMatch(/\/dataroom$/);
  });

  it("throws on unknown placeholders (validated at save time)", () => {
    expect(() => resolveInviteTemplate("Hi {{name}}", values)).toThrow(
      /unknown placeholder "\{\{name\}\}"/,
    );
  });
});
