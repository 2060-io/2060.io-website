"use client";

import { useActionState, useState, useTransition } from "react";
import LocalTime from "@/app/components/LocalTime";
import { createToken, revokeToken, type TokenState } from "./actions";

export type TokenRow = {
  id: string;
  name: string;
  prefix: string;
  scope: "read" | "write";
  createdAtIso: string;
  lastUsedAtIso: string | null;
  expiresAtIso: string | null;
  revokedAtIso: string | null;
};

function claudeCommand(mcpUrl: string, secret: string) {
  return `claude mcp add --transport http 2060-dataroom ${mcpUrl} --header "Authorization: Bearer ${secret}"`;
}

function configSnippet(mcpUrl: string, secret: string) {
  return JSON.stringify(
    { mcpServers: { "2060-dataroom": { type: "http", url: mcpUrl, headers: { Authorization: `Bearer ${secret}` } } } },
    null,
    2,
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn text-xs"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
    >
      {copied ? "Copied" : label}
    </button>
  );
}

/**
 * The MCP connection panel: how to connect, personal access tokens (created
 * here, shown once, revocable), and the client configuration for the token.
 */
export default function TokensPanel({ tokens, mcpUrl }: { tokens: TokenRow[]; mcpUrl: string }) {
  const [state, action, pending] = useActionState<TokenState, FormData>(createToken, {});
  const [revoking, startTransition] = useTransition();
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const active = tokens.filter((t) => !t.revokedAtIso);
  const revoked = tokens.filter((t) => t.revokedAtIso);
  const placeholder = "<your token>";

  return (
    <div className="grid gap-8 max-w-3xl">
      <div className="card">
        <h3 className="display text-lg">Connect an assistant</h3>
        <p className="text-sm text-muted mt-2">
          The data room exposes its VC admin console as an MCP server at{" "}
          <code className="text-fg">{mcpUrl}</code>. Create a token below, then
          give it to your client. The assistant acts as you: a{" "}
          <strong className="text-fg">read</strong> token can only look things
          up, a <strong className="text-fg">read-write</strong> one can do
          everything you can do here. Every change is recorded in the audit
          trail under your name.
        </p>
        <p className="text-xs text-muted mt-4">Claude Code</p>
        <pre className="mt-1 text-xs whitespace-pre-wrap break-all font-mono p-3 border hairline">{claudeCommand(mcpUrl, placeholder)}</pre>
        <p className="text-xs text-muted mt-4">Cursor, Claude Desktop and other clients (mcpServers configuration)</p>
        <pre className="mt-1 text-xs whitespace-pre-wrap break-all font-mono p-3 border hairline">{configSnippet(mcpUrl, placeholder)}</pre>
      </div>

      {state.secret && (
        <div className="card" style={{ borderColor: "var(--accent)" }}>
          <p className="display text-lg">Token “{state.name}” created — copy it now</p>
          <p className="text-sm text-muted mt-2">
            This is the only time the secret is shown. Store it in your
            assistant&apos;s configuration; if you lose it, revoke it and create
            a new one.
          </p>
          <pre className="mt-3 text-sm whitespace-pre-wrap break-all font-mono p-3 border hairline">{state.secret}</pre>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <CopyButton text={state.secret} label="Copy the token" />
            <CopyButton text={claudeCommand(mcpUrl, state.secret)} label="Copy the Claude Code command" />
            <CopyButton text={configSnippet(mcpUrl, state.secret)} label="Copy the mcpServers JSON" />
          </div>
        </div>
      )}

      <div>
        <h3 className="display text-lg">Your tokens</h3>
        {active.length === 0 ? (
          <p className="text-sm text-muted mt-2">No active token.</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {active.map((t) => (
              <li key={t.id} className="card flex flex-wrap items-center justify-between gap-3 text-sm">
                <span>
                  <span className="text-fg font-medium">{t.name}</span>{" "}
                  <code className="text-muted">{t.prefix}…</code>{" "}
                  <span className={`tag ${t.scope === "write" ? "tag-accent" : ""}`}>
                    {t.scope === "write" ? "read-write" : "read"}
                  </span>
                  <span className="block text-xs text-muted mt-1">
                    Created <LocalTime iso={t.createdAtIso} />
                    {t.lastUsedAtIso ? (
                      <>
                        {" "}· last used <LocalTime iso={t.lastUsedAtIso} />
                      </>
                    ) : (
                      " · never used"
                    )}
                    {t.expiresAtIso ? ` · expires ${t.expiresAtIso.slice(0, 10)}` : " · no expiry"}
                  </span>
                </span>
                <button
                  type="button"
                  className="btn text-xs"
                  disabled={revoking}
                  onClick={() => {
                    if (!confirm(`Revoke "${t.name}"? Assistants using it stop working immediately.`)) return;
                    startTransition(async () => {
                      const res = await revokeToken(t.id);
                      setRevokeError(res.error ?? null);
                    });
                  }}
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
        {revokeError && <p className="text-sm text-red-500 mt-2">{revokeError}</p>}
        {revoked.length > 0 && (
          <p className="text-xs text-muted mt-2">
            {revoked.length} revoked token{revoked.length === 1 ? "" : "s"} kept for the audit trail.
          </p>
        )}
      </div>

      <div>
        <h3 className="display text-lg">Create a token</h3>
        <form action={action} className="mt-3 flex flex-col gap-3 max-w-md">
          <input
            name="name"
            type="text"
            required
            maxLength={80}
            placeholder="Name, e.g. Claude Code on my laptop"
            className="field text-sm"
            aria-label="Token name"
          />
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs text-muted">
              Access
              <select name="scope" defaultValue="read" className="field text-sm">
                <option value="read">Read only</option>
                <option value="write">Read and write</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted">
              Expires
              <select name="expiresInDays" defaultValue="90" className="field text-sm">
                <option value="30">In 30 days</option>
                <option value="90">In 90 days</option>
                <option value="365">In a year</option>
                <option value="never">Never</option>
              </select>
            </label>
          </div>
          <div className="flex items-center gap-4">
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? "Creating…" : "Create token"}
            </button>
            {state.error && <p className="text-sm text-red-500">{state.error}</p>}
          </div>
        </form>
      </div>
    </div>
  );
}
