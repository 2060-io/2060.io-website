import { db } from "@/app/lib/db";
import { putFile } from "@/app/lib/storage";

/** Keep the original name readable but safe as a storage-key segment. */
export function safeFilename(name: string): string {
  const cleaned = name.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^[.-]+/, "");
  return (cleaned || "file").slice(0, 120);
}

export function documentKey(docId: string, version: number, filename: string): string {
  return `documents/${docId}/v${version}-${safeFilename(filename)}`;
}

export type UploadedFile = {
  filename: string;
  contentType: string;
  bytes: Buffer;
};

/** Read a form-upload File into the shape the repository stores. */
export async function readUpload(file: File): Promise<UploadedFile> {
  return {
    filename: file.name || "document",
    contentType: file.type || "application/octet-stream",
    bytes: Buffer.from(await file.arrayBuffer()),
  };
}

/** Create a new document (version 1) and store its content. */
export async function createDocument(opts: {
  title: string;
  file: UploadedFile;
  updatedBy: string;
}) {
  const doc = await db.document.create({
    data: {
      title: opts.title,
      filename: opts.file.filename,
      contentType: opts.file.contentType,
      size: opts.file.bytes.length,
      storageKey: "", // set below, once the id exists
      updatedBy: opts.updatedBy,
    },
  });
  const key = documentKey(doc.id, 1, opts.file.filename);
  await putFile(key, opts.file.bytes);
  return db.document.update({ where: { id: doc.id }, data: { storageKey: key } });
}

/**
 * Replace a document's content under the same id: bump the version, write the
 * new file, repoint the row. Grants and download history are untouched; the
 * previous file stays on the volume for audit.
 */
export async function replaceDocumentContent(opts: {
  documentId: string;
  file: UploadedFile;
  updatedBy: string;
}) {
  const doc = await db.document.findUnique({ where: { id: opts.documentId } });
  if (!doc) throw new Error("Document not found.");
  const version = doc.version + 1;
  const key = documentKey(doc.id, version, opts.file.filename);
  await putFile(key, opts.file.bytes);
  return db.document.update({
    where: { id: doc.id },
    data: {
      version,
      storageKey: key,
      filename: opts.file.filename,
      contentType: opts.file.contentType,
      size: opts.file.bytes.length,
      updatedBy: opts.updatedBy,
    },
  });
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
