"use client";

import { useEffect, useMemo, useState } from "react";
import { useActionState } from "react";
import { bookMeeting, type BookState } from "./actions";

/**
 * Slot grid in the VIEWER'S time zone (from the browser), with the zone named
 * so there is no ambiguity. Slots arrive as UTC instants and are regrouped by
 * local day here — a 23:30 GMT slot belongs to "tomorrow" east of Greenwich.
 * Rendered only after mount so server HTML (which has no viewer zone) never
 * mismatches.
 */
export default function SlotPicker({ startIsos }: { startIsos: string[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [state, action, pending] = useActionState<BookState, FormData>(
    bookMeeting,
    {},
  );

  const { zoneLabel, days } = useMemo(() => {
    if (!mounted) return { zoneLabel: "", days: [] as { day: string; label: string; slots: { iso: string; time: string; full: string }[] }[] };

    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offset = new Intl.DateTimeFormat("en", { timeZoneName: "longOffset" })
      .formatToParts(new Date())
      .find((p) => p.type === "timeZoneName")?.value;
    const zoneLabel = offset ? `${zone} (${offset})` : zone;

    const dayKey = new Intl.DateTimeFormat("en-CA", {
      year: "numeric", month: "2-digit", day: "2-digit",
    });
    const dayLabel = new Intl.DateTimeFormat(undefined, {
      weekday: "short", month: "short", day: "numeric",
    });
    const timeFmt = new Intl.DateTimeFormat(undefined, {
      hour: "2-digit", minute: "2-digit",
    });
    const fullFmt = new Intl.DateTimeFormat(undefined, {
      weekday: "short", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit", timeZoneName: "short",
    });

    const groups = new Map<string, { label: string; slots: { iso: string; time: string; full: string }[] }>();
    for (const iso of startIsos) {
      const d = new Date(iso);
      const key = dayKey.format(d);
      const g = groups.get(key) ?? { label: dayLabel.format(d), slots: [] };
      g.slots.push({ iso, time: timeFmt.format(d), full: fullFmt.format(d) });
      groups.set(key, g);
    }
    return {
      zoneLabel,
      days: [...groups.entries()].map(([day, g]) => ({ day, ...g })),
    };
  }, [mounted, startIsos]);

  if (!mounted) {
    return <p className="text-sm text-muted">Loading available slots…</p>;
  }

  return (
    <form
      action={action}
      onSubmit={(e) => {
        const btn = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        const label = btn?.dataset.label;
        if (label && !confirm(`Book a 30-minute call on ${label}?`)) {
          e.preventDefault();
        }
      }}
    >
      <p className="text-sm text-muted mb-5">
        Times are shown in your time zone:{" "}
        <strong className="text-fg">{zoneLabel}</strong>.
      </p>
      {state.error && (
        <p role="alert" className="text-sm text-red-500 mb-4 border-l-2 border-accent pl-3 py-1">
          {state.error}
        </p>
      )}
      <div className="grid gap-6">
        {days.map((d) => (
          <div key={d.day}>
            <p className="text-xs tracking-wider uppercase text-muted mb-2">{d.label}</p>
            <div className="flex flex-wrap gap-2">
              {d.slots.map((s) => (
                <button
                  key={s.iso}
                  type="submit"
                  name="startAt"
                  value={s.iso}
                  data-label={s.full}
                  disabled={pending}
                  className="btn text-sm"
                >
                  {s.time}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {pending && <p className="text-xs text-muted mt-6">Booking…</p>}
    </form>
  );
}
