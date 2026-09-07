import { defineConfig } from "prisma/config";

// Prisma stops auto-loading .env files once a config file is present, so load
// them here for local CLI commands (migrate/seed). .env.local takes precedence
// (Next convention); missing files are ignored. In production DATABASE_URL is
// already in the environment and these files are absent (no-op).
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // file absent — ignore
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "node prisma/seed.mjs",
  },
});
