/**
 * Brand Context Utilities for Server Components
 * 
 * Provides functions to extract brand information from request headers
 * and fetch brand data from the database.
 */

import { headers } from "next/headers";
import { prisma as db } from "@qp/db";
import type { Brand } from "@qp/db";

/**
 * Gets brand slug from request headers (set by middleware)
 * 
 * @returns Brand slug or null if base domain
 */
export async function getBrandSlug(): Promise<string | null> {
  const headersList = await headers();
  return headersList.get("x-brand-slug");
}

/**
 * Gets full hostname from request headers
 */
export async function getBrandHostname(): Promise<string> {
  const headersList = await headers();
  return headersList.get("x-brand-hostname") || "localhost:3000";
}

/**
 * Checks if current request is for a brand subdomain
 */
export async function isBrandSubdomain(): Promise<boolean> {
  const headersList = await headers();
  const isSubdomain = headersList.get("x-brand-is-subdomain");
  return isSubdomain === "true";
}

/**
 * Fetches brand data from database by slug
 * 
 * @param slug - Brand slug to fetch
 * @returns Brand data or null if not found
 */
export async function getBrandBySlug(slug: string): Promise<Brand | null> {
  try {
    const brand = await db.brand.findFirst({
      where: { slug },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
    
    return brand;
  } catch (error) {
    console.error(`[brandContext] Error fetching brand "${slug}":`, error);
    return null;
  }
}

/**
 * Fetches brand data from database by domain
 * 
 * Matches against the brand's configured domains array.
 * 
 * @param hostname - Full hostname to match
 * @returns Brand data or null if not found
 */
export async function getBrandByDomain(hostname: string): Promise<Brand | null> {
  try {
    // Remove port for matching
    const [host] = hostname.split(":");
    
    const brand = await db.brand.findFirst({
      where: {
        domains: {
          has: host,
        },
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
    
    return brand;
  } catch (error) {
    console.error(`[brandContext] Error fetching brand by domain "${hostname}":`, error);
    return null;
  }
}

/**
 * Gets current brand from request context
 * 
 * This is the main function to use in layouts/pages.
 * It extracts the brand slug from headers and fetches the brand data.
 * 
 * @returns Brand data or null if base domain or brand not found
 */
export async function getCurrentBrand(): Promise<Brand | null> {
  const slug = await getBrandSlug();
  
  if (!slug) {
    return null;
  }
  
  return getBrandBySlug(slug);
}

/**
 * Gets current brand or throws error if not found
 * 
 * Use this in pages that require a brand context.
 */
export async function requireBrand(): Promise<Brand> {
  const brand = await getCurrentBrand();
  
  if (!brand) {
    throw new Error("Brand context required but not found");
  }
  
  return brand;
}
