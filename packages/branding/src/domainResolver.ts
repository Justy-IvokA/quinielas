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
 * Checks if a hostname matches a brand's configured domains
 * 
 * @param hostname - The request hostname (e.g., "cocacola.localhost")
 * @param brandDomains - Array of domains configured for the brand
 * @returns true if hostname matches any of the brand's domains
 */
export function matchesBrandDomain(
  hostname: string,
  brandDomains: string[]
): boolean {
  // Remove port for comparison
  const [host] = hostname.split(":");
  
  return brandDomains.some((domain) => {
    // Exact match
    if (host === domain) return true;
    
    // Wildcard subdomain match (*.example.com)
    if (domain.startsWith("*.")) {
      const baseDomain = domain.slice(2); // Remove "*."
      return host.endsWith(`.${baseDomain}`) || host === baseDomain;
    }
    
    return false;
  });
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

/**
 * Builds a branded URL with the given brand slug
 * 
 * @param brandSlug - The brand slug to use as subdomain
 * @param baseDomain - The base domain (default: from env or "localhost")
 * @param path - Optional path to append
 * @returns Full URL with brand subdomain
 */
export function buildBrandUrl(
  brandSlug: string,
  baseDomain: string = "localhost:3000",
  path: string = ""
): string {
  const protocol = baseDomain.includes("localhost") ? "http" : "https";
  const url = `${protocol}://${brandSlug}.${baseDomain}${path}`;
  return url;
}
