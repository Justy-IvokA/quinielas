import { describe, it, expect, vi, beforeEach } from "vitest";
import { APIFootballProvider } from "./api-football";

describe("APIFootballProvider", () => {
  let provider: APIFootballProvider;

  beforeEach(() => {
    provider = new APIFootballProvider({
      apiKey: "test-key",
      maxRetries: 2,
      retryDelayMs: 100
    });
  });

  describe("getName", () => {
    it("should return provider name", () => {
      expect(provider.getName()).toBe("api-football");
    });
  });

  describe("fetchSeason", () => {
    it("should fetch season data with teams and matches", async () => {
      // Mock fetch
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            errors: {},
            response: [
              {
                league: { name: "World Cup" },
                seasons: [{ start: "2026-06-01", end: "2026-07-15" }]
              }
            ]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            errors: {},
            response: [
              {
                team: {
                  id: 1,
                  name: "Mexico",
                  code: "MEX",
                  logo: "https://example.com/mex.png",
                  country: "Mexico"
                }
              }
            ]
          })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            errors: {},
            response: [
              {
                fixture: {
                  id: 100,
                  date: "2026-06-12T18:00:00Z",
                  status: { short: "NS" },
                  venue: { name: "Estadio Azteca" }
                },
                league: { round: "Group Stage - 1" },
                teams: {
                  home: { id: 1 },
                  away: { id: 2 }
                },
                goals: { home: null, away: null }
              }
            ]
          })
        });

      const result = await provider.fetchSeason({
        competitionExternalId: "1",
        year: 2026
      });

      expect(result.name).toBe("World Cup 2026");
      expect(result.year).toBe(2026);
      expect(result.teams).toHaveLength(1);
      expect(result.teams[0].name).toBe("Mexico");
      expect(result.matches).toHaveLength(1);
      expect(result.matches[0].status).toBe("SCHEDULED");
    });

    it("should handle rate limiting with retry", async () => {
      let callCount = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({ status: 429, ok: false });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            errors: {},
            response: [{ league: { name: "Test" }, seasons: [] }]
          })
        });
      });

      // Should retry and succeed
      await expect(
        provider.fetchSeason({ competitionExternalId: "1", year: 2026 })
      ).resolves.toBeDefined();

      expect(callCount).toBeGreaterThan(1);
    });
  });

  describe("fetchResults", () => {
    it("should fetch results for multiple matches", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          errors: {},
          response: [
            {
              fixture: {
                id: 100,
                date: "2026-06-12T20:00:00Z",
                status: { short: "FT" }
              },
              goals: { home: 2, away: 1 }
            }
          ]
        })
      });

      const results = await provider.fetchResults({
        matchExternalIds: ["100"]
      });

      expect(results).toHaveLength(1);
      expect(results[0].matchExternalId).toBe("100");
      expect(results[0].status).toBe("FINISHED");
      expect(results[0].homeScore).toBe(2);
      expect(results[0].awayScore).toBe(1);
    });

    it("should return empty array for no matches", async () => {
      const results = await provider.fetchResults({ matchExternalIds: [] });
      expect(results).toEqual([]);
    });
  });
});
