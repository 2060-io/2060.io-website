import { PrismaClient } from "@prisma/client";

// Single Prisma client across HMR reloads in dev (Next recompiles modules on
// every change; without this we'd leak connections). In production a fresh
// module graph per process means one client per pod.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
