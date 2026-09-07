import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/app/lib/db";
import { currentUser, isVcAdmin } from "@/app/lib/authz";
import { formatSize } from "@/app/lib/documents";
import GrantEditor from "./GrantEditor";

export const metadata: Metadata = {
  title: "Document selection · VC admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function InviteGrantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();
  if (!user || !(await isVcAdmin(user.email))) notFound();

  const { id } = await params;
  const invite = await db.vcInvite.findUnique({
    where: { id },
    include: { org: true, documentGrants: true },
  });
  if (!invite) notFound();

  const docs = await db.document.findMany({ orderBy: { createdAt: "desc" } });
  const granted = new Set(invite.documentGrants.map((g) => g.documentId));

  return (
    <section className="px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <p className="text-sm mb-4">
          <Link href="/vc-admin/invites" className="prose-link text-muted">
            ← Invitations
          </Link>
        </p>
        <h1 className="display text-3xl md:text-4xl">
          Documents for {invite.email}
        </h1>
        <p className="text-muted mt-4 reading max-w-2xl">
          {invite.org.name} — check the documents this email sees in the data
          room. Changes apply immediately.
        </p>
        <GrantEditor
          inviteId={invite.id}
          options={docs.map((d) => ({
            id: d.id,
            title: d.title,
            size: formatSize(d.size),
            granted: granted.has(d.id),
            alwaysVisible: d.alwaysVisible,
          }))}
        />
      </div>
    </section>
  );
}
