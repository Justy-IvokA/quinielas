import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { prisma } from "@qp/db";
import { getSportsProvider } from "@qp/utils/sports";
import type { ExtendedSportsProvider, SportsProvider } from "@qp/utils/sports";

import { publicProcedure, router } from "../../trpc";
import { withTenant } from "../../middleware/with-tenant";
import { requireRole } from "../../middleware/require-role";
import {
  listCompetitionsSchema,
  listSeasonsSchema,
  listStagesSchema,
  previewFixturesSchema,
  createAndImportSchema
} from "./schema";

export const poolWizardRouter = router({
  /**
   * List available competitions from provider
   */
  listCompetitions: publicProcedure
    .use(withTenant)
    .use(requireRole("TENANT_ADMIN", "SUPERADMIN"))
    .input(listCompetitionsSchema)
    .query(async ({ input }) => {
      // Get provider (default to api-football for now)
      const provider = getSportsProvider({
        provider: "api-football",
        apiKey: process.env.SPORTS_API_KEY
      }) as unknown as ExtendedSportsProvider;

      try {
        const competitions = await provider.listCompetitions({
          query: input.query,
          country: input.country,
          youthOnly: input.youthOnly,
          limit: input.limit || 50
        });

        return { competitions };
      } catch (error) {
        console.error("[Pool Wizard] Error listing competitions:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to fetch competitions"
        });
      }
    }),

  /**
   * List available seasons for a competition
   */
  listSeasons: publicProcedure
    .use(withTenant)
    .use(requireRole("TENANT_ADMIN", "SUPERADMIN"))
    .input(listSeasonsSchema)
    .query(async ({ input }) => {
      const provider = getSportsProvider({
        provider: "api-football",
        apiKey: process.env.SPORTS_API_KEY
      }) as unknown as ExtendedSportsProvider;

      try {
        const seasons = await provider.listSeasons({
          competitionExternalId: input.competitionExternalId
        });

        return { seasons };
      } catch (error) {
        console.error("[Pool Wizard] Error listing seasons:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to fetch seasons"
        });
      }
    }),

  /**
   * List stages and rounds for a season
   */
  listStages: publicProcedure
    .use(withTenant)
    .use(requireRole("TENANT_ADMIN", "SUPERADMIN"))
    .input(listStagesSchema)
    .query(async ({ input }) => {
      const provider = getSportsProvider({
        provider: "api-football",
        apiKey: process.env.SPORTS_API_KEY
      }) as unknown as ExtendedSportsProvider;

      try {
        const stages = await provider.listStagesAndRounds({
          competitionExternalId: input.competitionExternalId,
          seasonYear: input.seasonYear
        });

        return { stages };
      } catch (error) {
        console.error("[Pool Wizard] Error listing stages:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to fetch stages"
        });
      }
    }),

  /**
   * Preview fixtures for a given scope
   */
  previewFixtures: publicProcedure
    .use(withTenant)
    .use(requireRole("TENANT_ADMIN", "SUPERADMIN"))
    .input(previewFixturesSchema)
    .query(async ({ input }) => {
      const provider = getSportsProvider({
        provider: "api-football",
        apiKey: process.env.SPORTS_API_KEY
      }) as unknown as ExtendedSportsProvider;

      try {
        const preview = await provider.previewFixtures({
          competitionExternalId: input.competitionExternalId,
          seasonYear: input.seasonYear,
          stageLabel: input.stageLabel,
          roundLabel: input.roundLabel
        });

        return preview;
      } catch (error) {
        console.error("[Pool Wizard] Error previewing fixtures:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to preview fixtures"
        });
      }
    }),

  /**
   * Create pool and import fixtures in one transaction
   */
  createAndImport: publicProcedure
    .use(withTenant)
    .use(requireRole("TENANT_ADMIN", "SUPERADMIN"))
    .input(createAndImportSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.tenant) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tenant context required"
        });
      }
      const tenantId = ctx.tenant.id;

      // Validate slug uniqueness
      const existingPool = await prisma.pool.findFirst({
        where: {
          tenantId,
          slug: input.pool.slug,
          brandId: input.pool.brandId || null
        }
      });

      if (existingPool) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A pool with this slug already exists for this brand"
        });
      }

      // Get or create Sport (Football)
      let sport = await prisma.sport.findFirst({
        where: { slug: "football" }
      });

      if (!sport) {
        sport = await prisma.sport.create({
          data: {
            slug: "football",
            name: "Football"
          }
        });
      }

      // Get provider
      const provider = getSportsProvider({
        provider: "api-football",
        apiKey: process.env.SPORTS_API_KEY
      }) as unknown as SportsProvider & ExtendedSportsProvider;

      // Get external source
      let externalSource = await prisma.externalSource.findFirst({
        where: { slug: "api-football" }
      });

      if (!externalSource) {
        externalSource = await prisma.externalSource.create({
          data: {
            slug: "api-football",
            name: "API-Football"
          }
        });
      }

      try {
        // Fetch competition data by external ID
        // We need to fetch the season data which includes competition info
        const seasonData = await provider.fetchSeason({
          competitionExternalId: input.competitionExternalId,
          year: input.seasonYear
        });

        if (!seasonData) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Season data not found"
          });
        }

        // Extract competition data from season
        const competitionData = {
          externalId: input.competitionExternalId,
          name: input.competitionName, // Use the name from wizard data
          logoUrl: undefined,
          meta: {}
        };

        // Create or get Competition
        let competition = await prisma.competition.findFirst({
          where: {
            sportId: sport.id,
            slug: competitionData.name.toLowerCase().replace(/\s+/g, "-")
          }
        });

        if (!competition) {
          competition = await prisma.competition.create({
            data: {
              sportId: sport.id,
              slug: competitionData.name.toLowerCase().replace(/\s+/g, "-"),
              name: competitionData.name,
              logoUrl: competitionData.logoUrl,
              metadata: competitionData.meta || {}
            }
          });

          // Create external mapping for competition
          await prisma.externalMap.create({
            data: {
              sourceId: externalSource.id,
              entityType: "competition",
              entityId: competition.id,
              externalId: input.competitionExternalId
            }
          });
        }

        // Create or get Season
        let season = await prisma.season.findFirst({
          where: {
            competitionId: competition.id,
            year: input.seasonYear
          }
        });

        if (!season) {
          season = await prisma.season.create({
            data: {
              competitionId: competition.id,
              name: `${competitionData.name} ${input.seasonYear}`,
              year: input.seasonYear
            }
          });
        }

        // Filter matches by scope (seasonData was already fetched above)
        let filteredMatches = seasonData.matches;
        
        if (input.roundLabel) {
          // Filter by specific round number
          const targetRound = parseInt(input.roundLabel, 10);
          if (!isNaN(targetRound)) {
            filteredMatches = filteredMatches.filter(match => match.round === targetRound);
            console.log(`[Pool Wizard] Filtered to round ${targetRound}: ${filteredMatches.length} matches`);
          }
        }
        
        // Note: stageLabel filtering would require additional metadata from the API
        // For now, we only filter by round number
        if (filteredMatches.length === 0 && (input.stageLabel || input.roundLabel)) {
          console.warn(`[Pool Wizard] No matches found for filters: stage=${input.stageLabel}, round=${input.roundLabel}`);
        }

        // Import only teams that participate in filtered matches
        const teamIdMap = new Map<string, string>();
        
        // Get unique team IDs from filtered matches
        const teamExternalIds = new Set<string>();
        for (const match of filteredMatches) {
          teamExternalIds.add(match.homeTeamExternalId);
          teamExternalIds.add(match.awayTeamExternalId);
        }
        
        const filteredTeams = seasonData.teams.filter(team => 
          teamExternalIds.has(team.externalId)
        );
        
        console.log(`[Pool Wizard] Importing ${filteredTeams.length} teams (from ${seasonData.teams.length} total)`);

        for (const teamDTO of filteredTeams) {
          let team = await prisma.team.findFirst({
            where: {
              sportId: sport.id,
              slug: teamDTO.name.toLowerCase().replace(/\s+/g, "-")
            }
          });

          if (!team) {
            team = await prisma.team.create({
              data: {
                sportId: sport.id,
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

        // Import matches
        let importedMatches = 0;

        for (const matchDTO of filteredMatches) {
          const homeTeamId = teamIdMap.get(matchDTO.homeTeamExternalId);
          const awayTeamId = teamIdMap.get(matchDTO.awayTeamExternalId);

          if (!homeTeamId || !awayTeamId) {
            console.warn(`[Wizard] Skipping match: team mapping not found`);
            continue;
          }

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

          importedMatches++;
        }

        // Create Pool
        const pool = await prisma.pool.create({
          data: {
            tenantId,
            brandId: input.pool.brandId,
            seasonId: season.id,
            name: input.pool.title,
            slug: input.pool.slug,
            description: input.pool.description,
            isActive: true,
            isPublic: input.access.accessType === "PUBLIC",
            ruleSet: {
              exactScore: 5,
              correctSign: 3,
              goalDiffBonus: 1,
              tieBreakers: ["EXACT_SCORES", "CORRECT_SIGNS"]
            }
          }
        });

        // Create Access Policy
        await prisma.accessPolicy.create({
          data: {
            poolId: pool.id,
            tenantId,
            accessType: input.access.accessType,
            requireCaptcha: input.access.requireCaptcha ?? false,
            requireEmailVerification: input.access.requireEmailVerification ?? false,
            domainAllowList: input.access.emailDomains ?? [],
            maxRegistrations: input.access.maxUsers,
            windowStart: input.access.startAt,
            windowEnd: input.access.endAt
          }
        });

        // Create Prizes
        if (input.prizes && input.prizes.length > 0) {
          await prisma.prize.createMany({
            data: input.prizes.map((prize, index) => ({
              poolId: pool.id,
              tenantId,
              position: index + 1,
              rankFrom: prize.rankFrom,
              rankTo: prize.rankTo,
              type: prize.type,
              title: prize.title,
              description: prize.description,
              value: prize.value,
              imageUrl: prize.imageUrl
            }))
          });
        }

        return {
          poolId: pool.id,
          poolSlug: pool.slug,
          imported: {
            teams: teamIdMap.size,
            matches: importedMatches
          }
        };
      } catch (error) {
        console.error("[Pool Wizard] Error creating pool:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to create pool and import fixtures"
        });
      }
    })
});
