"use client";

import { useRef } from "react";
import { useActionState } from "react";
import { inviteVcs, type InviteState } from "./actions";

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
