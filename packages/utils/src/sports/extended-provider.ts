/**
 * Extended sports provider interface for wizard integration
 * Adds competition/season/stage discovery methods
 */

export interface CompetitionDTO {
  externalId: string;
  name: string;
  country?: string;
  type?: "LEAGUE" | "CUP" | "TOURNAMENT";
  logoUrl?: string;
  isYouth?: boolean; // U-20, U-17, etc.
  meta?: Record<string, any>;
}

export interface SeasonInfoDTO {
  year: number;
  label?: string; // e.g., "2025/2026"
  startsAt?: Date;
  endsAt?: Date;
  isCurrent?: boolean;
}

export interface StageDTO {
  label: string; // e.g., "Final Stages", "Group Stage"
  rounds?: string[]; // e.g., ["Semi-finals", "Final"]
}

export interface FixturePreviewDTO {
  teamsCount: number;
  matchesCount: number;
  sampleMatches: Array<{
    homeTeam: string;
    awayTeam: string;
    kickoffTime: Date;
    round?: string;
    stage?: string;
  }>;
}

/**
 * Extended provider interface for wizard flows
 */
export interface ExtendedSportsProvider {
  /**
   * List available competitions with optional filtering
   */
  listCompetitions(params: {
    query?: string;
    country?: string;
    youthOnly?: boolean;
    limit?: number;
  }): Promise<CompetitionDTO[]>;

  /**
   * List available seasons for a competition
   */
  listSeasons(params: {
    competitionExternalId: string;
  }): Promise<SeasonInfoDTO[]>;

  /**
   * List stages and rounds for a specific season
   */
  listStagesAndRounds(params: {
    competitionExternalId: string;
    seasonYear: number;
  }): Promise<StageDTO[]>;

  /**
   * Preview fixtures for a given scope (stage/round filter)
   */
  previewFixtures(params: {
    competitionExternalId: string;
    seasonYear: number;
    stageLabel?: string;
    roundLabel?: string;
  }): Promise<FixturePreviewDTO>;
}
