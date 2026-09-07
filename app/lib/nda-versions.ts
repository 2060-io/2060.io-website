import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { db } from "@/app/lib/db";

/**
 * NDA version management (ported from the veranafoundation.org agreement
 * machinery). The legal/ directory is the source of truth: one Markdown
 * template file per version, added (never edited) for each new version. The DB
 * (NdaDocument) is a catalog that pins each filename to the sha384 it had when
 * first activated, so a version can never silently change.
 */

const LEGAL_DIR = path.join(process.cwd(), "legal");

export type VersionStatus = "active" | "ok" | "new" | "modified" | "missing";

export type VersionEntry = {
  filename: string;
  version: string;
  /** sha384 (SRI form) of the file as it is on disk right now, or null if missing. */
  currentHash: string | null;
  /** sha384 pinned in the catalog at first activation, or null if never activated. */
  pinnedHash: string | null;
  active: boolean;
  status: VersionStatus;
  /** May this file be made the active version? */
  selectable: boolean;
};

/** sha384 of `content` in Subresource-Integrity form, e.g. "sha384-AbC…". */
export function sha384(content: string | Buffer): string {
  return "sha384-" + crypto.createHash("sha384").update(content).digest("base64");
}

/** Derive a short version label from a filename ("…-v2.md" → "v2"). */
export function versionLabel(filename: string): string {
  const base = filename.replace(/\.md$/i, "");
  return base.match(/v\d+[a-z0-9.]*/i)?.[0] ?? base;
}

/** Names of all version files in legal/ (whitelist: *.md, no subpaths). */
export async function listVersionFiles(): Promise<string[]> {
  const entries = await fs.readdir(LEGAL_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".md"))
    .map((e) => e.name)
    .sort();
}

/** Read a version file by name, guarding against anything outside legal/*.md. */
export async function readVersionFile(filename: string): Promise<string> {
  if (!/^[A-Za-z0-9._-]+\.md$/.test(filename)) {
    throw new Error(`nda-versions: invalid filename "${filename}"`);
  }
  const full = path.join(LEGAL_DIR, filename);
  if (path.dirname(full) !== LEGAL_DIR) {
    throw new Error(`nda-versions: invalid filename "${filename}"`);
  }
  return fs.readFile(full, "utf8");
}

async function hashOf(filename: string): Promise<string | null> {
  try {
    return sha384(await readVersionFile(filename));
  } catch {
    return null;
  }
}

/** The active version (catalog row), or null if none is configured. */
export async function getActiveVersion() {
  return db.ndaDocument.findFirst({ where: { active: true } });
}

export type ActiveNda = {
  id: string;
  version: string;
  filename: string;
  content: string;
  pinnedHash: string;
  currentHash: string | null;
  /** The on-disk file still matches the hash pinned at activation. */
  intact: boolean;
};

/**
 * Load the active version's file content and verify it against the pinned hash.
 * Returns null when no active version is configured. `intact` is false when the
 * file is missing or was modified since activation — callers must not sign then.
 */
export async function loadActiveNda(): Promise<ActiveNda | null> {
  const active = await getActiveVersion();
  if (!active) return null;
  let content = "";
  let currentHash: string | null = null;
  try {
    content = await readVersionFile(active.filename);
    currentHash = sha384(content);
  } catch {
    /* file missing — intact stays false */
  }
  return {
    id: active.id,
    version: active.version,
    filename: active.filename,
    content,
    pinnedHash: active.hash,
    currentHash,
    intact: currentHash !== null && currentHash === active.hash,
  };
}

/**
 * Catalog of every version file in legal/ joined with the DB pins, with the
 * activation rule applied. Files modified since activation (hash mismatch) or
 * missing are not selectable.
 */
export async function listVersions(): Promise<VersionEntry[]> {
  const [files, rows] = await Promise.all([
    listVersionFiles(),
    db.ndaDocument.findMany(),
  ]);
  const byName = new Map(rows.map((r) => [r.filename, r]));
  const names = new Set<string>([...files, ...rows.map((r) => r.filename)]);

  const out: VersionEntry[] = [];
  for (const filename of [...names].sort()) {
    const onDisk = files.includes(filename);
    const row = byName.get(filename) ?? null;
    const currentHash = onDisk ? await hashOf(filename) : null;
    const pinnedHash = row?.hash ?? null;
    const active = !!row?.active;

    let status: VersionStatus;
    let selectable: boolean;
    if (!onDisk) {
      status = "missing";
      selectable = false;
    } else if (active) {
      status = "active";
      selectable = false; // already active
    } else if (!pinnedHash) {
      status = "new";
      selectable = true;
    } else if (currentHash === pinnedHash) {
      status = "ok";
      selectable = true;
    } else {
      status = "modified";
      selectable = false;
    }

    out.push({
      filename,
      version: versionLabel(filename),
      currentHash,
      pinnedHash,
      active,
      status,
      selectable,
    });
  }
  return out;
}

export type ActivateResult = { ok: true } | { ok: false; error: string };

/**
 * Make `filename` the active version. Enforces the pinned-hash rule server-side:
 * a previously-activated file may only be re-activated if it still matches its
 * pinned hash; a new file pins its current hash. Returns an error string instead
 * of throwing so the caller (admin action) can surface it.
 */
export async function activateVersion(filename: string): Promise<ActivateResult> {
  const files = await listVersionFiles();
  if (!files.includes(filename)) return { ok: false, error: "Unknown version file." };

  const content = await readVersionFile(filename);
  const currentHash = sha384(content);
  const existing = await db.ndaDocument.findUnique({ where: { filename } });

  if (existing && existing.hash !== currentHash) {
    return {
      ok: false,
      error:
        "This file was modified since it was last a published version. Add a new " +
        "version file instead of editing a pinned one.",
    };
  }

  await db.$transaction([
    db.ndaDocument.updateMany({ where: { active: true }, data: { active: false } }),
    existing
      ? db.ndaDocument.update({
          where: { filename },
          data: { active: true, effectiveFrom: new Date() },
        })
      : db.ndaDocument.create({
          data: {
            filename,
            version: versionLabel(filename),
            hash: currentHash,
            active: true,
          },
        }),
  ]);

  return { ok: true };
}
