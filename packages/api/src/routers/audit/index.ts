import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../../trpc";
import { prisma } from "@qp/db";
import { auditLogsToCsv, auditLogsToJson } from "@qp/utils/csv/audit";
import { searchAuditLogsSchema, exportAuditLogsSchema } from "./schema";

export const auditRouter = router({
  /**
   * Search audit logs with pagination
   */
  search: protectedProcedure
    .input(searchAuditLogsSchema)
    .query(async ({ input, ctx }) => {
      const {
        tenantId,
        poolId,
        startDate,
        endDate,
        action,
        userEmail,
        page,
        pageSize,
      } = input;

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
            message: "Insufficient permissions",
          });
        }
      }

      // Build where clause
      const where: any = {
        tenantId,
      };

      if (poolId) {
        where.metadata = {
          path: ["poolId"],
          equals: poolId,
        };
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      if (action) {
        where.action = action;
      }

      // If userEmail filter, find user first
      if (userEmail) {
        const user = await prisma.user.findUnique({
          where: { email: userEmail },
          select: { id: true },
        });

        if (user) {
          where.OR = [{ actorId: user.id }, { userId: user.id }];
        } else {
          // No user found, return empty results
          return {
            logs: [],
            total: 0,
            page,
            pageSize,
            totalPages: 0,
          };
        }
      }

      // Get total count
      const total = await prisma.auditLog.count({ where });

      // Get paginated logs
      const logs = await prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: {
              email: true,
              name: true,
            },
          },
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      return {
        logs,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

  /**
   * Export audit logs as CSV or JSON
   */
  export: protectedProcedure
    .input(exportAuditLogsSchema)
    .mutation(async ({ input, ctx }) => {
      const { tenantId, poolId, startDate, endDate, action, userEmail, format } =
        input;

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
            message: "Insufficient permissions",
          });
        }
      }

      // Build where clause (same as search)
      const where: any = {
        tenantId,
      };

      if (poolId) {
        where.metadata = {
          path: ["poolId"],
          equals: poolId,
        };
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      if (action) {
        where.action = action;
      }

      if (userEmail) {
        const user = await prisma.user.findUnique({
          where: { email: userEmail },
          select: { id: true },
        });

        if (user) {
          where.OR = [{ actorId: user.id }, { userId: user.id }];
        } else {
          // No user found, return empty export
          return {
            data: format === "csv" ? "" : "[]",
            format,
            count: 0,
          };
        }
      }

      // Fetch all matching logs (limit to prevent abuse)
      const logs = await prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: {
              email: true,
            },
          },
          user: {
            select: {
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10000, // Max 10k records per export
      });

      // Transform to export format
      const exportData = logs.map((log) => ({
        id: log.id,
        tenantId: log.tenantId,
        actorId: log.actorId,
        userId: log.userId,
        action: log.action,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        resourceType: log.resourceType,
        resourceId: log.resourceId,
        createdAt: log.createdAt,
        metadata: log.metadata,
        actorEmail: log.actor?.email,
        userEmail: log.user?.email,
      }));

      // Convert to requested format
      const data =
        format === "csv"
          ? auditLogsToCsv(exportData)
          : auditLogsToJson(exportData);

      // Log the export action
      await prisma.auditLog.create({
        data: {
          tenantId,
          actorId: ctx.session.user.id,
          action: "AUDIT_EXPORT",
          metadata: {
            format,
            count: logs.length,
            filters: {
              poolId,
              startDate,
              endDate,
              action,
              userEmail,
            },
          },
          ipAddress: ctx.ip,
          userAgent: ctx.userAgent,
        },
      });

      return {
        data,
        format,
        count: logs.length,
      };
    }),

  /**
   * Get available actions for filtering
   */
  getActions: protectedProcedure
    .input(
      searchAuditLogsSchema.pick({
        tenantId: true,
      })
    )
    .query(async ({ input, ctx }) => {
      const { tenantId } = input;

      // Authorization check
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

      // Get distinct actions
      const actions = await prisma.auditLog.findMany({
        where: { tenantId },
        select: { action: true },
        distinct: ["action"],
        orderBy: { action: "asc" },
      });

      return actions.map((a) => a.action);
    }),
});
