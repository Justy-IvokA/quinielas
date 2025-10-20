/**
 * Standings Router
 * tRPC endpoints for accessing cached competition standings
 */

import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { prisma } from "@qp/db";
import { getOrFetchStandings, getCachedStandings } from "../services/standings";

export const standingsRouter = router({
  /**
   * Get standings for a competition/season
   * Returns cached data if available, otherwise fetches from API
   */
  get: publicProcedure
    .input(
      z.object({
        competitionId: z.string(),
        seasonYear: z.number(),
        forceRefresh: z.boolean().optional().default(false),
      })
    )
    .query(async ({ input, ctx }) => {
      const { competitionId, seasonYear, forceRefresh } = input;

      // Get external league ID from ExternalMap
      const externalMap = await prisma.externalMap.findFirst({
        where: {
          entityId: competitionId,
          entityType: "COMPETITION",
        },
      });

      if (!externalMap) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "External mapping not found for this competition",
        });
      }

      try {
        const standings = await getOrFetchStandings({
          competitionId,
          seasonYear,
          externalLeagueId: externalMap.externalId,
          fetchedBy: ctx.session?.user?.id,
          forceRefresh,
          isManualRefresh: forceRefresh && !!ctx.session?.user?.id, // Only manual if user-initiated
        });

        return {
          id: standings.id,
          competitionId: standings.competitionId,
          seasonYear: standings.seasonYear,
          data: standings.standingsData,
          lastFetchedAt: standings.lastFetchedAt,
          lastUpdatedAt: standings.lastUpdatedAt,
          isCached: !forceRefresh,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to fetch standings",
        });
      }
    }),

  /**
   * Get cached standings only (no API call)
   */
  getCached: publicProcedure
    .input(
      z.object({
        competitionId: z.string(),
        seasonYear: z.number(),
      })
    )
    .query(async ({ input }) => {
      const { competitionId, seasonYear } = input;

      const standings = await getCachedStandings(competitionId, seasonYear);

      if (!standings) {
        return null;
      }

      return {
        id: standings.id,
        competitionId: standings.competitionId,
        seasonYear: standings.seasonYear,
        data: standings.standingsData,
        lastFetchedAt: standings.lastFetchedAt,
        lastUpdatedAt: standings.lastUpdatedAt,
      };
    }),

  /**
   * Get standings by pool slug (convenience method)
   */
  getByPoolSlug: publicProcedure
    .input(
      z.object({
        poolSlug: z.string(),
        tenantSlug: z.string(),
        forceRefresh: z.boolean().optional().default(false),
      })
    )
    .query(async ({ input, ctx }) => {
      const { poolSlug, tenantSlug, forceRefresh } = input;

      // Find tenant
      const tenant = await prisma.tenant.findUnique({
        where: { slug: tenantSlug },
      });

      if (!tenant) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tenant not found",
        });
      }

      // Find pool with season and competition
      const pool = await prisma.pool.findUnique({
        where: {
          tenantId_slug: {
            tenantId: tenant.id,
            slug: poolSlug,
          },
        },
        include: {
          season: {
            include: {
              competition: true,
            },
          },
        },
      });

      if (!pool) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pool not found",
        });
      }

      // Get external league ID
      const externalMap = await prisma.externalMap.findFirst({
        where: {
          entityId: pool.season.competitionId,
          entityType: "COMPETITION",
        },
      });

      if (!externalMap) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "External mapping not found for this competition",
        });
      }

      try {
        const standings = await getOrFetchStandings({
          competitionId: pool.season.competitionId,
          seasonYear: pool.season.year,
          externalLeagueId: externalMap.externalId,
          fetchedBy: ctx.session?.user?.id,
          forceRefresh,
          isManualRefresh: forceRefresh && !!ctx.session?.user?.id, // Only manual if user-initiated
        });

        return {
          id: standings.id,
          competitionId: standings.competitionId,
          seasonYear: standings.seasonYear,
          data: standings.standingsData,
          lastFetchedAt: standings.lastFetchedAt,
          lastUpdatedAt: standings.lastUpdatedAt,
          isCached: !forceRefresh,
          pool: {
            id: pool.id,
            name: pool.name,
            slug: pool.slug,
          },
          competition: {
            id: pool.season.competition.id,
            name: pool.season.competition.name,
            slug: pool.season.competition.slug,
            logoUrl: pool.season.competition.logoUrl,
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to fetch standings",
        });
      }
    }),

  /**
   * List all cached standings with metadata
   */
  listCached: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const { page, limit } = input;
      const skip = (page - 1) * limit;

      const [standings, total] = await Promise.all([
        prisma.competitionStandings.findMany({
          skip,
          take: limit,
          orderBy: {
            lastFetchedAt: "desc",
          },
          include: {
            competition: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        }),
        prisma.competitionStandings.count(),
      ]);

      return {
        standings: standings.map((s) => ({
          id: s.id,
          competitionId: s.competitionId,
          competitionName: s.competition.name,
          competitionSlug: s.competition.slug,
          seasonYear: s.seasonYear,
          lastFetchedAt: s.lastFetchedAt,
          lastUpdatedAt: s.lastUpdatedAt,
          fetchedBy: s.fetchedBy,
          ageInHours: (Date.now() - s.lastFetchedAt.getTime()) / (1000 * 60 * 60),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),
});
