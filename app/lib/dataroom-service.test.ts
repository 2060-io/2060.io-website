import { describe, expect, it } from "vitest";
import { normalizeMeetingSettings, parseEmailList } from "./dataroom-input";

describe("parseEmailList", () => {
  it("splits on commas, semicolons and whitespace; lowercases; de-duplicates", () => {
    const r = parseEmailList("A@Fund.vc, b@fund.vc;\n a@fund.vc  c@fund.vc");
    expect(r).toEqual({ ok: true, emails: ["a@fund.vc", "b@fund.vc", "c@fund.vc"] });
  });
  it("accepts arrays and reports the first invalid entry", () => {
    expect(parseEmailList(["x@y.io", "nope"])).toEqual({ ok: false, error: 'Not a valid email: "nope"' });
    expect(parseEmailList("")).toEqual({ ok: true, emails: [] });
  });
});

describe("normalizeMeetingSettings", () => {
  const base = {
    enabled: true,
    openDays: ["tue", "WED", "TUE"],
    windows: ["12:00-15:00", "", "16:00-17:30"],
    attendeeEmails: "a@2060.io, b@2060.io",
    horizonDays: "21",
    minNoticeHours: 500,
  };
  it("normalises days, windows, emails and clamps the numbers", () => {
    const r = normalizeMeetingSettings(base);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.settings.openDays).toEqual(["TUE", "WED"]);
    expect(r.settings.windows).toEqual([{ start: "12:00", end: "15:00" }, { start: "16:00", end: "17:30" }]);
    expect(r.settings.attendeeEmails).toEqual(["a@2060.io", "b@2060.io"]);
    expect(r.settings.horizonDays).toBe(21);
    expect(r.settings.minNoticeHours).toBe(168);
  });
  it("rejects unknown days and bad windows", () => {
    expect(normalizeMeetingSettings({ ...base, openDays: ["funday"] }).ok).toBe(false);
    expect(normalizeMeetingSettings({ ...base, windows: ["noon-ish"] }).ok).toBe(false);
  });
  it("refuses to enable booking without days, windows and attendees", () => {
    const r = normalizeMeetingSettings({ ...base, attendeeEmails: [] });
    expect(r).toEqual({ ok: false, error: "To enable booking, set at least one day, one time window, and one attendee." });
    expect(normalizeMeetingSettings({ ...base, enabled: false, attendeeEmails: [] }).ok).toBe(true);
  });
  it("falls back to defaults for missing numbers", () => {
    const r = normalizeMeetingSettings({ ...base, horizonDays: "", minNoticeHours: null });
    expect(r.ok && r.settings.horizonDays).toBe(14);
    expect(r.ok && r.settings.minNoticeHours).toBe(24);
  });
});
