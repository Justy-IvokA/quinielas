import createMiddleware from "next-intl/middleware";

import { locales, defaultLocale } from "@web/i18n/config";

/**
 * i18n Middleware
 * 
 * Handles locale detection and routing for the application.
 * - Detects locale from URL path, cookies, or Accept-Language header
 * - Redirects to localized URLs (e.g., /es-MX/register)
 * - Sets locale cookie for persistence
 */
export default createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale,

  // Prefix strategy: always show locale in URL
  localePrefix: "always",
});

export const config = {
  // Match all pathnames except for:
  // - API routes
  // - Static files (_next/static)
  // - Image optimization files (_next/image)
  // - Favicon and other public files
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
