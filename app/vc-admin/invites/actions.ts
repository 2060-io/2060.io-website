"use server";

import { revalidatePath } from "next/cache";
import * as svc from "@/app/lib/dataroom-service";

/** Form-facing wrappers over the data-room service; see documents/actions.ts. */

export type InviteState = { error?: string; ok?: boolean; message?: string };

/**
 * Invite one or more emails under an organization (created on first use).
 * Emails may be separated by commas, whitespace, or newlines.
 */
export async function inviteVcs(_prev: InviteState, formData: FormData): Promise<InviteState> {
  const actor = await svc.webActor();
  if (!actor) return { error: "Forbidden" };
  const emails = String(formData.get("emails") ?? "").split(/[\s,;]+/).filter(Boolean);
  if (emails.length === 0) return { error: "Enter at least one email." };
  const res = await svc.asResult(
    svc.inviteVcs(actor, { orgName: String(formData.get("orgName") ?? ""), emails }),
  );
  if (res.ok) revalidatePath("/vc-admin/invites");
  return { ok: res.ok, error: res.error, message: res.message };
}

/** Re-send the invitation email to an existing invite. */
export async function resendInvite(_prev: InviteState, formData: FormData): Promise<InviteState> {
  const actor = await svc.webActor();
  if (!actor) return { error: "Forbidden" };
  const res = await svc.asResult(svc.resendInvite(actor, String(formData.get("id") ?? "")));
  return { ok: res.ok, error: res.error, message: res.message };
}

/** Revoke an invite (sign-in gate + data room access; history kept). */
export async function revokeInvite(formData: FormData) {
  const actor = await svc.webActor();
  if (!actor) throw new Error("Forbidden");
  const res = await svc.asResult(svc.revokeInvite(actor, String(formData.get("id") ?? "")));
  if (res.ok) revalidatePath("/vc-admin/invites");
}

/** Replace the set of documents this invite sees (the per-email selection). */
export async function setGrants(_prev: InviteState, formData: FormData): Promise<InviteState> {
  const actor = await svc.webActor();
  if (!actor) return { error: "Forbidden" };
  const inviteId = String(formData.get("inviteId") ?? "");
  const res = await svc.asResult(
    svc.setGrants(actor, inviteId, formData.getAll("documentIds").map(String)),
  );
  if (res.ok) {
    revalidatePath("/vc-admin/invites");
    revalidatePath(`/vc-admin/invites/${inviteId}`);
  }
  return { ok: res.ok, error: res.error, message: res.message };
}
