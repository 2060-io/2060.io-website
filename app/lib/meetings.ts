import { db } from "@/app/lib/db";
import { freeBusy, organizerEmail, meetConfigured } from "@/app/lib/google-meet";
import {
  candidateSlots,
  filterAvailable,
  type DayCode,
  type Slot,
  type SlotSettings,
  type Window,
} from "@/app/lib/meeting-slots";

export type MeetingConfig = SlotSettings & {
  enabled: boolean;
  attendeeEmails: string[];
};

/** The stored settings row parsed into typed shape (null when never saved). */
export async function loadMeetingConfig(): Promise<MeetingConfig | null> {
  const row = await db.meetingSettings.findUnique({ where: { id: "default" } });
  if (!row) return null;
  return {
    enabled: row.enabled,
    openDays: (row.openDays as DayCode[]) ?? [],
    windows: (row.windows as Window[]) ?? [],
    attendeeEmails: (row.attendeeEmails as string[]) ?? [],
    horizonDays: row.horizonDays,
    minNoticeHours: row.minNoticeHours,
  };
}

/** Booking is offered only when enabled, configured, and Google env present. */
export function bookingOpen(cfg: MeetingConfig | null): cfg is MeetingConfig {
  return (
    !!cfg &&
    cfg.enabled &&
    meetConfigured() &&
    cfg.openDays.length > 0 &&
    cfg.windows.length > 0 &&
    cfg.attendeeEmails.length > 0
  );
}

/**
 * The slots a VC may book right now: configured candidates, minus slots with
 * an existing booking (DB), minus anything colliding with busy time on the
 * meetings account or any 2060-side attendee calendar (Google free/busy).
 * `unreadable` lists attendee calendars not shared with the meetings account.
 */
export async function availableSlots(cfg: MeetingConfig): Promise<{
  slots: Slot[];
  unreadable: string[];
}> {
  const now = new Date();
  const candidates = candidateSlots(cfg, now);
  if (candidates.length === 0) return { slots: [], unreadable: [] };

  const horizonEnd = candidates[candidates.length - 1].endAt;
  const organizer = organizerEmail();
  const [booked, fb] = await Promise.all([
    db.meeting.findMany({
      where: { startAt: { gte: now } },
      select: { startAt: true },
    }),
    freeBusy(
      [...(organizer ? [organizer] : []), ...cfg.attendeeEmails],
      now,
      horizonEnd,
    ),
  ]);

  return {
    slots: filterAvailable(candidates, booked.map((b) => b.startAt), fb.busy),
    unreadable: fb.unreadable,
  };
}
