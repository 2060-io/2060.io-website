"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/app/lib/db";
import { currentUser, isVcAdmin } from "@/app/lib/authz";
import {
  inviteValues,
  resolveInviteTemplate,
  renderInviteEmail,
} from "@/app/lib/invite-email";
import { sendEmail } from "@/app/lib/email";

export type TemplateState = { error?: string; ok?: boolean; message?: string };

async function guard() {
  const user = await currentUser();
  if (!user?.email || !(await isVcAdmin(user.email))) return null;
  return user;
}

const schema = z.object({
  subject: z.string().trim().min(1, "Enter a subject.").max(300),
  bodyMarkdown: z.string().trim().min(1, "Enter the email body.").max(20000),
});

export async function saveTemplate(
  _prev: TemplateState,
  formData: FormData,
): Promise<TemplateState> {
  const user = await guard();
  if (!user) return { error: "Forbidden" };

  const parsed = schema.safeParse({
    subject: formData.get("subject"),
    bodyMarkdown: formData.get("bodyMarkdown"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  }

  // Catch unknown {{placeholders}} before anything is sent to a real VC.
  const sample = inviteValues({ orgName: "Sample Ventures", email: "sample@fund.vc" });
  try {
    resolveInviteTemplate(parsed.data.subject, sample);
    resolveInviteTemplate(parsed.data.bodyMarkdown, sample);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Template error." };
  }

  await db.inviteEmailTemplate.upsert({
    where: { id: "default" },
    update: { ...parsed.data, updatedBy: user.email!.toLowerCase() },
    create: { id: "default", ...parsed.data, updatedBy: user.email!.toLowerCase() },
  });
  await db.adminAction.create({
    data: {
      actorUserId: user.id!,
      actorEmail: user.email!,
      action: "invite-template.save",
      targetType: "InviteEmailTemplate",
      targetId: "default",
    },
  });
  revalidatePath("/vc-admin/invite-email");
  return { ok: true, message: "Template saved." };
}

/** Reset to the code default by deleting the stored row. */
export async function resetTemplate() {
  const user = await guard();
  if (!user) throw new Error("Forbidden");
  await db.inviteEmailTemplate.deleteMany({ where: { id: "default" } });
  await db.adminAction.create({
    data: {
      actorUserId: user.id!,
      actorEmail: user.email!,
      action: "invite-template.reset",
      targetType: "InviteEmailTemplate",
      targetId: "default",
    },
  });
  revalidatePath("/vc-admin/invite-email");
}

/** Send the SAVED template to the signed-in VC admin for a real-inbox check. */
export async function sendTestEmail(
  _prev: TemplateState,
  _formData: FormData,
): Promise<TemplateState> {
  const user = await guard();
  if (!user) return { error: "Forbidden" };
  try {
    const { subject, html } = await renderInviteEmail({
      orgName: "Sample Ventures",
      email: user.email!,
    });
    await sendEmail({ to: user.email!, subject: `[test] ${subject}`, html });
  } catch (e) {
    console.error("[invite-template] test send failed", e);
    return { error: "Sending failed — check the SMTP configuration." };
  }
  return { ok: true, message: `Test sent to ${user.email}.` };
}
