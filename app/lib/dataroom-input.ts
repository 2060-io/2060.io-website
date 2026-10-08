import { z } from "zod";
import {
  DAY_CODES,
  parseWindowLine,
  type DayCode,
  type Window,
} from "@/app/lib/meeting-slots";

/**
 * Pure input parsing for the data-room service (no database, no Next.js):
 * email lists and meeting booking settings, as typed by a VC admin in a form
 * or passed by an MCP client. Kept apart from dataroom-service.ts so it can be
 * unit-tested without the auth stack.
 */

const emailSchema = z.string().trim().toLowerCase().email();

export type EmailListResult = { ok: true; emails: string[] } | { ok: false; error: string };

/** Split a free-text list of emails (commas, semicolons, whitespace, newlines); lowercased, de-duplicated. */
export function parseEmailList(raw: string | string[]): EmailListResult {
  const parts = (Array.isArray(raw) ? raw : [raw]).flatMap((s) => s.split(/[\s,;]+/)).filter(Boolean);
  const emails: string[] = [];
  for (const p of parts) {
    const r = emailSchema.safeParse(p);
    if (!r.success) return { ok: false, error: `Not a valid email: "${p}"` };
    if (!emails.includes(r.data)) emails.push(r.data);
  }
  return { ok: true, emails };
}


export type MeetingSettingsInput = {
  enabled: boolean;
  openDays: string[];
  windows: string[]; // "HH:MM-HH:MM" lines, GMT
  attendeeEmails: string | string[];
  horizonDays?: number | string | null;
  minNoticeHours?: number | string | null;
};

export type MeetingSettings = {
  enabled: boolean;
  openDays: DayCode[];
  windows: Window[];
  attendeeEmails: string[];
  horizonDays: number;
  minNoticeHours: number;
};

function clampInt(v: number | string | null | undefined, min: number, max: number, dflt: number): number {
  const n = v === null || v === undefined || v === "" ? NaN : Number(v);
  if (!Number.isFinite(n)) return dflt;
  return Math.min(max, Math.max(min, Math.round(n)));
}

/** Validate and normalise raw settings (strings from a form or an MCP call). */
export type MeetingSettingsResult =
  | { ok: true; settings: MeetingSettings }
  | { ok: false; error: string };

export function normalizeMeetingSettings(raw: MeetingSettingsInput): MeetingSettingsResult {
  const openDays: DayCode[] = [];
  for (const d of raw.openDays) {
    const code = d.trim().toUpperCase();
    if (!(DAY_CODES as readonly string[]).includes(code)) {
      return { ok: false, error: `Unknown day "${d}" (use ${DAY_CODES.join(", ")}).` };
    }
    if (!openDays.includes(code as DayCode)) openDays.push(code as DayCode);
  }
  const windows: Window[] = [];
  for (const line of raw.windows.map((l) => l.trim()).filter(Boolean)) {
    const w = parseWindowLine(line);
    if (!w) return { ok: false, error: `Not a valid time window: "${line}" (use e.g. 12:00-15:00, GMT).` };
    windows.push(w);
  }
  const emails = parseEmailList(raw.attendeeEmails);
  if (!emails.ok) return { ok: false, error: emails.error };

  const settings: MeetingSettings = {
    enabled: raw.enabled,
    openDays,
    windows,
    attendeeEmails: emails.emails,
    horizonDays: clampInt(raw.horizonDays, 1, 60, 14),
    minNoticeHours: clampInt(raw.minNoticeHours, 0, 168, 24),
  };
  if (settings.enabled && (openDays.length === 0 || windows.length === 0 || settings.attendeeEmails.length === 0)) {
    return { ok: false, error: "To enable booking, set at least one day, one time window, and one attendee." };
  }
  return { ok: true, settings };
}

