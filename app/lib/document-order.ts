import type { Prisma } from "@prisma/client";
import { z } from "zod";

/**
 * How every document list is ordered — the VC data room, the staff repository
 * and the per-email grant editor all use it, so VCs see exactly what the admin
 * arranged. VC admins set `Document.sortOrder` (any integer, lowest first);
 * documents without an order follow the ordered ones, newest first.
 */
export const DOCUMENT_LIST_ORDER: Prisma.DocumentOrderByWithRelationInput[] = [
  { sortOrder: { sort: "asc", nulls: "last" } },
  { createdAt: "desc" },
];

export const SORT_ORDER_LIMIT = 1_000_000;

const sortOrderSchema = z.coerce
  .number()
  .int()
  .min(-SORT_ORDER_LIMIT)
  .max(SORT_ORDER_LIMIT);

export type SortOrderInput =
  | { ok: true; value: number | null }
  | { ok: false; error: string };

/**
 * Parse the optional "Order" form field. Blank (or absent) means unordered;
 * otherwise the value must be a whole number within ±SORT_ORDER_LIMIT.
 */
export function parseSortOrder(input: unknown): SortOrderInput {
  const s = input === null || input === undefined ? "" : String(input).trim();
  if (s === "") return { ok: true, value: null };
  const parsed = sortOrderSchema.safeParse(s);
  if (!parsed.success) {
    return { ok: false, error: "Order must be a whole number (or blank)." };
  }
  return { ok: true, value: parsed.data };
}
