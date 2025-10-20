import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../../trpc";

export const externalMapsRouter = router({
  /**
   * Get external mapping by entity type and ID
   * Used to find API-Sports league IDs for competitions
   */
  getByEntity: publicProcedure
    .input(
      z.object({
        entityType: z.string(),
        entityId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const mapping = await ctx.prisma.externalMap.findFirst({
        where: {
          entityType: input.entityType,
          entityId: input.entityId,
        },
        select: {
          id: true,
          sourceId: true,
          externalId: true,
          entityType: true,
          entityId: true,
        },
      });

      return mapping;
    }),

  /**
   * Get all mappings for a specific entity type
   */
  listByType: protectedProcedure
    .input(
      z.object({
        entityType: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const mappings = await ctx.prisma.externalMap.findMany({
        where: {
          entityType: input.entityType,
        },
        select: {
          id: true,
          sourceId: true,
          externalId: true,
          entityType: true,
          entityId: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return mappings;
    }),
});
