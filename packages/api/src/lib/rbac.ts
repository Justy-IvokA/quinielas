import type { TenantRole } from "@qp/db";
import type { Session } from "next-auth";

/**
 * Role hierarchy for comparison
 * Higher index = higher privilege
 */
const ROLE_HIERARCHY: TenantRole[] = [
  "PLAYER",
  "TENANT_EDITOR",
  "TENANT_ADMIN",
  "SUPERADMIN"
];

/**
 * Compare two roles
 * Returns: 1 if a > b, -1 if a < b, 0 if equal
 */
export function compareRole(a: TenantRole, b: TenantRole): number {
  const indexA = ROLE_HIERARCHY.indexOf(a);
  const indexB = ROLE_HIERARCHY.indexOf(b);
  
  if (indexA > indexB) return 1;
  if (indexA < indexB) return -1;
  return 0;
}

/**
 * Check if user has at least one of the required roles
 */
export function hasRole(userRoles: TenantRole[], requiredRoles: TenantRole[]): boolean {
  return userRoles.some(role => requiredRoles.includes(role));
}

/**
 * Check if user has a role that meets or exceeds the minimum required role
 */
export function hasMinRole(userRole: TenantRole, minRole: TenantRole): boolean {
  return compareRole(userRole, minRole) >= 0;
}

/**
 * Check if session user is SUPERADMIN
 */
export function isSuperAdmin(session: Session | null): boolean {
  return session?.user?.highestRole === "SUPERADMIN";
}

/**
 * Get user's role for a specific tenant
 */
export function getTenantRole(session: Session | null, tenantId: string): TenantRole | null {
  if (!session?.user?.tenantRoles) return null;
  return session.user.tenantRoles[tenantId] ?? null;
}

/**
 * Check if user has required role in a specific tenant
 */
export function hasTenantRole(
  session: Session | null,
  tenantId: string,
  requiredRoles: TenantRole[]
): boolean {
  const userRole = getTenantRole(session, tenantId);
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
}

/**
 * Check if user has minimum role in a specific tenant
 */
export function hasTenantMinRole(
  session: Session | null,
  tenantId: string,
  minRole: TenantRole
): boolean {
  const userRole = getTenantRole(session, tenantId);
  if (!userRole) return false;
  return hasMinRole(userRole, minRole);
}

/**
 * Get highest role from a list of roles
 */
export function getHighestRole(roles: TenantRole[]): TenantRole | null {
  if (roles.length === 0) return null;
  
  return roles.reduce((highest, current) => {
    return compareRole(current, highest) > 0 ? current : highest;
  });
}
