import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { ApiTokenScope } from "@prisma/client";
import { db } from "@/app/lib/db";
import { generateSecret, hashToken } from "@/app/lib/api-tokens";

/**
 * OAuth 2.1 authorization server for the MCP connectors (ported from the
 * Verana Foundation site, ADR-0005 amendment): dynamic client registration
 * (RFC 7591), authorization code + PKCE (S256 only), refresh-token rotation
 * with replay detection, revocation (RFC 7009), server metadata (RFC 8414)
 * and resource indicators (RFC 8707). The site is the issuer; the tokens it
 * mints are the same hashed `dr_` records the MCP route verifies, so the
 * tools need no change.
 */

export const SCOPES = ["read", "write"] as const;
export const ACCESS_TOKEN_TTL_S = 60 * 60; // 1 hour
export const REFRESH_TOKEN_TTL_S = 90 * 24 * 60 * 60; // 90 days
export const CODE_TTL_S = 10 * 60;

export function issuer(): string {
  return (process.env.AUTH_URL ?? "https://2060.io").replace(/\/+$/, "");
}

/** The protected resource this server issues tokens for. */
export function mcpResourceUrl(): string {
  return `${issuer()}/api/mcp`;
}

export function authorizationServerMetadata() {
  const base = issuer();
  return {
    issuer: base,
    authorization_endpoint: `${base}/oauth/authorize`,
    token_endpoint: `${base}/api/oauth/token`,
    registration_endpoint: `${base}/api/oauth/register`,
    revocation_endpoint: `${base}/api/oauth/revoke`,
    scopes_supported: [...SCOPES],
    response_types_supported: ["code"],
    response_modes_supported: ["query"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["none", "client_secret_post", "client_secret_basic"],
    revocation_endpoint_auth_methods_supported: ["none", "client_secret_post", "client_secret_basic"],
    code_challenge_methods_supported: ["S256"],
    service_documentation: `${base}/account/settings`,
  };
}

// ── Pure helpers (tested) ────────────────────────────────────────────────────

/** "read write" → ["read","write"]; unknown scopes are rejected (null). Empty → ["read"]. */
export function parseScope(raw: string | null | undefined): ApiTokenScope[] | null {
  const parts = (raw ?? "").split(/[\s+]+/).filter(Boolean);
  if (parts.length === 0) return ["read"];
  const out = new Set<ApiTokenScope>();
  for (const p of parts) {
    if (!(SCOPES as readonly string[]).includes(p)) return null;
    out.add(p as ApiTokenScope);
  }
  return [...out];
}

/** The single token scope a scope list maps to: write implies read. */
export function tokenScopeOf(scopes: ApiTokenScope[]): ApiTokenScope {
  return scopes.includes("write") ? "write" : "read";
}

export function scopeString(scope: ApiTokenScope): string {
  return scope === "write" ? "read write" : "read";
}

/** https only, or http on a loopback host (desktop clients); no fragments. */
export function isValidRedirectUri(uri: string): boolean {
  let u: URL;
  try {
    u = new URL(uri);
  } catch {
    return false;
  }
  if (u.hash) return false;
  if (u.protocol === "https:") return true;
  if (u.protocol === "http:") return ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname);
  return false;
}

/** Exact match, except that a loopback redirect may use any port (RFC 8252 §7.3). */
export function redirectUriMatches(registered: string, requested: string): boolean {
  if (registered === requested) return true;
  try {
    const a = new URL(registered);
    const b = new URL(requested);
    const loopback = ["localhost", "127.0.0.1", "[::1]"];
    return (
      a.protocol === "http:" && b.protocol === "http:" &&
      loopback.includes(a.hostname) && a.hostname === b.hostname &&
      a.pathname === b.pathname && a.search === b.search
    );
  } catch {
    return false;
  }
}

export function pkceChallenge(verifier: string): string {
  return createHash("sha256").update(verifier, "ascii").digest("base64url");
}

/** RFC 7636: 43–128 chars of the unreserved set, S256 only. */
export function pkceVerify(verifier: string, challenge: string): boolean {
  if (!/^[A-Za-z0-9\-._~]{43,128}$/.test(verifier)) return false;
  const a = Buffer.from(pkceChallenge(verifier));
  const b = Buffer.from(challenge);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** A valid resource indicator for this server, or null when absent/invalid. */
export function resourceOk(resource: string | null | undefined): boolean {
  if (!resource) return true; // optional
  return resource.replace(/\/+$/, "") === mcpResourceUrl();
}

// ── Clients ──────────────────────────────────────────────────────────────────

export type RegistrationRequest = {
  client_name?: string;
  redirect_uris?: string[];
  token_endpoint_auth_method?: string;
  grant_types?: string[];
  response_types?: string[];
  scope?: string;
  client_uri?: string;
  logo_uri?: string;
};

export type RegistrationError = { error: string; error_description: string };

type AuthMethod = "none" | "client_secret_post" | "client_secret_basic";

/** Validate an RFC 7591 request; returns the normalised record or an error. */
export function validateRegistration(body: RegistrationRequest):
  | { ok: true; name: string; redirectUris: string[]; authMethod: AuthMethod; clientUri: string | null; logoUri: string | null }
  | { ok: false; error: RegistrationError } {
  const uris = Array.isArray(body.redirect_uris) ? body.redirect_uris.filter((u) => typeof u === "string") : [];
  if (uris.length === 0 || uris.length > 10) {
    return { ok: false, error: { error: "invalid_redirect_uri", error_description: "Provide 1 to 10 redirect_uris." } };
  }
  for (const u of uris) {
    if (!isValidRedirectUri(u)) {
      return { ok: false, error: { error: "invalid_redirect_uri", error_description: `Redirect URI not allowed: ${u} (https, or http on localhost).` } };
    }
  }
  const authMethod = body.token_endpoint_auth_method ?? "none";
  if (!["none", "client_secret_post", "client_secret_basic"].includes(authMethod)) {
    return { ok: false, error: { error: "invalid_client_metadata", error_description: "Unsupported token_endpoint_auth_method." } };
  }
  const grants = body.grant_types ?? ["authorization_code"];
  if (grants.some((g) => !["authorization_code", "refresh_token"].includes(g))) {
    return { ok: false, error: { error: "invalid_client_metadata", error_description: "Only authorization_code and refresh_token grants are supported." } };
  }
  if ((body.response_types ?? ["code"]).some((r) => r !== "code")) {
    return { ok: false, error: { error: "invalid_client_metadata", error_description: "Only the code response type is supported." } };
  }
  if (body.scope !== undefined && parseScope(body.scope) === null) {
    return { ok: false, error: { error: "invalid_client_metadata", error_description: "Unknown scope; use read and/or write." } };
  }
  const name = (body.client_name ?? "").toString().trim().slice(0, 120) || "MCP client";
  const url = (v: unknown) => (typeof v === "string" && /^https?:\/\//.test(v) ? v.slice(0, 500) : null);
  return { ok: true, name, redirectUris: uris, authMethod: authMethod as AuthMethod, clientUri: url(body.client_uri), logoUri: url(body.logo_uri) };
}

export async function registerClient(body: RegistrationRequest) {
  const v = validateRegistration(body);
  if (!v.ok) return v;
  const secret = v.authMethod === "none" ? null : randomToken(32);
  const client = await db.oAuthClient.create({
    data: {
      name: v.name,
      redirectUris: v.redirectUris,
      secretHash: secret ? hashToken(secret) : null,
      tokenEndpointAuthMethod: v.authMethod,
      clientUri: v.clientUri,
      logoUri: v.logoUri,
    },
  });
  return {
    ok: true as const,
    response: {
      client_id: client.id,
      ...(secret ? { client_secret: secret, client_secret_expires_at: 0 } : {}),
      client_id_issued_at: Math.floor(client.createdAt.getTime() / 1000),
      client_name: client.name,
      redirect_uris: client.redirectUris,
      token_endpoint_auth_method: client.tokenEndpointAuthMethod,
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      scope: "read write",
      ...(client.clientUri ? { client_uri: client.clientUri } : {}),
      ...(client.logoUri ? { logo_uri: client.logoUri } : {}),
    },
  };
}

/** Authenticate a client at the token/revocation endpoint (public or confidential). */
export async function authenticateClient(
  clientId: string | null,
  clientSecret: string | null,
): Promise<{ id: string; name: string; redirectUris: string[] } | null> {
  if (!clientId) return null;
  const client = await db.oAuthClient.findUnique({ where: { id: clientId } });
  if (!client) return null;
  if (client.tokenEndpointAuthMethod === "none") return client;
  if (!clientSecret || !client.secretHash) return null;
  const a = Buffer.from(hashToken(clientSecret));
  const b = Buffer.from(client.secretHash);
  return a.length === b.length && timingSafeEqual(a, b) ? client : null;
}

// ── Codes & tokens ───────────────────────────────────────────────────────────

export async function createAuthorizationCode(input: {
  clientId: string;
  userId: string;
  redirectUri: string;
  codeChallenge: string;
  scope: ApiTokenScope;
  resource: string | null;
}): Promise<string> {
  const code = randomToken(32);
  await db.oAuthAuthorizationCode.create({
    data: {
      codeHash: hashToken(code),
      clientId: input.clientId,
      userId: input.userId,
      redirectUri: input.redirectUri,
      codeChallenge: input.codeChallenge,
      scope: scopeString(input.scope),
      resource: input.resource,
      expiresAt: new Date(Date.now() + CODE_TTL_S * 1000),
    },
  });
  return code;
}

export type IssuedTokens = {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token: string;
  scope: string;
};

/** Mint an access + refresh pair for a grant (new grant when `grantId` is absent). */
export async function issueTokens(input: {
  userId: string;
  clientId: string;
  clientName: string;
  scope: ApiTokenScope;
  resource: string | null;
  grantId?: string;
}): Promise<IssuedTokens> {
  const grantId = input.grantId ?? randomToken(16);
  const access = generateSecret();
  const refresh = generateSecret();
  const now = Date.now();
  const common = {
    userId: input.userId,
    name: input.clientName,
    scope: input.scope,
    clientId: input.clientId,
    grantId,
    resource: input.resource ?? mcpResourceUrl(),
  };
  await db.apiToken.createMany({
    data: [
      { ...common, tokenHash: hashToken(access), prefix: access.slice(0, 9), kind: "access", expiresAt: new Date(now + ACCESS_TOKEN_TTL_S * 1000) },
      { ...common, tokenHash: hashToken(refresh), prefix: refresh.slice(0, 9), kind: "refresh", expiresAt: new Date(now + REFRESH_TOKEN_TTL_S * 1000) },
    ],
  });
  return {
    access_token: access,
    token_type: "Bearer",
    expires_in: ACCESS_TOKEN_TTL_S,
    refresh_token: refresh,
    scope: scopeString(input.scope),
  };
}

export type TokenError = { error: string; error_description: string; status: number };

/** authorization_code grant: single-use code, PKCE, client + redirect binding. */
export async function exchangeCode(input: {
  code: string;
  codeVerifier: string | null;
  redirectUri: string | null;
  client: { id: string; name: string };
  resource: string | null;
}): Promise<IssuedTokens | TokenError> {
  const bad = (d: string): TokenError => ({ error: "invalid_grant", error_description: d, status: 400 });
  const record = await db.oAuthAuthorizationCode.findUnique({ where: { codeHash: hashToken(input.code) } });
  if (!record || record.clientId !== input.client.id) return bad("Unknown authorization code.");
  if (record.usedAt) {
    // Replay of a used code (RFC 6749 §4.1.2): the code is gone for good.
    await db.oAuthAuthorizationCode.delete({ where: { id: record.id } }).catch(() => {});
    return bad("Authorization code already used.");
  }
  if (record.expiresAt.getTime() < Date.now()) return bad("Authorization code expired.");
  if (!input.redirectUri || input.redirectUri !== record.redirectUri) return bad("redirect_uri does not match.");
  if (!input.codeVerifier || !pkceVerify(input.codeVerifier, record.codeChallenge)) return bad("PKCE verification failed.");
  if (input.resource && !resourceOk(input.resource)) {
    return { error: "invalid_target", error_description: "Unknown resource.", status: 400 };
  }
  await db.oAuthAuthorizationCode.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  const scope = parseScope(record.scope) ?? ["read"];
  const tokens = await issueTokens({
    userId: record.userId,
    clientId: input.client.id,
    clientName: input.client.name,
    scope: tokenScopeOf(scope),
    resource: record.resource ?? input.resource ?? null,
  });
  const user = await db.user.findUnique({ where: { id: record.userId }, select: { email: true } });
  await db.adminAction.create({
    data: {
      actorUserId: record.userId,
      actorEmail: user?.email ?? "",
      action: "oauth.grant",
      targetType: "OAuthClient",
      targetId: input.client.id,
      after: { scope: tokens.scope, client: input.client.name },
    },
  });
  return tokens;
}

/** refresh_token grant with rotation; a replayed refresh token kills the grant. */
export async function refreshTokens(input: {
  refreshToken: string;
  client: { id: string; name: string };
  scope: string | null;
}): Promise<IssuedTokens | TokenError> {
  const bad = (d: string): TokenError => ({ error: "invalid_grant", error_description: d, status: 400 });
  const token = await db.apiToken.findUnique({ where: { tokenHash: hashToken(input.refreshToken) } });
  if (!token || token.kind !== "refresh" || token.clientId !== input.client.id) return bad("Unknown refresh token.");
  if (token.revokedAt) {
    // Rotated token presented again: someone else may hold the newer one.
    if (token.grantId) await revokeGrant(token.grantId);
    return bad("Refresh token was already used; the grant has been revoked.");
  }
  if (token.expiresAt && token.expiresAt.getTime() < Date.now()) return bad("Refresh token expired.");
  let scope = token.scope;
  if (input.scope) {
    const requested = parseScope(input.scope);
    if (!requested) return { error: "invalid_scope", error_description: "Unknown scope.", status: 400 };
    const narrowed = tokenScopeOf(requested);
    if (narrowed === "write" && token.scope === "read") {
      return { error: "invalid_scope", error_description: "Cannot widen the scope on refresh.", status: 400 };
    }
    scope = narrowed;
  }
  await db.apiToken.updateMany({
    where: { grantId: token.grantId ?? "", kind: { in: ["access", "refresh"] }, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return issueTokens({
    userId: token.userId,
    clientId: input.client.id,
    clientName: input.client.name,
    scope,
    resource: token.resource,
    grantId: token.grantId ?? undefined,
  });
}

export async function revokeGrant(grantId: string): Promise<number> {
  const res = await db.apiToken.updateMany({ where: { grantId, revokedAt: null }, data: { revokedAt: new Date() } });
  return res.count;
}

/** RFC 7009: revoke an access or refresh token (and its whole grant). Unknown tokens are a no-op. */
export async function revokeToken(secret: string, clientId: string): Promise<void> {
  const token = await db.apiToken.findUnique({ where: { tokenHash: hashToken(secret) } });
  if (!token || token.clientId !== clientId) return;
  if (token.grantId) await revokeGrant(token.grantId);
  else await db.apiToken.update({ where: { id: token.id }, data: { revokedAt: new Date() } });
}

export type GrantView = {
  grantId: string;
  clientId: string;
  clientName: string;
  clientUri: string | null;
  scope: ApiTokenScope;
  createdAt: Date;
  lastUsedAt: Date | null;
};

/** Connected apps of a user: one row per live grant. */
export async function listGrants(userId: string): Promise<GrantView[]> {
  const tokens = await db.apiToken.findMany({
    where: { userId, kind: { in: ["access", "refresh"] }, revokedAt: null, grantId: { not: null } },
    include: { client: true },
    orderBy: { createdAt: "desc" },
  });
  const byGrant = new Map<string, GrantView>();
  for (const t of tokens) {
    const g = byGrant.get(t.grantId!);
    if (!g) {
      byGrant.set(t.grantId!, {
        grantId: t.grantId!,
        clientId: t.clientId!,
        clientName: t.client?.name ?? t.name,
        clientUri: t.client?.clientUri ?? null,
        scope: t.scope,
        createdAt: t.createdAt,
        lastUsedAt: t.lastUsedAt,
      });
    } else {
      if (t.createdAt < g.createdAt) g.createdAt = t.createdAt;
      if (t.lastUsedAt && (!g.lastUsedAt || t.lastUsedAt > g.lastUsedAt)) g.lastUsedAt = t.lastUsedAt;
    }
  }
  return [...byGrant.values()];
}

/**
 * Purge expired codes and long-expired OAuth tokens. This site has no cron, so
 * the token endpoint calls it opportunistically after a code exchange.
 */
export async function cleanupOAuth(now = new Date()): Promise<number> {
  const codes = await db.oAuthAuthorizationCode.deleteMany({ where: { expiresAt: { lt: new Date(now.getTime() - 3_600_000) } } });
  const tokens = await db.apiToken.deleteMany({
    where: { kind: { in: ["access", "refresh"] }, expiresAt: { lt: new Date(now.getTime() - 30 * 86_400_000) } },
  });
  return codes.count + tokens.count;
}
