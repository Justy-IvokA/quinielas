import type { SportsProvider, SeasonDTO, ResultDTO } from "./provider";

/**
 * API-Football provider (via RapidAPI)
 * Skeleton implementation - requires API key and proper endpoint mapping
 */

interface APIFootballConfig {
  apiKey: string;
  baseUrl?: string;
}

export class APIFootballProvider implements SportsProvider {
  private config: APIFootballConfig;
  private baseUrl: string;

  constructor(config: APIFootballConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || "https://api-football-v1.p.rapidapi.com/v3";
  }

  getName(): string {
    return "api-football";
  }

  private async request<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        "X-RapidAPI-Key": this.config.apiKey,
        "X-RapidAPI-Host": "api-football-v1.p.rapidapi.com"
      }
    });

    if (!response.ok) {
      throw new Error(`API-Football request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  async fetchSeason(params: { competitionExternalId: string; year: number }): Promise<SeasonDTO> {
    // TODO: Implement actual API-Football endpoints
    // This is a skeleton - needs proper mapping of:
    // - /leagues endpoint to get league info
    // - /teams endpoint to get teams in season
    // - /fixtures endpoint to get matches

    console.warn("⚠️ API-Football provider not fully implemented. Using mock data.");

    // For now, throw to indicate not implemented
    throw new Error(
      "API-Football provider requires implementation. " +
        "Map competition IDs, fetch teams, and fixtures from API-Football endpoints."
    );

    // Example structure (commented out):
    /*
    const leagueResponse = await this.request('/leagues', {
      id: params.competitionExternalId,
      season: params.year.toString()
    });

    const teamsResponse = await this.request('/teams', {
      league: params.competitionExternalId,
      season: params.year.toString()
    });

    const fixturesResponse = await this.request('/fixtures', {
      league: params.competitionExternalId,
      season: params.year.toString()
    });

    // Map responses to SeasonDTO format
    return {
      externalId: params.competitionExternalId,
      name: leagueResponse.response[0].league.name,
      year: params.year,
      teams: teamsResponse.response.map(mapTeam),
      matches: fixturesResponse.response.map(mapMatch)
    };
    */
  }

  async fetchResults(params: { matchExternalIds: string[] }): Promise<ResultDTO[]> {
    // TODO: Implement actual API-Football results endpoint
    // This would fetch fixture details by ID and extract scores

    console.warn("⚠️ API-Football provider not fully implemented. Using mock data.");

    throw new Error(
      "API-Football provider requires implementation. " +
        "Fetch fixture details and map to ResultDTO format."
    );

    // Example structure (commented out):
    /*
    const results: ResultDTO[] = [];

    for (const matchId of params.matchExternalIds) {
      const response = await this.request('/fixtures', {
        id: matchId
      });

      const fixture = response.response[0];

      results.push({
        matchExternalId: matchId,
        status: mapStatus(fixture.fixture.status.short),
        homeScore: fixture.goals.home,
        awayScore: fixture.goals.away,
        finishedAt: fixture.fixture.status.short === 'FT' 
          ? new Date(fixture.fixture.date) 
          : undefined
      });
    }

    return results;
    */
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
