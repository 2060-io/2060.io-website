import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import {
  pickGithubVerifiedEmail,
  isGoogleEmailVerified,
  type GithubEmail,
} from "@/app/lib/verified-email";

// Edge-safe Auth.js config (no database adapter) shared by the route handler and
// middleware. The DB-backed adapter — and the invitation-only gate, which needs
// the DB — live in auth.ts (Node runtime only).
export default {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [
    // Google emails are always verified.
    Google({ allowDangerousEmailAccountLinking: true }),
    GitHub({
      allowDangerousEmailAccountLinking: true,
      authorization: { params: { scope: "read:user user:email" } },
    }),
    // The SMTP OTP (Nodemailer) provider is added in auth.ts — it pulls the
    // Node-only `nodemailer` lib, which must stay out of the edge middleware
    // bundle (this config is shared with middleware).
  ],
  callbacks: {
    // Safety rule (ported from veranafoundation.org, ADR-0002): the identity
    // key is a *verified* email. Account auto-linking is only safe because
    // every method here yields a verified one. auth.ts wraps this callback
    // with the invitation-only check.
    async signIn({ user, account, profile }) {
      if (!account) return false;
      switch (account.provider) {
        case "google":
          return isGoogleEmailVerified(profile as { email_verified?: boolean });
        case "nodemailer":
          return true;
        case "github": {
          // GitHub's profile email may be public/unverified — fetch the primary
          // verified email from the API and key the account on it.
          const res = await fetch("https://api.github.com/user/emails", {
            headers: {
              Authorization: `Bearer ${account.access_token}`,
              "User-Agent": "2060.io",
              Accept: "application/vnd.github+json",
            },
          });
          if (!res.ok) return false;
          const verified = pickGithubVerifiedEmail(
            (await res.json()) as GithubEmail[],
          );
          if (!verified) return false;
          user.email = verified;
          return true;
        }
        default:
          return false;
      }
    },
    async jwt({ token, user }) {
      if (user) token.uid = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token.uid && session.user) session.user.id = token.uid as string;
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isProtected =
        pathname.startsWith("/dataroom") ||
        pathname.startsWith("/vc-admin") ||
        pathname.startsWith("/admin");
      if (!isProtected) return true;
      // Coarse "is logged in?" gate; fine-grained role checks run server-side
      // in the pages, which can hit the DB.
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
