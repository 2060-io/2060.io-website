"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/app/lib/db";
import { currentUser, isAdmin } from "@/app/lib/authz";
import { activateVersion } from "@/app/lib/nda-versions";

export type NdaAdminState = { error?: string; ok?: boolean };

export async function activateNdaVersion(
  _prev: NdaAdminState,
  formData: FormData,
): Promise<NdaAdminState> {
  const user = await currentUser();
  if (!user || !(await isAdmin(user.email))) return { error: "Forbidden" };

  const filename = String(formData.get("filename") ?? "");
  const res = await activateVersion(filename);
  if (!res.ok) return { error: res.error };

  await db.adminAction.create({
    data: {
      actorUserId: user.id!,
      actorEmail: user.email!,
      action: "nda.activate",
      targetType: "NdaDocument",
      after: { filename },
    },
  });
  revalidatePath("/admin/nda");
  return { ok: true };
}
