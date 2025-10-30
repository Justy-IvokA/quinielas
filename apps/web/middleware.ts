import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

import { locales, defaultLocale } from "./src/i18n/config";
import { extractBrandContext } from "./src/middleware/brandResolver";

/**
 * i18n Middleware
 * 
 * Handles locale detection and routing for the application.
 * - Detects locale from URL path, cookies, or Accept-Language header
 * - Redirects to localized URLs (e.g., /es-MX/register)
 * - Sets locale cookie for persistence
 */
const intlMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale,

  // Prefix strategy: always show locale in URL
  localePrefix: "always",
});

/**
 * Combined Middleware: Brand Detection + i18n
 * 
 * 1. Extracts brand context from hostname (subdomain)
 * 2. Adds brand info to request headers for downstream use
 * 3. Applies i18n routing
 */
export default function middleware(request: NextRequest) {
  // Extract brand context from hostname
  const brandContext = extractBrandContext(request);
  
  // Run i18n middleware first
  const response = intlMiddleware(request);
  
  // Add brand context to response headers for server components
  // These headers can be read in layouts/pages to fetch brand data
  if (brandContext.slug) {
    response.headers.set("x-brand-slug", brandContext.slug);
  }
  response.headers.set("x-brand-hostname", brandContext.hostname);
  response.headers.set("x-brand-is-subdomain", brandContext.isSubdomain.toString());
  
  return response;
}

export const config = {
  // Match all pathnames except for:
  // - API routes
  // - Static files (_next/static)
  // - Image optimization files (_next/image)
  // - Favicon and other public files
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
