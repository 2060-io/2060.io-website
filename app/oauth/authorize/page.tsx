import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/app/lib/db";
import { currentUser, isAdmin, isVcAdmin } from "@/app/lib/authz";
import { mcpResourceUrl, parseScope, redirectUriMatches, resourceOk } from "@/app/lib/oauth";
import { decideAuthorization } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Authorize an application",
  robots: { index: false, follow: false },
};

type Params = {
  client_id?: string;
  redirect_uri?: string;
  response_type?: string;
  scope?: string;
  state?: string;
  code_challenge?: string;
  code_challenge_method?: string;
  resource?: string;
  error?: string;
};

function Problem({ title, detail }: { title: string; detail: string }) {
  return (
    <section className="px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <p className="tag tag-accent">Authorization</p>
        <h1 className="display text-3xl md:text-4xl mt-4">{title}</h1>
        <p className="text-muted mt-6 reading max-w-2xl">{detail}</p>
      </div>
    </section>
  );
}

/**
 * OAuth 2.1 consent screen for MCP connectors (claude.ai and the like). The
 * client is validated before anything is shown; the user signs in with the
 * usual methods first (the auth proxy sends anonymous visitors to /login and
 * back here). Only staff — VC admins and admins — can approve.
 */
export default async function AuthorizePage({ searchParams }: { searchParams: Promise<Params> }) {
  const q = await searchParams;
  if (q.error) {
    return (
      <Problem
        title="This authorization request is invalid"
        detail="The application sent a request we could not verify. Go back to the application and try again."
      />
    );
  }
  const client = q.client_id ? await db.oAuthClient.findUnique({ where: { id: q.client_id } }) : null;
  if (!client) return <Problem title="Unknown application" detail="No application is registered with this client id." />;
  if (!q.redirect_uri || !client.redirectUris.some((r) => redirectUriMatches(r, q.redirect_uri!))) {
    return <Problem title="Redirect not allowed" detail="The application asked us to send you to an address it did not register." />;
  }
  if (q.response_type !== "code") {
    return <Problem title="Unsupported request" detail="Only the authorization code flow is supported." />;
  }
  if (!q.code_challenge || (q.code_challenge_method ?? "S256") !== "S256") {
    return <Problem title="PKCE required" detail="The application must use PKCE with S256." />;
  }
  const scope = parseScope(q.scope);
  if (!scope) {
    return <Problem title="Unknown permissions requested" detail="The application asked for permissions this site does not define." />;
  }
  if (!resourceOk(q.resource)) {
    return <Problem title="Unknown resource" detail={`This server only issues tokens for ${mcpResourceUrl()}.`} />;
  }

  const user = await currentUser();
  if (!user?.id || !user.email) {
    const here = `/oauth/authorize?${new URLSearchParams(
      Object.entries(q).filter(([, v]) => v) as [string, string][],
    ).toString()}`;
    redirect(`/login?callbackUrl=${encodeURIComponent(here)}`);
  }
  const [admin, vcAdmin] = await Promise.all([isAdmin(user.email), isVcAdmin(user.email)]);
  if (!vcAdmin) {
    return (
      <Problem
        title="Connectors are for the 2060 team"
        detail={`You are signed in as ${user.email}, which has no VC admin role. The application could not do anything with your access, so nothing was authorized. Go back to the application to cancel.`}
      />
    );
  }
  const write = scope.includes("write");

  return (
    <section className="px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <p className="tag tag-accent">Authorization</p>
        <h1 className="display text-3xl md:text-4xl mt-4">
          <span className="text-accent-hover">{client.name}</span> wants to use the data room&apos;s VC admin console as you
        </h1>
        <div className="accent-line mt-6"></div>
        <div className="max-w-2xl">
          <p className="text-muted mt-8 reading">
            You are signed in as <strong className="text-fg">{user.email}</strong> ({admin ? "admin" : "VC admin"}).
            The application would act with your own role, never more, and every change it makes is
            recorded in the audit trail under your name.
          </p>
          <ul className="mt-6 grid gap-3 text-sm">
            <li className="card">
              <strong className="text-fg">Read</strong> — documents, invited VCs and their access,
              the invitation email, meeting settings and booked calls, engagement figures.
            </li>
            {write && (
              <li className="card" style={{ borderColor: "var(--accent)" }}>
                <strong className="text-fg">Write</strong> — everything you can do in the console:
                upload, replace, remove and share documents, invite or revoke VCs, edit the invitation
                email, change meeting settings and cancel calls.
              </li>
            )}
          </ul>
          {client.clientUri && (
            <p className="text-xs text-muted mt-4">
              Application site:{" "}
              <a href={client.clientUri} rel="noopener" className="prose-link text-fg">
                {client.clientUri}
              </a>
            </p>
          )}
          <p className="text-xs text-muted mt-3">
            You can disconnect it at any time from{" "}
            <a href="/account/settings" className="prose-link text-fg">your settings</a>. Access lasts until
            you do, with short-lived tokens renewed by the application.
          </p>
          <form action={decideAuthorization} className="mt-8 flex flex-wrap gap-3">
            <input type="hidden" name="client_id" value={client.id} />
            <input type="hidden" name="redirect_uri" value={q.redirect_uri} />
            <input type="hidden" name="state" value={q.state ?? ""} />
            <input type="hidden" name="code_challenge" value={q.code_challenge} />
            <input type="hidden" name="scope" value={scope.join(" ")} />
            <input type="hidden" name="resource" value={q.resource ?? ""} />
            <button type="submit" name="decision" value="approve" className="btn btn-primary">
              Allow {client.name}
            </button>
            <button type="submit" name="decision" value="deny" className="btn">
              Deny
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
