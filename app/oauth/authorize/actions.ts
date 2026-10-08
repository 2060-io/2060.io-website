"use server";

import { redirect } from "next/navigation";
import { db } from "@/app/lib/db";
import { currentUser, isVcAdmin } from "@/app/lib/authz";
import { createAuthorizationCode, parseScope, redirectUriMatches, resourceOk, tokenScopeOf } from "@/app/lib/oauth";

/** Approve: mint the code and send the browser back to the client. Deny: error redirect. */
export async function decideAuthorization(formData: FormData): Promise<void> {
  const user = await currentUser();
  if (!user?.id || !user.email) redirect("/login");
  const clientId = String(formData.get("client_id") ?? "");
  const redirectUri = String(formData.get("redirect_uri") ?? "");
  const state = String(formData.get("state") ?? "");
  const codeChallenge = String(formData.get("code_challenge") ?? "");
  const scopeRaw = String(formData.get("scope") ?? "");
  const resource = String(formData.get("resource") ?? "") || null;
  const decision = String(formData.get("decision") ?? "deny");

  const client = await db.oAuthClient.findUnique({ where: { id: clientId } });
  const scope = parseScope(scopeRaw);
  // Never redirect to a URI we didn't validate against the registration.
  if (!client || !client.redirectUris.some((r) => redirectUriMatches(r, redirectUri))) {
    redirect("/oauth/authorize?error=invalid_request");
  }
  const back = new URL(redirectUri);
  if (state) back.searchParams.set("state", state);

  // Connectors are for staff: without the role the tokens would be useless anyway.
  const staff = await isVcAdmin(user.email);
  if (decision !== "approve" || !staff || !scope || !/^[A-Za-z0-9\-._~]{43,128}$/.test(codeChallenge) || !resourceOk(resource)) {
    back.searchParams.set("error", decision !== "approve" || !staff ? "access_denied" : "invalid_request");
    redirect(back.toString());
  }
  const code = await createAuthorizationCode({
    clientId: client.id,
    userId: user.id,
    redirectUri,
    codeChallenge,
    scope: tokenScopeOf(scope),
    resource,
  });
  back.searchParams.set("code", code);
  redirect(back.toString());
}
