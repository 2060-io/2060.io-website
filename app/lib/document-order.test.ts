import { describe, expect, it } from "vitest";
import { DOCUMENT_LIST_ORDER, parseSortOrder } from "./document-order";

describe("parseSortOrder", () => {
  it("treats blank or absent input as unordered", () => {
    expect(parseSortOrder("")).toEqual({ ok: true, value: null });
    expect(parseSortOrder("   ")).toEqual({ ok: true, value: null });
    expect(parseSortOrder(null)).toEqual({ ok: true, value: null });
    expect(parseSortOrder(undefined)).toEqual({ ok: true, value: null });
  });

  it("accepts whole numbers, negative ones included", () => {
    expect(parseSortOrder("10")).toEqual({ ok: true, value: 10 });
    expect(parseSortOrder(" -3 ")).toEqual({ ok: true, value: -3 });
    expect(parseSortOrder("0")).toEqual({ ok: true, value: 0 });
  });

  it("rejects decimals, text and out-of-range values", () => {
    for (const bad of ["1.5", "abc", "1000001", "-1000001", "1e9"]) {
      const r = parseSortOrder(bad);
      expect(r.ok, bad).toBe(false);
    }
  });
});

describe("DOCUMENT_LIST_ORDER", () => {
  it("orders explicitly first (nulls last), then newest first", () => {
    expect(DOCUMENT_LIST_ORDER).toEqual([
      { sortOrder: { sort: "asc", nulls: "last" } },
      { createdAt: "desc" },
    ]);
  });
});
