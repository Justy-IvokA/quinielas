import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { z } from "zod";
import { prisma } from "@qp/db";
import type { Tenant, Brand, PrismaClient } from "@qp/db";
import { createAuthConfig, createAuthInstance } from "@qp/auth";
import type { Session } from "@qp/auth";

// Environment schema
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  SPORTS_API_PROVIDER: z.enum(["mock", "api-football", "sportmonks"]).default("mock"),
  SPORTS_API_KEY: z.string().optional(),
  EMAIL_PROVIDER: z.enum(["mock", "smtp"]).default("mock"),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().optional()
});

export type Env = z.infer<typeof envSchema>;

// Parse and validate environment variables
export const env = envSchema.parse(process.env);

// Auth config (reusable)
export const authConfig = createAuthConfig({ prisma });

export interface AppContext {
  prisma: PrismaClient;
  env: Env;
  tenant: Tenant | null;
  brand: Brand | null;
  session: Session | null;
  req?: Request;
  ip: string | null;
  userAgent: string | null;
}

/**
 * Resolve tenant and brand from request
 * Uses the robust host-based resolution strategy
 */
async function resolveTenantAndBrand(req?: Request): Promise<{
  tenant: Tenant | null;
  brand: Brand | null;
}> {
  if (!req) {
    return { tenant: null, brand: null };
  }

  try {
    const url = new URL(req.url);
    const { resolveTenantAndBrandFromHost } = await import("./lib/host-tenant");
    
    const result = await resolveTenantAndBrandFromHost(url.hostname, url.pathname);
    
    return {
      tenant: result.tenant,
      brand: result.brand
    };
  } catch (error) {
    console.error("[context] Error resolving tenant/brand:", error);
    return { tenant: null, brand: null };
  }
}

/**
 * Extract IP address from request headers
 */
function getIpAddress(req?: Request): string | null {
  if (!req) return null;
  
  // Check common proxy headers
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Fallback to connection info (may not be available in all environments)
  return null;
}

/**
 * Extract user agent from request headers
 */
function getUserAgent(req?: Request): string | null {
  if (!req) return null;
  return req.headers.get('user-agent');
}

/**
 * Create tRPC context
 */
export const createContext = async (opts?: FetchCreateContextFnOptions): Promise<AppContext> => {
  const req = opts?.req;

  // Get session from Auth.js
  const auth = createAuthInstance(authConfig);
  const session = await auth();

  // Resolve tenant and brand
  const { tenant, brand } = await resolveTenantAndBrand(req);

  return {
    prisma,
    env,
    tenant,
    brand,
    session,
    req,
    ip: getIpAddress(req),
    userAgent: getUserAgent(req)
  };
};

/**
 * Create caller for testing (without HTTP context)
 */
export const createTestContext = (overrides?: Partial<AppContext>): AppContext => ({
  prisma,
  env,
  tenant: null,
  brand: null,
  session: null,
  req: undefined,
  ip: null,
  userAgent: null,
  ...overrides
});
