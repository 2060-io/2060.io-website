import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/app/lib/db";
import { currentUser, isVcAdmin } from "@/app/lib/authz";
import { meetConfigured, organizerEmail, freeBusy } from "@/app/lib/google-meet";
import { loadMeetingConfig } from "@/app/lib/meetings";
import { gmtTime, DAY_CODES } from "@/app/lib/meeting-slots";
import SettingsForm from "./SettingsForm";
import { cancelMeetingAsStaff } from "./actions";

export const metadata: Metadata = {
  title: "Meetings · VC admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function VcAdminMeetingsPage() {
  const user = await currentUser();
  if (!user || !(await isVcAdmin(user.email))) notFound();

  const [cfg, upcoming] = await Promise.all([
    loadMeetingConfig(),
    db.meeting.findMany({
      where: { startAt: { gte: new Date() } },
      orderBy: { startAt: "asc" },
      include: { org: true },
    }),
  ]);

  // Surface attendee calendars the meetings account cannot read — each one is
  // a missing calendar share that silently loosens the availability check.
  let unreadable: string[] = [];
  if (meetConfigured() && cfg && cfg.attendeeEmails.length > 0) {
    try {
      const res = await freeBusy(
        cfg.attendeeEmails,
        new Date(),
        new Date(Date.now() + 86400_000),
      );
      unreadable = res.unreadable;
    } catch {
      /* availability probe is best-effort here */
    }
  }

  return (
    <section className="px-6 py-16">
      <div className="max-w-6xl mx-auto">
        <p className="text-sm mb-4">
          <Link href="/vc-admin" className="prose-link text-muted">
            ← VC admin
          </Link>
        </p>
        <h1 className="display text-3xl md:text-4xl">Meetings</h1>
        <p className="text-muted mt-4 reading max-w-2xl">
          VCs in the data room can request a 30-minute Google Meet call. Slots
          come from the open days and GMT windows below, and are offered only
          when the meetings account and every configured attendee are free.
        </p>

        {!meetConfigured() && (
          <p className="text-sm mt-6 border-l-2 border-accent pl-3 py-1 max-w-2xl">
            The Google Calendar integration is not configured (GOOGLE_* env) —
            booking stays closed regardless of the settings below.
          </p>
        )}
        {unreadable.length > 0 && (
          <p className="text-sm text-red-500 mt-6 max-w-2xl">
            Not shared with {organizerEmail()}: {unreadable.join(", ")} — their
            availability cannot be checked. Ask them to share their calendar
            (free/busy is enough) with the meetings account.
          </p>
        )}

        <h2 className="display text-xl mt-10 mb-4">Settings</h2>
        <SettingsForm
          enabled={cfg?.enabled ?? false}
          openDays={cfg?.openDays ?? []}
          windowsText={(cfg?.windows ?? []).map((w) => `${w.start}-${w.end}`).join("\n")}
          attendeesText={(cfg?.attendeeEmails ?? []).join("\n")}
          horizonDays={cfg?.horizonDays ?? 14}
          minNoticeHours={cfg?.minNoticeHours ?? 24}
        />

        <h2 className="display text-xl mt-12 mb-4">Upcoming meetings</h2>
        <div className="overflow-x-auto">
          <table className="clean min-w-[640px]">
            <thead>
              <tr>
                <th>When (GMT)</th>
                <th>VC</th>
                <th>Organization</th>
                <th>Meet</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((m) => (
                <tr key={m.id}>
                  <td className="whitespace-nowrap text-fg">
                    {DAY_CODES[m.startAt.getUTCDay()]}{" "}
                    {m.startAt.toISOString().slice(0, 10)} {gmtTime(m.startAt)}
                  </td>
                  <td>{m.email}</td>
                  <td className="text-muted">{m.org.name}</td>
                  <td>
                    {m.meetUrl ? (
                      <a href={m.meetUrl} rel="noopener" className="prose-link text-fg text-sm">
                        link
                      </a>
                    ) : (
                      <span className="text-muted">–</span>
                    )}
                  </td>
                  <td>
                    <form action={cancelMeetingAsStaff}>
                      <input type="hidden" name="id" value={m.id} />
                      <button type="submit" className="prose-link text-fg text-sm">
                        cancel
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {upcoming.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-muted">
                    No upcoming meetings.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
