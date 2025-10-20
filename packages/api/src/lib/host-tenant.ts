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
    // Strategy 0: Development fallback
    // In development, try to extract tenant from hostname even with 2 parts (e.g., ivoka.localhost)
    if (process.env.NODE_ENV === "development") {
      const parts = hostname.split(".");
      
      // Try to get tenant slug from first part of hostname
      let tenantSlug: string | null = null;
      
      if (parts.length >= 2 && parts[0] !== "localhost") {
        // Has subdomain like "ivoka.localhost"
        tenantSlug = parts[0];
      } else if (parts.length === 1 && parts[0] === "localhost") {
        // Plain "localhost" - use default fallback tenant
        tenantSlug = "innotecnia";
      }
      
      if (tenantSlug && !["www", "api", "admin", "cdn", "static"].includes(tenantSlug)) {
        const devTenant = await prisma.tenant.findUnique({
          where: { slug: tenantSlug }
        });

        if (devTenant) {
          const devBrand = await prisma.brand.findFirst({
            where: {
              tenantId: devTenant.id,
              slug: devTenant.slug
            }
          });

          return {
            tenant: devTenant,
            brand: devBrand,
            source: "fallback"
          };
        }
      }
    }

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
 * Handles both development (localhost) and production environments
 */
export function getBrandCanonicalUrl(brand: Brand & { tenant: Tenant }): string {
  // Prefer custom domain
  if (Array.isArray(brand.domains) && brand.domains.length > 0) {
    const domain = brand.domains[0];
    // Check if domain includes localhost (development)
    const protocol = domain.includes('localhost') ? 'http' : 'https';
    return `${protocol}://${domain}`;
  }

  // Fallback to subdomain pattern using tenant slug
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "localhost:3000";
  const protocol = baseDomain.includes('localhost') ? 'http' : 'https';
  
  // Validate tenant exists
  if (!brand.tenant || !brand.tenant.slug) {
    console.error("[host-tenant] ERROR: Brand has no tenant or tenant.slug!", {
      brandId: brand.id,
      tenant: brand.tenant
    });
    // Fallback to localhost without subdomain
    return `${protocol}://${baseDomain}`;
  }
  
  // Use tenant slug as subdomain (not brand slug)
  return `${protocol}://${brand.tenant.slug}.${baseDomain}`;
}

/**
 * Build pool URL for a given brand and pool slug
 * Includes locale in the path
 */
export function buildPoolUrl(
  brand: Brand & { tenant: Tenant }, 
  poolSlug: string,
  locale: string = 'es-MX'
): string {
  const baseUrl = getBrandCanonicalUrl(brand);
  return `${baseUrl}/${locale}/pools/${poolSlug}`;
}

/**
 * Build invitation URL for a given brand, pool, and token
 */
export function buildInvitationUrl(
  brand: Brand & { tenant: Tenant },
  poolSlug: string,
  token: string,
  locale: string = 'es-MX'
): string {
  const baseUrl = getBrandCanonicalUrl(brand);
  return `${baseUrl}/${locale}/auth/register/${poolSlug}?token=${token}`;
}

/**
 * Build auth callback URL for a given brand
 * Used for magic link authentication
 */
export function buildAuthCallbackUrl(
  brand: Brand & { tenant: Tenant },
  locale: string = 'es-MX'
): string {
  const baseUrl = getBrandCanonicalUrl(brand);
  return `${baseUrl}/${locale}/auth/callback`;
}
