import { notFound } from "next/navigation";
import { NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import { currentUser, vcInviteFor } from "@/app/lib/authz";

export const dynamic = "force-dynamic";

/**
 * VC access to a URL entry: same gates as a document download (invited +
 * signed NDA; URL entries are always visible), the open is recorded in the
 * access trail, then a redirect sends the new window to the external URL.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user?.email) notFound();
  const invite = await vcInviteFor(user.email);
  if (!invite) notFound();

  const { id } = await params;
  const [doc, nda] = await Promise.all([
    db.document.findFirst({
      where: {
        id,
        kind: "url",
        OR: [{ alwaysVisible: true }, { grants: { some: { inviteId: invite.id } } }],
      },
    }),
    db.ndaSignature.findUnique({ where: { orgId: invite.orgId } }),
  ]);
  if (!doc?.url || !nda) notFound();

  await db.downloadEvent.create({
    data: {
      email: invite.email,
      documentId: doc.id,
      documentTitle: doc.title,
    },
  });

  return NextResponse.redirect(doc.url, {
    status: 302,
    headers: { "Cache-Control": "private, no-store" },
  });
}
