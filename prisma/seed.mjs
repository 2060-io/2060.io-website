// One-time bootstrap: seed the data-room admin allowlist from
// ADMIN_BOOTSTRAP_EMAILS (comma-separated). Idempotent (upsert), so re-running
// never removes admins added later in /admin — it only guarantees the
// bootstrap emails are present. Run: `npm run db:seed`.
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// Run directly via `node`, so load local env ourselves (the Prisma CLI loads it
// via prisma.config.ts, but `node prisma/seed.mjs` doesn't). In the cluster,
// env comes from the Job and these files are absent (no-op).
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // file absent — ignore
  }
}

const db = new PrismaClient();

const emails = (process.env.ADMIN_BOOTSTRAP_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

for (const email of emails) {
  await db.adminAllowlistEntry.upsert({
    where: { email },
    update: {},
    create: { email },
  });
}

console.log(
  `Seeded ${emails.length} admin allowlist entr${emails.length === 1 ? "y" : "ies"}.`,
);

// Activate an NDA version file from legal/ (admins can switch versions in
// /admin/nda). Pins the file's sha384 on first activation; never re-pins a
// changed file (that would defeat the integrity guarantee).
const ndaFile = process.env.NDA_FILENAME ?? "nda-v1.md";
try {
  const content = readFileSync(path.join(process.cwd(), "legal", ndaFile), "utf8");
  const hash = "sha384-" + crypto.createHash("sha384").update(content, "utf8").digest("base64");
  const version = ndaFile.replace(/\.md$/i, "").match(/v\d+[a-z0-9.]*/i)?.[0] ?? ndaFile;
  const existing = await db.ndaDocument.findUnique({ where: { filename: ndaFile } });
  if (existing && existing.hash !== hash) {
    console.warn(`Skipped activating ${ndaFile}: file changed since it was pinned.`);
  } else {
    await db.ndaDocument.updateMany({ where: { active: true }, data: { active: false } });
    await db.ndaDocument.upsert({
      where: { filename: ndaFile },
      update: { active: true },
      create: { filename: ndaFile, version, hash, active: true },
    });
    console.log(`Activated NDA ${version} (${ndaFile}).`);
  }
} catch (e) {
  console.warn(`Could not seed NDA from ${ndaFile}:`, e.message);
}

await db.$disconnect();
