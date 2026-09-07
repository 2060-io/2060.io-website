"use client";

import { useActionState } from "react";
import { setGrants, type InviteState } from "../actions";

export type GrantOption = {
  id: string;
  title: string;
  size: string;
  granted: boolean;
  alwaysVisible: boolean;
};

/** Per-email document selection: check what this VC sees, then save. */
export default function GrantEditor({
  inviteId,
  options,
}: {
  inviteId: string;
  options: GrantOption[];
}) {
  const [state, action, pending] = useActionState<InviteState, FormData>(
    setGrants,
    {},
  );

  if (options.length === 0) {
    return (
      <p className="text-sm text-muted mt-4">
        No documents in the repository yet — add some under Documents first.
      </p>
    );
  }

  return (
    <form action={action} className="mt-6 max-w-xl">
      <input type="hidden" name="inviteId" value={inviteId} />
      <div className="flex flex-col gap-3">
        {options.map((o) => (
          <label key={o.id} className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              name="documentIds"
              value={o.id}
              defaultChecked={o.alwaysVisible || o.granted}
              disabled={o.alwaysVisible}
              className="mt-1"
            />
            <span className={o.alwaysVisible ? "opacity-70" : undefined}>
              <span className="text-fg">{o.title}</span>{" "}
              <span className="text-muted">({o.size})</span>
              {o.alwaysVisible && (
                <span className="text-muted">
                  {" "}
                  — visible to everyone (set on the Documents page)
                </span>
              )}
            </span>
          </label>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-6">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save selection"}
        </button>
        {state.error && <p className="text-sm text-red-500">{state.error}</p>}
        {state.ok && <p className="text-sm text-accent-hover">{state.message}</p>}
      </div>
    </form>
  );
}
