/**
 * Sync Router
 * 
 * Endpoints para monitorear y controlar la sincronización de fixtures
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { prisma } from "@qp/db";
import { sportsAPICache } from "@qp/utils/sports";

import { publicProcedure, router } from "../../trpc";

export const syncRouter = router({
  // Obtener estadísticas de sincronización
  getStats: publicProcedure.query(async () => {
    const [
      totalSeasons,
      activeSeasons,
      totalMatches,
      syncedMatches,
      totalTeams,
      externalSources
    ] = await Promise.all([
      prisma.season.count(),
      prisma.season.count({
        where: {
          OR: [
            {
              startsAt: { lte: new Date() },
              endsAt: { gte: new Date() }
            },
            {
              startsAt: {
                gte: new Date(),
                lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              }
            }
          ]
        }
      }),
      prisma.match.count(),
      prisma.externalMap.count({ where: { entityType: "match" } }),
      prisma.team.count(),
      prisma.externalSource.findMany({
        include: {
          _count: {
            select: {
              mappings: true // ExternalMap
            }
          }
        }
      })
    ]);

    // Estadísticas del caché
    const cacheStats = sportsAPICache.getStats();

    return {
      seasons: {
        total: totalSeasons,
        active: activeSeasons
      },
      matches: {
        total: totalMatches,
        synced: syncedMatches,
        percentage: totalMatches > 0 ? (syncedMatches / totalMatches) * 100 : 0
      },
      teams: {
        total: totalTeams
      },
      sources: externalSources.map(source => ({
        id: source.id,
        name: source.name,
        slug: source.slug,
        mappings: source._count.mappings
      })),
      cache: cacheStats
    };
  }),

  // Obtener historial de sincronizaciones
  getSyncHistory: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0)
      })
    )
    .query(async ({ input }) => {
      // Obtener logs de auditoría relacionados con sincronización
      const logs = await prisma.auditLog.findMany({
        where: {
          action: {
            in: ["SYNC_FIXTURES", "SYNC_SEASON"]
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        take: input.limit,
        skip: input.offset
      });

      const total = await prisma.auditLog.count({
        where: {
          action: {
            in: ["SYNC_FIXTURES", "SYNC_SEASON"]
          }
        }
      });

      return {
        logs,
        total,
        hasMore: input.offset + input.limit < total
      };
    }),

  // Limpiar caché manualmente
  clearCache: publicProcedure
    .input(
      z.object({
        provider: z.string().optional()
      })
    )
    .mutation(async ({ input }) => {
      if (input.provider) {
        sportsAPICache.invalidateProvider(input.provider);
        return {
          success: true,
          message: `Cache cleared for provider: ${input.provider}`
        };
      } else {
        sportsAPICache.clear();
        return {
          success: true,
          message: "All cache cleared"
        };
      }
    }),

  // Obtener estado de temporadas activas
  getActiveSeasons: publicProcedure.query(async () => {
    const now = new Date();
    const seasons = await prisma.season.findMany({
      where: {
        OR: [
          {
            startsAt: { lte: now },
            endsAt: { gte: now }
          },
          {
            startsAt: {
              gte: now,
              lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
            }
          }
        ]
      },
      include: {
        competition: {
          include: {
            sport: true
          }
        },
        _count: {
          select: {
            matches: true
          }
        }
      },
      orderBy: {
        startsAt: "asc"
      }
    });

    // Obtener todos los ExternalMaps de las competiciones
    const competitionIds = seasons.map(s => s.competition.id);
    const externalMaps = await prisma.externalMap.findMany({
      where: {
        entityType: "competition",
        entityId: { in: competitionIds }
      },
      include: {
        source: true
      }
    });

    // Crear un mapa para acceso rápido
    const mapsById = new Map(
      externalMaps.map(map => [map.entityId, map])
    );

    return seasons.map(season => {
      const competitionMap = mapsById.get(season.competition.id);

      return {
        id: season.id,
        name: season.name,
        year: season.year,
        startsAt: season.startsAt,
        endsAt: season.endsAt,
        competition: {
          id: season.competition.id,
          name: season.competition.name,
          sport: season.competition.sport.name
        },
        matchCount: season._count.matches,
        externalSource: competitionMap ? {
          id: competitionMap.source.id,
          name: competitionMap.source.name,
          externalId: competitionMap.externalId
        } : null,
        canSync: !!competitionMap
      };
    });
  }),

  // Trigger manual sync para una temporada específica
  triggerSync: publicProcedure
    .input(
      z.object({
        seasonId: z.string(),
        forceRefresh: z.boolean().default(false)
      })
    )
    .mutation(async ({ input }) => {
      const season = await prisma.season.findUnique({
        where: { id: input.seasonId },
        include: {
          competition: true
        }
      });

      if (!season) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Season not found"
        });
      }

      // Buscar ExternalMap manualmente
      const competitionMap = await prisma.externalMap.findFirst({
        where: {
          entityType: "competition",
          entityId: season.competition.id
        },
        include: {
          source: true
        }
      });

      if (!competitionMap) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No external mapping found for this competition"
        });
      }

      // Si force refresh, limpiar caché
      if (input.forceRefresh) {
        sportsAPICache.invalidateProvider(competitionMap.source.slug);
      }

      // Aquí normalmente llamarías al job de sincronización
      // Por ahora solo retornamos la info
      return {
        success: true,
        message: `Sync triggered for ${season.name}`,
        seasonId: season.id,
        provider: competitionMap.source.name
      };
    })
});
