import { createSign } from "node:crypto";

/**
 * Google Calendar client for data-room VC meetings, ported from the
 * veranafoundation.org WG-meetings integration. A service account with
 * domain-wide delegation impersonates the meetings role account
 * (GOOGLE_CALENDAR_IMPERSONATE, e.g. meetings@2060.io), which organizes every
 * call: Google auto-creates the Meet link and delivers invitations and
 * cancellations to all attendees (Gmail natively; Microsoft/Apple via
 * standard iCalendar email).
 *
 * On top of the foundation's event scope this also queries free/busy, so the
 * domain-wide delegation grant must authorize BOTH scopes below. 2060-side
 * attendees share their calendars (free/busy visibility is enough) with the
 * meetings account so their availability can be checked.
 *
 * Plain fetch + a hand-rolled JWT-bearer grant — no googleapis dependency.
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API = "https://www.googleapis.com/calendar/v3";
const SCOPE =
  "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.freebusy";

function config() {
  const email = process.env.GOOGLE_SA_EMAIL;
  // The key arrives with literal \n in env files.
  const key = process.env.GOOGLE_SA_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const impersonate = process.env.GOOGLE_CALENDAR_IMPERSONATE;
  if (!email || !key || !impersonate) return null;
  return { email, key, impersonate };
}

/** Whether the Calendar integration is configured (env present). */
export function meetConfigured(): boolean {
  return config() !== null;
}

/** The impersonated organizer (its calendar is always availability-checked). */
export function organizerEmail(): string | null {
  return config()?.impersonate ?? null;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  const cfg = config();
  if (!cfg) throw new Error("Google Calendar is not configured (GOOGLE_* env).");
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const now = Math.floor(Date.now() / 1000);
  const enc = (o: object) =>
    Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${enc({ alg: "RS256", typ: "JWT" })}.${enc({
    iss: cfg.email,
    sub: cfg.impersonate, // act as the meetings role account
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  })}`;
  const signature = createSign("RSA-SHA256")
    .update(unsigned)
    .sign(cfg.key, "base64url");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
  });
  if (!res.ok) {
    throw new Error(`Google token exchange failed (${res.status}): ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

async function api<T>(
  method: string,
  path: string,
  query: Record<string, string>,
  body?: object,
): Promise<T> {
  const token = await accessToken();
  const qs = new URLSearchParams(query).toString();
  const res = await fetch(`${API}${path}${qs ? `?${qs}` : ""}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new Error(`Calendar API ${method} ${path} failed (${res.status}): ${await res.text()}`);
  }
  // DELETE returns 204 with empty body.
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

type GEvent = {
  id: string;
  status: string;
  hangoutLink?: string;
  conferenceData?: { entryPoints?: { entryPointType: string; uri: string }[] };
};

function meetLinkOf(ev: GEvent): string | null {
  if (ev.hangoutLink) return ev.hangoutLink;
  const video = ev.conferenceData?.entryPoints?.find(
    (e) => e.entryPointType === "video",
  );
  return video?.uri ?? null;
}

/** Create a single (non-recurring) call; Google generates Meet link + invites. */
export async function createMeetingEvent(input: {
  summary: string;
  description?: string;
  startsAt: Date;
  endsAt: Date;
  attendees: string[];
}): Promise<{ eventId: string; meetLink: string | null }> {
  const ev = await api<GEvent>(
    "POST",
    "/calendars/primary/events",
    { conferenceDataVersion: "1", sendUpdates: "all" },
    {
      summary: input.summary,
      description: input.description ?? "",
      start: { dateTime: input.startsAt.toISOString(), timeZone: "Etc/GMT" },
      end: { dateTime: input.endsAt.toISOString(), timeZone: "Etc/GMT" },
      attendees: input.attendees.map((email) => ({ email })),
      guestsCanInviteOthers: false,
      guestsCanModify: false,
      conferenceData: {
        createRequest: {
          requestId: `dr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    },
  );
  return { eventId: ev.id, meetLink: meetLinkOf(ev) };
}

/** Cancel a call; attendees receive the cancellation. */
export async function deleteMeetingEvent(eventId: string): Promise<void> {
  await api("DELETE", `/calendars/primary/events/${eventId}`, {
    sendUpdates: "all",
  });
}

export type BusyInterval = { start: Date; end: Date };

/**
 * Busy intervals across the organizer + attendee calendars, merged into one
 * list. A calendar that cannot be read (not shared with the meetings account)
 * is skipped — its address is reported in `unreadable` so the admin console
 * can surface the missing share instead of silently ignoring it.
 */
export async function freeBusy(
  emails: string[],
  timeMin: Date,
  timeMax: Date,
): Promise<{ busy: BusyInterval[]; unreadable: string[] }> {
  const unique = [...new Set(emails.map((e) => e.toLowerCase()))];
  const data = await api<{
    calendars: Record<
      string,
      { busy?: { start: string; end: string }[]; errors?: { reason: string }[] }
    >;
  }>("POST", "/freeBusy", {}, {
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    items: unique.map((id) => ({ id })),
  });

  const busy: BusyInterval[] = [];
  const unreadable: string[] = [];
  for (const [id, cal] of Object.entries(data.calendars ?? {})) {
    if (cal.errors?.length) {
      unreadable.push(id);
      continue;
    }
    for (const b of cal.busy ?? []) {
      busy.push({ start: new Date(b.start), end: new Date(b.end) });
    }
  }
  return { busy, unreadable };
}
