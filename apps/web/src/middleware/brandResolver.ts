import { NextRequest } from "next/server";

/**
 * Brand Resolution Middleware Utilities
 * 
 * Extracts brand information from request hostname and attaches it
 * to the request for downstream consumption.
 */
/**
 * Domain/Subdomain Resolution for Multi-tenant Branding
 * 
 * Extracts brand identifier from hostname and provides utilities
 * for resolving brands in a multi-tenant environment.
 */

export interface DomainInfo {
  /** Full hostname (e.g., "cocacola.localhost:3000") */
  hostname: string;
  /** Subdomain extracted (e.g., "cocacola") or null if base domain */
  subdomain: string | null;
  /** Base domain (e.g., "localhost") */
  baseDomain: string;
  /** Port if present (e.g., "3000") */
  port: string | null;
  /** Whether this is a subdomain request */
  isSubdomain: boolean;
}
/**
 * Extracts domain information from a hostname string
 * 
 * Examples:
 * - "cocacola.localhost:3000" → { subdomain: "cocacola", baseDomain: "localhost", port: "3000" }
 * - "localhost:3000" → { subdomain: null, baseDomain: "localhost", port: "3000" }
 * - "brand.example.com" → { subdomain: "brand", baseDomain: "example.com", port: null }
 * - "example.com" → { subdomain: null, baseDomain: "example.com", port: null }
 */
export function parseDomain(hostname: string): DomainInfo {
  // Remove port if present
  const [host, port] = hostname.split(":");
  
  // Split by dots
  const parts = host.split(".");
  
  // Determine if this is a subdomain
  // For localhost: subdomain.localhost (2 parts = subdomain)
  // For regular domains: subdomain.example.com (3+ parts = subdomain)
  let subdomain: string | null = null;
  let baseDomain: string;
  let isSubdomain = false;

  if (parts.length === 1) {
    // Just "localhost" or "example"
    baseDomain = parts[0];
  } else if (parts.length === 2) {
    // Could be "subdomain.localhost" or "example.com"
    if (parts[1] === "localhost") {
      // subdomain.localhost
      subdomain = parts[0];
      baseDomain = parts[1];
      isSubdomain = true;
    } else {
      // example.com (no subdomain)
      baseDomain = host;
    }
  } else {
    // 3+ parts: subdomain.example.com or subdomain.example.co.uk
    // Take first part as subdomain, rest as base domain
    subdomain = parts[0];
    baseDomain = parts.slice(1).join(".");
    isSubdomain = true;
  }

  return {
    hostname,
    subdomain,
    baseDomain,
    port: port || null,
    isSubdomain,
  };
}

/**
 * Extracts brand slug from hostname
 * 
 * This is a convenience function that returns the subdomain
 * which typically corresponds to the brand slug.
 * 
 * @param hostname - The request hostname
 * @returns Brand slug (subdomain) or null if base domain
 */
export function extractBrandSlug(hostname: string): string | null {
  const { subdomain } = parseDomain(hostname);
  return subdomain;
}


export interface BrandContext {
  /** Brand slug extracted from hostname (subdomain) */
  slug: string | null;
  /** Full hostname */
  hostname: string;
  /** Whether this is a subdomain request */
  isSubdomain: boolean;
  /** Base domain */
  baseDomain: string;
}

/**
 * Extracts brand context from Next.js request
 * 
 * This runs in middleware and provides brand information
 * that can be used for routing, theming, and data filtering.
 */
export function extractBrandContext(request: NextRequest): BrandContext {
  // Get hostname from request headers
  const hostname = request.headers.get("host") || "localhost:3000";
  
  // Parse domain information
  const domainInfo = parseDomain(hostname);
  
  return {
    slug: domainInfo.subdomain,
    hostname,
    isSubdomain: domainInfo.isSubdomain,
    baseDomain: domainInfo.baseDomain,
  };
}

/**
 * Checks if the request is for a specific brand (has subdomain)
 */
export function isBrandRequest(request: NextRequest): boolean {
  const context = extractBrandContext(request);
  return context.isSubdomain && context.slug !== null;
}

/**
 * Gets brand slug from request, or null if base domain
 */
export function getBrandSlugFromRequest(request: NextRequest): string | null {
  const hostname = request.headers.get("host") || "localhost:3000";
  return extractBrandSlug(hostname);
}
