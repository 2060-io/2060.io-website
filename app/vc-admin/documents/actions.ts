"use server";

import { revalidatePath } from "next/cache";
import { readUpload } from "@/app/lib/documents";
import { parseSortOrder } from "@/app/lib/document-order";
import * as svc from "@/app/lib/dataroom-service";

/**
 * Form-facing wrappers over the data-room service (app/lib/dataroom-service.ts):
 * parse the form, call the service as the signed-in user, revalidate. The
 * service checks the VC-admin role and writes the audit trail.
 */

export type DocState = { error?: string; ok?: boolean; message?: string };

function validFile(file: unknown): file is File {
  return file instanceof File && file.size > 0;
}

function refresh() {
  revalidatePath("/vc-admin/documents");
  revalidatePath("/dataroom");
}

export async function addDocument(_prev: DocState, formData: FormData): Promise<DocState> {
  const actor = await svc.webActor();
  if (!actor) return { error: "Forbidden" };

  const title = String(formData.get("title") ?? "");
  const order = parseSortOrder(formData.get("sortOrder"));
  if (!order.ok) return { error: order.error };

  let res: svc.Result;
  if (formData.get("entryKind") === "url") {
    res = await svc.asResult(
      svc.addUrlEntry(actor, { title, url: String(formData.get("url") ?? ""), sortOrder: order.value }),
    );
  } else {
    const file = formData.get("file");
    if (!validFile(file)) return { error: "Choose a file." };
    if (file.size > svc.MAX_DOCUMENT_BYTES) return { error: "File too large (50 MB max)." };
    res = await svc.asResult(
      svc.addFileDocument(actor, {
        title,
        file: await readUpload(file),
        alwaysVisible: formData.get("alwaysVisible") === "on",
        sortOrder: order.value,
      }),
    );
  }
  if (res.ok) refresh();
  return res.error ? { error: res.error } : { ok: true };
}

/** Set or clear a document's position in the lists (Order column). */
export async function setSortOrder(formData: FormData) {
  const actor = await svc.webActor();
  if (!actor) throw new Error("Forbidden");
  const order = parseSortOrder(formData.get("sortOrder"));
  if (!order.ok) return; // the field is numeric client-side; nothing to do with garbage
  const res = await svc.asResult(svc.setDocumentOrder(actor, String(formData.get("id") ?? ""), order.value));
  if (res.ok) refresh();
}

/** Flip a document between "visible to everyone" and "manually shared". */
export async function toggleAlwaysVisible(formData: FormData) {
  const actor = await svc.webActor();
  if (!actor) throw new Error("Forbidden");
  const res = await svc.asResult(svc.toggleDocumentVisibility(actor, String(formData.get("id") ?? "")));
  if (res.ok) refresh();
}

export async function replaceDocument(_prev: DocState, formData: FormData): Promise<DocState> {
  const actor = await svc.webActor();
  if (!actor) return { error: "Forbidden" };
  const file = formData.get("file");
  if (!validFile(file)) return { error: "Choose a file." };
  if (file.size > svc.MAX_DOCUMENT_BYTES) return { error: "File too large (50 MB max)." };
  const res = await svc.asResult(
    svc.replaceDocument(actor, String(formData.get("id") ?? ""), await readUpload(file)),
  );
  if (res.ok) refresh();
  return res.error ? { error: res.error } : { ok: true };
}

export async function removeDocument(formData: FormData) {
  const actor = await svc.webActor();
  if (!actor) throw new Error("Forbidden");
  const res = await svc.asResult(svc.removeDocument(actor, String(formData.get("id") ?? "")));
  if (res.ok) refresh();
}

// ─── Preview thumbnails ──────────────────────────────────────────────────────

export async function regenerateThumbnail(formData: FormData) {
  const actor = await svc.webActor();
  if (!actor) throw new Error("Forbidden");
  await svc.asResult(svc.renderDocumentPreview(actor, String(formData.get("id") ?? "")));
  refresh();
}

export async function uploadThumbnail(_prev: DocState, formData: FormData): Promise<DocState> {
  const actor = await svc.webActor();
  if (!actor) return { error: "Forbidden" };
  const image = formData.get("image");
  if (!validFile(image)) return { error: "Choose an image." };
  const res = await svc.asResult(
    svc.setDocumentCover(actor, String(formData.get("id") ?? ""), Buffer.from(await image.arrayBuffer())),
  );
  if (res.ok) refresh();
  return res.error ? { error: res.error } : { ok: true };
}

export async function removeThumbnail(formData: FormData) {
  const actor = await svc.webActor();
  if (!actor) throw new Error("Forbidden");
  const res = await svc.asResult(svc.removeDocumentCover(actor, String(formData.get("id") ?? "")));
  if (res.ok) refresh();
}

export async function generateMissingThumbnails(_prev: DocState, _formData: FormData): Promise<DocState> {
  const actor = await svc.webActor();
  if (!actor) return { error: "Forbidden" };
  const res = await svc.asResult(svc.renderMissingPreviews(actor));
  if (res.ok) refresh();
  return res.error ? { error: res.error } : { ok: true, message: res.message };
}
