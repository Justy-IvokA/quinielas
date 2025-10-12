import { prisma } from "@qp/db";
import type { Tenant, Brand } from "@qp/db";

export interface TenantBrandResolution {
  tenant: Tenant | null;
  brand: Brand | null;
  source: "domain" | "subdomain" | "path" | "fallback" | "none";
}

/**
 * Parse hostname to extract tenant slug from subdomain
 * Examples:
 * - cemex.quinielas.mx → "cemex"
 * - demo.quinielas.app → "demo"
 * - localhost → null
 */
export function extractTenantFromSubdomain(hostname: string): string | null {
  // Skip localhost and IP addresses
  if (hostname === "localhost" || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return null;
  }

  const parts = hostname.split(".");
  
  // Need at least 3 parts for subdomain (e.g., tenant.quinielas.mx)
  if (parts.length < 3) {
    return null;
  }

  // First part is the tenant slug
  const tenantSlug = parts[0];
  
  // Validate it's not www or common subdomains
  if (["www", "api", "admin", "cdn", "static"].includes(tenantSlug)) {
    return null;
  }

  return tenantSlug;
}

/**
 * Resolve tenant and brand from request hostname
 * Priority:
 * 1. Custom domain (exact match in Brand.domains)
 * 2. Subdomain pattern (tenant.quinielas.mx)
 * 3. Path segments (fallback for multi-tenant on single domain)
 * 4. Development fallback (demo tenant)
 */
export async function resolveTenantAndBrandFromHost(
  hostname: string,
  pathname?: string
): Promise<TenantBrandResolution> {
  try {
    // Strategy 1: Try custom domain lookup
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
        brand: brandByDomain,
        source: "domain"
      };
    }

    // Strategy 2: Try subdomain extraction
    const tenantSlug = extractTenantFromSubdomain(hostname);
    if (tenantSlug) {
      const tenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlug }
      });

      if (tenant) {
        // Get default brand for this tenant
        const brand = await prisma.brand.findFirst({
          where: {
            tenantId: tenant.id,
            slug: "default"
          }
        });

        return {
          tenant,
          brand,
          source: "subdomain"
        };
      }
    }

    // Strategy 3: Try path-based resolution (e.g., /tenant/brand/...)
    if (pathname) {
      const pathSegments = pathname.split("/").filter(Boolean);
      
      // Skip locale segment if present (e.g., /es-MX/...)
      const startIdx = pathSegments[0]?.match(/^[a-z]{2}-[A-Z]{2}$/) ? 1 : 0;
      
      if (pathSegments.length >= startIdx + 2) {
        const [tenantSlugPath, brandSlugPath] = pathSegments.slice(startIdx, startIdx + 2);

        const brand = await prisma.brand.findFirst({
          where: {
            slug: brandSlugPath,
            tenant: {
              slug: tenantSlugPath
            }
          },
          include: {
            tenant: true
          }
        });

        if (brand) {
          return {
            tenant: brand.tenant,
            brand,
            source: "path"
          };
        }
      }
    }

    // Strategy 4: Development fallback
    if (process.env.NODE_ENV === "development") {
      const demoTenant = await prisma.tenant.findUnique({
        where: { slug: "ivoka" }
      });

      if (demoTenant) {
        const demoBrand = await prisma.brand.findFirst({
          where: {
            tenantId: demoTenant.id,
            slug: "ivoka"
          }
        });

        return {
          tenant: demoTenant,
          brand: demoBrand,
          source: "fallback"
        };
      }
    }
  } catch (error) {
    console.error("[host-tenant] Error resolving tenant/brand:", error);
  }

  return {
    tenant: null,
    brand: null,
    source: "none"
  };
}

/**
 * Get canonical URL for a brand
 * Uses first domain in Brand.domains array or constructs subdomain URL
 */
export function getBrandCanonicalUrl(brand: Brand & { tenant: Tenant }): string {
  // Prefer custom domain
  if (brand.domains && brand.domains.length > 0) {
    return `https://${brand.domains[0]}`;
  }

  // Fallback to subdomain pattern
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "quinielas.mx";
  return `https://${brand.tenant.slug}.${baseDomain}`;
}

/**
 * Build pool URL for a given brand and pool slug
 */
export function buildPoolUrl(brand: Brand & { tenant: Tenant }, poolSlug: string): string {
  const baseUrl = getBrandCanonicalUrl(brand);
  return `${baseUrl}/${poolSlug}`;
}
