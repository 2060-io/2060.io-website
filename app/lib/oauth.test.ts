import { describe, expect, it } from "vitest";
import {
  isValidRedirectUri,
  parseScope,
  pkceChallenge,
  pkceVerify,
  redirectUriMatches,
  scopeString,
  tokenScopeOf,
  validateRegistration,
} from "./oauth";

describe("oauth helpers", () => {
  it("parses and maps scopes", () => {
    expect(parseScope("")).toEqual(["read"]);
    expect(parseScope("read write")).toEqual(["read", "write"]);
    expect(parseScope("write")).toEqual(["write"]);
    expect(parseScope("admin")).toBeNull();
    expect(tokenScopeOf(["read"])).toBe("read");
    expect(tokenScopeOf(["read", "write"])).toBe("write");
    expect(scopeString("write")).toBe("read write");
  });
  it("accepts https and loopback http redirect URIs only", () => {
    expect(isValidRedirectUri("https://claude.ai/api/mcp/auth_callback")).toBe(true);
    expect(isValidRedirectUri("http://localhost:6274/oauth/callback")).toBe(true);
    expect(isValidRedirectUri("http://127.0.0.1/cb")).toBe(true);
    expect(isValidRedirectUri("http://example.com/cb")).toBe(false);
    expect(isValidRedirectUri("https://x.y/cb#frag")).toBe(false);
    expect(isValidRedirectUri("not a url")).toBe(false);
  });
  it("matches redirect URIs exactly, with loopback ports free", () => {
    expect(redirectUriMatches("https://a.b/cb", "https://a.b/cb")).toBe(true);
    expect(redirectUriMatches("https://a.b/cb", "https://a.b/cb2")).toBe(false);
    expect(redirectUriMatches("http://localhost:1234/cb", "http://localhost:9999/cb")).toBe(true);
    expect(redirectUriMatches("http://localhost:1234/cb", "http://localhost:9999/other")).toBe(false);
  });
  it("verifies PKCE S256 with a well-formed verifier only", () => {
    const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    expect(pkceChallenge(verifier)).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
    expect(pkceVerify(verifier, pkceChallenge(verifier))).toBe(true);
    expect(pkceVerify("short", pkceChallenge("short"))).toBe(false);
    expect(pkceVerify(verifier, "nope")).toBe(false);
  });
  it("validates dynamic registration requests", () => {
    const ok = validateRegistration({ client_name: "Claude", redirect_uris: ["https://claude.ai/api/mcp/auth_callback"] });
    expect(ok.ok).toBe(true);
    expect(validateRegistration({ client_name: "x" }).ok).toBe(false);
    expect(validateRegistration({ redirect_uris: ["https://a.b/cb"], grant_types: ["implicit"] }).ok).toBe(false);
    expect(validateRegistration({ redirect_uris: ["https://a.b/cb"], scope: "admin" }).ok).toBe(false);
  });
});
