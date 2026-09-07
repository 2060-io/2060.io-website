import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/app/lib/db";
import { currentUser, isVcAdmin } from "@/app/lib/authz";
import { formatSize } from "@/app/lib/documents";
import DocumentManager from "./DocumentManager";

export const metadata: Metadata = {
  title: "Documents · VC admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function VcAdminDocumentsPage() {
  const user = await currentUser();
  if (!user || !(await isVcAdmin(user.email))) notFound();

  const docs = await db.document.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { grants: true, downloads: true } } },
  });

  return (
    <section className="px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <p className="text-sm mb-4">
          <Link href="/vc-admin" className="prose-link text-muted">
            ← VC admin
          </Link>
        </p>
        <h1 className="display text-3xl md:text-4xl">Documents</h1>
        <p className="text-muted mt-4 reading max-w-2xl">
          The data-room repository. Each document has a stable identity: replace
          its content any time (versioned) without losing who it is shared with
          or its download history. New documents are visible to no one until
          granted per email — unless marked always visible, which shares them
          with every invited email.
        </p>
        <DocumentManager
          docs={docs.map((d) => ({
            id: d.id,
            title: d.title,
            filename: d.filename,
            size: formatSize(d.size),
            version: d.version,
            updatedAt: d.updatedAt.toISOString().slice(0, 16).replace("T", " "),
            updatedBy: d.updatedBy ?? "—",
            alwaysVisible: d.alwaysVisible,
            grants: d._count.grants,
            downloads: d._count.downloads,
          }))}
        />
      </div>
    </section>
  );
}
