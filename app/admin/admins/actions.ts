"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/app/lib/db";
import { currentUser, isAdmin } from "@/app/lib/authz";
import type { AllowlistState } from "../AllowlistManager";

const emailSchema = z.string().trim().toLowerCase().email();

export async function addAdmin(
  _prev: AllowlistState,
  formData: FormData,
): Promise<AllowlistState> {
  const user = await currentUser();
  if (!user || !(await isAdmin(user.email))) return { error: "Forbidden" };

  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Enter a valid email." };
  const email = parsed.data;

  await db.adminAllowlistEntry.upsert({
    where: { email },
    update: {},
    create: { email, addedByUserId: user.id },
  });
  await db.adminAction.create({
    data: {
      actorUserId: user.id!,
      actorEmail: user.email!,
      action: "admin.add",
      targetType: "AdminAllowlistEntry",
      after: { email },
    },
  });
  revalidatePath("/admin/admins");
  return { ok: true };
}

export async function removeAdmin(formData: FormData) {
  const user = await currentUser();
  if (!user || !(await isAdmin(user.email))) throw new Error("Forbidden");

  const id = String(formData.get("id"));
  const total = await db.adminAllowlistEntry.count();
  if (total <= 1) throw new Error("Keep at least one admin.");

  const entry = await db.adminAllowlistEntry.findUnique({ where: { id } });
  // An admin cannot remove their own access.
  if (entry && entry.email === user.email?.toLowerCase()) {
    throw new Error("You cannot remove your own admin access.");
  }
  await db.adminAllowlistEntry.delete({ where: { id } });
  await db.adminAction.create({
    data: {
      actorUserId: user.id!,
      actorEmail: user.email!,
      action: "admin.remove",
      targetType: "AdminAllowlistEntry",
      before: { email: entry?.email },
    },
  });
  revalidatePath("/admin/admins");
}
