import { describe, it, expect } from "vitest";
import { scoreMatch, scorePredictions, generateLeaderboard, DEFAULT_RULE_SET } from "./engine";

describe("Scoring Engine", () => {
  describe("scoreMatch", () => {
    it("should award full points for exact score", () => {
      const result = scoreMatch(
        { homeScore: 2, awayScore: 1 },
        { homeScore: 2, awayScore: 1 },
        DEFAULT_RULE_SET
      );

      expect(result.exactScore).toBe(true);
      expect(result.correctSign).toBe(true);
      expect(result.correctDiff).toBe(true);
      expect(result.points).toBe(5);
      expect(result.breakdown.exactScorePoints).toBe(5);
    });

    it("should award points for correct sign only", () => {
      const result = scoreMatch(
        { homeScore: 2, awayScore: 1 },
        { homeScore: 3, awayScore: 0 },
        DEFAULT_RULE_SET
      );

      expect(result.exactScore).toBe(false);
      expect(result.correctSign).toBe(true);
      expect(result.correctDiff).toBe(false);
      expect(result.points).toBe(3);
      expect(result.breakdown.correctSignPoints).toBe(3);
    });

    it("should award points for correct sign and goal difference", () => {
      const result = scoreMatch(
        { homeScore: 2, awayScore: 1 },
        { homeScore: 3, awayScore: 2 },
        DEFAULT_RULE_SET
      );

      expect(result.exactScore).toBe(false);
      expect(result.correctSign).toBe(true);
      expect(result.correctDiff).toBe(true);
      expect(result.points).toBe(4); // 3 for sign + 1 for diff
      expect(result.breakdown.correctSignPoints).toBe(3);
      expect(result.breakdown.goalDiffBonusPoints).toBe(1);
    });

    it("should award zero points for wrong prediction", () => {
      const result = scoreMatch(
        { homeScore: 2, awayScore: 1 },
        { homeScore: 0, awayScore: 3 },
        DEFAULT_RULE_SET
      );

      expect(result.exactScore).toBe(false);
      expect(result.correctSign).toBe(false);
      expect(result.points).toBe(0);
    });

    it("should handle draw predictions correctly", () => {
      const result = scoreMatch(
        { homeScore: 1, awayScore: 1 },
        { homeScore: 2, awayScore: 2 },
        DEFAULT_RULE_SET
      );

      expect(result.exactScore).toBe(false);
      expect(result.correctSign).toBe(true); // Both are draws
      expect(result.correctDiff).toBe(true); // Both have diff of 0
      expect(result.points).toBe(4);
    });

    it("should not award diff bonus if sign is wrong", () => {
      const result = scoreMatch(
        { homeScore: 2, awayScore: 1 }, // Home win by 1
        { homeScore: 1, awayScore: 2 }, // Away win by 1 (same diff, wrong sign)
        DEFAULT_RULE_SET
      );

      expect(result.correctSign).toBe(false);
      expect(result.correctDiff).toBe(false); // Diff is opposite
      expect(result.points).toBe(0);
    });
  });

  describe("scorePredictions", () => {
    it("should calculate total points correctly", () => {
      const predictions = [
        {
          prediction: { homeScore: 2, awayScore: 1 },
          result: { homeScore: 2, awayScore: 1 }
        },
        {
          prediction: { homeScore: 1, awayScore: 0 },
          result: { homeScore: 2, awayScore: 0 }
        },
        {
          prediction: { homeScore: 0, awayScore: 0 },
          result: { homeScore: 1, awayScore: 1 }
        }
      ];

      const result = scorePredictions(predictions, DEFAULT_RULE_SET);

      expect(result.totalPoints).toBe(9); // 5 + 4 + 0
      expect(result.exactCount).toBe(1);
      expect(result.signCount).toBe(2);
    });

    it("should apply premium multiplier", () => {
      const predictions = [
        {
          prediction: { homeScore: 2, awayScore: 1 },
          result: { homeScore: 2, awayScore: 1 },
          isPremium: true
        }
      ];

      const ruleSet = {
        ...DEFAULT_RULE_SET,
        premiumMatchMultiplier: 2
      };

      const result = scorePredictions(predictions, ruleSet);

      expect(result.totalPoints).toBe(10); // 5 * 2
    });
  });

  describe("generateLeaderboard", () => {
    it("should rank players by total points", () => {
      const players = [
        { userId: "user1", totalPoints: 10, exactCount: 1, signCount: 2 },
        { userId: "user2", totalPoints: 15, exactCount: 2, signCount: 3 },
        { userId: "user3", totalPoints: 5, exactCount: 0, signCount: 1 }
      ];

      const leaderboard = generateLeaderboard(players);

      expect(leaderboard[0]?.userId).toBe("user2");
      expect(leaderboard[0]?.rank).toBe(1);
      expect(leaderboard[1]?.userId).toBe("user1");
      expect(leaderboard[1]?.rank).toBe(2);
      expect(leaderboard[2]?.userId).toBe("user3");
      expect(leaderboard[2]?.rank).toBe(3);
    });

    it("should handle ties with exact count tiebreaker", () => {
      const players = [
        { userId: "user1", totalPoints: 10, exactCount: 1, signCount: 2 },
        { userId: "user2", totalPoints: 10, exactCount: 2, signCount: 2 }
      ];

      const leaderboard = generateLeaderboard(players);

      expect(leaderboard[0]?.userId).toBe("user2"); // More exact scores
      expect(leaderboard[0]?.rank).toBe(1);
      expect(leaderboard[1]?.userId).toBe("user1");
      expect(leaderboard[1]?.rank).toBe(2);
    });

    it("should assign same rank for complete ties", () => {
      const players = [
        { userId: "user1", totalPoints: 10, exactCount: 1, signCount: 2 },
        { userId: "user2", totalPoints: 10, exactCount: 1, signCount: 2 },
        { userId: "user3", totalPoints: 5, exactCount: 0, signCount: 1 }
      ];

      const leaderboard = generateLeaderboard(players);

      expect(leaderboard[0]?.rank).toBe(1);
      expect(leaderboard[1]?.rank).toBe(1); // Same rank as user1
      expect(leaderboard[2]?.rank).toBe(3); // Skip rank 2
    });
  });
});
