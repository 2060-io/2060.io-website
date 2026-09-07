import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { currentUser, isVcAdmin } from "@/app/lib/authz";
import { loadInviteTemplate, renderInviteEmail } from "@/app/lib/invite-email";
import SessionBar from "@/app/components/SessionBar";
import TemplateEditor from "./TemplateEditor";

export const metadata: Metadata = {
  title: "Invitation email · VC admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function InviteEmailPage() {
  const user = await currentUser();
  if (!user || !(await isVcAdmin(user.email))) notFound();

  const tpl = await loadInviteTemplate();
  const preview = await renderInviteEmail({
    orgName: "Sample Ventures",
    email: "jane@fund.vc",
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
        <h1 className="display text-3xl md:text-4xl">Invitation email</h1>
        <p className="text-muted mt-4 reading max-w-2xl">
          The email sent when you invite a VC (and on resend).{" "}
          {tpl.customized ? "Customized." : "Currently the default template."}
        </p>

        <TemplateEditor
          subject={tpl.subject}
          bodyMarkdown={tpl.bodyMarkdown}
          customized={tpl.customized}
        />

        <h2 className="display text-xl mt-12">Preview</h2>
        <p className="text-sm text-muted mt-1 mb-4">
          Rendered with sample values (Sample Ventures / jane@fund.vc). Subject:{" "}
          <strong className="text-fg">{preview.subject}</strong>
        </p>
        <iframe
          srcDoc={preview.html}
          title="Invitation email preview"
          className="w-full max-w-2xl h-[560px] border hairline bg-white"
          sandbox=""
        />
      </div>
    </section>
  );
}
