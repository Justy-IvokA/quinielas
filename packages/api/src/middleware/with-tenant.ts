import { TRPCError } from "@trpc/server";
import { procedure, middleware } from "../trpc";

/**
 * Middleware that ensures tenant context exists
 * Throws FORBIDDEN if tenant is not resolved
 */
export const withTenant = middleware(async ({ ctx, next }) => {
  if (!ctx.tenant) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Tenant context required. Unable to resolve tenant from request."
    });
  }

  return next({
    ctx: {
      ...ctx,
      tenant: ctx.tenant // Now guaranteed to be non-null
    }
  });
});

/**
 * Middleware that ensures both tenant and brand context exist
 */
export const withTenantAndBrand = middleware(async ({ ctx, next }) => {
  if (!ctx.tenant || !ctx.brand) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Tenant and brand context required. Unable to resolve from request."
    });
  }

  return next({
    ctx: {
      ...ctx,
      tenant: ctx.tenant,
      brand: ctx.brand
    }
  });
});

/**
 * Middleware that ensures user is authenticated
 */
export const withAuth = middleware(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required"
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session
    }
  });
});

/**
 * Combined: authenticated + tenant context
 */
export const protectedProcedure = procedure.use(withAuth).use(withTenant);
