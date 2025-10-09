import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { z } from "zod";
import { prisma } from "@qp/db";
import type { Tenant, Brand, PrismaClient } from "@qp/db";

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

// Session type (placeholder for Auth.js integration)
export interface Session {
  user: {
    id: string;
    email: string;
    name?: string | null;
  };
}

export interface AppContext {
  prisma: PrismaClient;
  env: Env;
  tenant: Tenant | null;
  brand: Brand | null;
  session: Session | null;
  req?: Request;
}

/**
 * Resolve tenant and brand from request
 * Priority: host domain > path segment > default
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
    const hostname = url.hostname;

    // Try to find brand by domain
    const brandByDomain = await prisma.brand.findFirst({
      where: {
        domains: {
          has: hostname
        }
      },
      include: {
        tenant: true
      }
    });

    if (brandByDomain) {
      return {
        tenant: brandByDomain.tenant,
        brand: brandByDomain
      };
    }

    // Try to extract from path: /[tenantSlug]/[brandSlug]/...
    const pathSegments = url.pathname.split("/").filter(Boolean);
    if (pathSegments.length >= 2) {
      const [tenantSlug, brandSlug] = pathSegments;

      const brand = await prisma.brand.findFirst({
        where: {
          slug: brandSlug,
          tenant: {
            slug: tenantSlug
          }
        },
        include: {
          tenant: true
        }
      });

      if (brand) {
        return {
          tenant: brand.tenant,
          brand
        };
      }
    }

    // Fallback: try to get demo tenant for development
    if (env.NODE_ENV === "development") {
      const demoTenant = await prisma.tenant.findUnique({
        where: { slug: "demo" }
      });

      if (demoTenant) {
        const demoBrand = await prisma.brand.findFirst({
          where: {
            tenantId: demoTenant.id,
            slug: "default"
          }
        });

        return {
          tenant: demoTenant,
          brand: demoBrand
        };
      }
    }
  } catch (error) {
    console.error("Error resolving tenant/brand:", error);
  }

  return { tenant: null, brand: null };
}

/**
 * Create tRPC context
 */
export const createContext = async (opts?: FetchCreateContextFnOptions): Promise<AppContext> => {
  const req = opts?.req;

  // Resolve tenant and brand
  const { tenant, brand } = await resolveTenantAndBrand(req);

  // TODO: Get session from Auth.js
  const session: Session | null = null;

  return {
    prisma,
    env,
    tenant,
    brand,
    session,
    req
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
  ...overrides
});
