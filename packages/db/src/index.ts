// packages/db/src/index.ts
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

// ✅ Singleton pattern para evitar múltiples instancias
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<PrismaClient['$extends']> | undefined;
};

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  }).$extends(withAccelerate());
};

export const db = (globalForPrisma.prisma ?? prismaClientSingleton()) as ReturnType<typeof prismaClientSingleton>;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

export { prisma } from "./client";
export * from '@prisma/client';
export type { PrismaClient } from "@prisma/client";

// User metadata types
export * from "./types/user-metadata";