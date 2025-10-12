import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { prisma } from "@qp/db";
import { getSportsProvider } from "@qp/utils/sports";

import { publicProcedure, router } from "../../trpc";
import {
  getFixtureByIdSchema,
  getFixturesBySeasonSchema,
  lockMatchPredictionsSchema,
  syncSeasonFixturesSchema,
  updateMatchResultSchema
} from "./schema";

export const fixturesRouter = router({
  // Get fixtures by season
  getBySeasonId: publicProcedure.input(getFixturesBySeasonSchema).query(async ({ input }) => {
    const matches = await prisma.match.findMany({
      where: {
        seasonId: input.seasonId,
        ...(input.includeFinished ? {} : { status: { not: "FINISHED" } })
      },
      include: {
        homeTeam: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logoUrl: true,
            countryCode: true
          }
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logoUrl: true,
            countryCode: true
          }
        },
        _count: {
          select: {
            predictions: true
          }
        }
      },
      orderBy: [{ kickoffTime: "asc" }, { round: "asc" }]
    });

    return matches;
  }),

  // Alias for getBySeasonId
  listBySeason: publicProcedure.input(z.object({ seasonId: z.string().cuid() })).query(async ({ input }) => {
    const matches = await prisma.match.findMany({
      where: { seasonId: input.seasonId },
      include: {
        homeTeam: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logoUrl: true
          }
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logoUrl: true
          }
        }
      },
      orderBy: [{ kickoffTime: "asc" }, { round: "asc" }]
    });

    return matches;
  }),

  // Get fixture by ID
  getById: publicProcedure.input(getFixtureByIdSchema).query(async ({ input }) => {
    const match = await prisma.match.findUnique({
      where: { id: input.id },
      include: {
        season: {
          select: {
            id: true,
            name: true,
            year: true,
            competition: {
              select: {
                id: true,
                name: true,
                logoUrl: true
              }
            }
          }
        },
        homeTeam: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logoUrl: true,
            countryCode: true
          }
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logoUrl: true,
            countryCode: true
          }
        },
        _count: {
          select: {
            predictions: true
          }
        }
      }
    });

    if (!match) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Match not found"
      });
    }

    return match;
  }),

  // Sync season fixtures from external API
  syncSeasonFixtures: publicProcedure.input(syncSeasonFixturesSchema).mutation(async ({ input }) => {
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

    const externalSource = await prisma.externalSource.findUnique({
      where: { id: input.externalSourceId }
    });

    if (!externalSource) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "External source not found"
      });
    }

    // Get competition external ID from ExternalMap
    const competitionMap = await prisma.externalMap.findFirst({
      where: {
        sourceId: externalSource.id,
        entityType: "competition",
        entityId: season.competitionId
      }
    });

    if (!competitionMap) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `No external mapping found for competition ${season.competition.name}`
      });
    }

    // Initialize sports provider
    const provider = getSportsProvider({
      provider: externalSource.slug as "mock" | "api-football",
      apiKey: process.env.SPORTS_API_KEY
    });

    console.log(`[Sync] Fetching season data from ${provider.getName()}...`);
    console.log(`[Sync] Competition external ID: ${competitionMap.externalId}, Year: ${season.year}`);

    // Fetch season data from external provider
    let seasonData;
    try {
      seasonData = await provider.fetchSeason({
        competitionExternalId: competitionMap.externalId,
        year: season.year
      });
    } catch (error) {
      console.error(`[Sync] Error fetching season data:`, error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to fetch season data from provider"
      });
    }

    console.log(`[Sync] Received ${seasonData.teams.length} teams and ${seasonData.matches.length} matches`);

    // Sync teams first
    const teamIdMap = new Map<string, string>(); // externalId -> internalId

    for (const teamDTO of seasonData.teams) {
      // Find or create team
      let team = await prisma.team.findFirst({
        where: {
          sportId: season.competition.sportId,
          slug: teamDTO.name.toLowerCase().replace(/\s+/g, "-")
        }
      });

      if (!team) {
        team = await prisma.team.create({
          data: {
            sportId: season.competition.sportId,
            slug: teamDTO.name.toLowerCase().replace(/\s+/g, "-"),
            name: teamDTO.name,
            shortName: teamDTO.shortName,
            logoUrl: teamDTO.logoUrl,
            countryCode: teamDTO.countryCode
          }
        });
      }

      // Create external mapping
      await prisma.externalMap.upsert({
        where: {
          sourceId_entityType_externalId: {
            sourceId: externalSource.id,
            entityType: "team",
            externalId: teamDTO.externalId
          }
        },
        create: {
          sourceId: externalSource.id,
          entityType: "team",
          entityId: team.id,
          externalId: teamDTO.externalId
        },
        update: {
          entityId: team.id
        }
      });

      // Associate team with season
      await prisma.teamSeason.upsert({
        where: {
          teamId_seasonId: {
            teamId: team.id,
            seasonId: season.id
          }
        },
        create: {
          teamId: team.id,
          seasonId: season.id
        },
        update: {}
      });

      teamIdMap.set(teamDTO.externalId, team.id);
    }

    // Sync matches
    let syncedCount = 0;

    for (const matchDTO of seasonData.matches) {
      const homeTeamId = teamIdMap.get(matchDTO.homeTeamExternalId);
      const awayTeamId = teamIdMap.get(matchDTO.awayTeamExternalId);

      if (!homeTeamId || !awayTeamId) {
        console.warn(`[Sync] Skipping match ${matchDTO.externalId}: team mapping not found`);
        continue;
      }

      // Upsert match
      const match = await prisma.match.upsert({
        where: {
          seasonId_round_homeTeamId_awayTeamId: {
            seasonId: season.id,
            round: matchDTO.round ?? 0,
            homeTeamId,
            awayTeamId
          }
        },
        create: {
          seasonId: season.id,
          round: matchDTO.round ?? 0,
          homeTeamId,
          awayTeamId,
          kickoffTime: matchDTO.kickoffTime,
          venue: matchDTO.venue,
          status: matchDTO.status,
          homeScore: matchDTO.homeScore,
          awayScore: matchDTO.awayScore,
          finishedAt: matchDTO.finishedAt
        },
        update: {
          kickoffTime: matchDTO.kickoffTime,
          venue: matchDTO.venue,
          status: matchDTO.status,
          homeScore: matchDTO.homeScore,
          awayScore: matchDTO.awayScore,
          finishedAt: matchDTO.finishedAt
        }
      });

      // Create external mapping for match
      await prisma.externalMap.upsert({
        where: {
          sourceId_entityType_externalId: {
            sourceId: externalSource.id,
            entityType: "match",
            externalId: matchDTO.externalId
          }
        },
        create: {
          sourceId: externalSource.id,
          entityType: "match",
          entityId: match.id,
          externalId: matchDTO.externalId
        },
        update: {
          entityId: match.id
        }
      });

      syncedCount++;
    }

    console.log(`[Sync] Successfully synced ${syncedCount} matches`);

    return {
      synced: syncedCount,
      seasonId: season.id,
      seasonName: season.name
    };
  }),

  // Update match result (for admin/worker)
  updateMatchResult: publicProcedure.input(updateMatchResultSchema).mutation(async ({ input }) => {
    const match = await prisma.match.findUnique({
      where: { id: input.matchId }
    });

    if (!match) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Match not found"
      });
    }

    const updatedMatch = await prisma.match.update({
      where: { id: input.matchId },
      data: {
        homeScore: input.homeScore,
        awayScore: input.awayScore,
        status: input.status,
        ...(input.status === "FINISHED" && { finishedAt: new Date() })
      }
    });

    // If match is finished, trigger scoring calculation
    if (input.status === "FINISHED") {
      // TODO: Trigger scoring worker/job
      console.log(`Match ${input.matchId} finished. Triggering scoring calculation...`);
    }

    return updatedMatch;
  }),

  // Lock match predictions (called at kickoff time)
  lockMatchPredictions: publicProcedure.input(lockMatchPredictionsSchema).mutation(async ({ input }) => {
    const match = await prisma.match.findUnique({
      where: { id: input.matchId }
    });

    if (!match) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Match not found"
      });
    }

    if (match.locked) {
      return { alreadyLocked: true, match };
    }

    const updatedMatch = await prisma.match.update({
      where: { id: input.matchId },
      data: { locked: true }
    });

    return { alreadyLocked: false, match: updatedMatch };
  }),

  // Get upcoming matches (next 7 days)
  getUpcoming: publicProcedure.input(z.object({ seasonId: z.string().cuid() })).query(async ({ input }) => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return prisma.match.findMany({
      where: {
        seasonId: input.seasonId,
        kickoffTime: {
          gte: now,
          lte: nextWeek
        },
        status: "SCHEDULED"
      },
      include: {
        homeTeam: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logoUrl: true,
            countryCode: true
          }
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logoUrl: true,
            countryCode: true
          }
        }
      },
      orderBy: { kickoffTime: "asc" },
      take: 10
    });
  }),

  // Get live matches
  getLive: publicProcedure.input(z.object({ seasonId: z.string().cuid() })).query(async ({ input }) => {
    return prisma.match.findMany({
      where: {
        seasonId: input.seasonId,
        status: "LIVE"
      },
      include: {
        homeTeam: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logoUrl: true,
            countryCode: true
          }
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logoUrl: true,
            countryCode: true
          }
        }
      },
      orderBy: { kickoffTime: "asc" }
    });
  }),

  // Get available seasons
  getSeasons: publicProcedure.query(async () => {
    return prisma.season.findMany({
      include: {
        competition: {
          select: {
            id: true,
            name: true,
            logoUrl: true
          }
        },
        _count: {
          select: {
            matches: true
          }
        }
      },
      orderBy: { year: "desc" }
    });
  }),

  // Get external sources
  getExternalSources: publicProcedure.query(async () => {
    return prisma.externalSource.findMany({
      orderBy: { name: "asc" }
    });
  })
});
