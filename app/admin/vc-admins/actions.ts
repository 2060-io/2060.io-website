"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/app/lib/db";
import { currentUser, isAdmin } from "@/app/lib/authz";
import type { AllowlistState } from "../AllowlistManager";

const emailSchema = z.string().trim().toLowerCase().email();

export async function addVcAdmin(
  _prev: AllowlistState,
  formData: FormData,
): Promise<AllowlistState> {
  const user = await currentUser();
  if (!user || !(await isAdmin(user.email))) return { error: "Forbidden" };

  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Enter a valid email." };
  const email = parsed.data;

  await db.vcAdminEntry.upsert({
    where: { email },
    update: {},
    create: { email, addedByUserId: user.id },
  });
  await db.adminAction.create({
    data: {
      actorUserId: user.id!,
      actorEmail: user.email!,
      action: "vcadmin.add",
      targetType: "VcAdminEntry",
      after: { email },
    },
  });
  revalidatePath("/admin/vc-admins");
  return { ok: true };
}

export async function removeVcAdmin(formData: FormData) {
  const user = await currentUser();
  if (!user || !(await isAdmin(user.email))) throw new Error("Forbidden");

  const id = String(formData.get("id"));
  const entry = await db.vcAdminEntry.findUnique({ where: { id } });
  await db.vcAdminEntry.delete({ where: { id } });
  await db.adminAction.create({
    data: {
      actorUserId: user.id!,
      actorEmail: user.email!,
      action: "vcadmin.remove",
      targetType: "VcAdminEntry",
      before: { email: entry?.email },
    },
  });
  revalidatePath("/admin/vc-admins");
}
