"use client";

import { useActionState } from "react";
import { saveMeetingSettings, type MeetingSettingsState } from "./actions";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

export default function SettingsForm({
  enabled,
  openDays,
  windowsText,
  attendeesText,
  horizonDays,
  minNoticeHours,
}: {
  enabled: boolean;
  openDays: string[];
  windowsText: string;
  attendeesText: string;
  horizonDays: number;
  minNoticeHours: number;
}) {
  const [state, action, pending] = useActionState<MeetingSettingsState, FormData>(
    saveMeetingSettings,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-5 max-w-xl">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="enabled" defaultChecked={enabled} />
        <span className="text-fg">Meeting requests open</span>
      </label>

      <div>
        <p className="text-sm text-muted mb-2">Open days (GMT)</p>
        <div className="flex flex-wrap gap-3">
          {DAYS.map((d) => (
            <label key={d} className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                name="openDays"
                value={d}
                defaultChecked={openDays.includes(d)}
              />
              {d}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="windows" className="text-sm text-muted block mb-1">
          Time windows, GMT — one per line, e.g. <code>12:00-15:00</code>
        </label>
        <textarea
          id="windows"
          name="windows"
          rows={3}
          defaultValue={windowsText}
          className="field text-sm font-mono"
        />
      </div>

      <div>
        <label htmlFor="attendeeEmails" className="text-sm text-muted block mb-1">
          2060/Verana attendees — every call invites all of them; their
          calendars must be shared with the meetings account
        </label>
        <textarea
          id="attendeeEmails"
          name="attendeeEmails"
          rows={3}
          defaultValue={attendeesText}
          placeholder={"fabrice@2060.io\nariel@2060.io"}
          className="field text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="text-sm text-muted">
          Bookable horizon (days)
          <input
            type="number"
            name="horizonDays"
            min={1}
            max={60}
            defaultValue={horizonDays}
            className="field text-sm mt-1 w-24"
          />
        </label>
        <label className="text-sm text-muted">
          Minimum notice (hours)
          <input
            type="number"
            name="minNoticeHours"
            min={0}
            max={168}
            defaultValue={minNoticeHours}
            className="field text-sm mt-1 w-24"
          />
        </label>
      </div>

      <div className="flex items-center gap-4">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </button>
        {state.error && <p className="text-sm text-red-500">{state.error}</p>}
        {state.ok && <p className="text-sm text-accent-hover">Saved.</p>}
      </div>
    </form>
  );
}
