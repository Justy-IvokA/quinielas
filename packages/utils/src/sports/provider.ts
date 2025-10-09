/**
 * Sports data provider interface
 * Abstracts external sports APIs (API-Football, SportMonks, etc.)
 */

export interface TeamDTO {
  externalId: string;
  name: string;
  shortName?: string;
  logoUrl?: string;
  countryCode?: string;
}

export interface MatchDTO {
  externalId: string;
  round?: number;
  matchday?: number;
  kickoffTime: Date;
  homeTeamExternalId: string;
  awayTeamExternalId: string;
  venue?: string;
  status: "SCHEDULED" | "LIVE" | "FINISHED" | "POSTPONED" | "CANCELLED";
  homeScore?: number;
  awayScore?: number;
  finishedAt?: Date;
}

export interface SeasonDTO {
  externalId: string;
  name: string;
  year: number;
  startsAt?: Date;
  endsAt?: Date;
  teams: TeamDTO[];
  matches: MatchDTO[];
}

export interface ResultDTO {
  matchExternalId: string;
  status: "SCHEDULED" | "LIVE" | "FINISHED" | "POSTPONED" | "CANCELLED";
  homeScore?: number;
  awayScore?: number;
  finishedAt?: Date;
}

export interface SportsProvider {
  /**
   * Fetch season data including teams and fixtures
   */
  fetchSeason(params: { competitionExternalId: string; year: number }): Promise<SeasonDTO>;

  /**
   * Fetch results for specific matches
   */
  fetchResults(params: { matchExternalIds: string[] }): Promise<ResultDTO[]>;

  /**
   * Get provider name
   */
  getName(): string;
}
