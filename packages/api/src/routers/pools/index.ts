import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { prisma } from "@qp/db";

import { publicProcedure, router } from "../../trpc";
import { withTenant } from "../../middleware/with-tenant";
import {
  createPoolSchema,
  createPrizeSchema,
  updatePoolSchema,
  updatePrizeSchema
} from "./schema";

export const poolsRouter = router({
  // List pools by tenant (uses ctx.tenant)
  listByTenant: publicProcedure
    .use(withTenant)
    .input(z.object({ includeInactive: z.boolean().default(false) }))
    .query(async ({ ctx, input }) => {
      return prisma.pool.findMany({
        where: {
          tenantId: ctx.tenant.id,
          ...(input.includeInactive ? {} : { isActive: true })
        },
        include: {
          brand: { select: { name: true, slug: true, domains: true } },
          season: { select: { name: true, year: true, competition: { select: { name: true, countryCode: true, logoUrl: true } } } },
          accessPolicy: { select: { accessType: true } },
          _count: {
            select: {
              registrations: true,
              prizes: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });
    }),

  // Get registrations for a pool
  getRegistrations: publicProcedure
    .input(z.object({ poolId: z.string().cuid() }))
    .query(async ({ input }) => {
      const registrations = await prisma.registration.findMany({
        where: { poolId: input.poolId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true
            }
          }
        },
        orderBy: { joinedAt: "desc" }
      });

      // Get prediction counts for each user in this pool
      const registrationsWithCounts = await Promise.all(
        registrations.map(async (registration) => {
          const predictionsCount = await prisma.prediction.count({
            where: {
              userId: registration.userId,
              poolId: input.poolId
            }
          });

          return {
            ...registration,
            _count: {
              predictions: predictionsCount
            }
          };
        })
      );

      return registrationsWithCounts;
    }),

  // Get pool by ID
  getById: publicProcedure.input(z.object({ id: z.string().cuid() })).query(async ({ input }) => {
    const pool = await prisma.pool.findUnique({
      where: { id: input.id },
      include: {
        tenant: { select: { name: true, slug: true } },
        brand: { 
          select: { 
            name: true, 
            slug: true, 
            logoUrl: true,
            domains: true 
          } 
        },
        season: { 
          select: { 
            name: true, 
            year: true, 
            competitionId: true,
            competition: {
              select: {
                name: true,
                sport: {
                  select: { name: true }
                }
              }
            }
          } 
        },
        accessPolicy: true,
        prizes: { orderBy: { position: "asc" } },
        _count: {
          select: {
            registrations: true,
            predictions: true
          }
        }
      }
    });

    if (!pool) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Pool not found"
      });
    }

    return pool;
  }),

  // Get pool by slug (scoped to ctx.tenant)
  getBySlug: publicProcedure
    .use(withTenant)
    .input(z.object({ poolSlug: z.string() }))
    .query(async ({ ctx, input }) => {
      const pool = await prisma.pool.findFirst({
        where: {
          slug: input.poolSlug,
          tenantId: ctx.tenant.id
        },
        include: {
          tenant: { select: { name: true, slug: true } },
          brand: { select: { name: true, slug: true, logoUrl: true } },
          season: { select: { name: true, year: true } },
          accessPolicy: true,
          prizes: { orderBy: { position: "asc" } }
        }
      });

      if (!pool) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pool not found"
        });
      }

      return pool;
    }),

  // Create pool (uses ctx.tenant)
  create: publicProcedure
    .use(withTenant)
    .input(createPoolSchema.omit({ tenantId: true }))
    .mutation(async ({ ctx, input }) => {
      // Check if slug is unique for this tenant/brand
      const existing = await prisma.pool.findFirst({
        where: {
          slug: input.slug,
          tenantId: ctx.tenant.id,
          brandId: input.brandId
        }
      });

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "A pool with this slug already exists for this brand"
      });
    }

    // Validate dates
    if (input.endDate <= input.startDate) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "End date must be after start date"
      });
    }

    return prisma.pool.create({
      data: {
        ...input,
        tenantId: ctx.tenant.id
      },
      include: {
        brand: { select: { name: true } },
        season: { select: { name: true } }
      }
    });
  }),

  // Update pool
  update: publicProcedure.input(updatePoolSchema).mutation(async ({ input }) => {
    const { id, ...data } = input;

    // Validate dates if both provided
    if (data.startDate && data.endDate && data.endDate <= data.startDate) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "End date must be after start date"
      });
    }

    return prisma.pool.update({
      where: { id },
      data,
      include: {
        brand: { select: { name: true } },
        season: { select: { name: true } }
      }
    });
  }),

  // Toggle pool active status
  toggleActive: publicProcedure
    .input(z.object({ 
      id: z.string().cuid(),
      isActive: z.boolean()
    }))
    .mutation(async ({ input }) => {
      return prisma.pool.update({
        where: { id: input.id },
        data: { isActive: input.isActive }
      });
    }),

  // Delete pool
  delete: publicProcedure
    .use(withTenant)
    .input(z.object({ 
      id: z.string().cuid(),
      force: z.boolean().optional().default(false) // Allow force delete for testing/development
    }))
    .mutation(async ({ ctx, input }) => {
      // Fetch pool with counts
      const pool = await prisma.pool.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: {
              registrations: true,
              predictions: true,
              prizes: true,
              invitations: true,
              scoreAudits: true,
              leaderboards: true
            }
          }
        }
      });

      if (!pool) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pool not found"
        });
      }

      // Verify tenant ownership
      if (pool.tenantId !== ctx.tenant.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to delete this pool"
        });
      }

      // Prevent deletion if pool has registrations (users have participated)
      // unless force flag is set (for testing/development)
      if (pool._count.registrations > 0 && !input.force) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete pool with existing registrations. Deactivate it instead, or use force flag for testing."
        });
      }

      console.log(`[Pool Delete] Deleting pool ${input.id} with:`, {
        registrations: pool._count.registrations,
        predictions: pool._count.predictions,
        prizes: pool._count.prizes,
        invitations: pool._count.invitations,
        scoreAudits: pool._count.scoreAudits,
        leaderboards: pool._count.leaderboards,
        force: input.force
      });

      // Delete pool (cascade will handle related records)
      // Relations with onDelete: Cascade in schema:
      // - AccessPolicy
      // - Registrations (if force=true)
      // - Predictions
      // - Prizes
      // - Invitations
      // - ScoreAudits
      // - LeaderboardSnapshots
      // - Settings
      // - PolicyDocuments
      // - ConsentRecords
      // - DataRetentionPolicies
      await prisma.pool.delete({
        where: { id: input.id }
      });

      console.log(`[Pool Delete] Successfully deleted pool ${input.id}`);

      return { success: true, deletedPoolId: input.id };
    }),

  // Prize management
  prizes: router({
    // List prizes for pool
    list: publicProcedure.input(z.object({ poolId: z.string().cuid() })).query(async ({ input }) => {
      return prisma.prize.findMany({
        where: { poolId: input.poolId },
        orderBy: { position: "asc" }
      });
    }),

    // Create prize
    create: publicProcedure.input(createPrizeSchema).mutation(async ({ input }) => {
      return prisma.prize.create({
        data: input
      });
    }),

    // Update prize
    update: publicProcedure.input(updatePrizeSchema).mutation(async ({ input }) => {
      const { id, ...data } = input;
      return prisma.prize.update({
        where: { id },
        data
      });
    }),

    // Delete prize
    delete: publicProcedure.input(z.object({ id: z.string().cuid() })).mutation(async ({ input }) => {
      return prisma.prize.delete({
        where: { id: input.id }
      });
    })
  })
});
