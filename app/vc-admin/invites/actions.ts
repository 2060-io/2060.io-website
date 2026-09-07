"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/app/lib/db";
import { currentUser, isVcAdmin } from "@/app/lib/authz";
import { sendInviteEmail } from "@/app/lib/invite-email";

export type InviteState = { error?: string; ok?: boolean; message?: string };

const emailSchema = z.string().trim().toLowerCase().email();

async function guard() {
  const user = await currentUser();
  if (!user?.email || !(await isVcAdmin(user.email))) return null;
  return user;
}

/**
 * Invite one or more emails under an organization (created on first use).
 * Emails may be separated by commas, whitespace, or newlines. Each new invite
 * gets the invitation email (best-effort — the invite stands even if SMTP is
 * down; resend from the list).
 */
export async function inviteVcs(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const user = await guard();
  if (!user) return { error: "Forbidden" };

  const orgName = z
    .string()
    .trim()
    .min(1)
    .max(200)
    .safeParse(formData.get("orgName"));
  if (!orgName.success) return { error: "Enter the organization name." };

  const rawEmails = String(formData.get("emails") ?? "")
    .split(/[\s,;]+/)
    .filter(Boolean);
  if (rawEmails.length === 0) return { error: "Enter at least one email." };

  const emails: string[] = [];
  for (const raw of rawEmails) {
    const parsed = emailSchema.safeParse(raw);
    if (!parsed.success) return { error: `Not a valid email: "${raw}"` };
    if (!emails.includes(parsed.data)) emails.push(parsed.data);
  }

  const org = await db.org.upsert({
    where: { name: orgName.data },
    update: {},
    create: { name: orgName.data },
  });

  const created: string[] = [];
  const skipped: string[] = [];
  for (const email of emails) {
    const existing = await db.vcInvite.findUnique({ where: { email } });
    if (existing) {
      skipped.push(
        existing.orgId === org.id ? email : `${email} (already invited under another org)`,
      );
      continue;
    }
    await db.vcInvite.create({
      data: { email, orgId: org.id, invitedByUserId: user.id },
    });
    created.push(email);
    try {
      await sendInviteEmail({ orgName: org.name, email });
    } catch (e) {
      console.error(`[invite] email to ${email} failed — use resend`, e);
    }
  }

  await db.adminAction.create({
    data: {
      actorUserId: user.id!,
      actorEmail: user.email!,
      action: "invite.add",
      targetType: "Org",
      targetId: org.id,
      after: { org: org.name, created, skipped },
    },
  });

  revalidatePath("/vc-admin/invites");
  const parts = [];
  if (created.length) parts.push(`Invited ${created.join(", ")}.`);
  if (skipped.length) parts.push(`Already invited: ${skipped.join(", ")}.`);
  return { ok: true, message: parts.join(" ") };
}

/** Re-send the invitation email to an existing invite. */
export async function resendInvite(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const user = await guard();
  if (!user) return { error: "Forbidden" };

  const id = String(formData.get("id") ?? "");
  const invite = await db.vcInvite.findUnique({
    where: { id },
    include: { org: true },
  });
  if (!invite) return { error: "Invite not found." };

  try {
    await sendInviteEmail({ orgName: invite.org.name, email: invite.email });
  } catch (e) {
    console.error(`[invite] resend to ${invite.email} failed`, e);
    return { error: "Sending failed — check the SMTP configuration." };
  }
  return { ok: true, message: `Invitation re-sent to ${invite.email}.` };
}

/**
 * Revoke an invite: the email can no longer sign in (login gate) and an
 * existing session loses the data room on its next request (role checks are
 * per-request). Grants cascade away; download history is kept.
 */
export async function revokeInvite(formData: FormData) {
  const user = await guard();
  if (!user) throw new Error("Forbidden");

  const id = String(formData.get("id") ?? "");
  const invite = await db.vcInvite.findUnique({
    where: { id },
    include: { org: true },
  });
  if (!invite) return;

  await db.vcInvite.delete({ where: { id } });
  await db.adminAction.create({
    data: {
      actorUserId: user.id!,
      actorEmail: user.email!,
      action: "invite.revoke",
      targetType: "VcInvite",
      targetId: id,
      before: { email: invite.email, org: invite.org.name },
    },
  });
  revalidatePath("/vc-admin/invites");
}

/** Replace the set of documents this invite sees (the per-email selection). */
export async function setGrants(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const user = await guard();
  if (!user) return { error: "Forbidden" };

  const inviteId = String(formData.get("inviteId") ?? "");
  const invite = await db.vcInvite.findUnique({ where: { id: inviteId } });
  if (!invite) return { error: "Invite not found." };

  const wanted = new Set(formData.getAll("documentIds").map(String));
  // Only real documents can be granted.
  const docs = await db.document.findMany({
    select: { id: true, alwaysVisible: true },
  });
  const valid = new Set(docs.map((d) => d.id));
  for (const id of wanted) {
    if (!valid.has(id)) return { error: "Unknown document in selection." };
  }
  // Always-visible documents are frozen here: their checkboxes are disabled in
  // the editor (so they never arrive in `wanted`), and any manual grant they
  // already carry is preserved — it applies again if the flag is turned off.
  const frozen = new Set(docs.filter((d) => d.alwaysVisible).map((d) => d.id));

  const current = await db.documentGrant.findMany({ where: { inviteId } });
  const have = new Set(current.map((g) => g.documentId));
  const toAdd = [...wanted].filter((id) => !have.has(id) && !frozen.has(id));
  const toRemove = current
    .filter((g) => !wanted.has(g.documentId) && !frozen.has(g.documentId))
    .map((g) => g.id);

  await db.$transaction([
    db.documentGrant.deleteMany({ where: { id: { in: toRemove } } }),
    db.documentGrant.createMany({
      data: toAdd.map((documentId) => ({
        inviteId,
        documentId,
        grantedBy: user.email!.toLowerCase(),
      })),
      skipDuplicates: true,
    }),
  ]);

  await db.adminAction.create({
    data: {
      actorUserId: user.id!,
      actorEmail: user.email!,
      action: "invite.grants",
      targetType: "VcInvite",
      targetId: inviteId,
      after: { email: invite.email, documents: [...wanted] },
    },
  });

  revalidatePath("/vc-admin/invites");
  revalidatePath(`/vc-admin/invites/${inviteId}`);
  return { ok: true, message: "Selection saved." };
}
