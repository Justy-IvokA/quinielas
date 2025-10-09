import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { prisma } from "@qp/db";

import { publicProcedure, router } from "../../trpc";
import {
  createPoolSchema,
  createPrizeSchema,
  updatePoolSchema,
  updatePrizeSchema
} from "./schema";

export const poolsRouter = router({
  // List pools by tenant
  listByTenant: publicProcedure
    .input(z.object({ tenantId: z.string().cuid(), includeInactive: z.boolean().default(false) }))
    .query(async ({ input }) => {
      return prisma.pool.findMany({
        where: {
          tenantId: input.tenantId,
          ...(input.includeInactive ? {} : { isActive: true })
        },
        include: {
          brand: { select: { name: true, slug: true } },
          season: { select: { name: true, year: true } },
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

  // Get pool by ID
  getById: publicProcedure.input(z.object({ id: z.string().cuid() })).query(async ({ input }) => {
    const pool = await prisma.pool.findUnique({
      where: { id: input.id },
      include: {
        tenant: { select: { name: true, slug: true } },
        brand: { select: { name: true, slug: true, logoUrl: true } },
        season: { select: { name: true, year: true, competitionId: true } },
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

  // Get pool by slug
  getBySlug: publicProcedure
    .input(z.object({ tenantSlug: z.string(), brandSlug: z.string(), poolSlug: z.string() }))
    .query(async ({ input }) => {
      const pool = await prisma.pool.findFirst({
        where: {
          slug: input.poolSlug,
          tenant: { slug: input.tenantSlug },
          brand: { slug: input.brandSlug }
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

  // Create pool
  create: publicProcedure.input(createPoolSchema).mutation(async ({ input }) => {
    // Check if slug is unique for this tenant/brand
    const existing = await prisma.pool.findFirst({
      where: {
        slug: input.slug,
        tenantId: input.tenantId,
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
      data: input,
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

  // Delete pool
  delete: publicProcedure.input(z.object({ id: z.string().cuid() })).mutation(async ({ input }) => {
    // Check if pool has registrations
    const pool = await prisma.pool.findUnique({
      where: { id: input.id },
      include: {
        _count: {
          select: { registrations: true }
        }
      }
    });

    if (!pool) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Pool not found"
      });
    }

    if (pool._count.registrations > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot delete pool with existing registrations. Deactivate it instead."
      });
    }

    return prisma.pool.delete({
      where: { id: input.id }
    });
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
