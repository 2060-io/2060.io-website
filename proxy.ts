import NextAuth from "next-auth";
import authConfig from "@/auth.config";

// Next 16 proxy (the successor of middleware.ts). Uses the adapter-free Auth.js
// config; the `authorized` callback redirects unauthenticated users away from
// the data-room areas. Fine-grained role checks (ADMIN / VC_ADMIN / VC) run
// server-side in the pages.
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  // /api/mcp and /api/oauth/* are NOT listed: they authenticate with bearer
  // tokens / client credentials, not the session. /oauth/authorize (the consent
  // page) is: anonymous visitors go to /login and come back with their request.
  matcher: ["/dataroom/:path*", "/vc-admin/:path*", "/admin/:path*", "/account/:path*", "/oauth/:path*"],
};
