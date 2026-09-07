"use client";

import { useActionState } from "react";
import { activateNdaVersion, type NdaAdminState } from "./actions";

type Option = { filename: string; version: string; selectable: boolean; note: string };

export default function VersionSelector({ options }: { options: Option[] }) {
  const [state, formAction, pending] = useActionState<NdaAdminState, FormData>(
    activateNdaVersion,
    {},
  );
  const anySelectable = options.some((o) => o.selectable);

  if (options.length === 0) {
    return <p className="text-sm text-muted mt-2">No other versions in legal/.</p>;
  }

  return (
    <form action={formAction} className="mt-2 flex flex-col gap-2 max-w-xl">
      <select
        name="filename"
        defaultValue=""
        required
        className="field text-sm"
        aria-label="NDA version"
      >
        <option value="" disabled>
          Choose a version…
        </option>
        {options.map((o) => (
          <option key={o.filename} value={o.filename} disabled={!o.selectable}>
            {o.filename} — {o.note}
          </option>
        ))}
      </select>

      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
      {state.ok && (
        <p className="text-sm text-accent-hover">
          Activated — this is now the active version.
        </p>
      )}

      <button
        type="submit"
        className="btn btn-primary w-fit"
        disabled={pending || !anySelectable}
      >
        {pending ? "Activating…" : "Make this the active version"}
      </button>
    </form>
  );
}
