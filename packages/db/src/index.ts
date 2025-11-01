import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';

// ✅ Singleton pattern para evitar múltiples instancias
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<PrismaClient['$extends']> | undefined;
};

// ✅ En runtime, usar Accelerate si está disponible
const getDatabaseUrl = () => {
  // En producción (Vercel), usar Accelerate
  if (process.env.NODE_ENV === 'production') {
    return process.env.DATABASE_URL;
  }
  
  // En desarrollo, usar URL directo
  return process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
};

export const db = globalForPrisma.prisma ?? 
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
  }).$extends(withAccelerate());

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

export { prisma } from "./client";
export * from '@prisma/client';
export type { PrismaClient } from "@prisma/client";

// User metadata types
export * from "./types/user-metadata";