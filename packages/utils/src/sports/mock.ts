import type { SportsProvider, SeasonDTO, ResultDTO, TeamDTO, MatchDTO } from "./provider";

/**
 * Mock sports provider for development and testing
 * Returns static World Cup 2026 data
 */
export class MockSportsProvider implements SportsProvider {
  getName(): string {
    return "mock";
  }

  async fetchSeason(params: { competitionExternalId: string; year: number }): Promise<SeasonDTO> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const teams: TeamDTO[] = [
      {
        externalId: "mock-team-mex",
        name: "Mexico",
        shortName: "MEX",
        logoUrl: "https://flagcdn.com/w80/mx.png",
        countryCode: "MX"
      },
      {
        externalId: "mock-team-usa",
        name: "United States",
        shortName: "USA",
        logoUrl: "https://flagcdn.com/w80/us.png",
        countryCode: "US"
      },
      {
        externalId: "mock-team-can",
        name: "Canada",
        shortName: "CAN",
        logoUrl: "https://flagcdn.com/w80/ca.png",
        countryCode: "CA"
      },
      {
        externalId: "mock-team-arg",
        name: "Argentina",
        shortName: "ARG",
        logoUrl: "https://flagcdn.com/w80/ar.png",
        countryCode: "AR"
      },
      {
        externalId: "mock-team-bra",
        name: "Brazil",
        shortName: "BRA",
        logoUrl: "https://flagcdn.com/w80/br.png",
        countryCode: "BR"
      },
      {
        externalId: "mock-team-ger",
        name: "Germany",
        shortName: "GER",
        logoUrl: "https://flagcdn.com/w80/de.png",
        countryCode: "DE"
      },
      {
        externalId: "mock-team-fra",
        name: "France",
        shortName: "FRA",
        logoUrl: "https://flagcdn.com/w80/fr.png",
        countryCode: "FR"
      },
      {
        externalId: "mock-team-esp",
        name: "Spain",
        shortName: "ESP",
        logoUrl: "https://flagcdn.com/w80/es.png",
        countryCode: "ES"
      }
    ];

    const baseDate = new Date("2026-06-08T18:00:00.000Z");

    const matches: MatchDTO[] = [
      {
        externalId: "mock-match-1",
        round: 1,
        matchday: 1,
        kickoffTime: new Date(baseDate),
        homeTeamExternalId: "mock-team-mex",
        awayTeamExternalId: "mock-team-usa",
        venue: "Estadio Azteca",
        status: "SCHEDULED"
      },
      {
        externalId: "mock-match-2",
        round: 1,
        matchday: 1,
        kickoffTime: new Date(baseDate.getTime() + 3 * 60 * 60 * 1000),
        homeTeamExternalId: "mock-team-can",
        awayTeamExternalId: "mock-team-arg",
        venue: "BMO Field",
        status: "SCHEDULED"
      },
      {
        externalId: "mock-match-3",
        round: 1,
        matchday: 1,
        kickoffTime: new Date(baseDate.getTime() + 24 * 60 * 60 * 1000),
        homeTeamExternalId: "mock-team-bra",
        awayTeamExternalId: "mock-team-ger",
        venue: "MetLife Stadium",
        status: "SCHEDULED"
      },
      {
        externalId: "mock-match-4",
        round: 1,
        matchday: 1,
        kickoffTime: new Date(baseDate.getTime() + 27 * 60 * 60 * 1000),
        homeTeamExternalId: "mock-team-fra",
        awayTeamExternalId: "mock-team-esp",
        venue: "SoFi Stadium",
        status: "SCHEDULED"
      },
      {
        externalId: "mock-match-5",
        round: 2,
        matchday: 2,
        kickoffTime: new Date(baseDate.getTime() + 4 * 24 * 60 * 60 * 1000),
        homeTeamExternalId: "mock-team-usa",
        awayTeamExternalId: "mock-team-can",
        venue: "AT&T Stadium",
        status: "SCHEDULED"
      },
      {
        externalId: "mock-match-6",
        round: 2,
        matchday: 2,
        kickoffTime: new Date(baseDate.getTime() + 4 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        homeTeamExternalId: "mock-team-arg",
        awayTeamExternalId: "mock-team-mex",
        venue: "Estadio Azteca",
        status: "SCHEDULED"
      }
    ];

    return {
      externalId: params.competitionExternalId,
      name: `World Cup ${params.year}`,
      year: params.year,
      startsAt: new Date("2026-06-08T00:00:00.000Z"),
      endsAt: new Date("2026-07-21T00:00:00.000Z"),
      teams,
      matches
    };
  }

  async fetchResults(params: { matchExternalIds: string[] }): Promise<ResultDTO[]> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Mock results - return some finished matches with scores
    return params.matchExternalIds.map((id) => {
      // Simulate some matches being finished
      const isFinished = Math.random() > 0.7;

      if (isFinished) {
        return {
          matchExternalId: id,
          status: "FINISHED" as const,
          homeScore: Math.floor(Math.random() * 4),
          awayScore: Math.floor(Math.random() * 4),
          finishedAt: new Date()
        };
      }

      return {
        matchExternalId: id,
        status: "SCHEDULED" as const
      };
    });
  }
}
