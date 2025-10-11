import { TRPCError } from "@trpc/server";
import type { TenantRole } from "@qp/db";
import { middleware } from "../trpc";
import { hasRole, isSuperAdmin } from "../lib/rbac";

/**
 * Middleware that requires user to have at least one of the specified roles
 * Checks user's highest role across all tenants
 */
export function requireRole(...roles: TenantRole[]) {
  return middleware(async ({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Authentication required"
      });
    }

    const { highestRole } = ctx.session.user;

    if (!highestRole) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "No role assigned. Contact administrator."
      });
    }

    if (!roles.includes(highestRole)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Insufficient permissions. Required role: ${roles.join(" or ")}`
      });
    }

    return next({
      ctx: {
        ...ctx,
        session: ctx.session
      }
    });
  });
}

/**
 * Shorthand: Require SUPERADMIN role
 */
export const requireSuperAdmin = requireRole("SUPERADMIN");
