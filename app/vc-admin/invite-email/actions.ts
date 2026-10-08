"use server";

import { revalidatePath } from "next/cache";
import * as svc from "@/app/lib/dataroom-service";

/** Form-facing wrappers over the data-room service; see documents/actions.ts. */

export type TemplateState = { error?: string; ok?: boolean; message?: string };

export async function saveTemplate(_prev: TemplateState, formData: FormData): Promise<TemplateState> {
  const actor = await svc.webActor();
  if (!actor) return { error: "Forbidden" };
  const res = await svc.asResult(
    svc.saveInviteTemplate(actor, {
      subject: String(formData.get("subject") ?? ""),
      bodyMarkdown: String(formData.get("bodyMarkdown") ?? ""),
    }),
  );
  if (res.ok) revalidatePath("/vc-admin/invite-email");
  return { ok: res.ok, error: res.error, message: res.message };
}

/** Reset to the code default. */
export async function resetTemplate() {
  const actor = await svc.webActor();
  if (!actor) throw new Error("Forbidden");
  const res = await svc.asResult(svc.resetInviteTemplate(actor));
  if (res.ok) revalidatePath("/vc-admin/invite-email");
}

/** Send the SAVED template to the signed-in VC admin for a real-inbox check. */
export async function sendTestEmail(_prev: TemplateState, _formData: FormData): Promise<TemplateState> {
  const actor = await svc.webActor();
  if (!actor) return { error: "Forbidden" };
  const res = await svc.asResult(svc.sendTestInviteEmail(actor));
  return { ok: res.ok, error: res.error, message: res.message };
}
