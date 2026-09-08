/**
 * Slot arithmetic for data-room VC meetings — pure functions, unit-tested.
 * All times are GMT: the admin configures open days and windows in GMT, and
 * slots are generated as UTC instants on 30-minute boundaries.
 */

export const SLOT_MINUTES = 30;

export const DAY_CODES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
export type DayCode = (typeof DAY_CODES)[number];

export type Window = { start: string; end: string }; // "HH:MM" GMT, start < end

export type SlotSettings = {
  openDays: DayCode[];
  windows: Window[];
  horizonDays: number;
  minNoticeHours: number;
};

export type Slot = { startAt: Date; endAt: Date };

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** "13:30" → minutes since midnight; null when malformed. */
export function parseHhMm(s: string): number | null {
  const m = HHMM.exec(s.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** Parse a "12:00-15:00" line into a Window; null when invalid or empty. */
export function parseWindowLine(line: string): Window | null {
  const m = line.trim().match(/^(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})$/);
  if (!m) return null;
  const pad = (t: string) => (t.length === 4 ? `0${t}` : t);
  const start = pad(m[1]);
  const end = pad(m[2]);
  const s = parseHhMm(start);
  const e = parseHhMm(end);
  if (s === null || e === null || s >= e) return null;
  return { start, end };
}

/**
 * All candidate 30-minute slots over the horizon: days whose GMT weekday is
 * open, stepped through each window, starting no earlier than
 * now + minNoticeHours.
 */
export function candidateSlots(settings: SlotSettings, now: Date): Slot[] {
  const out: Slot[] = [];
  const open = new Set(settings.openDays);
  const earliest = now.getTime() + settings.minNoticeHours * 3600_000;

  for (let d = 0; d <= settings.horizonDays; d++) {
    const day = new Date(Date.UTC(
      now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + d,
    ));
    if (!open.has(DAY_CODES[day.getUTCDay()])) continue;
    for (const w of settings.windows) {
      const start = parseHhMm(w.start);
      const end = parseHhMm(w.end);
      if (start === null || end === null) continue;
      for (let m = start; m + SLOT_MINUTES <= end; m += SLOT_MINUTES) {
        const startAt = new Date(day.getTime() + m * 60_000);
        if (startAt.getTime() < earliest) continue;
        out.push({
          startAt,
          endAt: new Date(startAt.getTime() + SLOT_MINUTES * 60_000),
        });
      }
    }
  }
  return out.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
}

type Busy = { start: Date; end: Date };

/** Whether a slot overlaps any busy interval (half-open comparison). */
export function overlapsBusy(slot: Slot, busy: Busy[]): boolean {
  return busy.some(
    (b) => slot.startAt < b.end && b.start < slot.endAt,
  );
}

/** Drop slots that are already booked (exact starts) or collide with busy time. */
export function filterAvailable(
  candidates: Slot[],
  bookedStarts: Date[],
  busy: Busy[],
): Slot[] {
  const booked = new Set(bookedStarts.map((d) => d.getTime()));
  return candidates.filter(
    (s) => !booked.has(s.startAt.getTime()) && !overlapsBusy(s, busy),
  );
}

/** "14:00" (GMT) for a slot instant. */
export function gmtTime(d: Date): string {
  return d.toISOString().slice(11, 16);
}
