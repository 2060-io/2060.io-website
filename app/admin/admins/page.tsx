import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/app/lib/db";
import { currentUser, isAdmin } from "@/app/lib/authz";
import SessionBar from "@/app/components/SessionBar";
import AllowlistManager from "../AllowlistManager";
import { addAdmin, removeAdmin } from "./actions";

export const metadata: Metadata = {
  title: "Admins · Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminAdminsPage() {
  const user = await currentUser();
  if (!user || !(await isAdmin(user.email))) notFound();

  const entries = await db.adminAllowlistEntry.findMany({
    orderBy: { addedAt: "desc" },
  });

  return (
    <section className="px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <SessionBar />
        <p className="text-sm mb-4">
          <Link href="/admin" className="prose-link text-muted">
            ← Admin
          </Link>
        </p>
        <h1 className="display text-3xl md:text-4xl">Admins</h1>
        <p className="text-muted mt-4 reading max-w-2xl">
          Anyone whose verified email is on this list has full admin access to
          the data room, including every VC-admin privilege. This is the only
          grant of admin rights.
        </p>
        <AllowlistManager
          noun="admin"
          protectSelf
          currentEmail={(user.email ?? "").toLowerCase()}
          entries={entries.map((e) => ({
            id: e.id,
            email: e.email,
            addedAt: e.addedAt.toISOString().slice(0, 16).replace("T", " "),
          }))}
          addAction={addAdmin}
          removeAction={removeAdmin}
        />
      </div>
    </section>
  );
}
