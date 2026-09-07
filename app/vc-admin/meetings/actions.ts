"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/app/lib/db";
import { currentUser, isVcAdmin } from "@/app/lib/authz";
import { DAY_CODES, parseWindowLine, type DayCode } from "@/app/lib/meeting-slots";
import { deleteMeetingEvent } from "@/app/lib/google-meet";

export type MeetingSettingsState = { error?: string; ok?: boolean };

const emailSchema = z.string().trim().toLowerCase().email();

async function guard() {
  const user = await currentUser();
  if (!user?.email || !(await isVcAdmin(user.email))) return null;
  return user;
}

export async function saveMeetingSettings(
  _prev: MeetingSettingsState,
  formData: FormData,
): Promise<MeetingSettingsState> {
  const user = await guard();
  if (!user) return { error: "Forbidden" };

  const enabled = formData.get("enabled") === "on";

  const openDays = formData
    .getAll("openDays")
    .map(String)
    .filter((d): d is DayCode => (DAY_CODES as readonly string[]).includes(d));

  const windowLines = String(formData.get("windows") ?? "")
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const windows = [];
  for (const line of windowLines) {
    const w = parseWindowLine(line);
    if (!w) return { error: `Not a valid time window: "${line}" (use e.g. 12:00-15:00, GMT).` };
    windows.push(w);
  }

  const rawEmails = String(formData.get("attendeeEmails") ?? "")
    .split(/[\s,;]+/)
    .filter(Boolean);
  const attendeeEmails: string[] = [];
  for (const raw of rawEmails) {
    const parsed = emailSchema.safeParse(raw);
    if (!parsed.success) return { error: `Not a valid email: "${raw}"` };
    if (!attendeeEmails.includes(parsed.data)) attendeeEmails.push(parsed.data);
  }

  const horizonDays = Math.min(60, Math.max(1, Number(formData.get("horizonDays") ?? 14) || 14));
  const minNoticeHours = Math.min(168, Math.max(0, Number(formData.get("minNoticeHours") ?? 24) || 0));

  if (enabled && (openDays.length === 0 || windows.length === 0 || attendeeEmails.length === 0)) {
    return {
      error: "To enable booking, set at least one day, one time window, and one attendee.",
    };
  }

  await db.meetingSettings.upsert({
    where: { id: "default" },
    update: { enabled, openDays, windows, attendeeEmails, horizonDays, minNoticeHours, updatedBy: user.email!.toLowerCase() },
    create: { id: "default", enabled, openDays, windows, attendeeEmails, horizonDays, minNoticeHours, updatedBy: user.email!.toLowerCase() },
  });
  await db.adminAction.create({
    data: {
      actorUserId: user.id!,
      actorEmail: user.email!,
      action: "meeting-settings.save",
      targetType: "MeetingSettings",
      targetId: "default",
      after: { enabled, openDays, windows, attendeeEmails, horizonDays, minNoticeHours },
    },
  });
  revalidatePath("/vc-admin/meetings");
  revalidatePath("/dataroom");
  return { ok: true };
}

/** Staff-side cancellation of any upcoming meeting (attendees are notified). */
export async function cancelMeetingAsStaff(formData: FormData) {
  const user = await guard();
  if (!user) throw new Error("Forbidden");

  const id = String(formData.get("id") ?? "");
  const meeting = await db.meeting.findUnique({
    where: { id },
    include: { org: true },
  });
  if (!meeting) return;

  if (meeting.googleEventId) {
    try {
      await deleteMeetingEvent(meeting.googleEventId);
    } catch (e) {
      console.error("[meetings] Google cancellation failed", e);
    }
  }
  await db.meeting.delete({ where: { id } });
  await db.adminAction.create({
    data: {
      actorUserId: user.id!,
      actorEmail: user.email!,
      action: "meeting.cancel-staff",
      targetType: "Meeting",
      targetId: id,
      before: {
        email: meeting.email,
        org: meeting.org.name,
        startAt: meeting.startAt.toISOString(),
      },
    },
  });
  revalidatePath("/vc-admin/meetings");
}
