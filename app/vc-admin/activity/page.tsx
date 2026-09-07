import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/app/lib/db";
import { currentUser, isVcAdmin } from "@/app/lib/authz";
import DownloadsChart, { type DayPoint } from "./DownloadsChart";

export const metadata: Metadata = {
  title: "Activity · VC admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

function relative(d: Date): string {
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 30 * 86400) return `${Math.floor(s / 86400)}d ago`;
  return d.toISOString().slice(0, 10);
}

/** UTC day buckets for the last `range` days, oldest first, zero-filled. */
function dayBuckets(range: Range, events: { at: Date }[]): DayPoint[] {
  const counts = new Map<string, number>();
  for (const e of events) {
    const key = e.at.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const out: DayPoint[] = [];
  const today = new Date();
  for (let i = range - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(
      today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i,
    ));
    const key = d.toISOString().slice(0, 10);
    out.push({
      date: key,
      label: `${d.toLocaleString("en", { month: "short", timeZone: "UTC" })} ${d.getUTCDate()}`,
      count: counts.get(key) ?? 0,
    });
  }
  return out;
}

/**
 * Engagement dashboard: KPI tiles, downloads-per-day chart, top documents,
 * recent activity feed — with the per-email download detail kept below as the
 * accessible table view.
 */
export default async function VcAdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const user = await currentUser();
  if (!user || !(await isVcAdmin(user.email))) notFound();

  const { range: rangeParam } = await searchParams;
  const range: Range = RANGES.includes(Number(rangeParam) as Range)
    ? (Number(rangeParam) as Range)
    : 30;
  const since = new Date(Date.now() - range * 86400_000);

  const [invites, orgCount, ndaCount, windowEvents, recentEvents, recentNdas, allEvents] =
    await Promise.all([
      db.vcInvite.findMany({
        include: { org: true },
        orderBy: [{ org: { name: "asc" } }, { email: "asc" }],
      }),
      db.org.count(),
      db.ndaSignature.count(),
      db.downloadEvent.findMany({
        where: { at: { gte: since } },
        select: { at: true, documentTitle: true, email: true },
      }),
      db.downloadEvent.findMany({ orderBy: { at: "desc" }, take: 10 }),
      db.ndaSignature.findMany({
        orderBy: { signedAt: "desc" },
        take: 5,
        include: { org: true },
      }),
      db.downloadEvent.findMany({ orderBy: { at: "desc" }, take: 500 }),
    ]);

  const connected = invites.filter((i) => i.lastLoginAt).length;
  const connectedPct = invites.length
    ? Math.round((connected / invites.length) * 100)
    : 0;

  // Top documents within the window.
  const byDoc = new Map<string, number>();
  for (const e of windowEvents) {
    byDoc.set(e.documentTitle, (byDoc.get(e.documentTitle) ?? 0) + 1);
  }
  const topDocs = [...byDoc.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const topMax = topDocs[0]?.[1] ?? 1;

  // Merged feed: downloads + NDA signings, newest first.
  const feed = [
    ...recentEvents.map((e) => ({
      at: e.at,
      icon: "fa-file-arrow-down",
      text: `${e.email} downloaded "${e.documentTitle}"`,
    })),
    ...recentNdas.map((s) => ({
      at: s.signedAt,
      icon: "fa-file-signature",
      text: `${s.signerEmail} signed the NDA for ${s.org.name}`,
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 12);

  const eventsByEmail = new Map<string, typeof allEvents>();
  for (const e of allEvents) {
    const list = eventsByEmail.get(e.email) ?? [];
    list.push(e);
    eventsByEmail.set(e.email, list);
  }

  const tiles = [
    { value: String(invites.length), label: "invited emails", href: "/vc-admin/invites" },
    { value: `${connectedPct}%`, label: `connected (${connected}/${invites.length})`, href: "/vc-admin/invites" },
    { value: String(windowEvents.length), label: `downloads · ${range}d`, href: null },
    { value: `${ndaCount}/${orgCount}`, label: "NDAs signed (orgs)", href: "/admin/nda" },
  ];

  return (
    <section className="px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <p className="text-sm mb-4">
          <Link href="/vc-admin" className="prose-link text-muted">
            ← VC admin
          </Link>
        </p>
        <h1 className="display text-3xl md:text-4xl">Activity</h1>

        {/* KPI tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {tiles.map((t) =>
            t.href ? (
              <Link key={t.label} href={t.href} className="card block text-fg">
                <p className="display text-3xl">{t.value}</p>
                <p className="text-xs tracking-wide uppercase text-muted mt-1">{t.label}</p>
              </Link>
            ) : (
              <div key={t.label} className="card">
                <p className="display text-3xl">{t.value}</p>
                <p className="text-xs tracking-wide uppercase text-muted mt-1">{t.label}</p>
              </div>
            ),
          )}
        </div>

        {/* Downloads over time */}
        <div className="card mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="display text-lg">Downloads per day</h2>
            <div className="flex items-center gap-2">
              {RANGES.map((r) => (
                <Link
                  key={r}
                  href={`?range=${r}`}
                  className={`tag ${r === range ? "tag-accent" : "hover:text-fg"}`}
                  aria-current={r === range ? "true" : undefined}
                >
                  {r}d
                </Link>
              ))}
            </div>
          </div>
          <DownloadsChart days={dayBuckets(range, windowEvents)} />
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* Top documents */}
          <div className="card">
            <h2 className="display text-lg mb-4">Top documents · {range}d</h2>
            {topDocs.length === 0 ? (
              <p className="text-sm text-muted">No downloads in this window.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {topDocs.map(([title, count]) => (
                  <li key={title} className="text-sm">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-fg truncate">{title}</span>
                      <span className="text-muted">{count}</span>
                    </div>
                    <div className="mt-1 h-2 w-full" style={{ background: "var(--border)" }}>
                      <div
                        className="h-2"
                        style={{
                          width: `${(count / topMax) * 100}%`,
                          background: "var(--accent)",
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recent activity */}
          <div className="card">
            <h2 className="display text-lg mb-4">Recent activity</h2>
            {feed.length === 0 ? (
              <p className="text-sm text-muted">Nothing yet.</p>
            ) : (
              <ul className="flex flex-col gap-2.5 text-sm">
                {feed.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <i
                      className={`fa-solid fa-fw ${f.icon} text-muted mt-0.5 text-xs`}
                      aria-hidden="true"
                    ></i>
                    <span className="flex-1 text-fg">{f.text}</span>
                    <span className="text-muted whitespace-nowrap text-xs mt-0.5">
                      {relative(f.at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Per-email detail — the accessible table view of the same data */}
        <h2 className="display text-xl mt-12 mb-2">Per email</h2>
        <p className="text-sm text-muted mb-4">
          Last connection and full download history per invited email.
        </p>
        <div className="grid gap-2">
          {invites.map((i) => {
            const evts = eventsByEmail.get(i.email) ?? [];
            return (
              <details key={i.id} className="card !p-0">
                <summary className="cursor-pointer list-none px-5 py-3 flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm">
                    <strong className="text-fg">{i.email}</strong>{" "}
                    <span className="text-muted">· {i.org.name}</span>
                  </span>
                  <span className="text-xs text-muted">
                    last connected {i.lastLoginAt ? relative(i.lastLoginAt) : "never"} ·{" "}
                    {evts.length} download{evts.length === 1 ? "" : "s"}
                  </span>
                </summary>
                <div className="px-5 pb-4">
                  {evts.length === 0 ? (
                    <p className="text-sm text-muted">No downloads yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="clean min-w-[420px]">
                        <thead>
                          <tr>
                            <th>Document</th>
                            <th>Downloaded at</th>
                          </tr>
                        </thead>
                        <tbody>
                          {evts.map((e) => (
                            <tr key={e.id}>
                              <td>
                                {e.documentTitle}
                                {!e.documentId && (
                                  <span className="text-muted text-xs"> (since removed)</span>
                                )}
                              </td>
                              <td className="text-muted whitespace-nowrap">
                                {e.at.toISOString().slice(0, 16).replace("T", " ")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </details>
            );
          })}
          {invites.length === 0 && <p className="text-muted">No VC emails invited yet.</p>}
        </div>
      </div>
    </section>
  );
}
