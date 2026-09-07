import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUser, isAdmin } from "@/app/lib/authz";
import SessionBar from "@/app/components/SessionBar";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await currentUser();
  if (!user || !(await isAdmin(user.email))) notFound();

  return (
    <section className="px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <SessionBar />
        <p className="tag tag-accent">Data room</p>
        <h1 className="display text-3xl md:text-4xl mt-4">Administration</h1>
        <div className="accent-line mt-6"></div>
        <div className="grid md:grid-cols-3 gap-6 mt-10">
          <Link href="/admin/admins" className="card block text-fg">
            <h2 className="display text-lg">Admins</h2>
            <p className="text-muted text-sm mt-2">
              Manage who has full admin access to the data room.
            </p>
          </Link>
          <Link href="/admin/vc-admins" className="card block text-fg">
            <h2 className="display text-lg">VC admins</h2>
            <p className="text-muted text-sm mt-2">
              Manage who runs the data room: invitations, documents, activity.
            </p>
          </Link>
          <div className="card">
            <h2 className="display text-lg">NDA</h2>
            <p className="text-muted text-sm mt-2">
              Manage the NDA that VCs sign before accessing documents.
            </p>
            <p className="text-xs text-muted mt-4 italic">Arriving in the next release.</p>
          </div>
        </div>
        <p className="text-sm text-muted mt-10">
          Admins hold every VC-admin privilege too —{" "}
          <Link href="/vc-admin" className="prose-link text-fg">
            open the VC-admin console
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
