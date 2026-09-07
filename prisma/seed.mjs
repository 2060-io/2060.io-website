// One-time bootstrap: seed the data-room admin allowlist from
// ADMIN_BOOTSTRAP_EMAILS (comma-separated). Idempotent (upsert), so re-running
// never removes admins added later in /admin — it only guarantees the
// bootstrap emails are present. Run: `npm run db:seed`.
import { PrismaClient } from "@prisma/client";

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

await db.$disconnect();
