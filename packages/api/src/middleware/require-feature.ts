import { TRPCError } from "@trpc/server";
import type { Feature } from "@qp/db";
import { middleware } from "../trpc";
import { createFeatureGuard } from "../services/features.service";

/**
 * Middleware that requires a specific feature to be enabled for the current tenant
 */
export function requireFeature(feature: Feature) {
  return middleware(async ({ ctx, next }) => {
    if (!ctx.tenant) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Tenant context required"
      });
    }

    const featureGuard = createFeatureGuard(ctx.prisma);
    const isEnabled = await featureGuard.isFeatureEnabled(ctx.tenant.id, feature);

    if (!isEnabled) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Feature '${feature}' is not enabled for this tenant`
      });
    }

    return next({
      ctx: {
        ...ctx,
        featureGuard
      }
    });
  });
}
