import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Small filesystem store for data-room binaries (signed NDA PDFs today; the
 * document repository next). Backed by a mounted volume in production and a
 * gitignored local dir in dev.
 *
 * Keys are relative POSIX-style paths under STORAGE_DIR, e.g.
 * "nda/<orgId>.pdf". Keys are resolved and guarded against traversal.
 */

const ROOT = process.env.STORAGE_DIR
  ? path.resolve(process.env.STORAGE_DIR)
  : path.join(process.cwd(), "var", "storage");

export function storageRoot(): string {
  return ROOT;
}

function resolveKey(key: string): string {
  const full = path.resolve(ROOT, key);
  const rel = path.relative(ROOT, full);
  if (rel === "" || rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`storage: invalid key "${key}"`);
  }
  return full;
}

/** Write bytes at `key` (creating parent dirs); returns the key. */
export async function putFile(key: string, data: Buffer | Uint8Array): Promise<string> {
  const full = resolveKey(key);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, data);
  return key;
}

/** Read the bytes stored at `key`. Throws if absent. */
export async function getFile(key: string): Promise<Buffer> {
  return fs.readFile(resolveKey(key));
}

/** Remove `key` if present (no error when it does not exist). */
export async function deleteFile(key: string): Promise<void> {
  await fs.rm(resolveKey(key), { force: true });
}
