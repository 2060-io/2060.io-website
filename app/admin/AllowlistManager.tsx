"use client";

import { useActionState } from "react";

export type AllowlistState = { error?: string; ok?: boolean };

export type AllowlistEntry = {
  id: string;
  email: string;
  addedAt: string; // preformatted "YYYY-MM-DD HH:mm"
};

/**
 * Generic add/remove manager for an email allowlist (admins, VC admins). The
 * server actions arrive as props so both allowlists share this one component.
 */
export default function AllowlistManager({
  entries,
  currentEmail,
  noun,
  addAction,
  removeAction,
  protectSelf,
}: {
  entries: AllowlistEntry[];
  currentEmail: string;
  noun: string; // "admin" | "VC admin"
  addAction: (prev: AllowlistState, formData: FormData) => Promise<AllowlistState>;
  removeAction: (formData: FormData) => Promise<void>;
  /** Admins cannot remove themselves; VC-admin rows have no such rule. */
  protectSelf: boolean;
}) {
  const [state, add, pending] = useActionState<AllowlistState, FormData>(
    addAction,
    {},
  );

  return (
    <div className="grid gap-12 mt-10">
      <section>
        <h2 className="display text-xl mb-4">Add a {noun}</h2>
        <form action={add} className="flex flex-col gap-2 max-w-md">
          <input
            name="email"
            type="email"
            required
            placeholder="name@example.com"
            className="field text-sm"
            aria-label={`${noun} email`}
          />
          <div className="flex items-center gap-4">
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? "Adding…" : `Add ${noun}`}
            </button>
            {state.error && <p className="text-sm text-red-500">{state.error}</p>}
            {state.ok && <p className="text-sm text-accent-hover">Added.</p>}
          </div>
        </form>
      </section>

      <section>
        <h2 className="display text-xl mb-4">Current {noun}s</h2>
        <div className="overflow-x-auto">
          <table className="clean min-w-[560px]">
            <thead>
              <tr>
                <th>Email</th>
                <th>Added</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const isSelf = e.email === currentEmail;
                return (
                  <tr key={e.id}>
                    <td>
                      {e.email}
                      {isSelf && <span className="tag ml-2">you</span>}
                    </td>
                    <td className="text-muted whitespace-nowrap">{e.addedAt}</td>
                    <td>
                      {protectSelf && isSelf ? (
                        <span className="text-muted">—</span>
                      ) : (
                        <form action={removeAction}>
                          <input type="hidden" name="id" value={e.id} />
                          <button type="submit" className="prose-link text-fg text-sm">
                            remove
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-muted">
                    None yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
