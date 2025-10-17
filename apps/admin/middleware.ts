import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { getToken } from "next-auth/jwt";
import type { TenantRole } from "@qp/db";

import { locales, defaultLocale } from "./src/i18n/config";

// Create i18n middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always"
});

/**
 * Admin Middleware - Protects admin routes and handles authentication
 * 
 * This middleware:
 * 1. Handles i18n locale routing
 * 2. Checks for auth session cookie
 * 3. Verifies user has admin role (SUPERADMIN, TENANT_ADMIN, or TENANT_EDITOR)
 * 4. Redirects unauthorized users to error page
 */

// Admin roles that can access the admin panel
const ADMIN_ROLES: TenantRole[] = ["SUPERADMIN", "TENANT_ADMIN", "TENANT_EDITOR"];
export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Extract locale from pathname (e.g., /es-MX/dashboard -> es-MX)
  const pathnameLocale = pathname.split('/')[1];
  const locale = locales.includes(pathnameLocale as any) ? pathnameLocale : defaultLocale;
  
  // Public routes that don't require authentication or role verification
  const isAuthRoute = pathname.match(new RegExp(`^/(${locales.join('|')})/auth(/.*)?$`));
  const isApiRoute = pathname.startsWith('/api/');
  const isPublicRoute = isAuthRoute || isApiRoute;
  
  // Skip all checks for public routes (auth pages, API routes)
  if (isPublicRoute) {
    return intlMiddleware(req);
  }
  
  // Check for session cookie (Auth.js uses this cookie name by default)
  const sessionToken = req.cookies.get('authjs.session-token') || req.cookies.get('__Secure-authjs.session-token');
  
  // If no session token, redirect to sign-in
  if (!sessionToken) {
    const signInUrl = new URL(`/${locale}/auth/signin`, req.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }
  
  // For authenticated routes, verify user has admin role
  if (sessionToken) {
    try {
      // Decode JWT to get user's role
      const token = await getToken({ 
        req, 
        secret: process.env.AUTH_SECRET 
      });
      
      const userRole = token?.highestRole as TenantRole | null;
      
      // Check if user has an admin role
      const isAdmin = userRole && ADMIN_ROLES.includes(userRole);
      
      if (!isAdmin) {
        console.log(`[admin-middleware] Access denied for user with role: ${userRole}`);
        
        // Redirect to unauthorized page
        const unauthorizedUrl = new URL(`/${locale}/auth/unauthorized`, req.url);
        return NextResponse.redirect(unauthorizedUrl);
      }
      
      console.log(`[admin-middleware] Access granted for user with role: ${userRole}`);
    } catch (error) {
      console.error('[admin-middleware] Error checking user role:', error);
      
      // On error, redirect to sign-in
      const signInUrl = new URL(`/${locale}/auth/signin`, req.url);
      return NextResponse.redirect(signInUrl);
    }
  }
  
  // Apply i18n middleware for locale handling
  return intlMiddleware(req);
}

export const config = {
  // Match all routes except:
  // - API routes (/api/*)
  // - Static files (_next/static/*)
  // - Image optimization (_next/image/*)
  // - Favicon and other static assets
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"]
};
