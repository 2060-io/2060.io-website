"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useActionState } from "react";
import { resendInvite, revokeInvite, type InviteState } from "./actions";

export type InviteRow = {
  id: string;
  email: string;
  org: string;
  ndaSigned: boolean;
  grants: number;
  downloads: number;
  status: "active" | "connected" | "never";
  lastSeenEpoch: number; // 0 = never
  lastSeenLabel: string;
  invitedLabel: string; // YYYY-MM-DD
};

type Filter = "all" | "never" | "active";
type SortKey = "email" | "org" | "lastSeen" | "downloads";

const DOT: Record<InviteRow["status"], { cls: string; label: string }> = {
  active: { cls: "bg-green-500", label: "downloaded documents" },
  connected: { cls: "bg-amber-500", label: "connected, no downloads yet" },
  never: { cls: "bg-neutral-400/60", label: "never connected" },
};

function StatusDot({ status }: { status: InviteRow["status"] }) {
  const d = DOT[status];
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${d.cls}`}
      title={d.label}
      aria-label={d.label}
    />
  );
}

function ResendIcon({ id, email }: { id: string; email: string }) {
  const [state, action, pending] = useActionState<InviteState, FormData>(
    resendInvite,
    {},
  );
  return (
    <form action={action} className="inline">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending || state.ok}
        className="w-7 h-7 inline-flex items-center justify-center border hairline text-muted hover:text-fg disabled:opacity-60"
        title={
          state.error
            ? state.error
            : state.ok
              ? `Invitation re-sent to ${email}`
              : `Resend the invitation email to ${email}`
        }
        aria-label={`Resend invitation to ${email}`}
      >
        <i
          className={`fa-solid text-xs ${
            state.error
              ? "fa-triangle-exclamation text-red-500"
              : state.ok
                ? "fa-check text-green-600"
                : pending
                  ? "fa-spinner fa-spin"
                  : "fa-rotate-right"
          }`}
          aria-hidden="true"
        ></i>
      </button>
    </form>
  );
}

function RevokeIcon({ id, email }: { id: string; email: string }) {
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
      <button
        type="submit"
        className="w-7 h-7 inline-flex items-center justify-center border hairline text-muted hover:text-red-500"
        title={`Revoke ${email}`}
        aria-label={`Revoke ${email}`}
      >
        <i className="fa-solid fa-xmark text-xs" aria-hidden="true"></i>
      </button>
    </form>
  );
}

/**
 * Dense, flat invite table: status dot per row, filter chips + search on top,
 * sortable columns, icon actions (documents / resend / revoke). Scales to
 * hundreds of invites where the old per-org cards did not.
 */
export default function InvitesTable({ rows }: { rows: InviteRow[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("lastSeen");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);

  const counts = useMemo(
    () => ({
      all: rows.length,
      never: rows.filter((r) => r.status === "never").length,
      active: rows.filter((r) => r.status === "active").length,
    }),
    [rows],
  );

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const filtered = rows.filter((r) => {
      if (filter === "never" && r.status !== "never") return false;
      if (filter === "active" && r.status !== "active") return false;
      if (needle && !r.email.includes(needle) && !r.org.toLowerCase().includes(needle))
        return false;
      return true;
    });
    const cmp: Record<SortKey, (a: InviteRow, b: InviteRow) => number> = {
      email: (a, b) => a.email.localeCompare(b.email),
      org: (a, b) => a.org.localeCompare(b.org) || a.email.localeCompare(b.email),
      lastSeen: (a, b) => a.lastSeenEpoch - b.lastSeenEpoch,
      downloads: (a, b) => a.downloads - b.downloads,
    };
    return filtered.sort((a, b) => sortDir * cmp[sortKey](a, b));
  }, [rows, filter, q, sortKey, sortDir]);

  function onSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(key);
      setSortDir(key === "email" || key === "org" ? 1 : -1);
    }
  }

  function Th({
    label,
    k,
    className,
  }: {
    label: string;
    k?: SortKey;
    className?: string;
  }) {
    if (!k) return <th className={className}>{label}</th>;
    const active = sortKey === k;
    return (
      <th className={className}>
        <button
          type="button"
          onClick={() => onSort(k)}
          className={`inline-flex items-center gap-1 uppercase tracking-[0.04em] ${
            active ? "text-fg" : "hover:text-fg"
          }`}
        >
          {label}
          <i
            className={`fa-solid text-[10px] ${
              active ? (sortDir === 1 ? "fa-caret-up" : "fa-caret-down") : "fa-sort opacity-40"
            }`}
            aria-hidden="true"
          ></i>
        </button>
      </th>
    );
  }

  const chip = (f: Filter, label: string, n: number) => (
    <button
      type="button"
      onClick={() => setFilter(f)}
      className={`tag ${filter === f ? "tag-accent" : "hover:text-fg"}`}
      aria-pressed={filter === f}
    >
      {label} {n}
    </button>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {chip("all", "All", counts.all)}
        {chip("never", "Never connected", counts.never)}
        {chip("active", "Active", counts.active)}
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search email or organization…"
          className="field text-sm ml-auto max-w-64"
          aria-label="Search invites"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="clean min-w-[760px]">
          <thead>
            <tr>
              <th className="w-6" aria-label="Status"></th>
              <Th label="Email" k="email" />
              <Th label="Org" k="org" />
              <th>NDA</th>
              <Th label="Last seen" k="lastSeen" />
              <Th label="Downloads" k="downloads" />
              <th>Docs</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id} className={r.status === "never" ? "opacity-70" : undefined}>
                <td>
                  <StatusDot status={r.status} />
                </td>
                <td className="text-fg whitespace-nowrap">{r.email}</td>
                <td className="text-muted whitespace-nowrap">{r.org}</td>
                <td>
                  {r.ndaSigned ? (
                    <i
                      className="fa-solid fa-check text-green-600 text-xs"
                      title="NDA signed for this organization"
                      aria-label="NDA signed"
                    ></i>
                  ) : (
                    <span className="text-muted" title="NDA not signed yet">
                      –
                    </span>
                  )}
                </td>
                <td
                  className="text-muted whitespace-nowrap"
                  title={`invited ${r.invitedLabel}`}
                >
                  {r.lastSeenLabel}
                </td>
                <td className="text-muted">{r.downloads || "–"}</td>
                <td>
                  <Link
                    href={`/vc-admin/invites/${r.id}`}
                    className="prose-link text-fg text-sm whitespace-nowrap"
                    title="Select the documents this email sees"
                  >
                    {r.grants} selected
                  </Link>
                </td>
                <td>
                  <div className="flex items-center justify-end gap-1.5">
                    <ResendIcon id={r.id} email={r.email} />
                    <RevokeIcon id={r.id} email={r.email} />
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={8} className="text-muted">
                  {rows.length === 0 ? "No one invited yet." : "No matches."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted mt-3">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500" /> downloaded
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500" /> connected, no
          downloads
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-neutral-400/60" /> never
          connected
        </span>
        <span>Hover a row's last-seen for the invite date.</span>
      </p>
    </div>
  );
}
