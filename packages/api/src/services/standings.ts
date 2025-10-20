/**
 * Standings Service
 * Handles fetching and caching competition standings from external API
 */

import { prisma } from "@qp/db";
import type { Prisma } from "@qp/db";

interface StandingsAPIResponse {
  get: string;
  parameters: {
    league: string;
    season: string;
  };
  errors: Record<string, string>;
  results: number;
  paging: {
    current: number;
    total: number;
  };
  response: Array<{
    league: {
      id: number;
      name: string;
      country: string;
      logo: string;
      flag: string;
      season: number;
      standings: Array<Array<{
        rank: number;
        team: {
          id: number;
          name: string;
          logo: string;
        };
        points: number;
        goalsDiff: number;
        group: string;
        form: string;
        status: string;
        description: string | null;
        all: {
          played: number;
          win: number;
          draw: number;
          lose: number;
          goals: {
            for: number;
            against: number;
          };
        };
        home: {
          played: number;
          win: number;
          draw: number;
          lose: number;
          goals: {
            for: number;
            against: number;
          };
        };
        away: {
          played: number;
          win: number;
          draw: number;
          lose: number;
          goals: {
            for: number;
            against: number;
          };
        };
        update: string;
      }>>;
    };
  }>;
}

export interface FetchStandingsOptions {
  competitionId: string;
  seasonYear: number;
  externalLeagueId: string;
  fetchedBy?: string;
  forceRefresh?: boolean;
  isManualRefresh?: boolean; // Track if this is a manual user refresh
}

export interface CachedStandings {
  id: string;
  competitionId: string;
  seasonYear: number;
  standingsData: any;
  lastFetchedAt: Date;
  lastUpdatedAt: Date;
  fetchedBy: string | null;
  createdAt: Date;
}

/**
 * Fetch standings from external API
 */
async function fetchStandingsFromAPI(
  leagueId: string,
  season: number
): Promise<StandingsAPIResponse> {
  const apiKey = process.env.SPORTS_API_KEY;
  
  if (!apiKey) {
    throw new Error("SPORTS_API_KEY is not configured");
  }

  const url = `https://v3.football.api-sports.io/standings?league=${leagueId}&season=${season}`;
  
  console.log(`🌐 Fetching standings from API: league=${leagueId}, season=${season}`);

  const response = await fetch(url, {
    headers: {
      "x-apisports-key": apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: StandingsAPIResponse = await response.json();

  if (data.errors && Object.keys(data.errors).length > 0) {
    const errorMessage = Object.values(data.errors)[0];
    throw new Error(`API Error: ${errorMessage}`);
  }

  if (!data.response || data.response.length === 0) {
    throw new Error("No standings data available from API");
  }

  console.log(`✅ Standings fetched successfully: ${data.results} result(s)`);

  return data;
}

/**
 * Get or fetch standings (with caching)
 * Returns cached data if available and not expired, otherwise fetches from API
 */
export async function getOrFetchStandings(
  options: FetchStandingsOptions
): Promise<CachedStandings> {
  const { competitionId, seasonYear, externalLeagueId, fetchedBy, forceRefresh = false, isManualRefresh = false } = options;

  // Check if we have cached data
  if (!forceRefresh) {
    const cached = await prisma.competitionStandings.findUnique({
      where: {
        competitionId_seasonYear: {
          competitionId,
          seasonYear,
        },
      },
    });

    if (cached) {
      const hoursSinceLastFetch = 
        (Date.now() - cached.lastFetchedAt.getTime()) / (1000 * 60 * 60);

      // Return cached data if less than 24 hours old
      if (hoursSinceLastFetch < 24) {
        console.log(`📦 Using cached standings (${hoursSinceLastFetch.toFixed(1)}h old)`);
        return cached as CachedStandings;
      }

      console.log(`⏰ Cached data is ${hoursSinceLastFetch.toFixed(1)}h old, refreshing...`);
    }
  }

  // Check manual refresh cooldown (5 minutes)
  if (isManualRefresh) {
    const cached = await prisma.competitionStandings.findUnique({
      where: {
        competitionId_seasonYear: {
          competitionId,
          seasonYear,
        },
      },
    });

    if (cached?.lastManualRefreshAt) {
      const minutesSinceLastManualRefresh = 
        (Date.now() - cached.lastManualRefreshAt.getTime()) / (1000 * 60);

      if (minutesSinceLastManualRefresh < 5) {
        const remainingMinutes = Math.ceil(5 - minutesSinceLastManualRefresh);
        throw new Error(
          `Please wait ${remainingMinutes} minute(s) before refreshing again. Last refresh was ${Math.floor(minutesSinceLastManualRefresh)} minute(s) ago.`
        );
      }
    }

    // Check if season has ended - don't allow manual refresh for finished seasons
    const season = await prisma.season.findFirst({
      where: {
        competitionId,
        year: seasonYear,
      },
      select: {
        endsAt: true,
      },
    });

    if (season?.endsAt && season.endsAt < new Date()) {
      throw new Error(
        "This season has ended. Standings are final and cannot be refreshed."
      );
    }
  }

  // Fetch fresh data from API
  const apiData = await fetchStandingsFromAPI(externalLeagueId, seasonYear);

  // Update Competition logoUrl if available from API
  if (apiData.response[0]?.league?.logo) {
    await prisma.competition.update({
      where: { id: competitionId },
      data: { logoUrl: apiData.response[0].league.logo },
    }).catch(err => {
      console.warn(`⚠️ Could not update competition logo: ${err.message}`);
    });
  }

  // Upsert to database
  const updateData: any = {
    standingsData: apiData.response[0] as any,
    fetchedBy,
    lastFetchedAt: new Date(),
  };

  // Update lastManualRefreshAt only for manual refreshes
  if (isManualRefresh) {
    updateData.lastManualRefreshAt = new Date();
  }

  const standings = await prisma.competitionStandings.upsert({
    where: {
      competitionId_seasonYear: {
        competitionId,
        seasonYear,
      },
    },
    create: {
      competitionId,
      seasonYear,
      ...updateData,
    },
    update: updateData,
  });

  console.log(`💾 Standings cached for competition=${competitionId}, season=${seasonYear}`);

  return standings as CachedStandings;
}

/**
 * Get cached standings without fetching
 */
export async function getCachedStandings(
  competitionId: string,
  seasonYear: number
): Promise<CachedStandings | null> {
  const standings = await prisma.competitionStandings.findUnique({
    where: {
      competitionId_seasonYear: {
        competitionId,
        seasonYear,
      },
    },
  });

  return standings as CachedStandings | null;
}

/**
 * Refresh all standings that are older than specified hours
 */
export async function refreshStaleStandings(olderThanHours: number = 24): Promise<number> {
  const cutoffDate = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
  const now = new Date();

  const staleStandings = await prisma.competitionStandings.findMany({
    where: {
      lastFetchedAt: {
        lt: cutoffDate,
      },
    },
    include: {
      competition: {
        select: {
          id: true,
          slug: true,
        },
      },
    },
  });

  console.log(`🔄 Found ${staleStandings.length} stale standings to refresh`);

  let refreshed = 0;
  const errors: Array<{ competitionId: string; error: string }> = [];

  for (const standing of staleStandings) {
    try {
      // Check if season has ended - skip if finished
      const season = await prisma.season.findFirst({
        where: {
          competitionId: standing.competitionId,
          year: standing.seasonYear,
        },
        select: {
          endsAt: true,
        },
      });

      if (season?.endsAt && season.endsAt < now) {
        console.log(`⏭️  Skipping finished season: ${standing.competitionId} (${standing.seasonYear})`);
        continue;
      }

      // Get external league ID from ExternalMap
      const externalMap = await prisma.externalMap.findFirst({
        where: {
          entityId: standing.competitionId,
          entityType: "COMPETITION",
        },
      });

      if (!externalMap) {
        console.warn(`⚠️ No external mapping found for competition ${standing.competitionId}`);
        continue;
      }

      await getOrFetchStandings({
        competitionId: standing.competitionId,
        seasonYear: standing.seasonYear,
        externalLeagueId: externalMap.externalId,
        fetchedBy: "worker",
        forceRefresh: true,
      });

      refreshed++;
      
      // Rate limiting: wait 1 second between requests to avoid hitting API limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ Error refreshing standings for ${standing.competitionId}:`, error);
      errors.push({
        competitionId: standing.competitionId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  console.log(`✅ Refreshed ${refreshed}/${staleStandings.length} standings`);
  
  if (errors.length > 0) {
    console.error(`❌ ${errors.length} errors occurred:`, errors);
  }

  return refreshed;
}

/**
 * Delete standings older than specified days
 */
export async function cleanupOldStandings(olderThanDays: number = 365): Promise<number> {
  const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);

  const result = await prisma.competitionStandings.deleteMany({
    where: {
      lastFetchedAt: {
        lt: cutoffDate,
      },
    },
  });

  console.log(`🗑️ Deleted ${result.count} old standings records`);

  return result.count;
}
