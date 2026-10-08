"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/app/lib/db";
import { currentUser, isVcAdmin } from "@/app/lib/authz";
import { createDocument, replaceDocumentContent, readUpload } from "@/app/lib/documents";
import { parseSortOrder } from "@/app/lib/document-order";

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
  if (!title.success) return { error: "Enter a title." };

  const order = parseSortOrder(formData.get("sortOrder"));
  if (!order.ok) return { error: order.error };

  // URL entry: a labeled external link — always visible to every invited
  // email, opened in a new window from the data room (no file involved).
  if (formData.get("entryKind") === "url") {
    const url = z
      .string()
      .trim()
      .url()
      .refine((u) => /^https?:\/\//i.test(u), "http(s) only")
      .safeParse(formData.get("url"));
    if (!url.success) return { error: "Enter a valid http(s) URL." };

    const doc = await db.document.create({
      data: {
        kind: "url",
        title: title.data,
        url: url.data,
        sortOrder: order.value,
        alwaysVisible: true,
        filename: "",
        contentType: "",
        size: 0,
        storageKey: "",
        updatedBy: user.email!.toLowerCase(),
      },
    });
    await db.adminAction.create({
      data: {
        actorUserId: user.id!,
        actorEmail: user.email!,
        action: "document.add-url",
        targetType: "Document",
        targetId: doc.id,
        after: { title: doc.title, url: doc.url, sortOrder: doc.sortOrder },
      },
    });
    revalidatePath("/vc-admin/documents");
    revalidatePath("/dataroom");
    return { ok: true };
  }

  const file = formData.get("file");
  if (!validFile(file)) return { error: "Choose a file." };
  if (file.size > MAX_BYTES) return { error: "File too large (50 MB max)." };

  const alwaysVisible = formData.get("alwaysVisible") === "on";
  const doc = await createDocument({
    title: title.data,
    file: await readUpload(file),
    updatedBy: user.email!.toLowerCase(),
    sortOrder: order.value,
  });
  if (alwaysVisible) {
    await db.document.update({ where: { id: doc.id }, data: { alwaysVisible: true } });
  }
  await db.adminAction.create({
    data: {
      actorUserId: user.id!,
      actorEmail: user.email!,
      action: "document.add",
      targetType: "Document",
      targetId: doc.id,
      after: {
        title: doc.title,
        filename: doc.filename,
        size: doc.size,
        alwaysVisible,
        sortOrder: doc.sortOrder,
      },
    },
  });
  revalidatePath("/vc-admin/documents");
  revalidatePath("/dataroom");
  return { ok: true };
}

/**
 * Set or clear a document's position in the lists (Order column). Blank
 * clears it: the entry then follows the ordered ones, newest first.
 */
export async function setSortOrder(formData: FormData) {
  const user = await guard();
  if (!user) throw new Error("Forbidden");

  const id = String(formData.get("id") ?? "");
  const order = parseSortOrder(formData.get("sortOrder"));
  if (!order.ok) return; // the field is numeric client-side; nothing to do with garbage

  const doc = await db.document.findUnique({ where: { id } });
  if (!doc || doc.sortOrder === order.value) return;

  await db.document.update({ where: { id }, data: { sortOrder: order.value } });
  await db.adminAction.create({
    data: {
      actorUserId: user.id!,
      actorEmail: user.email!,
      action: "document.reorder",
      targetType: "Document",
      targetId: id,
      before: { sortOrder: doc.sortOrder },
      after: { sortOrder: order.value, title: doc.title },
    },
  });
  revalidatePath("/vc-admin/documents");
  revalidatePath("/dataroom");
}

/** Flip a document between "visible to everyone" and "manually shared". */
export async function toggleAlwaysVisible(formData: FormData) {
  const user = await guard();
  if (!user) throw new Error("Forbidden");

  const id = String(formData.get("id") ?? "");
  const doc = await db.document.findUnique({ where: { id } });
  if (!doc) return;
  if (doc.kind === "url") return; // URL entries are always visible by definition

  const next = !doc.alwaysVisible;
  await db.document.update({ where: { id }, data: { alwaysVisible: next } });
  await db.adminAction.create({
    data: {
      actorUserId: user.id!,
      actorEmail: user.email!,
      action: "document.visibility",
      targetType: "Document",
      targetId: id,
      before: { alwaysVisible: doc.alwaysVisible },
      after: { alwaysVisible: next, title: doc.title },
    },
  });
  revalidatePath("/vc-admin/documents");
  revalidatePath("/dataroom");
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
  if (before.kind === "url") {
    return { error: "URL entries have no file — remove and re-add to change them." };
  }

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
