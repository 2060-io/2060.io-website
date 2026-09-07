"use client";

import { useRef } from "react";
import { useActionState } from "react";
import { inviteVcs, resendInvite, revokeInvite, type InviteState } from "./actions";

export function InviteForm({ orgNames }: { orgNames: string[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<InviteState, FormData>(
    async (prev, fd) => {
      const res = await inviteVcs(prev, fd);
      if (res.ok) formRef.current?.reset();
      return res;
    },
    {},
  );
  return (
    <form ref={formRef} action={action} className="flex flex-col gap-2 max-w-xl">
      <input
        name="orgName"
        type="text"
        required
        list="org-names"
        placeholder="Organization (existing or new)"
        className="field text-sm"
        aria-label="Organization name"
      />
      <datalist id="org-names">
        {orgNames.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
      <textarea
        name="emails"
        required
        rows={3}
        placeholder={"Email addresses — one per line or comma-separated\njane@fund.vc\njohn@fund.vc"}
        className="field text-sm"
        aria-label="Email addresses"
      />
      <div className="flex items-center gap-4">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Inviting…" : "Invite & send email"}
        </button>
      </div>
      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
      {state.ok && state.message && (
        <p className="text-sm text-accent-hover">{state.message}</p>
      )}
    </form>
  );
}

export function ResendButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState<InviteState, FormData>(
    resendInvite,
    {},
  );
  return (
    <form action={action} className="inline-flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="prose-link text-fg text-sm"
        disabled={pending}
      >
        {pending ? "sending…" : state.ok ? "sent" : "resend"}
      </button>
      {state.error && <span className="text-xs text-red-500">{state.error}</span>}
    </form>
  );
}

export function RevokeButton({ id, email }: { id: string; email: string }) {
  return (
    <form
      action={revokeInvite}
      className="inline"
      onSubmit={(e) => {
        if (
          !confirm(
            `Revoke ${email}? They can no longer sign in; download history is kept.`,
          )
        )
          e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="prose-link text-fg text-sm">
        revoke
      </button>
    </form>
  );
}
