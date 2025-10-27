import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../../trpc";
import { prisma } from "@qp/db";
import {
  getSetting,
  getAllSettings,
  getEffectiveSettings,
  upsertSetting,
  deleteSetting,
} from "../../lib/settings";
import {
  listSettingsSchema,
  upsertSettingSchema,
  deleteSettingSchema,
  effectiveSettingsSchema,
  updateSyncSettingsSchema,
} from "./schema";

export const settingsRouter = router({
  /**
   * List settings at a specific scope
   */
  list: protectedProcedure
    .input(listSettingsSchema)
    .query(async ({ input, ctx }) => {
      const { scope, tenantId, poolId } = input;

      // Authorization checks
      const userRole = ctx.session.user.highestRole;
      const isSuperAdmin = userRole === "SUPERADMIN";

      if (scope === "GLOBAL" && !isSuperAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only SUPERADMIN can view global settings",
        });
      }

      if (scope === "TENANT" && !isSuperAdmin && tenantId) {
        // Check if user is TENANT_ADMIN for this tenant
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
            message: "Insufficient permissions for this tenant",
          });
        }
      }

      if (scope === "POOL" && !isSuperAdmin && poolId && tenantId) {
        // Check if user is TENANT_ADMIN for the pool's tenant
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
            message: "Insufficient permissions for this pool",
          });
        }
      }

      // Fetch settings
      const settings = await prisma.setting.findMany({
        where: {
          scope,
          tenantId: tenantId ?? null,
          poolId: poolId ?? null,
        },
        orderBy: {
          key: "asc",
        },
      });

      return settings;
    }),

  /**
   * Get effective settings (merged cascade)
   */
  effective: protectedProcedure
    .input(effectiveSettingsSchema)
    .query(async ({ input }) => {
      const { tenantId, poolId } = input;
      return await getEffectiveSettings({ tenantId, poolId });
    }),

  /**
   * Get all settings with source information
   */
  allWithSources: protectedProcedure
    .input(effectiveSettingsSchema)
    .query(async ({ input }) => {
      const { tenantId, poolId } = input;
      return await getAllSettings({ tenantId, poolId });
    }),

  /**
   * Upsert a setting
   */
  upsert: protectedProcedure
    .input(upsertSettingSchema)
    .mutation(async ({ input, ctx }) => {
      const { scope, tenantId, poolId, key, value } = input;

      // Authorization checks
      const userRole = ctx.session.user.highestRole;
      const isSuperAdmin = userRole === "SUPERADMIN";

      if (scope === "GLOBAL" && !isSuperAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only SUPERADMIN can modify global settings",
        });
      }

      if ((scope === "TENANT" || scope === "POOL") && !isSuperAdmin) {
        // Must be TENANT_ADMIN for the tenant
        if (!tenantId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "tenantId required for tenant/pool settings",
          });
        }

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
            message: "Must be TENANT_ADMIN to modify tenant/pool settings",
          });
        }
      }

      // Validate pool exists if poolId provided
      if (poolId) {
        const pool = await prisma.pool.findUnique({
          where: { id: poolId },
        });

        if (!pool) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Pool not found",
          });
        }

        if (pool.tenantId !== tenantId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Pool does not belong to specified tenant",
          });
        }
      }

      try {
        await upsertSetting(key, value, scope, { tenantId, poolId });

        // Log the action
        if (tenantId) {
          await prisma.auditLog.create({
            data: {
              tenantId,
              actorId: ctx.session.user.id,
              action: "SETTING_UPSERT",
              metadata: {
                scope,
                key,
                poolId,
              },
              ipAddress: ctx.ip,
              userAgent: ctx.userAgent,
            },
          });
        }

        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Failed to upsert setting",
        });
      }
    }),

  /**
   * Delete a setting
   */
  delete: protectedProcedure
    .input(deleteSettingSchema)
    .mutation(async ({ input, ctx }) => {
      const { scope, tenantId, poolId, key } = input;

      // Authorization checks (same as upsert)
      const userRole = ctx.session.user.highestRole;
      const isSuperAdmin = userRole === "SUPERADMIN";

      if (scope === "GLOBAL" && !isSuperAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only SUPERADMIN can delete global settings",
        });
      }

      if ((scope === "TENANT" || scope === "POOL") && !isSuperAdmin) {
        if (!tenantId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "tenantId required for tenant/pool settings",
          });
        }

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
            message: "Must be TENANT_ADMIN to delete tenant/pool settings",
          });
        }
      }

      await deleteSetting(key, scope, { tenantId, poolId });

      // Log the action
      if (tenantId) {
        await prisma.auditLog.create({
          data: {
            tenantId,
            actorId: ctx.session.user.id,
            action: "SETTING_DELETE",
            metadata: {
              scope,
              key,
              poolId,
            },
            ipAddress: ctx.ip,
            userAgent: ctx.userAgent,
          },
        });
      }

      return { success: true };
    }),

  /**
   * Get sync settings (SUPERADMIN only)
   * Fetches all cron schedule settings for worker jobs
   */
  getSyncSettings: protectedProcedure.query(async ({ ctx }) => {
    const userRole = ctx.session.user.highestRole;
    if (userRole !== "SUPERADMIN") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Solo SUPERADMIN puede ver los ajustes de sincronización",
      });
    }

    // Get the superadmin's tenant (first tenant where user is SUPERADMIN)
    const superadminMembership = await prisma.tenantMember.findFirst({
      where: {
        userId: ctx.session.user.id,
        role: "SUPERADMIN",
      },
      include: {
        tenant: true,
      },
    });

    if (!superadminMembership) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "SUPERADMIN no tiene un tenant",
      });
    }

    const tenantId = superadminMembership.tenantId;

    // Fetch all sync settings for this tenant
    const settings = await prisma.setting.findMany({
      where: {
        scope: "GLOBAL",
        tenantId,
        key: {
          startsWith: "sync:",
        },
      },
    });

    // Map to object format
    const syncSettings: Record<string, string> = {};
    settings.forEach((setting) => {
      syncSettings[setting.key] = String(setting.value);
    });

    return syncSettings;
  }),

  /**
   * Update sync settings (SUPERADMIN only)
   * Updates cron schedules for worker jobs
   */
  updateSyncSettings: protectedProcedure
    .input(updateSyncSettingsSchema)
    .mutation(async ({ input, ctx }) => {
      const userRole = ctx.session.user.highestRole;
      if (userRole !== "SUPERADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Solo SUPERADMIN puede modificar los ajustes de sincronización",
        });
      }

      // Get the superadmin's tenant
      const superadminMembership = await prisma.tenantMember.findFirst({
        where: {
          userId: ctx.session.user.id,
          role: "SUPERADMIN",
        },
        include: {
          tenant: true,
        },
      });

      if (!superadminMembership) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "SUPERADMIN no tiene un tenant",
        });
      }

      const tenantId = superadminMembership.tenantId;

      // Validate cron strings (basic validation)
      const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;

      // Upsert each setting
      for (const [key, value] of Object.entries(input.settings)) {
        if (value && !cronRegex.test(value)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Invalid cron format for ${key}: ${value}`,
          });
        }

        if (value) {
          await prisma.setting.upsert({
            where: {
              scope_tenantId_poolId_key: {
                scope: "GLOBAL",
                tenantId,
                poolId: "",
                key,
              },
            },
            create: {
              scope: "GLOBAL",
              tenantId,
              key,
              value,
            },
            update: {
              value,
            },
          });
        }
      }

      // Log the action
      await prisma.auditLog.create({
        data: {
          tenantId,
          actorId: ctx.session.user.id,
          action: "SYNC_SETTINGS_UPDATE",
          metadata: {
            updatedKeys: Object.keys(input.settings).filter(
              (k) => input.settings[k as keyof typeof input.settings]
            ),
          },
          ipAddress: ctx.ip,
          userAgent: ctx.userAgent,
        },
      });

      return { success: true };
    }),
});
