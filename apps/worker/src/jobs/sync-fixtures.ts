import { prisma } from "@qp/db";
import { getSportsProvider, type MatchDTO, type TeamDTO } from "@qp/utils";

export async function syncFixturesJob(params: {
  seasonId: string;
  competitionExternalId: string;
  year: number;
  providerName?: string;
  apiKey?: string;
}) {
  console.log(`[SyncFixtures] Starting sync for season ${params.seasonId}`);

  const season = await prisma.season.findUnique({
    where: { id: params.seasonId },
    include: {
      competition: {
        include: {
          sport: true
        }
      }
    }
  });

  if (!season) {
    throw new Error(`Season ${params.seasonId} not found`);
  }

  // Get provider (from env or params)
  const providerName = params.providerName || process.env.SPORTS_PROVIDER || "mock";
  const apiKey = params.apiKey || process.env.SPORTS_API_KEY;

  const provider = getSportsProvider({
    provider: providerName as "mock" | "api-football" | "sportmonks",
    apiKey
  });

  console.log(`[SyncFixtures] Using provider: ${provider.getName()}`);

  // Fetch season data from provider
  const seasonData = await provider.fetchSeason({
    competitionExternalId: params.competitionExternalId,
    year: params.year
  });

  console.log(
    `[SyncFixtures] Fetched ${seasonData.teams.length} teams and ${seasonData.matches.length} matches`
  );

  // Get or create external source
  const externalSource = await prisma.externalSource.upsert({
    where: { slug: provider.getName() },
    create: {
      name: provider.getName(),
      slug: provider.getName()
    },
    update: {}
  });

  // Sync teams first
  const teamIdMap = new Map<string, string>(); // externalId -> internalId

  for (const teamDTO of seasonData.teams) {
    // Check if team already exists via external mapping
    let teamMapping = await prisma.externalMap.findFirst({
      where: {
        sourceId: externalSource.id,
        entityType: "TEAM",
        externalId: teamDTO.externalId
      }
    });

    let teamId: string;

    if (teamMapping) {
      teamId = teamMapping.entityId;
      // Update team info
      await prisma.team.update({
        where: { id: teamId },
        data: {
          name: teamDTO.name,
          shortName: teamDTO.shortName,
          logoUrl: teamDTO.logoUrl,
          countryCode: teamDTO.countryCode
        }
      });
    } else {
      // Generate slug
      const slug = teamDTO.name.toLowerCase().replace(/\s+/g, "-");
      
      // Upsert team (create or update if exists by sportId + slug)
      const team = await prisma.team.upsert({
        where: {
          sportId_slug: {
            sportId: season.competition.sportId,
            slug: slug
          }
        },
        update: {
          name: teamDTO.name,
          shortName: teamDTO.shortName,
          logoUrl: teamDTO.logoUrl,
          countryCode: teamDTO.countryCode
        },
        create: {
          sportId: season.competition.sportId,
          slug: slug,
          name: teamDTO.name,
          shortName: teamDTO.shortName,
          logoUrl: teamDTO.logoUrl,
          countryCode: teamDTO.countryCode
        }
      });

      teamId = team.id;

      // Create external mapping if it doesn't exist
      await prisma.externalMap.upsert({
        where: {
          sourceId_entityType_externalId: {
            sourceId: externalSource.id,
            entityType: "TEAM",
            externalId: teamDTO.externalId
          }
        },
        update: {
          entityId: teamId
        },
        create: {
          sourceId: externalSource.id,
          entityType: "TEAM",
          entityId: teamId,
          externalId: teamDTO.externalId
        }
      });
    }

    // Ensure TeamSeason exists
    await prisma.teamSeason.upsert({
      where: {
        teamId_seasonId: {
          teamId,
          seasonId: params.seasonId
        }
      },
      create: {
        teamId,
        seasonId: params.seasonId
      },
      update: {}
    });

    teamIdMap.set(teamDTO.externalId, teamId);
  }

  console.log(`[SyncFixtures] Synced ${teamIdMap.size} teams`);

  // Sync matches
  let syncedCount = 0;
  let errorCount = 0;

  for (const matchDTO of seasonData.matches) {
    try {
      const homeTeamId = teamIdMap.get(matchDTO.homeTeamExternalId);
      const awayTeamId = teamIdMap.get(matchDTO.awayTeamExternalId);

      if (!homeTeamId || !awayTeamId) {
        console.warn(`[SyncFixtures] Missing team mapping for match ${matchDTO.externalId}`);
        errorCount++;
        continue;
      }

      // Upsert match
      const match = await prisma.match.upsert({
        where: {
          seasonId_round_homeTeamId_awayTeamId: {
            seasonId: params.seasonId,
            round: matchDTO.round || 1,
            homeTeamId,
            awayTeamId
          }
        },
        create: {
          seasonId: params.seasonId,
          round: matchDTO.round,
          matchday: matchDTO.matchday,
          homeTeamId,
          awayTeamId,
          kickoffTime: matchDTO.kickoffTime,
          venue: matchDTO.venue,
          status: matchDTO.status,
          homeScore: matchDTO.homeScore,
          awayScore: matchDTO.awayScore,
          locked: matchDTO.status !== "SCHEDULED",
          finishedAt: matchDTO.finishedAt
        },
        update: {
          kickoffTime: matchDTO.kickoffTime,
          venue: matchDTO.venue,
          status: matchDTO.status,
          homeScore: matchDTO.homeScore,
          awayScore: matchDTO.awayScore,
          locked: matchDTO.status !== "SCHEDULED",
          finishedAt: matchDTO.finishedAt
        }
      });

      // Create or update external mapping for match
      await prisma.externalMap.upsert({
        where: {
          sourceId_entityType_externalId: {
            sourceId: externalSource.id,
            entityType: "MATCH",
            externalId: matchDTO.externalId
          }
        },
        create: {
          sourceId: externalSource.id,
          entityType: "MATCH",
          externalId: matchDTO.externalId,
          entityId: match.id
        },
        update: {
          entityId: match.id
        }
      });

      syncedCount++;
    } catch (error) {
      console.error(`[SyncFixtures] Error syncing match ${matchDTO.externalId}:`, error);
      errorCount++;
    }
  }

  console.log(`[SyncFixtures] Completed. Synced: ${syncedCount}, Errors: ${errorCount}`);

  return {
    seasonId: params.seasonId,
    syncedCount,
    errorCount,
    totalFixtures: seasonData.matches.length,
    totalTeams: seasonData.teams.length
  };
}
