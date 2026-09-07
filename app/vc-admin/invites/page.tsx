import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/app/lib/db";
import { currentUser, isVcAdmin } from "@/app/lib/authz";
import SessionBar from "@/app/components/SessionBar";
import { InviteForm, ResendButton, RevokeButton } from "./InviteControls";

export const metadata: Metadata = {
  title: "Invitations · VC admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function fmt(d: Date | null): string {
  return d ? d.toISOString().slice(0, 16).replace("T", " ") : "never";
}

export default async function VcAdminInvitesPage() {
  const user = await currentUser();
  if (!user || !(await isVcAdmin(user.email))) notFound();

  const orgs = await db.org.findMany({
    orderBy: { name: "asc" },
    include: {
      ndaSignature: true,
      invites: {
        orderBy: { email: "asc" },
        include: { _count: { select: { documentGrants: true } } },
      },
    },
  });

  return (
    <section className="px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <SessionBar />
        <p className="text-sm mb-4">
          <Link href="/vc-admin" className="prose-link text-muted">
            ← VC admin
          </Link>
        </p>
        <h1 className="display text-3xl md:text-4xl">Invitations</h1>
        <p className="text-muted mt-4 reading max-w-2xl">
          Only invited emails can sign in. Several emails can be invited under
          the same organization; the NDA is signed once per organization. New
          invites see no documents until you select them per email.
        </p>

        <h2 className="display text-xl mt-10 mb-4">Invite</h2>
        <InviteForm orgNames={orgs.map((o) => o.name)} />

        <h2 className="display text-xl mt-12 mb-2">Invited</h2>
        {orgs.length === 0 && <p className="text-muted text-sm">No one yet.</p>}
        <div className="grid gap-8 mt-4">
          {orgs.map((org) => (
            <div key={org.id} className="card">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="display text-lg">{org.name}</h3>
                <p className="text-sm text-muted">
                  {org.ndaSignature ? (
                    <>
                      NDA signed by{" "}
                      <strong className="text-fg">
                        {org.ndaSignature.signerName}
                      </strong>{" "}
                      on {org.ndaSignature.signedAt.toISOString().slice(0, 10)}
                    </>
                  ) : (
                    "NDA not signed yet"
                  )}
                </p>
              </div>
              <div className="overflow-x-auto mt-3">
                <table className="clean min-w-[720px]">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Invited</th>
                      <th>Last connected</th>
                      <th>Documents</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {org.invites.map((i) => (
                      <tr key={i.id}>
                        <td className="text-fg">{i.email}</td>
                        <td className="text-muted whitespace-nowrap">
                          {fmt(i.invitedAt)}
                        </td>
                        <td className="text-muted whitespace-nowrap">
                          {fmt(i.lastLoginAt)}
                        </td>
                        <td>
                          <Link
                            href={`/vc-admin/invites/${i.id}`}
                            className="prose-link text-fg text-sm"
                          >
                            {i._count.documentGrants} shared — select
                          </Link>
                        </td>
                        <td>
                          <div className="flex items-center gap-3">
                            <ResendButton id={i.id} />
                            <RevokeButton id={i.id} email={i.email} />
                          </div>
                        </td>
                      </tr>
                    ))}
                    {org.invites.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-muted">
                          No invites under this organization.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
