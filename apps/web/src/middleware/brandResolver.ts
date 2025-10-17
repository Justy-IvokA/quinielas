/**
 * Brand Resolution Middleware Utilities
 * 
 * Extracts brand information from request hostname and attaches it
 * to the request for downstream consumption.
 */

import { NextRequest } from "next/server";
import { parseDomain, extractBrandSlug } from "@qp/branding";

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
