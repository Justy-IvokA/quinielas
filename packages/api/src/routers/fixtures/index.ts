import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { prisma } from "@qp/db";

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

    // TODO: Implement actual API call to external provider
    // This is a placeholder that would be replaced with actual API integration
    const mockFixtures = generateMockFixtures(season.id);

    // Upsert fixtures
    const results = await Promise.all(
      mockFixtures.map(async (fixture) => {
        return prisma.match.upsert({
          where: {
            seasonId_round_homeTeamId_awayTeamId: {
              seasonId: season.id,
              round: fixture.round,
              homeTeamId: fixture.homeTeamId,
              awayTeamId: fixture.awayTeamId
            }
          },
          create: {
            seasonId: fixture.seasonId,
            round: fixture.round,
            homeTeamId: fixture.homeTeamId,
            awayTeamId: fixture.awayTeamId,
            kickoffTime: fixture.kickoffTime,
            venue: fixture.venue,
            status: fixture.status
          },
          update: {
            kickoffTime: fixture.kickoffTime,
            venue: fixture.venue,
            status: fixture.status
          }
        });
      })
    );

    return {
      synced: results.length,
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
  })
});

// Helper function to generate mock fixtures (replace with actual API integration)
function generateMockFixtures(seasonId: string): Array<{
  seasonId: string;
  round: number;
  homeTeamId: string;
  awayTeamId: string;
  kickoffTime: Date;
  venue: string | null;
  status: "SCHEDULED" | "LIVE" | "FINISHED" | "POSTPONED" | "CANCELLED";
}> {
  // This would be replaced with actual API call to API-Football or SportMonks
  // For now, return empty array as placeholder
  return [];
}
