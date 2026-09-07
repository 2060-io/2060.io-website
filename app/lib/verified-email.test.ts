import { describe, expect, it } from "vitest";
import {
  pickGithubVerifiedEmail,
  isGoogleEmailVerified,
  type GithubEmail,
} from "./verified-email";

describe("pickGithubVerifiedEmail", () => {
  const e = (email: string, primary: boolean, verified: boolean): GithubEmail => ({
    email,
    primary,
    verified,
  });

  it("prefers the primary verified email", () => {
    expect(
      pickGithubVerifiedEmail([
        e("other@x.com", false, true),
        e("primary@x.com", true, true),
      ]),
    ).toBe("primary@x.com");
  });

  it("falls back to any verified email when the primary is unverified", () => {
    expect(
      pickGithubVerifiedEmail([
        e("primary@x.com", true, false),
        e("verified@x.com", false, true),
      ]),
    ).toBe("verified@x.com");
  });

  it("returns null when nothing is verified", () => {
    expect(
      pickGithubVerifiedEmail([
        e("a@x.com", true, false),
        e("b@x.com", false, false),
      ]),
    ).toBeNull();
    expect(pickGithubVerifiedEmail([])).toBeNull();
  });
});

describe("isGoogleEmailVerified", () => {
  it("accepts only an explicit email_verified: true", () => {
    expect(isGoogleEmailVerified({ email_verified: true })).toBe(true);
    expect(isGoogleEmailVerified({ email_verified: false })).toBe(false);
    expect(isGoogleEmailVerified({})).toBe(false);
    expect(isGoogleEmailVerified(null)).toBe(false);
    expect(isGoogleEmailVerified(undefined)).toBe(false);
  });
});
