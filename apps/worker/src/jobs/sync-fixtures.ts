import { prisma } from "@qp/db";

interface ExternalFixture {
  externalId: string;
  round: number;
  homeTeamExternalId: string;
  awayTeamExternalId: string;
  kickoffTime: Date;
  venue?: string;
  status: "SCHEDULED" | "LIVE" | "FINISHED" | "POSTPONED" | "CANCELLED";
  homeScore?: number;
  awayScore?: number;
}

export async function syncFixturesJob(seasonId: string, externalSourceId: string) {
  console.log(`[SyncFixtures] Starting sync for season ${seasonId} from source ${externalSourceId}`);

  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    include: {
      competition: true
    }
  });

  if (!season) {
    throw new Error(`Season ${seasonId} not found`);
  }

  const externalSource = await prisma.externalSource.findUnique({
    where: { id: externalSourceId }
  });

  if (!externalSource) {
    throw new Error(`External source ${externalSourceId} not found`);
  }

  // Get external season mapping
  const seasonMapping = await prisma.externalMap.findFirst({
    where: {
      sourceId: externalSourceId,
      entityType: "SEASON",
      entityId: seasonId
    }
  });

  if (!seasonMapping) {
    throw new Error(`No external mapping found for season ${seasonId}`);
  }

  // Fetch fixtures from external API
  // Note: ExternalSource schema doesn't have provider/apiKey fields yet
  // This is a placeholder for future implementation
  const externalFixtures = await fetchFixturesFromProvider(
    "mock",
    "",
    seasonMapping.externalId
  );

  console.log(`[SyncFixtures] Fetched ${externalFixtures.length} fixtures from external API`);

  let syncedCount = 0;
  let errorCount = 0;

  for (const fixture of externalFixtures) {
    try {
      // Map external team IDs to internal team IDs
      const homeTeamMapping = await prisma.externalMap.findFirst({
        where: {
          sourceId: externalSourceId,
          entityType: "TEAM",
          externalId: fixture.homeTeamExternalId
        }
      });

      const awayTeamMapping = await prisma.externalMap.findFirst({
        where: {
          sourceId: externalSourceId,
          entityType: "TEAM",
          externalId: fixture.awayTeamExternalId
        }
      });

      if (!homeTeamMapping || !awayTeamMapping) {
        console.warn(`[SyncFixtures] Missing team mapping for fixture ${fixture.externalId}`);
        errorCount++;
        continue;
      }

      // Find TeamSeason records
      const homeTeamSeason = await prisma.teamSeason.findFirst({
        where: {
          seasonId,
          teamId: homeTeamMapping.entityId
        }
      });

      const awayTeamSeason = await prisma.teamSeason.findFirst({
        where: {
          seasonId,
          teamId: awayTeamMapping.entityId
        }
      });

      if (!homeTeamSeason || !awayTeamSeason) {
        console.warn(`[SyncFixtures] Missing TeamSeason for fixture ${fixture.externalId}`);
        errorCount++;
        continue;
      }

      // Upsert match
      await prisma.match.upsert({
        where: {
          seasonId_round_homeTeamId_awayTeamId: {
            seasonId,
            round: fixture.round,
            homeTeamId: homeTeamSeason.id,
            awayTeamId: awayTeamSeason.id
          }
        },
        create: {
          seasonId,
          round: fixture.round,
          homeTeamId: homeTeamSeason.id,
          awayTeamId: awayTeamSeason.id,
          kickoffTime: fixture.kickoffTime,
          venue: fixture.venue,
          status: fixture.status,
          homeScore: fixture.homeScore,
          awayScore: fixture.awayScore,
          locked: fixture.status !== "SCHEDULED"
        },
        update: {
          kickoffTime: fixture.kickoffTime,
          venue: fixture.venue,
          status: fixture.status,
          homeScore: fixture.homeScore,
          awayScore: fixture.awayScore,
          locked: fixture.status !== "SCHEDULED",
          ...(fixture.status === "FINISHED" && !fixture.homeScore && { finishedAt: new Date() })
        }
      });

      // Create or update external mapping for match
      await prisma.externalMap.upsert({
        where: {
          sourceId_entityType_externalId: {
            sourceId: externalSourceId,
            entityType: "MATCH",
            externalId: fixture.externalId
          }
        },
        create: {
          sourceId: externalSourceId,
          entityType: "MATCH",
          externalId: fixture.externalId,
          entityId: `${seasonId}-${fixture.round}-${homeTeamSeason.id}-${awayTeamSeason.id}`
        },
        update: {}
      });

      syncedCount++;
    } catch (error) {
      console.error(`[SyncFixtures] Error syncing fixture ${fixture.externalId}:`, error);
      errorCount++;
    }
  }

  console.log(`[SyncFixtures] Completed. Synced: ${syncedCount}, Errors: ${errorCount}`);

  return {
    seasonId,
    syncedCount,
    errorCount,
    totalFixtures: externalFixtures.length
  };
}

async function fetchFixturesFromProvider(
  provider: string,
  apiKey: string,
  externalSeasonId: string
): Promise<ExternalFixture[]> {
  // TODO: Implement actual API calls based on provider
  // This is a placeholder that would be replaced with actual API integration

  switch (provider) {
    case "API_FOOTBALL":
      return fetchFromApiFootball(apiKey, externalSeasonId);
    case "SPORTMONKS":
      return fetchFromSportmonks(apiKey, externalSeasonId);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

async function fetchFromApiFootball(apiKey: string, seasonId: string): Promise<ExternalFixture[]> {
  // Placeholder for API-Football integration
  // const response = await fetch(`https://v3.football.api-sports.io/fixtures?season=${seasonId}`, {
  //   headers: { 'x-rapidapi-key': apiKey }
  // });
  // const data = await response.json();
  // return data.response.map(transformApiFootballFixture);

  console.log(`[API-Football] Would fetch fixtures for season ${seasonId}`);
  return [];
}

async function fetchFromSportmonks(apiKey: string, seasonId: string): Promise<ExternalFixture[]> {
  // Placeholder for Sportmonks integration
  // const response = await fetch(`https://api.sportmonks.com/v3/football/fixtures/season/${seasonId}`, {
  //   headers: { 'Authorization': apiKey }
  // });
  // const data = await response.json();
  // return data.data.map(transformSportmonksFixture);

  console.log(`[Sportmonks] Would fetch fixtures for season ${seasonId}`);
  return [];
}
