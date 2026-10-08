import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { currentUser, isAdmin, isVcAdmin } from "@/app/lib/authz";
import { listApiTokens } from "@/app/lib/api-tokens";
import { listGrants } from "@/app/lib/oauth";
import TokensPanel from "./TokensPanel";
import ConnectedApps from "./ConnectedApps";

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

  const [tokens, grants] = await Promise.all([listApiTokens(user.id), listGrants(user.id)]);
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
        <p className="text-sm text-muted mb-6 max-w-3xl">
          Two ways to connect an assistant to the VC admin console. <strong className="text-fg">claude.ai</strong>{" "}
          signs in through this site and appears below under connected applications.{" "}
          <strong className="text-fg">Claude Code, Cursor and other clients</strong> that take a bearer token use a
          personal access token, further down.
        </p>
        <h3 className="display text-lg mb-3">Connected applications</h3>
        <ConnectedApps
          mcpUrl={mcpUrl}
          grants={grants.map((g) => ({
            grantId: g.grantId,
            clientName: g.clientName,
            clientUri: g.clientUri,
            scope: g.scope,
            createdAtIso: g.createdAt.toISOString(),
            lastUsedAtIso: g.lastUsedAt?.toISOString() ?? null,
          }))}
        />
        <h3 className="display text-lg mt-10 mb-3">Personal access tokens</h3>
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
