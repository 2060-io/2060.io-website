import { authenticateClient, cleanupOAuth, exchangeCode, refreshTokens } from "@/app/lib/oauth";
import { clientCredentials, clientIp, corsPreflight, json, oauthError, readParams } from "@/app/lib/oauth-http";
import { rateLimitAllow } from "@/app/lib/rate-limit";

export const dynamic = "force-dynamic";

/** RFC 6749 token endpoint: authorization_code (PKCE) and refresh_token (rotating). */
export async function POST(req: Request) {
  if (!rateLimitAllow(`oauth-token:${clientIp(req)}`, 60, 60_000).allowed) {
    return oauthError("rate_limited", "Too many token requests; try again later.", 429);
  }
  const params = await readParams(req);
  const { clientId, clientSecret } = clientCredentials(req, params);
  const client = await authenticateClient(clientId, clientSecret);
  if (!client) return oauthError("invalid_client", "Unknown client or bad client credentials.", 401);

  let result;
  switch (params.grant_type) {
    case "authorization_code":
      if (!params.code) return oauthError("invalid_request", "code is required.");
      result = await exchangeCode({
        code: params.code,
        codeVerifier: params.code_verifier || null,
        redirectUri: params.redirect_uri || null,
        client,
        resource: params.resource || null,
      });
      // No cron on this site: a new connection is a good moment to purge
      // expired codes and long-expired tokens.
      await cleanupOAuth().catch((e) => console.warn("[oauth] cleanup failed:", e));
      break;
    case "refresh_token":
      if (!params.refresh_token) return oauthError("invalid_request", "refresh_token is required.");
      result = await refreshTokens({ refreshToken: params.refresh_token, client, scope: params.scope || null });
      break;
    default:
      return oauthError("unsupported_grant_type", "Use authorization_code or refresh_token.");
  }
  if ("error" in result) return oauthError(result.error, result.error_description, result.status);
  return json(result);
}

export function OPTIONS() {
  return corsPreflight();
}
