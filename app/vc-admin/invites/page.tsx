import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/app/lib/db";
import { currentUser, isVcAdmin } from "@/app/lib/authz";
import { InviteForm } from "./InviteControls";
import InvitesTable, { type InviteRow } from "./InvitesTable";

export const metadata: Metadata = {
  title: "Invitations · VC admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Compact relative label: "just now", "5m ago", "3h ago", "6d ago", else date. */
function relative(d: Date | null): string {
  if (!d) return "never";
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 30 * 86400) return `${Math.floor(s / 86400)}d ago`;
  return d.toISOString().slice(0, 10);
}

export default async function VcAdminInvitesPage() {
  const user = await currentUser();
  if (!user || !(await isVcAdmin(user.email))) notFound();

  const [invites, downloads] = await Promise.all([
    db.vcInvite.findMany({
      include: {
        org: { include: { ndaSignature: true } },
        _count: { select: { documentGrants: true } },
      },
    }),
    db.downloadEvent.groupBy({
      by: ["email"],
      _count: { _all: true },
      _max: { at: true },
    }),
  ]);
  const dlByEmail = new Map(
    downloads.map((d) => [d.email, { count: d._count._all, last: d._max.at }]),
  );

  const rows: InviteRow[] = invites.map((i) => {
    const dl = dlByEmail.get(i.email);
    // "Last seen" = the latest signal we have: sign-in or download.
    const lastSeen =
      [i.lastLoginAt, dl?.last]
        .filter((x): x is Date => !!x)
        .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
    return {
      id: i.id,
      email: i.email,
      org: i.org.name,
      ndaSigned: !!i.org.ndaSignature,
      grants: i._count.documentGrants,
      downloads: dl?.count ?? 0,
      status: dl?.count ? "active" : i.lastLoginAt ? "connected" : "never",
      lastSeenEpoch: lastSeen?.getTime() ?? 0,
      lastSeenLabel: relative(lastSeen),
      invitedLabel: i.invitedAt.toISOString().slice(0, 10),
    };
  });

  return (
    <section className="px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <p className="text-sm mb-4">
          <Link href="/vc-admin" className="prose-link text-muted">
            ← VC admin
          </Link>
        </p>
        <h1 className="display text-3xl md:text-4xl">Invitations</h1>
        <p className="text-muted mt-4 reading max-w-2xl">
          Only invited emails can sign in. Several emails can be invited under
          the same organization; the NDA is signed once per organization. New
          invites see only always-visible documents until you select more per
          email.
        </p>

        <h2 className="display text-xl mt-10 mb-4">Invite</h2>
        <InviteForm orgNames={[...new Set(invites.map((i) => i.org.name))].sort()} />

        <h2 className="display text-xl mt-12 mb-4">Invited</h2>
        <InvitesTable rows={rows} />
      </div>
    </section>
  );
}
