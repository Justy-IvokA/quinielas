import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { prisma } from "@qp/db";

import { publicProcedure, router } from "../../trpc";
import { createPrizeSchema, updatePrizeSchema, reorderPrizesSchema } from "./schema";

/**
 * Validates that prize rank ranges don't overlap for a given pool
 */
async function validateNoOverlap(
  poolId: string,
  rankFrom: number,
  rankTo: number,
  excludeId?: string
) {
  const existingPrizes = await prisma.prize.findMany({
    where: {
      poolId,
      ...(excludeId ? { id: { not: excludeId } } : {})
    },
    select: { id: true, rankFrom: true, rankTo: true, title: true }
  });

  for (const prize of existingPrizes) {
    // Check if ranges overlap: [a1, a2] overlaps [b1, b2] if max(a1,b1) <= min(a2,b2)
    const overlaps =
      Math.max(rankFrom, prize.rankFrom) <= Math.min(rankTo, prize.rankTo);

    if (overlaps) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Rank range [${rankFrom}-${rankTo}] overlaps with existing prize "${prize.title}" [${prize.rankFrom}-${prize.rankTo}]`
      });
    }
  }
}

export const prizesRouter = router({
  // List prizes by pool
  listByPool: publicProcedure
    .input(z.object({ poolId: z.string().cuid() }))
    .query(async ({ input }) => {
      return prisma.prize.findMany({
        where: { poolId: input.poolId },
        orderBy: { rankFrom: "asc" },
        include: {
          _count: {
            select: { awards: true }
          }
        }
      });
    }),

  // Get prize by ID
  getById: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ input }) => {
      const prize = await prisma.prize.findUnique({
        where: { id: input.id },
        include: {
          pool: {
            select: { name: true, slug: true }
          },
          _count: {
            select: { awards: true }
          }
        }
      });

      if (!prize) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prize not found"
        });
      }

      return prize;
    }),

  // Create prize
  create: publicProcedure
    .input(createPrizeSchema)
    .mutation(async ({ input }) => {
      // Validate no overlap
      await validateNoOverlap(input.poolId, input.rankFrom, input.rankTo);

      return prisma.prize.create({
        data: input,
        include: {
          pool: {
            select: { name: true }
          }
        }
      });
    }),

  // Update prize
  update: publicProcedure
    .input(updatePrizeSchema)
    .mutation(async ({ input }) => {
      const { id, ...data } = input;

      // Get existing prize to check pool and current ranges
      const existing = await prisma.prize.findUnique({
        where: { id },
        select: { poolId: true, rankFrom: true, rankTo: true }
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prize not found"
        });
      }

      // If rank ranges are being updated, validate no overlap
      const newRankFrom = data.rankFrom ?? existing.rankFrom;
      const newRankTo = data.rankTo ?? existing.rankTo;

      if (data.rankFrom !== undefined || data.rankTo !== undefined) {
        await validateNoOverlap(existing.poolId, newRankFrom, newRankTo, id);
      }

      return prisma.prize.update({
        where: { id },
        data,
        include: {
          pool: {
            select: { name: true }
          }
        }
      });
    }),

  // Delete prize
  delete: publicProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ input }) => {
      // Check if prize has awards
      const prize = await prisma.prize.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: { awards: true }
          }
        }
      });

      if (!prize) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Prize not found"
        });
      }

      if (prize._count.awards > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete prize with existing awards"
        });
      }

      return prisma.prize.delete({
        where: { id: input.id }
      });
    }),

  // Reorder prizes (batch update rank ranges)
  reorder: publicProcedure
    .input(reorderPrizesSchema)
    .mutation(async ({ input }) => {
      // Validate all prizes belong to the pool and tenant
      const prizes = await prisma.prize.findMany({
        where: {
          id: { in: input.prizes.map((p) => p.id) },
          poolId: input.poolId,
          tenantId: input.tenantId
        },
        select: { id: true }
      });

      if (prizes.length !== input.prizes.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Some prizes do not belong to this pool"
        });
      }

      // Check for overlaps in the new configuration
      for (let i = 0; i < input.prizes.length; i++) {
        for (let j = i + 1; j < input.prizes.length; j++) {
          const a = input.prizes[i];
          const b = input.prizes[j];
          const overlaps =
            Math.max(a.rankFrom, b.rankFrom) <= Math.min(a.rankTo, b.rankTo);

          if (overlaps) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Prize ranges overlap: [${a.rankFrom}-${a.rankTo}] and [${b.rankFrom}-${b.rankTo}]`
            });
          }
        }
      }

      // Update all prizes in a transaction
      await prisma.$transaction(
        input.prizes.map((p) =>
          prisma.prize.update({
            where: { id: p.id },
            data: {
              rankFrom: p.rankFrom,
              rankTo: p.rankTo
            }
          })
        )
      );

      return { success: true };
    })
});
