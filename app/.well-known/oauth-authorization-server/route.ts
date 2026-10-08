import { authorizationServerMetadata } from "@/app/lib/oauth";
import { corsPreflight, json } from "@/app/lib/oauth-http";

export const dynamic = "force-dynamic";

/** RFC 8414 — how MCP connectors find our authorize/token/registration endpoints. */
export function GET() {
  return json(authorizationServerMetadata(), 200, { "Cache-Control": "public, max-age=3600" });
}

export function OPTIONS() {
  return corsPreflight();
}
