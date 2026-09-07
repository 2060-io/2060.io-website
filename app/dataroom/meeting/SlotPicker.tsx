"use client";

import { useActionState } from "react";
import { bookMeeting, type BookState } from "./actions";

export type DayGroup = {
  day: string; // YYYY-MM-DD
  label: string; // "TUE Sep 15"
  slots: { startIso: string; time: string }[]; // time = "12:00" GMT
};

/** GMT slot grid; one click books (with a confirm). */
export default function SlotPicker({ days }: { days: DayGroup[] }) {
  const [state, action, pending] = useActionState<BookState, FormData>(
    bookMeeting,
    {},
  );

  return (
    <form
      action={action}
      onSubmit={(e) => {
        const btn = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        const label = btn?.dataset.label;
        if (label && !confirm(`Book a 30-minute call on ${label} (GMT)?`)) {
          e.preventDefault();
        }
      }}
    >
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
                  key={s.startIso}
                  type="submit"
                  name="startAt"
                  value={s.startIso}
                  data-label={`${d.label} at ${s.time}`}
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
      <p className="text-xs text-muted mt-6">
        All times are GMT. {pending && "Booking…"}
      </p>
    </form>
  );
}
