import { db } from "@/app/lib/db";
import { currentUser, vcInviteFor } from "@/app/lib/authz";

/**
 * The gates every VC document route applies, in one place: the signed-in user
 * is an invited VC, the entry is of the expected kind and either always
 * visible or granted to this email, and the VC's org has signed the NDA.
 * Returns null as soon as one gate fails (callers answer 404).
 */
export async function vcDocumentAccess(id: string, kind: "file" | "url") {
  const user = await currentUser();
  if (!user?.email) return null;
  const invite = await vcInviteFor(user.email);
  if (!invite) return null;

  const [doc, nda] = await Promise.all([
    db.document.findFirst({
      where: {
        id,
        kind,
        OR: [{ alwaysVisible: true }, { grants: { some: { inviteId: invite.id } } }],
      },
    }),
    db.ndaSignature.findUnique({ where: { orgId: invite.orgId } }),
  ]);
  if (!doc || !nda) return null;
  return { invite, doc };
}
