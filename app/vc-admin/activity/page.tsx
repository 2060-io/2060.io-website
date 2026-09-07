import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/app/lib/db";
import { currentUser, isVcAdmin } from "@/app/lib/authz";

export const metadata: Metadata = {
  title: "Activity · VC admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function fmt(d: Date | null): string {
  return d ? d.toISOString().slice(0, 16).replace("T", " ") : "never";
}

/**
 * Per invited email: when they last connected, and which documents they
 * downloaded, when. Grouped per email, with the raw event feed below.
 */
export default async function VcAdminActivityPage() {
  const user = await currentUser();
  if (!user || !(await isVcAdmin(user.email))) notFound();

  const [invites, events] = await Promise.all([
    db.vcInvite.findMany({
      include: { org: true, _count: { select: { documentGrants: true } } },
      orderBy: [{ org: { name: "asc" } }, { email: "asc" }],
    }),
    db.downloadEvent.findMany({
      orderBy: { at: "desc" },
      take: 500,
    }),
  ]);

  const byEmail = new Map<string, typeof events>();
  for (const e of events) {
    const list = byEmail.get(e.email) ?? [];
    list.push(e);
    byEmail.set(e.email, list);
  }

  return (
    <section className="px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <p className="text-sm mb-4">
          <Link href="/vc-admin" className="prose-link text-muted">
            ← VC admin
          </Link>
        </p>
        <h1 className="display text-3xl md:text-4xl">Activity</h1>
        <p className="text-muted mt-4 reading max-w-2xl">
          Per invited email: last connection and downloads. Sign-ins refresh
          automatically; downloads are recorded when a VC fetches a document.
        </p>

        <div className="grid gap-10 mt-10">
          {invites.map((i) => {
            const evts = byEmail.get(i.email) ?? [];
            return (
              <div key={i.id} className="card">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="display text-lg">
                    {i.email}{" "}
                    <span className="text-muted text-sm font-normal">
                      · {i.org.name}
                    </span>
                  </h2>
                  <p className="text-sm text-muted">
                    last connected:{" "}
                    <strong className="text-fg">{fmt(i.lastLoginAt)}</strong> ·{" "}
                    {i._count.documentGrants} document
                    {i._count.documentGrants === 1 ? "" : "s"} shared
                  </p>
                </div>
                {evts.length === 0 ? (
                  <p className="text-sm text-muted mt-3">No downloads yet.</p>
                ) : (
                  <div className="overflow-x-auto mt-3">
                    <table className="clean min-w-[480px]">
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
                            <td className="text-muted whitespace-nowrap">{fmt(e.at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
          {invites.length === 0 && (
            <p className="text-muted">No VC emails invited yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
