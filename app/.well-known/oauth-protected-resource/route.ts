import { metadataCorsOptionsRequestHandler, protectedResourceHandler } from "mcp-handler";
import { issuer, mcpResourceUrl } from "@/app/lib/oauth";

export const dynamic = "force-dynamic";

/** RFC 9728 — the MCP endpoint's metadata: which authorization server protects it. */
const handler = protectedResourceHandler({ authServerUrls: [issuer()], resourceUrl: mcpResourceUrl() });

export function GET(req: Request) {
  return handler(req);
}

export const OPTIONS = metadataCorsOptionsRequestHandler();
