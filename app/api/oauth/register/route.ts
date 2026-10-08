import { registerClient, type RegistrationRequest } from "@/app/lib/oauth";
import { clientIp, corsPreflight, json, oauthError } from "@/app/lib/oauth-http";
import { rateLimitAllow } from "@/app/lib/rate-limit";

export const dynamic = "force-dynamic";

/** RFC 7591 dynamic client registration — open to any client; consent protects the user. */
export async function POST(req: Request) {
  if (!rateLimitAllow(`oauth-register:${clientIp(req)}`, 20, 60 * 60_000).allowed) {
    return oauthError("rate_limited", "Too many registrations from this address; try again later.", 429);
  }
  const body = (await req.json().catch(() => null)) as RegistrationRequest | null;
  if (!body || typeof body !== "object") return oauthError("invalid_client_metadata", "JSON body expected.");
  const res = await registerClient(body);
  if (!res.ok) return json(res.error, 400);
  return json(res.response, 201);
}

export function OPTIONS() {
  return corsPreflight();
}
