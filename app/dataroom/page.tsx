import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { currentUser, isAdmin, isVcAdmin, vcInviteFor } from "@/app/lib/authz";
import SessionBar from "@/app/components/SessionBar";

export const metadata: Metadata = {
  title: "Data room",
  robots: { index: false, follow: false },
};

// Per-request (auth + DB); never prerender.
export const dynamic = "force-dynamic";

/**
 * The data-room landing. Role-aware: staff are sent to their consoles; an
 * invited VC sees the document area (the NDA gate and the document list ship
 * in the next releases).
 */
export default async function DataroomPage() {
  const user = await currentUser();
  if (!user) notFound(); // middleware already redirects; belt and braces

  if (await isAdmin(user.email)) redirect("/admin");
  if (await isVcAdmin(user.email)) redirect("/vc-admin");

  const invite = await vcInviteFor(user.email);
  if (!invite) notFound();

  return (
    <section className="px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <SessionBar />
        <p className="tag tag-accent">Data room</p>
        <h1 className="display text-3xl md:text-4xl mt-4">
          {invite.org.name}
        </h1>
        <div className="accent-line mt-6"></div>
        <p className="text-muted mt-8 reading max-w-2xl">
          Welcome. Your access is set up. The document repository is being
          provisioned — you will receive an email when documents are available
          here.
        </p>
      </div>
    </section>
  );
}
