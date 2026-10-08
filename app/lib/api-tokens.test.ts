import { describe, expect, it } from "vitest";
import { generateSecret, hashToken, TOKEN_PREFIX } from "./api-tokens";

describe("api tokens", () => {
  it("generates distinct prefixed url-safe secrets", () => {
    const a = generateSecret();
    const b = generateSecret();
    expect(a).not.toBe(b);
    expect(a.startsWith(TOKEN_PREFIX)).toBe(true);
    expect(a.slice(TOKEN_PREFIX.length)).toMatch(/^[A-Za-z0-9_-]{40}$/);
  });

  it("hashes deterministically with sha256 hex", () => {
    const s = generateSecret();
    expect(hashToken(s)).toBe(hashToken(s));
    expect(hashToken(s)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(s)).not.toBe(hashToken(s + "x"));
  });
});
