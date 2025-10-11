import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, publicProcedure } from "../../trpc";
import { prisma } from "@qp/db";
import {
  listPoliciesSchema,
  publishPolicySchema,
  getCurrentPolicySchema,
  getPolicyByVersionSchema,
} from "./schema";

export const policiesRouter = router({
  /**
   * List all policy documents for a tenant/pool
   */
  list: protectedProcedure
    .input(listPoliciesSchema)
    .query(async ({ input, ctx }) => {
      const { tenantId, poolId, type } = input;

      // Authorization: SUPERADMIN or TENANT_ADMIN can list
      const userRole = ctx.session.user.highestRole;
      const isSuperAdmin = userRole === "SUPERADMIN";

      if (!isSuperAdmin) {
        const membership = await prisma.tenantMember.findFirst({
          where: {
            userId: ctx.session.user.id,
            tenantId,
            role: { in: ["SUPERADMIN", "TENANT_ADMIN"] },
          },
        });

        if (!membership) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Insufficient permissions",
          });
        }
      }

      const policies = await prisma.policyDocument.findMany({
        where: {
          tenantId,
          poolId: poolId ?? null,
          ...(type && { type }),
        },
        orderBy: [
          { type: "asc" },
          { version: "desc" },
        ],
      });

      return policies;
    }),

  /**
   * Get current (latest) policy for a type
   * Public endpoint for players to view
   */
  getCurrent: publicProcedure
    .input(getCurrentPolicySchema)
    .query(async ({ input }) => {
      const { tenantId, poolId, type } = input;

      const policy = await prisma.policyDocument.findFirst({
        where: {
          tenantId,
          poolId: poolId ?? null,
          type,
        },
        orderBy: {
          version: "desc",
        },
      });

      if (!policy) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `No ${type} policy found`,
        });
      }

      return policy;
    }),

  /**
   * Get a specific policy version
   */
  getByVersion: publicProcedure
    .input(getPolicyByVersionSchema)
    .query(async ({ input }) => {
      const { tenantId, poolId, type, version } = input;

      const policy = await prisma.policyDocument.findUnique({
        where: {
          tenantId_poolId_type_version: {
            tenantId,
            poolId: poolId!,
            type,
            version,
          },
        },
      });

      if (!policy) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Policy version not found",
        });
      }

      return policy;
    }),

  /**
   * Publish a new policy version
   * Auto-increments version number
   */
  publish: protectedProcedure
    .input(publishPolicySchema)
    .mutation(async ({ input, ctx }) => {
      const { tenantId, poolId, type, title, content } = input;

      // Authorization: SUPERADMIN or TENANT_ADMIN
      const userRole = ctx.session.user.highestRole;
      const isSuperAdmin = userRole === "SUPERADMIN";

      if (!isSuperAdmin) {
        const membership = await prisma.tenantMember.findFirst({
          where: {
            userId: ctx.session.user.id,
            tenantId,
            role: { in: ["SUPERADMIN", "TENANT_ADMIN"] },
          },
        });

        if (!membership) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Must be TENANT_ADMIN to publish policies",
          });
        }
      }

      // Validate pool exists if poolId provided
      if (poolId) {
        const pool = await prisma.pool.findUnique({
          where: { id: poolId },
        });

        if (!pool || pool.tenantId !== tenantId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Pool not found or does not belong to tenant",
          });
        }
      }

      // Get the latest version number
      const latestPolicy = await prisma.policyDocument.findFirst({
        where: {
          tenantId,
          poolId: poolId ?? null,
          type,
        },
        orderBy: {
          version: "desc",
        },
        select: {
          version: true,
        },
      });

      const newVersion = (latestPolicy?.version ?? 0) + 1;

      // Create new policy version
      const newPolicy = await prisma.policyDocument.create({
        data: {
          tenantId,
          poolId: poolId ?? null,
          type,
          version: newVersion,
          title,
          content,
        },
      });

      // Log the action
      await prisma.auditLog.create({
        data: {
          tenantId,
          actorId: ctx.session.user.id,
          action: "POLICY_PUBLISH",
          metadata: {
            policyId: newPolicy.id,
            type,
            version: newVersion,
            poolId,
          },
          ipAddress: ctx.ip,
          userAgent: ctx.userAgent,
        },
      });

      return newPolicy;
    }),
});
