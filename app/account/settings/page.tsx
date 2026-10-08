import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { currentUser, isAdmin, isVcAdmin } from "@/app/lib/authz";
import { listApiTokens } from "@/app/lib/api-tokens";
import TokensPanel from "./TokensPanel";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Account settings — for staff (VC admins and admins): who you are and how to
 * connect an AI assistant to the VC admin console through the MCP server.
 */
export default async function SettingsPage() {
  const user = await currentUser();
  if (!user?.id || !user.email) notFound(); // the proxy redirects anonymous users to /login
  const [admin, vcAdmin] = await Promise.all([isAdmin(user.email), isVcAdmin(user.email)]);
  if (!vcAdmin) notFound();

  const tokens = await listApiTokens(user.id);
  const mcpUrl = `${(process.env.AUTH_URL ?? "https://2060.io").replace(/\/+$/, "")}/api/mcp`;

  return (
    <section className="px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <p className="tag tag-accent">Settings</p>
        <h1 className="display text-3xl md:text-4xl mt-4">Your account</h1>
        <div className="accent-line mt-6"></div>
        <p className="text-sm text-muted mt-6">
          Signed in as <strong className="text-fg">{user.email}</strong>
          {" · "}
          {admin ? "admin" : "VC admin"}
        </p>

        <h2 className="display text-xl mt-12 mb-4">AI assistants (MCP)</h2>
        <TokensPanel
          mcpUrl={mcpUrl}
          tokens={tokens.map((t) => ({
            id: t.id,
            name: t.name,
            prefix: t.prefix,
            scope: t.scope,
            createdAtIso: t.createdAt.toISOString(),
            lastUsedAtIso: t.lastUsedAt?.toISOString() ?? null,
            expiresAtIso: t.expiresAt?.toISOString() ?? null,
            revokedAtIso: t.revokedAt?.toISOString() ?? null,
          }))}
        />
      </div>
    </section>
  );
}
