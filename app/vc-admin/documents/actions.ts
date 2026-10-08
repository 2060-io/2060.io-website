"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/app/lib/db";
import { currentUser, isVcAdmin } from "@/app/lib/authz";
import { createDocument, replaceDocumentContent, readUpload } from "@/app/lib/documents";
import { parseSortOrder } from "@/app/lib/document-order";
import { thumbnailSource } from "@/app/lib/doc-view";
import {
  refreshAutoThumbnail,
  removeCustomThumbnail,
  setCustomThumbnail,
  ThumbnailError,
} from "@/app/lib/doc-thumbnail";

export type DocState = { error?: string; ok?: boolean; message?: string };

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
  await refreshAutoThumbnail(doc.id); // best-effort preview; never fails the upload
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
  await refreshAutoThumbnail(id); // re-render from the new content; an uploaded cover is kept
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

// ─── Preview thumbnails ──────────────────────────────────────────────────────

/** Render a document's automatic preview again from its current file. */
export async function regenerateThumbnail(formData: FormData) {
  const user = await guard();
  if (!user) throw new Error("Forbidden");

  const id = String(formData.get("id") ?? "");
  await refreshAutoThumbnail(id);
  revalidatePath("/vc-admin/documents");
  revalidatePath("/dataroom");
}

/** Upload a cover image as the preview (for HTML decks and anything else that
 *  cannot be rendered — or simply a nicer one). Kept across replacements. */
export async function uploadThumbnail(
  _prev: DocState,
  formData: FormData,
): Promise<DocState> {
  const user = await guard();
  if (!user) return { error: "Forbidden" };

  const id = String(formData.get("id") ?? "");
  const image = formData.get("image");
  if (!validFile(image)) return { error: "Choose an image." };
  const doc = await db.document.findUnique({ where: { id } });
  if (!doc) return { error: "Document not found." };

  try {
    await setCustomThumbnail(id, Buffer.from(await image.arrayBuffer()));
  } catch (e) {
    return { error: e instanceof ThumbnailError ? e.message : "Could not process that image." };
  }
  await db.adminAction.create({
    data: {
      actorUserId: user.id!,
      actorEmail: user.email!,
      action: "document.thumbnail",
      targetType: "Document",
      targetId: id,
      before: { thumbnailSource: doc.thumbnailSource },
      after: { thumbnailSource: "custom", title: doc.title },
    },
  });
  revalidatePath("/vc-admin/documents");
  revalidatePath("/dataroom");
  return { ok: true };
}

/** Drop the uploaded cover; the automatic preview takes over where possible. */
export async function removeThumbnail(formData: FormData) {
  const user = await guard();
  if (!user) throw new Error("Forbidden");

  const id = String(formData.get("id") ?? "");
  const doc = await db.document.findUnique({ where: { id } });
  if (!doc) return;

  const result = await removeCustomThumbnail(id);
  await db.adminAction.create({
    data: {
      actorUserId: user.id!,
      actorEmail: user.email!,
      action: "document.thumbnail",
      targetType: "Document",
      targetId: id,
      before: { thumbnailSource: doc.thumbnailSource },
      after: { thumbnailSource: result === "generated" ? "auto" : null, title: doc.title },
    },
  });
  revalidatePath("/vc-admin/documents");
  revalidatePath("/dataroom");
}

/** Backfill: render previews for every file that can have one and has none. */
export async function generateMissingThumbnails(
  _prev: DocState,
  _formData: FormData,
): Promise<DocState> {
  const user = await guard();
  if (!user) return { error: "Forbidden" };

  const docs = await db.document.findMany({ where: { kind: "file", thumbnailKey: null } });
  let generated = 0;
  let failed = 0;
  for (const d of docs) {
    if (!thumbnailSource(d)) continue;
    const r = await refreshAutoThumbnail(d.id);
    if (r === "generated") generated++;
    else if (r === "failed") failed++;
  }
  revalidatePath("/vc-admin/documents");
  revalidatePath("/dataroom");
  return {
    ok: true,
    message: `${generated} preview${generated === 1 ? "" : "s"} rendered${
      failed ? `, ${failed} failed (see the server log)` : ""
    }.`,
  };
}
