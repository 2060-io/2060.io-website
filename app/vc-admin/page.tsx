import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { currentUser, isVcAdmin } from "@/app/lib/authz";
import SessionBar from "@/app/components/SessionBar";

export const metadata: Metadata = {
  title: "VC admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * VC-admin console home. The invitation, document, activity, and email-template
 * managers land here in the next releases; this page establishes the guarded
 * area and confirms the role works end to end.
 */
export default async function VcAdminPage() {
  const user = await currentUser();
  if (!user || !(await isVcAdmin(user.email))) notFound();

  return (
    <section className="px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <SessionBar />
        <p className="tag tag-accent">Data room</p>
        <h1 className="display text-3xl md:text-4xl mt-4">VC administration</h1>
        <div className="accent-line mt-6"></div>
        <div className="grid md:grid-cols-2 gap-6 mt-10">
          {[
            {
              title: "Invitations",
              desc: "Invite VC emails by organization, see who was invited and when they last signed in.",
            },
            {
              title: "Documents",
              desc: "Manage the document repository: add, replace, and remove documents; choose what each VC sees.",
            },
            {
              title: "Activity",
              desc: "Per email: last connection, and which documents were downloaded, when.",
            },
            {
              title: "Invitation email",
              desc: "Customize the invitation email template.",
            },
          ].map((c) => (
            <div key={c.title} className="card">
              <h2 className="display text-lg">{c.title}</h2>
              <p className="text-muted text-sm mt-2">{c.desc}</p>
              <p className="text-xs text-muted mt-4 italic">Arriving in the next release.</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
