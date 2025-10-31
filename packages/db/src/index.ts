// packages/db/src/index.ts
import { PrismaClient } from '@prisma/client';

// ✅ Singleton pattern para evitar múltiples instancias
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

export { prisma } from "./client";
export * from "@prisma/client";
export { Prisma } from "@prisma/client";
export type { PrismaClient } from "@prisma/client";

// User metadata types
export * from "./types/user-metadata";
