import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/app/lib/db";
import { currentUser, isAdmin, isVcAdmin, vcInviteFor } from "@/app/lib/authz";
import { loadActiveNda } from "@/app/lib/nda-versions";
import { resolveNdaTemplate } from "@/app/lib/nda-template";
import { markdownToHtml } from "@/app/lib/doc-html";
import { formatSize } from "@/app/lib/documents";
import NdaSignForm from "./NdaSignForm";

export const metadata: Metadata = {
  title: "Data room",
  robots: { index: false, follow: false },
};

// Per-request (auth + DB); never prerender.
export const dynamic = "force-dynamic";

/**
 * The data-room landing. Role-aware: staff are sent to their consoles; an
 * invited VC must pass the NDA gate — signed once per organization — before the
 * document area.
 */
export default async function DataroomPage() {
  const user = await currentUser();
  if (!user?.email) notFound(); // middleware already redirects; belt and braces

  if (await isAdmin(user.email)) redirect("/admin");
  if (await isVcAdmin(user.email)) redirect("/vc-admin");

  const invite = await vcInviteFor(user.email);
  if (!invite) notFound();

  const signature = await db.ndaSignature.findUnique({
    where: { orgId: invite.orgId },
    include: { ndaDocument: true },
  });

  // ── NDA gate ──────────────────────────────────────────────────────────────
  if (!signature) {
    const nda = await loadActiveNda();
    if (!nda || !nda.intact) {
      return (
        <section className="px-6 py-16">
          <div className="max-w-6xl mx-auto">
            <p className="tag tag-accent">Data room</p>
            <h1 className="display text-3xl md:text-4xl mt-4">{invite.org.name}</h1>
            <p className="text-muted mt-8 reading max-w-2xl">
              The data room is not ready to accept signatures right now. Please
              try again later or contact us.
            </p>
          </div>
        </section>
      );
    }

    const personalised = resolveNdaTemplate(nda.content, {
      orgName: invite.org.name,
      signerName: user.name?.trim() || "the undersigned",
      signerEmail: user.email,
      effectiveDate: new Date(),
    });

    return (
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <p className="tag tag-accent">Data room</p>
          <h1 className="display text-3xl md:text-4xl mt-4">
            One step before the documents
          </h1>
          <div className="accent-line mt-6"></div>
          <p className="text-muted mt-8 reading max-w-2xl">
            Access to the data room requires a signed Non-Disclosure Agreement —
            one per organization. Review it below and sign; your colleagues at{" "}
            <strong className="text-fg">{invite.org.name}</strong> will then
            enter without signing again.
          </p>
          <div
            className="doc-prose mt-8 max-h-[32rem] overflow-y-auto border hairline p-6 max-w-3xl"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(personalised) }}
          />
          <p className="text-xs text-muted mt-2">
            NDA version {nda.version}. The name below replaces “the undersigned”
            in the executed copy.
          </p>
          <NdaSignForm
            orgName={invite.org.name}
            defaultSignerName={user.name ?? ""}
          />
        </div>
      </section>
    );
  }

  // ── Signed: the document area ─────────────────────────────────────────────
  const grants = await db.documentGrant.findMany({
    where: { inviteId: invite.id },
    include: { document: true },
    orderBy: { document: { createdAt: "desc" } },
  });

  return (
    <section className="px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <p className="tag tag-accent">Data room</p>
        <h1 className="display text-3xl md:text-4xl mt-4">{invite.org.name}</h1>
        <div className="accent-line mt-6"></div>
        <p className="text-sm text-muted mt-6">
          NDA {signature.ndaDocument.version} signed by {signature.signerName}{" "}
          on {signature.signedAt.toISOString().slice(0, 10)}
          {signature.pdfPath && (
            <>
              {" "}
              ·{" "}
              <a href="/dataroom/nda.pdf" className="prose-link text-fg">
                download your copy
              </a>
            </>
          )}
          .
        </p>

        {grants.length === 0 ? (
          <p className="text-muted mt-10 reading max-w-2xl">
            No documents have been shared with you yet — you will receive an
            email when documents are available here.
          </p>
        ) : (
          <div className="overflow-x-auto mt-10">
            <table className="clean min-w-[560px]">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Size</th>
                  <th>Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {grants.map(({ document: d }) => (
                  <tr key={d.id}>
                    <td className="text-fg">{d.title}</td>
                    <td className="text-muted whitespace-nowrap">
                      {formatSize(d.size)}
                    </td>
                    <td className="text-muted whitespace-nowrap">
                      {d.updatedAt.toISOString().slice(0, 10)}
                    </td>
                    <td>
                      <a
                        href={`/dataroom/doc/${d.id}`}
                        className="btn text-xs"
                        download
                      >
                        Download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
