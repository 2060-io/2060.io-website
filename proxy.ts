import NextAuth from "next-auth";
import authConfig from "@/auth.config";

// Next 16 proxy (the successor of middleware.ts). Uses the adapter-free Auth.js
// config; the `authorized` callback redirects unauthenticated users away from
// the data-room areas. Fine-grained role checks (ADMIN / VC_ADMIN / VC) run
// server-side in the pages.
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: ["/dataroom/:path*", "/vc-admin/:path*", "/admin/:path*"],
};
