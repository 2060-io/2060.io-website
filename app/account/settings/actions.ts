"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/app/lib/db";
import { currentUser, isVcAdmin } from "@/app/lib/authz";
import { createApiToken, revokeApiToken } from "@/app/lib/api-tokens";
import { revokeGrant } from "@/app/lib/oauth";

export type TokenState = { error?: string; ok?: boolean; secret?: string; name?: string };

const tokenSchema = z.object({
  name: z.string().trim().min(1, "Give the token a name.").max(80),
  scope: z.enum(["read", "write"]),
  expiresInDays: z.enum(["30", "90", "365", "never"]),
});

/** Tokens are for staff: the owner must hold the VC admin role (admins do). */
async function guard() {
  const user = await currentUser();
  if (!user?.id || !user.email || !(await isVcAdmin(user.email))) return null;
  return { id: user.id, email: user.email };
}

export async function createToken(_prev: TokenState, formData: FormData): Promise<TokenState> {
  const user = await guard();
  if (!user) return { error: "Forbidden" };
  const parsed = tokenSchema.safeParse({
    name: formData.get("name"),
    scope: formData.get("scope"),
    expiresInDays: formData.get("expiresInDays"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };

  const { secret, token } = await createApiToken(user.id, {
    name: parsed.data.name,
    scope: parsed.data.scope,
    expiresInDays: parsed.data.expiresInDays === "never" ? null : Number(parsed.data.expiresInDays),
  });
  await db.adminAction.create({
    data: {
      actorUserId: user.id,
      actorEmail: user.email,
      action: "token.create",
      targetType: "ApiToken",
      targetId: token.id,
      after: { name: token.name, scope: token.scope, expiresAt: token.expiresAt?.toISOString() ?? null },
    },
  });
  revalidatePath("/account/settings");
  return { ok: true, secret, name: token.name };
}

export async function revokeToken(id: string): Promise<TokenState> {
  const user = await guard();
  if (!user) return { error: "Forbidden" };
  const revoked = await revokeApiToken(user.id, id);
  if (!revoked) return { error: "Token not found." };
  await db.adminAction.create({
    data: {
      actorUserId: user.id,
      actorEmail: user.email,
      action: "token.revoke",
      targetType: "ApiToken",
      targetId: id,
    },
  });
  revalidatePath("/account/settings");
  return { ok: true };
}

// ── Connected apps (OAuth grants) ────────────────────────────────────────────

export async function disconnectApp(grantId: string): Promise<TokenState> {
  const user = await currentUser();
  if (!user?.id || !user.email) return { error: "Not signed in." };
  // Only the owner's tokens carry this grant id; the update is scoped to them.
  const count = await db.apiToken.updateMany({
    where: { grantId, userId: user.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (count.count === 0) return { error: "Nothing to disconnect." };
  await revokeGrant(grantId); // belt and braces for any straggler
  await db.adminAction.create({
    data: {
      actorUserId: user.id,
      actorEmail: user.email,
      action: "oauth.revoke",
      targetType: "OAuthGrant",
      targetId: grantId,
    },
  });
  revalidatePath("/account/settings");
  return { ok: true };
}
