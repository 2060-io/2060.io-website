import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/app/lib/db";
import { currentUser, vcInviteFor } from "@/app/lib/authz";
import { loadMeetingConfig, bookingOpen, availableSlots } from "@/app/lib/meetings";
import { groupByDay, gmtTime, DAY_CODES } from "@/app/lib/meeting-slots";
import SlotPicker, { type DayGroup } from "./SlotPicker";
import { cancelMeeting } from "./actions";

export const metadata: Metadata = {
  title: "Request a meeting · Data room",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function fmtWhen(d: Date): string {
  return `${DAY_CODES[d.getUTCDay()]} ${d.toISOString().slice(0, 10)} at ${gmtTime(d)} GMT`;
}

export default async function MeetingPage() {
  const user = await currentUser();
  if (!user?.email) notFound();
  const invite = await vcInviteFor(user.email);
  if (!invite) notFound();
  const nda = await db.ndaSignature.findUnique({ where: { orgId: invite.orgId } });
  if (!nda) redirect("/dataroom"); // NDA first — same gate as the documents

  const upcoming = await db.meeting.findFirst({
    where: { inviteId: invite.id, startAt: { gte: new Date() } },
    orderBy: { startAt: "asc" },
  });

  const cfg = await loadMeetingConfig();
  const open = bookingOpen(cfg);

  let days: DayGroup[] = [];
  if (!upcoming && open) {
    const { slots } = await availableSlots(cfg);
    days = groupByDay(slots).map((g) => ({
      day: g.day,
      label: g.label,
      slots: g.slots.map((s) => ({
        startIso: s.startAt.toISOString(),
        time: gmtTime(s.startAt),
      })),
    }));
  }

  return (
    <section className="px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <p className="text-sm mb-4">
          <Link href="/dataroom" className="prose-link text-muted">
            ← Data room
          </Link>
        </p>
        <p className="tag tag-accent">Data room</p>
        <h1 className="display text-3xl md:text-4xl mt-4">Request a meeting</h1>
        <div className="accent-line mt-6"></div>

        {upcoming ? (
          <div className="card mt-10 max-w-xl">
            <h2 className="display text-lg">Your call is booked</h2>
            <p className="text-muted mt-3">
              30 minutes on{" "}
              <strong className="text-fg">{fmtWhen(upcoming.startAt)}</strong>.
              The calendar invitation was sent to{" "}
              <strong className="text-fg">{invite.email}</strong>.
            </p>
            {upcoming.meetUrl && (
              <p className="mt-4">
                <a href={upcoming.meetUrl} rel="noopener" className="btn btn-primary">
                  Join with Google Meet
                </a>
              </p>
            )}
            <form action={cancelMeeting} className="mt-5">
              <button type="submit" className="prose-link text-fg text-sm">
                Cancel this meeting
              </button>
            </form>
          </div>
        ) : !open ? (
          <p className="text-muted mt-10 reading max-w-2xl">
            Meeting requests are not open at the moment — please check back
            later or reply to your invitation email.
          </p>
        ) : days.length === 0 ? (
          <p className="text-muted mt-10 reading max-w-2xl">
            No slots are available right now — new slots open as the calendar
            frees up, so please check back soon.
          </p>
        ) : (
          <>
            <p className="text-muted mt-8 reading max-w-2xl">
              Pick a 30-minute slot. You will receive a Google Calendar
              invitation with the Meet link at{" "}
              <strong className="text-fg">{invite.email}</strong>.
            </p>
            <div className="mt-8 max-w-3xl">
              <SlotPicker days={days} />
            </div>
          </>
        )}
      </div>
    </section>
  );
}
