import { TRPCError } from "@trpc/server";
import type { TenantRole } from "@qp/db";
import { middleware } from "../trpc";
import { getTenantRole, hasMinRole, isSuperAdmin } from "../lib/rbac";

/**
 * Middleware that requires user to be a member of the current tenant
 * with at least the specified minimum role
 * 
 * SUPERADMIN bypasses tenant membership checks
 */
export function requireTenantMember(minRole?: TenantRole) {
  return middleware(async ({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required"
      });
    }

    // SUPERADMIN bypasses tenant checks
    if (isSuperAdmin(ctx.session)) {
      return next({ ctx });
    }

    if (!ctx.tenant) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Tenant context required"
      });
    }

    const userRole = getTenantRole(ctx.session, ctx.tenant.id);

    if (!userRole) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You are not a member of this tenant"
      });
    }

    if (minRole && !hasMinRole(userRole, minRole)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Insufficient permissions. Required role: ${minRole} or higher`
      });
    }

    return next({
      ctx: {
        ...ctx,
        userRole
      }
    });
  });
}

/**
 * Shorthand: Require TENANT_ADMIN or higher
 */
export const requireTenantAdmin = requireTenantMember("TENANT_ADMIN");

/**
 * Shorthand: Require TENANT_EDITOR or higher
 */
export const requireTenantEditor = requireTenantMember("TENANT_EDITOR");
