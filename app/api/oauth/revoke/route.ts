import { authenticateClient, revokeToken } from "@/app/lib/oauth";
import { clientCredentials, corsPreflight, json, oauthError, readParams } from "@/app/lib/oauth-http";

export const dynamic = "force-dynamic";

/** RFC 7009 — revoking either token of a grant revokes the whole grant. */
export async function POST(req: Request) {
  const params = await readParams(req);
  const { clientId, clientSecret } = clientCredentials(req, params);
  const client = await authenticateClient(clientId, clientSecret);
  if (!client) return oauthError("invalid_client", "Unknown client or bad client credentials.", 401);
  if (params.token) await revokeToken(params.token, client.id);
  return json({}, 200);
}

export function OPTIONS() {
  return corsPreflight();
}
