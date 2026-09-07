import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/app/lib/db";
import { currentUser, isAdmin } from "@/app/lib/authz";
import { listVersions, readVersionFile } from "@/app/lib/nda-versions";
import { renderTemplateHtml } from "@/app/lib/doc-html";
import VersionSelector from "./VersionSelector";

export const metadata: Metadata = {
  title: "NDA · Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const STATUS_NOTE: Record<string, string> = {
  modified: "modified since publish — not selectable",
  missing: "file missing — not selectable",
  new: "new (never activated)",
  ok: "matches published hash",
};

export default async function AdminNdaPage() {
  const user = await currentUser();
  if (!user || !(await isAdmin(user.email))) notFound();

  const [versions, signatures] = await Promise.all([
    listVersions(),
    db.ndaSignature.findMany({
      include: { org: true, ndaDocument: true },
      orderBy: { signedAt: "desc" },
    }),
  ]);
  const active = versions.find((v) => v.active) ?? null;
  const others = versions.filter((v) => !v.active);

  const activeContent =
    active && active.currentHash
      ? await readVersionFile(active.filename).catch(() => null)
      : null;
  const activeHtml = activeContent ? renderTemplateHtml(activeContent) : null;
  const activeDrifted = !!active && active.currentHash !== active.pinnedHash;

  return (
    <section className="px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <p className="text-sm mb-4">
          <Link href="/admin" className="prose-link text-muted">
            ← Admin
          </Link>
        </p>
        <h1 className="display text-3xl md:text-4xl">NDA</h1>
        <p className="text-muted mt-4 reading max-w-2xl">
          The NDA every VC organization signs before accessing the data room —
          one signature per organization. Versions live as Markdown files in{" "}
          <code>legal/</code>; each new version is a new file, never an edit of a
          published one. Existing signatures keep the version they signed.
        </p>

        <h2 className="display text-xl mt-10">Active version</h2>
        {active ? (
          <>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
              <dt className="text-muted">Document</dt>
              <dd>
                <code>{active.filename}</code> ({active.version})
              </dd>
              <dt className="text-muted">Integrity hash</dt>
              <dd className="break-all font-mono text-xs">{active.pinnedHash}</dd>
            </dl>
            {activeDrifted && (
              <p className="text-sm text-red-500 mt-2">
                The file on disk no longer matches this hash
                {active.currentHash ? "" : " (file missing)"} — signing is
                blocked until it is restored.
              </p>
            )}
            {activeHtml ? (
              <div
                className="doc-prose mt-4 max-h-[28rem] overflow-y-auto border hairline p-5"
                dangerouslySetInnerHTML={{ __html: activeHtml }}
              />
            ) : (
              <p className="text-sm text-muted mt-2">Content unavailable.</p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted mt-2">
            No active version configured — run the seed (npm run db:seed) or
            activate one below. VCs cannot enter the data room until an NDA is
            active.
          </p>
        )}

        <h2 className="display text-xl mt-10">Other versions</h2>
        <VersionSelector
          options={others.map((v) => ({
            filename: v.filename,
            version: v.version,
            selectable: v.selectable,
            note: STATUS_NOTE[v.status] ?? v.status,
          }))}
        />

        <h2 className="display text-xl mt-12">Signatures</h2>
        <p className="text-muted text-sm mt-2">
          One per organization; it covers every VC invited under that
          organization.
        </p>
        <div className="overflow-x-auto mt-4">
          <table className="clean min-w-[680px]">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Signed by</th>
                <th>Date</th>
                <th>Version</th>
                <th>PDF</th>
              </tr>
            </thead>
            <tbody>
              {signatures.map((s) => (
                <tr key={s.id}>
                  <td>{s.org.name}</td>
                  <td>
                    {s.signerName}{" "}
                    <span className="text-muted">({s.signerEmail})</span>
                  </td>
                  <td className="whitespace-nowrap text-muted">
                    {s.signedAt.toISOString().slice(0, 16).replace("T", " ")}
                  </td>
                  <td>{s.ndaDocument.version}</td>
                  <td>
                    {s.pdfPath ? (
                      <a
                        href={`/admin/nda/${s.id}/pdf`}
                        className="prose-link text-fg text-sm"
                      >
                        download
                      </a>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {signatures.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-muted">
                    No signatures yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
