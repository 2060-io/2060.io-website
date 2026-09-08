import { describe, expect, it } from "vitest";
import {
  candidateSlots,
  filterAvailable,
  gmtTime,
  overlapsBusy,
  parseWindowLine,
  type SlotSettings,
} from "./meeting-slots";

// Monday 2026-09-07 10:00 GMT.
const NOW = new Date("2026-09-07T10:00:00Z");

const settings: SlotSettings = {
  openDays: ["TUE", "WED"],
  windows: [{ start: "12:00", end: "14:00" }],
  horizonDays: 7,
  minNoticeHours: 24,
};

describe("parseWindowLine", () => {
  it("accepts HH:MM-HH:MM (and pads H:MM)", () => {
    expect(parseWindowLine("12:00-15:00")).toEqual({ start: "12:00", end: "15:00" });
    expect(parseWindowLine(" 9:30 - 11:00 ")).toEqual({ start: "09:30", end: "11:00" });
  });
  it("rejects malformed or inverted windows", () => {
    expect(parseWindowLine("12h-15h")).toBeNull();
    expect(parseWindowLine("15:00-12:00")).toBeNull();
    expect(parseWindowLine("25:00-26:00")).toBeNull();
  });
});

describe("candidateSlots", () => {
  it("generates 30-minute GMT slots on open days within windows", () => {
    const slots = candidateSlots(settings, NOW);
    // Two open days per week over 7 days: TUE 8th + WED 9th → 4 slots each.
    expect(slots).toHaveLength(8);
    expect(slots[0].startAt.toISOString()).toBe("2026-09-08T12:00:00.000Z");
    expect(gmtTime(slots[0].endAt)).toBe("12:30");
    expect(slots.map((s) => gmtTime(s.startAt))).toEqual([
      "12:00", "12:30", "13:00", "13:30",
      "12:00", "12:30", "13:00", "13:30",
    ]);
  });

  it("enforces the minimum notice", () => {
    // 30h notice pushes past TUE 12:00/12:30/13:00/13:30? 30h from MON 10:00
    // = TUE 16:00 → the whole TUE window is gone.
    const slots = candidateSlots({ ...settings, minNoticeHours: 30 }, NOW);
    expect(slots.every((s) => s.startAt.getTime() >= NOW.getTime() + 30 * 3600_000)).toBe(true);
    expect(slots).toHaveLength(4); // WED only
  });
});

describe("availability filtering", () => {
  it("drops booked starts and busy overlaps", () => {
    const slots = candidateSlots(settings, NOW);
    const booked = [new Date("2026-09-08T12:00:00Z")];
    const busy = [
      // Covers TUE 12:45–13:15 → kills the 12:30 and 13:00 slots.
      { start: new Date("2026-09-08T12:45:00Z"), end: new Date("2026-09-08T13:15:00Z") },
    ];
    const out = filterAvailable(slots, booked, busy);
    const tue = out.filter((s) => s.startAt.toISOString().startsWith("2026-09-08"));
    expect(tue.map((s) => gmtTime(s.startAt))).toEqual(["13:30"]);
  });

  it("half-open interval semantics: back-to-back busy does not collide", () => {
    const slot = {
      startAt: new Date("2026-09-08T12:00:00Z"),
      endAt: new Date("2026-09-08T12:30:00Z"),
    };
    expect(
      overlapsBusy(slot, [
        { start: new Date("2026-09-08T12:30:00Z"), end: new Date("2026-09-08T13:00:00Z") },
      ]),
    ).toBe(false);
  });
});

