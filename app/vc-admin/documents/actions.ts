"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/app/lib/db";
import { currentUser, isVcAdmin } from "@/app/lib/authz";
import { createDocument, replaceDocumentContent, readUpload } from "@/app/lib/documents";

export type DocState = { error?: string; ok?: boolean };

const MAX_BYTES = 50 * 1024 * 1024; // matches serverActions.bodySizeLimit headroom

async function guard() {
  const user = await currentUser();
  if (!user?.email || !(await isVcAdmin(user.email))) return null;
  return user;
}

function validFile(file: unknown): file is File {
  return file instanceof File && file.size > 0;
}

export async function addDocument(
  _prev: DocState,
  formData: FormData,
): Promise<DocState> {
  const user = await guard();
  if (!user) return { error: "Forbidden" };

  const title = z.string().trim().min(1).max(200).safeParse(formData.get("title"));
  if (!title.success) return { error: "Enter a document title." };
  const file = formData.get("file");
  if (!validFile(file)) return { error: "Choose a file." };
  if (file.size > MAX_BYTES) return { error: "File too large (50 MB max)." };

  const doc = await createDocument({
    title: title.data,
    file: await readUpload(file),
    updatedBy: user.email!.toLowerCase(),
  });
  await db.adminAction.create({
    data: {
      actorUserId: user.id!,
      actorEmail: user.email!,
      action: "document.add",
      targetType: "Document",
      targetId: doc.id,
      after: { title: doc.title, filename: doc.filename, size: doc.size },
    },
  });
  revalidatePath("/vc-admin/documents");
  return { ok: true };
}

export async function replaceDocument(
  _prev: DocState,
  formData: FormData,
): Promise<DocState> {
  const user = await guard();
  if (!user) return { error: "Forbidden" };

  const id = String(formData.get("id") ?? "");
  const file = formData.get("file");
  if (!validFile(file)) return { error: "Choose a file." };
  if (file.size > MAX_BYTES) return { error: "File too large (50 MB max)." };

  const before = await db.document.findUnique({ where: { id } });
  if (!before) return { error: "Document not found." };

  const doc = await replaceDocumentContent({
    documentId: id,
    file: await readUpload(file),
    updatedBy: user.email!.toLowerCase(),
  });
  await db.adminAction.create({
    data: {
      actorUserId: user.id!,
      actorEmail: user.email!,
      action: "document.replace",
      targetType: "Document",
      targetId: id,
      before: { filename: before.filename, version: before.version },
      after: { filename: doc.filename, version: doc.version, size: doc.size },
    },
  });
  revalidatePath("/vc-admin/documents");
  return { ok: true };
}

export async function removeDocument(formData: FormData) {
  const user = await guard();
  if (!user) throw new Error("Forbidden");

  const id = String(formData.get("id") ?? "");
  const doc = await db.document.findUnique({ where: { id } });
  if (!doc) return;

  // The DB row (and its grants, by cascade) go; files stay on the volume and
  // download history keeps the title via DownloadEvent.documentTitle.
  await db.document.delete({ where: { id } });
  await db.adminAction.create({
    data: {
      actorUserId: user.id!,
      actorEmail: user.email!,
      action: "document.remove",
      targetType: "Document",
      targetId: id,
      before: { title: doc.title, filename: doc.filename, version: doc.version },
    },
  });
  revalidatePath("/vc-admin/documents");
}
