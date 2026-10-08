import { NextResponse } from "next/server";

/** Shared HTTP bits of the OAuth endpoints: CORS (browser-based MCP clients) and error shapes. */

export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, MCP-Protocol-Version",
  "Access-Control-Max-Age": "86400",
};

export function corsPreflight(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export function json(body: unknown, status = 200, extra: Record<string, string> = {}): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { ...CORS_HEADERS, "Cache-Control": "no-store", Pragma: "no-cache", ...extra },
  });
}

export function oauthError(error: string, description: string, status = 400): NextResponse {
  return json({ error, error_description: description }, status);
}

/** Form-encoded or JSON body → flat string map. */
export async function readParams(req: Request): Promise<Record<string, string>> {
  const type = req.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(body).map(([k, v]) => [k, typeof v === "string" ? v : String(v ?? "")]));
  }
  const text = await req.text();
  return Object.fromEntries(new URLSearchParams(text));
}

/** client_id / client_secret from HTTP Basic or from the body (RFC 6749 §2.3.1). */
export function clientCredentials(req: Request, params: Record<string, string>): { clientId: string | null; clientSecret: string | null } {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    const decoded = Buffer.from(auth.slice(6), "base64").toString("utf8");
    const i = decoded.indexOf(":");
    if (i > 0) return { clientId: decodeURIComponent(decoded.slice(0, i)), clientSecret: decodeURIComponent(decoded.slice(i + 1)) };
  }
  return { clientId: params.client_id || null, clientSecret: params.client_secret || null };
}

export function clientIp(req: Request): string {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}
