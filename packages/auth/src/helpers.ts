import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import type { Session } from "next-auth";
import { TRPCError } from "@trpc/server";
import type { TenantRole } from "@qp/db";

/**
 * Create auth instance from config
 * Returns the auth function to get the current session
 */
export function createAuthInstance(authConfig: NextAuthConfig): () => Promise<Session | null> {
  const { auth } = NextAuth(authConfig);
  return auth as () => Promise<Session | null>;
}

/**
 * Get server-side auth session
 * Use this in tRPC context, API routes, or server components
 */
export async function getServerAuthSession(authConfig: NextAuthConfig): Promise<Session | null> {
  const auth = createAuthInstance(authConfig);
  return await auth();
}

/**
 * Require authenticated session (throws if not authenticated)
 */
export async function requireSession(authConfig: NextAuthConfig): Promise<Session> {
  const session = await getServerAuthSession(authConfig);
  
  if (!session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required"
    });
  }
  
  return session;
}

/**
 * Require specific role (throws if not authorized)
 */
export async function requireRole(
  authConfig: NextAuthConfig,
  allowedRoles: TenantRole[]
): Promise<Session> {
  const session = await requireSession(authConfig);
  
  if (!session.user.highestRole || !allowedRoles.includes(session.user.highestRole)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Insufficient permissions"
    });
  }
  
  return session;
}

/**
 * Check if user is SUPERADMIN
 */
export function isSuperAdmin(session: Session | null): boolean {
  return session?.user?.highestRole === "SUPERADMIN";
}

/**
 * Get user's role for a specific tenant
 */
export function getTenantRole(session: Session | null, tenantId: string) {
  return session?.user?.tenantRoles?.[tenantId] ?? null;
}

/**
 * Get default redirect path based on user role
 */
export function getDefaultRedirectForRole(role: TenantRole | null, locale: string = "es-MX"): string {
  switch (role) {
    case "SUPERADMIN":
      return "/superadmin/tenants";
    case "TENANT_ADMIN":
    case "TENANT_EDITOR":
      return `/${locale}/dashboard`;
    case "PLAYER":
      return `/${locale}/dashboard`; // Fixed: removed (player) route group
    default:
      return `/${locale}`;
  }
}
