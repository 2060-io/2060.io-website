import { auth } from "@/auth";
import { db } from "@/app/lib/db";

/** The signed-in user (with `id`), or null. */
export async function currentUser() {
  return (await auth())?.user ?? null;
}

/** ADMIN grant = verified email present in the admin allowlist. */
export async function isAdmin(email?: string | null) {
  if (!email) return false;
  // Entries are stored lowercased (seed + /admin); match case-insensitively.
  return !!(
    await db.adminAllowlistEntry.findUnique({
      where: { email: email.toLowerCase() },
    })
  );
}

/** VC_ADMIN grant — ADMINs hold every VC_ADMIN privilege too. */
export async function isVcAdmin(email?: string | null) {
  if (!email) return false;
  const e = email.toLowerCase();
  const [vcAdmin, admin] = await Promise.all([
    db.vcAdminEntry.findUnique({ where: { email: e } }),
    db.adminAllowlistEntry.findUnique({ where: { email: e } }),
  ]);
  return !!(vcAdmin || admin);
}

/** The VC invitation for this email (with its org), or null. */
export async function vcInviteFor(email?: string | null) {
  if (!email) return null;
  return db.vcInvite.findUnique({
    where: { email: email.toLowerCase() },
    include: { org: true },
  });
}

/**
 * The invitation-only gate: an email may sign in only when it is on one of the
 * role tables (admin allowlist, VC-admin allowlist, or a VC invitation).
 * Enforced in auth.ts's signIn callback, so an uninvited address can neither
 * create an account nor even receive an OTP code.
 */
export async function isInvitedEmail(email?: string | null): Promise<boolean> {
  if (!email) return false;
  const e = email.toLowerCase();
  const [admin, vcAdmin, invite] = await Promise.all([
    db.adminAllowlistEntry.findUnique({ where: { email: e } }),
    db.vcAdminEntry.findUnique({ where: { email: e } }),
    db.vcInvite.findUnique({ where: { email: e } }),
  ]);
  return !!(admin || vcAdmin || invite);
}
