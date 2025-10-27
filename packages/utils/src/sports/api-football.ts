import type { SportsProvider, SeasonDTO, ResultDTO, TeamDTO, MatchDTO } from "./provider";
import type { ExtendedSportsProvider, CompetitionDTO, SeasonInfoDTO, StageDTO, FixturePreviewDTO } from "./extended-provider";
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

export class APIFootballProvider implements SportsProvider, ExtendedSportsProvider {
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
      competitionLogoUrl: league.league?.logo || undefined,
      teams,
      matches
    };
  }

  async fetchSeasonRound(params: { 
    competitionExternalId: string; 
    year: number;
    stageLabel?: string;
    roundLabel?: string;
  }): Promise<SeasonDTO> {
    console.log(`[API-Football] Fetching season round for league ${params.competitionExternalId}, year ${params.year}, stage=${params.stageLabel}, round=${params.roundLabel}`);

    // Fetch league info
    const leagueResponse = await this.request<any[]>("/leagues", {
      id: params.competitionExternalId,
      season: params.year.toString()
    });

    if (!leagueResponse.response || leagueResponse.response.length === 0) {
      throw new Error(`No se encontró la liga ${params.competitionExternalId} para la temporada ${params.year}`);
    }

    const league = leagueResponse.response[0];
    const seasonName = `${league.league.name} ${params.year}`;

    // Build round filter for API
    // API-Football expects format like "Regular Season - 16" or "Apertura - 16"
    let roundFilter: string | undefined;
    if (params.stageLabel && params.roundLabel) {
      roundFilter = `${params.stageLabel} - ${params.roundLabel}`;
    } else if (params.stageLabel) {
      // Try common patterns
      roundFilter = params.stageLabel;
    }

    // Fetch fixtures with round filter
    const fixturesParams: Record<string, string> = {
      league: params.competitionExternalId,
      season: params.year.toString(),
    };
    
    if (roundFilter) {
      fixturesParams.round = roundFilter;
      console.log(`[API-Football] Filtrando por etapa - jornada: "${roundFilter}"`);
    }

    const fixturesResponse = await this.request<any[]>("/fixtures", fixturesParams);

    if (!fixturesResponse.response || fixturesResponse.response.length === 0) {
      console.warn(`[API-Football] No se encontraron partidos para la etapa - jornada: "${roundFilter}"`);
    }

    const matches: MatchDTO[] = fixturesResponse.response.map((item: any) => {
      const fixture = item.fixture;
      const teams = item.teams;
      const goals = item.goals;

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

    // Get unique team IDs from matches
    const teamExternalIds = new Set<string>();
    for (const match of matches) {
      teamExternalIds.add(match.homeTeamExternalId);
      teamExternalIds.add(match.awayTeamExternalId);
    }

    // Fetch only teams that participate in these matches
    const teams: TeamDTO[] = [];
    
    if (teamExternalIds.size > 0) {
      // API-Football doesn't support filtering teams by ID list, so we fetch all and filter
      const teamsResponse = await this.request<any[]>("/teams", {
        league: params.competitionExternalId,
        season: params.year.toString()
      });

      const filteredTeams = teamsResponse.response
        .filter((item: any) => teamExternalIds.has(item.team.id.toString()))
        .map((item: any) => ({
          externalId: item.team.id.toString(),
          name: item.team.name,
          shortName: item.team.code || item.team.name.substring(0, 3).toUpperCase(),
          logoUrl: item.team.logo,
          countryCode: item.team.country
        }));
      
      teams.push(...filteredTeams);
      console.log(`[API-Football] Fetched ${teams.length} teams for ${matches.length} matches`);
    }

    return {
      externalId: params.competitionExternalId,
      name: seasonName,
      year: params.year,
      startsAt: league.seasons?.[0]?.start ? new Date(league.seasons[0].start) : undefined,
      endsAt: league.seasons?.[0]?.end ? new Date(league.seasons[0].end) : undefined,
      competitionLogoUrl: league.league?.logo || undefined,
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

  /**
   * List available competitions with optional filtering
   */
  async listCompetitions(params: {
    query?: string;
    country?: string;
    youthOnly?: boolean;
    limit?: number;
  }): Promise<CompetitionDTO[]> {
    console.log(`[API-Football] Listing competitions`, params);

    const requestParams: Record<string, string> = {};
    
    if (params.query) {
      requestParams.search = params.query;
    }
    if (params.country) {
      requestParams.country = params.country;
    }

    const response = await this.request<any[]>("/leagues", requestParams);

    let competitions: CompetitionDTO[] = response.response.map((item: any) => {
      const league = item.league;
      const country = item.country;
      
      // Detect youth competitions from name
      const isYouth = /U-?\d{2}|Under[- ]?\d{2}|Youth/i.test(league.name);
      
      return {
        externalId: league.id.toString(),
        name: league.name,
        country: country?.name,
        type: league.type === "Cup" ? "CUP" : league.type === "League" ? "LEAGUE" : "TOURNAMENT",
        logoUrl: league.logo,
        isYouth,
        meta: {
          countryCode: country?.code,
          countryFlag: country?.flag
        }
      };
    });

    // Filter by youth if requested
    if (params.youthOnly) {
      competitions = competitions.filter(c => c.isYouth);
    }

    // Apply limit
    if (params.limit) {
      competitions = competitions.slice(0, params.limit);
    }

    return competitions;
  }

  /**
   * List available seasons for a competition
   */
  async listSeasons(params: {
    competitionExternalId: string;
  }): Promise<SeasonInfoDTO[]> {
    console.log(`[API-Football] Listing seasons for league ${params.competitionExternalId}`);

    const response = await this.request<any[]>("/leagues", {
      id: params.competitionExternalId
    });

    if (!response.response || response.response.length === 0) {
      return [];
    }

    const league = response.response[0];
    const seasons: SeasonInfoDTO[] = (league.seasons || []).map((season: any) => ({
      year: season.year,
      label: season.year.toString(),
      startsAt: season.start ? new Date(season.start) : undefined,
      endsAt: season.end ? new Date(season.end) : undefined,
      isCurrent: season.current === true
    }));

    // Sort by year descending (most recent first)
    return seasons.sort((a, b) => b.year - a.year);
  }

  /**
   * List stages and rounds for a specific season
   */
  async listStagesAndRounds(params: {
    competitionExternalId: string;
    seasonYear: number;
  }): Promise<StageDTO[]> {
    console.log(`[API-Football] Listing stages/rounds for league ${params.competitionExternalId}, season ${params.seasonYear}`);

    // Fetch all fixtures to extract unique stages/rounds
    const response = await this.request<any[]>("/fixtures", {
      league: params.competitionExternalId,
      season: params.seasonYear.toString()
    });

    // Extract unique rounds and group by stage
    const stagesMap = new Map<string, Set<string>>();

    for (const item of response.response) {
      const roundString = item.league.round || "Regular Season";
      
      // Parse stage and round from strings like:
      // "Regular Season - 1", "Group A - 1", "Final Stages - Semi-finals"
      const parts = roundString.split(" - ");
      
      if (parts.length >= 2) {
        const stage = parts[0].trim();
        const round = parts.slice(1).join(" - ").trim();
        
        if (!stagesMap.has(stage)) {
          stagesMap.set(stage, new Set());
        }
        stagesMap.get(stage)!.add(round);
      } else {
        // Single-part round (no stage)
        if (!stagesMap.has("Regular Season")) {
          stagesMap.set("Regular Season", new Set());
        }
        stagesMap.get("Regular Season")!.add(roundString);
      }
    }

    // Convert to DTO array
    const stages: StageDTO[] = Array.from(stagesMap.entries()).map(([label, roundsSet]) => ({
      label,
      rounds: Array.from(roundsSet).sort()
    }));

    return stages;
  }

  /**
   * Preview fixtures for a given scope (stage/round filter)
   */
  async previewFixtures(params: {
    competitionExternalId: string;
    seasonYear: number;
    stageLabel?: string;
    roundLabel?: string;
  }): Promise<FixturePreviewDTO> {
    console.log(`[API-Football] Previewing fixtures`, params);

    // Fetch all fixtures
    const response = await this.request<any[]>("/fixtures", {
      league: params.competitionExternalId,
      season: params.seasonYear.toString()
    });

    // Filter by stage/round if provided
    let filteredFixtures = response.response;

    if (params.stageLabel || params.roundLabel) {
      filteredFixtures = filteredFixtures.filter((item: any) => {
        const roundString = item.league.round || "";
        
        if (params.stageLabel && params.roundLabel) {
          // Both stage and round must match
          return roundString.includes(params.stageLabel) && roundString.includes(params.roundLabel);
        } else if (params.stageLabel) {
          // Only stage must match
          return roundString.includes(params.stageLabel);
        } else if (params.roundLabel) {
          // Only round must match
          return roundString.includes(params.roundLabel);
        }
        
        return true;
      });
    }

    // Extract unique teams
    const teamsSet = new Set<string>();
    filteredFixtures.forEach((item: any) => {
      teamsSet.add(item.teams.home.id.toString());
      teamsSet.add(item.teams.away.id.toString());
    });

    // Sample matches (up to 5)
    const sampleMatches = filteredFixtures.slice(0, 5).map((item: any) => ({
      homeTeam: item.teams.home.name,
      awayTeam: item.teams.away.name,
      kickoffTime: new Date(item.fixture.date),
      round: item.league.round,
      stage: params.stageLabel
    }));

    // Calculate date range
    let dateRange: { start: Date; end: Date } | undefined;
    if (filteredFixtures.length > 0) {
      const dates = filteredFixtures
        .map((item: any) => new Date(item.fixture.date))
        .filter((date: Date) => !isNaN(date.getTime()));
      
      if (dates.length > 0) {
        dateRange = {
          start: new Date(Math.min(...dates.map(d => d.getTime()))),
          end: new Date(Math.max(...dates.map(d => d.getTime())))
        };
      }
    }

    return {
      teamsCount: teamsSet.size,
      matchesCount: filteredFixtures.length,
      sampleMatches,
      dateRange
    };
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
