import { createHash, randomBytes } from "node:crypto";
import type { ApiTokenScope } from "@prisma/client";
import { db } from "@/app/lib/db";

/**
 * Personal access tokens for the MCP server (same design as the Verana
 * Foundation site). The secret looks like `dr_` + 40 url-safe characters; only
 * its SHA-256 is stored, the user sees it once. Verification is a hash lookup
 * plus revocation/expiry checks; the last-used stamp is written at most once
 * every few minutes.
 */

export const TOKEN_PREFIX = "dr_";
const LAST_USED_WRITE_INTERVAL_MS = 5 * 60_000;

export function hashToken(secret: string): string {
  return createHash("sha256").update(secret, "utf8").digest("hex");
}

export function generateSecret(): string {
  return TOKEN_PREFIX + randomBytes(30).toString("base64url");
}

/** What the list in account settings shows (never the secret). */
export type ApiTokenView = {
  id: string;
  name: string;
  prefix: string;
  scope: ApiTokenScope;
  createdAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
};

const VIEW_SELECT = {
  id: true, name: true, prefix: true, scope: true,
  createdAt: true, lastUsedAt: true, expiresAt: true, revokedAt: true,
} as const;

export async function listApiTokens(userId: string): Promise<ApiTokenView[]> {
  return db.apiToken.findMany({
    where: { userId, kind: "personal" },
    orderBy: { createdAt: "desc" },
    select: VIEW_SELECT,
  });
}

export async function createApiToken(
  userId: string,
  input: { name: string; scope: ApiTokenScope; expiresInDays: number | null },
): Promise<{ secret: string; token: ApiTokenView }> {
  const secret = generateSecret();
  const token = await db.apiToken.create({
    data: {
      userId,
      name: input.name.trim().slice(0, 80) || "Untitled",
      tokenHash: hashToken(secret),
      prefix: secret.slice(0, TOKEN_PREFIX.length + 6),
      scope: input.scope,
      expiresAt: input.expiresInDays ? new Date(Date.now() + input.expiresInDays * 86_400_000) : null,
    },
    select: VIEW_SELECT,
  });
  return { secret, token };
}

export async function revokeApiToken(userId: string, id: string): Promise<boolean> {
  const res = await db.apiToken.updateMany({
    where: { id, userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return res.count > 0;
}

export type VerifiedToken = {
  tokenId: string;
  scope: ApiTokenScope;
  expiresAt: Date | null;
  kind: "personal" | "access";
  resource: string | null; // RFC 8707 audience of an OAuth token
  user: { id: string; email: string };
};

/** The user behind a bearer secret, or null when unknown, revoked or expired. */
export async function verifyApiToken(secret: string): Promise<VerifiedToken | null> {
  if (!secret.startsWith(TOKEN_PREFIX)) return null;
  const token = await db.apiToken.findUnique({
    where: { tokenHash: hashToken(secret) },
    include: { user: { select: { id: true, email: true } } },
  });
  if (!token || token.revokedAt || !token.user.email) return null;
  if (token.kind === "refresh") return null; // only presented to a token endpoint
  if (token.expiresAt && token.expiresAt.getTime() < Date.now()) return null;
  if (!token.lastUsedAt || Date.now() - token.lastUsedAt.getTime() > LAST_USED_WRITE_INTERVAL_MS) {
    await db.apiToken.update({ where: { id: token.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
  }
  return {
    tokenId: token.id,
    scope: token.scope,
    expiresAt: token.expiresAt,
    kind: token.kind,
    resource: token.resource,
    user: { id: token.user.id, email: token.user.email },
  };
}
