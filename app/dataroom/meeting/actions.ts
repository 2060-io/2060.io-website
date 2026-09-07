"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/app/lib/db";
import { currentUser, vcInviteFor } from "@/app/lib/authz";
import { loadMeetingConfig, bookingOpen, availableSlots } from "@/app/lib/meetings";
import { createMeetingEvent, deleteMeetingEvent } from "@/app/lib/google-meet";
import { SLOT_MINUTES } from "@/app/lib/meeting-slots";

export type BookState = { error?: string; ok?: boolean };

async function vcContext() {
  const user = await currentUser();
  if (!user?.email) return null;
  const invite = await vcInviteFor(user.email);
  if (!invite) return null;
  const nda = await db.ndaSignature.findUnique({ where: { orgId: invite.orgId } });
  if (!nda) return null; // the NDA gates the whole data room, meetings included
  return { user, invite };
}

/**
 * Book a 30-minute slot. The DB row (unique startAt) reserves the slot first;
 * the Google event (Meet link + native invitations to the VC and the 2060-side
 * attendees) follows, and a Google failure rolls the reservation back so no
 * phantom bookings survive.
 */
export async function bookMeeting(
  _prev: BookState,
  formData: FormData,
): Promise<BookState> {
  const ctx = await vcContext();
  if (!ctx) return { error: "Not available." };
  const { user, invite } = ctx;

  const startIso = String(formData.get("startAt") ?? "");
  const startAt = new Date(startIso);
  if (Number.isNaN(startAt.getTime())) return { error: "Pick a slot." };

  const cfg = await loadMeetingConfig();
  if (!bookingOpen(cfg)) return { error: "Booking is not open right now." };

  const existing = await db.meeting.findFirst({
    where: { inviteId: invite.id, startAt: { gte: new Date() } },
  });
  if (existing) return { error: "You already have an upcoming meeting." };

  // Re-validate against the live availability (config, bookings, calendars).
  const { slots } = await availableSlots(cfg);
  const slot = slots.find((s) => s.startAt.getTime() === startAt.getTime());
  if (!slot) {
    revalidatePath("/dataroom/meeting");
    return { error: "That slot is no longer available — pick another." };
  }

  let meeting;
  try {
    meeting = await db.meeting.create({
      data: {
        inviteId: invite.id,
        email: invite.email,
        orgId: invite.orgId,
        startAt: slot.startAt,
        endAt: slot.endAt,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      revalidatePath("/dataroom/meeting");
      return { error: "That slot was just taken — pick another." };
    }
    throw e;
  }

  try {
    const { eventId, meetLink } = await createMeetingEvent({
      summary: `2060 × ${invite.org.name} — data room call`,
      description:
        `${SLOT_MINUTES}-minute call requested from the 2060 investor data room by ${invite.email}.`,
      startsAt: slot.startAt,
      endsAt: slot.endAt,
      attendees: [invite.email, ...cfg.attendeeEmails],
    });
    await db.meeting.update({
      where: { id: meeting.id },
      data: { googleEventId: eventId, meetUrl: meetLink },
    });
  } catch (e) {
    // No phantom bookings: free the slot and surface the failure.
    await db.meeting.delete({ where: { id: meeting.id } }).catch(() => {});
    console.error("[meetings] Google event creation failed", e);
    return { error: "Creating the calendar event failed — please try again." };
  }

  await db.adminAction.create({
    data: {
      actorUserId: user.id!,
      actorEmail: user.email!,
      action: "meeting.book",
      targetType: "Meeting",
      targetId: meeting.id,
      after: { org: invite.org.name, startAt: slot.startAt.toISOString() },
    },
  });

  revalidatePath("/dataroom/meeting");
  revalidatePath("/dataroom");
  return { ok: true };
}

/** Cancel the VC's own upcoming meeting; attendees get the cancellation. */
export async function cancelMeeting(): Promise<void> {
  const ctx = await vcContext();
  if (!ctx) return;
  const { user, invite } = ctx;

  const meeting = await db.meeting.findFirst({
    where: { inviteId: invite.id, startAt: { gte: new Date() } },
  });
  if (!meeting) return;

  if (meeting.googleEventId) {
    try {
      await deleteMeetingEvent(meeting.googleEventId);
    } catch (e) {
      console.error("[meetings] Google cancellation failed", e);
    }
  }
  await db.meeting.delete({ where: { id: meeting.id } });
  await db.adminAction.create({
    data: {
      actorUserId: user.id!,
      actorEmail: user.email!,
      action: "meeting.cancel",
      targetType: "Meeting",
      targetId: meeting.id,
      before: { org: invite.org.name, startAt: meeting.startAt.toISOString() },
    },
  });
  revalidatePath("/dataroom/meeting");
  revalidatePath("/dataroom");
}
