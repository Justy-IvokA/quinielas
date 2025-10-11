import type { SportsProvider, SeasonDTO, ResultDTO, TeamDTO, MatchDTO } from "./provider";
import { sportsAPICache } from "./cache";

/**
 * API-Football provider (API-Sports v3)
 * Full implementation with retry logic, rate-limit awareness, and caching
 * 
 * Base URL: https://v3.football.api-sports.io
 * Documentation: https://www.api-football.com/documentation-v3
 * 
 * Note: Uses direct API-Sports endpoint, NOT RapidAPI
 */

interface APIFootballConfig {
  apiKey: string;
  baseUrl?: string;
  maxRetries?: number;
  retryDelayMs?: number;
  enableCache?: boolean;
  cacheTTLMinutes?: number;
}

interface APIFootballResponse<T> {
  get: string;
  parameters: Record<string, string>;
  errors: any[];
  results: number;
  paging: {
    current: number;
    total: number;
  };
  response: T;
}

export class APIFootballProvider implements SportsProvider {
  private config: APIFootballConfig;
  private baseUrl: string;
  private maxRetries: number;
  private retryDelayMs: number;
  private enableCache: boolean;
  private cacheTTLMinutes: number;

  constructor(config: APIFootballConfig) {
    this.config = config;
    // API-Sports direct endpoint (NOT RapidAPI)
    this.baseUrl = config.baseUrl || "https://v3.football.api-sports.io";
    this.maxRetries = config.maxRetries || 3;
    this.retryDelayMs = config.retryDelayMs || 1000;
    this.enableCache = config.enableCache !== false; // Enabled by default
    this.cacheTTLMinutes = config.cacheTTLMinutes || 60; // 1 hour default
  }

  getName(): string {
    return "api-football";
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async request<T>(
    endpoint: string,
    params?: Record<string, string>,
    retryCount = 0
  ): Promise<APIFootballResponse<T>> {
    // Check cache first
    if (this.enableCache && params) {
      const cached = sportsAPICache.get<APIFootballResponse<T>>(
        this.getName(),
        endpoint,
        params
      );
      if (cached) {
        return cached;
      }
    }

    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    try {
      const response = await fetch(url.toString(), {
        headers: {
          "x-apisports-key": this.config.apiKey
        }
      });

      // Handle rate limiting (429)
      if (response.status === 429) {
        if (retryCount < this.maxRetries) {
          const backoffDelay = this.retryDelayMs * Math.pow(2, retryCount);
          console.warn(`[API-Football] Rate limited. Retrying in ${backoffDelay}ms...`);
          await this.sleep(backoffDelay);
          return this.request<T>(endpoint, params, retryCount + 1);
        }
        throw new Error("API-Football rate limit exceeded");
      }

      if (!response.ok) {
        throw new Error(`API-Football request failed: ${response.status} ${response.statusText}`);
      }

      const data: APIFootballResponse<T> = await response.json();

      // Check for API errors
      if (data.errors && Object.keys(data.errors).length > 0) {
        throw new Error(`API-Football error: ${JSON.stringify(data.errors)}`);
      }

      // Cache the successful response
      if (this.enableCache && params) {
        sportsAPICache.set(
          this.getName(),
          endpoint,
          params,
          data,
          this.cacheTTLMinutes
        );
      }

      return data;
    } catch (error) {
      // Retry on network errors
      if (retryCount < this.maxRetries && error instanceof Error && error.message.includes("fetch")) {
        const backoffDelay = this.retryDelayMs * Math.pow(2, retryCount);
        console.warn(`[API-Football] Network error. Retrying in ${backoffDelay}ms...`);
        await this.sleep(backoffDelay);
        return this.request<T>(endpoint, params, retryCount + 1);
      }
      throw error;
    }
  }

  async fetchSeason(params: { competitionExternalId: string; year: number }): Promise<SeasonDTO> {
    console.log(`[API-Football] Fetching season for league ${params.competitionExternalId}, year ${params.year}`);

    // Fetch league info
    const leagueResponse = await this.request<any[]>("/leagues", {
      id: params.competitionExternalId,
      season: params.year.toString()
    });

    if (!leagueResponse.response || leagueResponse.response.length === 0) {
      throw new Error(`League ${params.competitionExternalId} not found for season ${params.year}`);
    }

    const league = leagueResponse.response[0];
    const seasonName = `${league.league.name} ${params.year}`;

    // Fetch teams
    const teamsResponse = await this.request<any[]>("/teams", {
      league: params.competitionExternalId,
      season: params.year.toString()
    });

    const teams: TeamDTO[] = teamsResponse.response.map((item: any) => ({
      externalId: item.team.id.toString(),
      name: item.team.name,
      shortName: item.team.code || item.team.name.substring(0, 3).toUpperCase(),
      logoUrl: item.team.logo,
      countryCode: item.team.country
    }));

    // Fetch fixtures
    const fixturesResponse = await this.request<any[]>("/fixtures", {
      league: params.competitionExternalId,
      season: params.year.toString()
    });

    const matches: MatchDTO[] = fixturesResponse.response.map((item: any) => {
      const fixture = item.fixture;
      const teams = item.teams;
      const goals = item.goals;
      const score = item.score;

      return {
        externalId: fixture.id.toString(),
        round: this.parseRound(item.league.round),
        matchday: this.parseMatchday(item.league.round),
        kickoffTime: new Date(fixture.date),
        homeTeamExternalId: teams.home.id.toString(),
        awayTeamExternalId: teams.away.id.toString(),
        venue: fixture.venue?.name,
        status: mapStatus(fixture.status.short),
        homeScore: goals.home,
        awayScore: goals.away,
        finishedAt: fixture.status.short === "FT" ? new Date(fixture.date) : undefined
      };
    });

    return {
      externalId: params.competitionExternalId,
      name: seasonName,
      year: params.year,
      startsAt: league.seasons?.[0]?.start ? new Date(league.seasons[0].start) : undefined,
      endsAt: league.seasons?.[0]?.end ? new Date(league.seasons[0].end) : undefined,
      teams,
      matches
    };
  }

  private parseRound(roundString: string): number {
    // Extract number from strings like "Regular Season - 1", "Group A - 1", etc.
    const match = roundString.match(/\d+/);
    return match ? parseInt(match[0], 10) : 1;
  }

  private parseMatchday(roundString: string): number | undefined {
    // For group stages, extract matchday if available
    const match = roundString.match(/Matchday (\d+)/i);
    return match ? parseInt(match[1], 10) : undefined;
  }

  async fetchResults(params: { matchExternalIds: string[] }): Promise<ResultDTO[]> {
    if (params.matchExternalIds.length === 0) {
      return [];
    }

    console.log(`[API-Football] Fetching results for ${params.matchExternalIds.length} matches`);

    const results: ResultDTO[] = [];

    // API-Football allows fetching multiple fixtures by IDs (separated by -)
    // But to avoid URL length issues, we batch them
    const batchSize = 20;
    for (let i = 0; i < params.matchExternalIds.length; i += batchSize) {
      const batch = params.matchExternalIds.slice(i, i + batchSize);
      const idsParam = batch.join("-");

      const response = await this.request<any[]>("/fixtures", {
        ids: idsParam
      });

      for (const item of response.response) {
        const fixture = item.fixture;
        const goals = item.goals;

        results.push({
          matchExternalId: fixture.id.toString(),
          status: mapStatus(fixture.status.short),
          homeScore: goals.home,
          awayScore: goals.away,
          finishedAt: fixture.status.short === "FT" ? new Date(fixture.date) : undefined
        });
      }
    }

    return results;
  }
}

/**
 * Helper to map API-Football status codes to our status enum
 */
function mapStatus(apiStatus: string): "SCHEDULED" | "LIVE" | "FINISHED" | "POSTPONED" | "CANCELLED" {
  const statusMap: Record<string, "SCHEDULED" | "LIVE" | "FINISHED" | "POSTPONED" | "CANCELLED"> = {
    TBD: "SCHEDULED",
    NS: "SCHEDULED",
    "1H": "LIVE",
    HT: "LIVE",
    "2H": "LIVE",
    ET: "LIVE",
    P: "LIVE",
    FT: "FINISHED",
    AET: "FINISHED",
    PEN: "FINISHED",
    PST: "POSTPONED",
    CANC: "CANCELLED",
    ABD: "CANCELLED"
  };

  return statusMap[apiStatus] || "SCHEDULED";
}
