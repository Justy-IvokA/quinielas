/**
 * Validates callback URLs to prevent open redirect vulnerabilities
 * Only allows URLs from the same tenant's domains
 */

import { prisma } from "@qp/db";

/**
 * Check if a URL is safe to redirect to
 * @param callbackUrl - The URL to validate
 * @param tenantId - Current tenant ID
 * @returns true if safe, false otherwise
 */
export async function isCallbackUrlSafe(
  callbackUrl: string | null | undefined,
  tenantId: string | null
): Promise<boolean> {
  if (!callbackUrl) return true;

  // Check if it's a relative URL (starts with /)
  if (callbackUrl.startsWith("/")) {
    // Relative URLs are always safe (same origin)
    return true;
  }

  try {
    const url = new URL(callbackUrl);

    // Allow localhost in development
    if (
      process.env.NODE_ENV === "development" &&
      (url.hostname === "localhost" || 
       url.hostname === "127.0.0.1" ||
       url.hostname.endsWith(".localhost"))
    ) {
      return true;
    }

    // If no tenant, only allow same origin
    if (!tenantId) {
      return url.origin === process.env.NEXTAUTH_URL;
    }

    // Get tenant's allowed domains from brands
    const brands = await prisma.brand.findMany({
      where: { tenantId },
      select: { domains: true },
    });

    const allowedDomains = brands.flatMap((b) => b.domains);

    // Check if callback URL hostname matches any allowed domain
    return allowedDomains.some((domain) => {
      // Exact match
      if (url.hostname === domain) return true;
      // Subdomain match (e.g., www.example.com matches example.com)
      if (url.hostname.endsWith(`.${domain}`)) return true;
      return false;
    });
  } catch (error) {
    // Invalid URL format
    return false;
  }
}

/**
 * Sanitize callback URL or return default
 * @param callbackUrl - The URL to sanitize
 * @param tenantId - Current tenant ID
 * @param defaultUrl - Fallback URL if callback is unsafe
 * @returns Safe callback URL
 */
export async function sanitizeCallbackUrl(
  callbackUrl: string | null | undefined,
  tenantId: string | null,
  defaultUrl: string = "/"
): Promise<string> {
  const isSafe = await isCallbackUrlSafe(callbackUrl, tenantId);
  return isSafe && callbackUrl ? callbackUrl : defaultUrl;
}
