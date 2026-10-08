"use server";

import { revalidatePath } from "next/cache";
import * as svc from "@/app/lib/dataroom-service";

/** Form-facing wrappers over the data-room service; see documents/actions.ts. */

export type MeetingSettingsState = { error?: string; ok?: boolean };

export async function saveMeetingSettings(
  _prev: MeetingSettingsState,
  formData: FormData,
): Promise<MeetingSettingsState> {
  const actor = await svc.webActor();
  if (!actor) return { error: "Forbidden" };
  const res = await svc.asResult(
    svc.saveMeetingSettings(actor, {
      enabled: formData.get("enabled") === "on",
      openDays: formData.getAll("openDays").map(String),
      windows: String(formData.get("windows") ?? "").split(/\n+/),
      attendeeEmails: String(formData.get("attendeeEmails") ?? ""),
      horizonDays: String(formData.get("horizonDays") ?? ""),
      minNoticeHours: String(formData.get("minNoticeHours") ?? ""),
    }),
  );
  if (res.ok) {
    revalidatePath("/vc-admin/meetings");
    revalidatePath("/dataroom");
  }
  return res.error ? { error: res.error } : { ok: true };
}

/** Staff-side cancellation of any upcoming meeting (attendees are notified). */
export async function cancelMeetingAsStaff(formData: FormData) {
  const actor = await svc.webActor();
  if (!actor) throw new Error("Forbidden");
  const res = await svc.asResult(svc.cancelMeetingAsStaff(actor, String(formData.get("id") ?? "")));
  if (res.ok) revalidatePath("/vc-admin/meetings");
}
