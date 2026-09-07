import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/app/lib/db";
import { currentUser, isAdmin } from "@/app/lib/authz";
import AllowlistManager from "../AllowlistManager";
import { addVcAdmin, removeVcAdmin } from "./actions";

export const metadata: Metadata = {
  title: "VC admins · Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminVcAdminsPage() {
  const user = await currentUser();
  if (!user || !(await isAdmin(user.email))) notFound();

  const entries = await db.vcAdminEntry.findMany({
    orderBy: { addedAt: "desc" },
  });

  return (
    <section className="px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <p className="text-sm mb-4">
          <Link href="/admin" className="prose-link text-muted">
            ← Admin
          </Link>
        </p>
        <h1 className="display text-3xl md:text-4xl">VC admins</h1>
        <p className="text-muted mt-4 reading max-w-2xl">
          VC admins run the data room: they invite VC emails, manage the
          document repository, choose which documents each VC sees, and follow
          activity. They sign in like every other user — Google, GitHub, or an
          emailed code.
        </p>
        <AllowlistManager
          noun="VC admin"
          protectSelf={false}
          currentEmail={(user.email ?? "").toLowerCase()}
          entries={entries.map((e) => ({
            id: e.id,
            email: e.email,
            addedAt: e.addedAt.toISOString().slice(0, 16).replace("T", " "),
          }))}
          addAction={addVcAdmin}
          removeAction={removeVcAdmin}
        />
      </div>
    </section>
  );
}
