/**
 * Scoring engine for Quinielas WL
 * Pure, deterministic scoring logic
 */

export interface RuleSet {
  exactScore: number; // Points for exact score match
  correctSign: number; // Points for correct result (1X2)
  goalDiffBonus: number; // Bonus for correct goal difference
  premiumMatchMultiplier?: number; // Multiplier for premium matches
}

export interface Prediction {
  homeScore: number;
  awayScore: number;
}

export interface Result {
  homeScore: number;
  awayScore: number;
}

export interface ScoreBreakdown {
  exactScore: boolean;
  correctSign: boolean;
  correctDiff: boolean;
  points: number;
  breakdown: {
    exactScorePoints: number;
    correctSignPoints: number;
    goalDiffBonusPoints: number;
  };
}

/**
 * Default rule set (World Cup 2026 baseline)
 */
export const DEFAULT_RULE_SET: RuleSet = {
  exactScore: 5,
  correctSign: 3,
  goalDiffBonus: 1,
};

/**
 * Calculate sign (1X2) from scores
 */
function getSign(homeScore: number, awayScore: number): "1" | "X" | "2" {
  if (homeScore > awayScore) return "1";
  if (homeScore < awayScore) return "2";
  return "X";
}

/**
 * Calculate goal difference
 */
function getGoalDiff(homeScore: number, awayScore: number): number {
  return homeScore - awayScore;
}

/**
 * Score a single prediction against a result
 */
export function scoreMatch(
  prediction: Prediction,
  result: Result,
  ruleSet: RuleSet = DEFAULT_RULE_SET
): ScoreBreakdown {
  // Check exact score
  const exactScore =
    prediction.homeScore === result.homeScore && prediction.awayScore === result.awayScore;

  // If exact score, award full points (includes sign and diff)
  if (exactScore) {
    return {
      exactScore: true,
      correctSign: true,
      correctDiff: true,
      points: ruleSet.exactScore,
      breakdown: {
        exactScorePoints: ruleSet.exactScore,
        correctSignPoints: 0,
        goalDiffBonusPoints: 0,
      },
    };
  }

  // Check correct sign (1X2)
  const predictionSign = getSign(prediction.homeScore, prediction.awayScore);
  const resultSign = getSign(result.homeScore, result.awayScore);
  const correctSign = predictionSign === resultSign;

  // Check correct goal difference
  const predictionDiff = getGoalDiff(prediction.homeScore, prediction.awayScore);
  const resultDiff = getGoalDiff(result.homeScore, result.awayScore);
  const correctDiff = predictionDiff === resultDiff;

  let points = 0;
  const breakdown = {
    exactScorePoints: 0,
    correctSignPoints: 0,
    goalDiffBonusPoints: 0,
  };

  // Award points for correct sign
  if (correctSign) {
    points += ruleSet.correctSign;
    breakdown.correctSignPoints = ruleSet.correctSign;
  }

  // Award bonus for correct goal difference (only if sign is correct)
  if (correctSign && correctDiff) {
    points += ruleSet.goalDiffBonus;
    breakdown.goalDiffBonusPoints = ruleSet.goalDiffBonus;
  }

  return {
    exactScore: false,
    correctSign,
    correctDiff,
    points,
    breakdown,
  };
}

/**
 * Score multiple predictions
 */
export function scorePredictions(
  predictions: Array<{ prediction: Prediction; result: Result; isPremium?: boolean }>,
  ruleSet: RuleSet = DEFAULT_RULE_SET
): {
  totalPoints: number;
  exactCount: number;
  signCount: number;
  diffCount: number;
  scores: ScoreBreakdown[];
} {
  let totalPoints = 0;
  let exactCount = 0;
  let signCount = 0;
  let diffCount = 0;
  const scores: ScoreBreakdown[] = [];

  for (const { prediction, result, isPremium } of predictions) {
    const score = scoreMatch(prediction, result, ruleSet);

    // Apply premium multiplier if applicable
    let finalPoints = score.points;
    if (isPremium && ruleSet.premiumMatchMultiplier) {
      finalPoints *= ruleSet.premiumMatchMultiplier;
    }

    totalPoints += finalPoints;

    if (score.exactScore) exactCount++;
    if (score.correctSign) signCount++;
    if (score.correctDiff) diffCount++;

    scores.push({
      ...score,
      points: finalPoints,
    });
  }

  return {
    totalPoints,
    exactCount,
    signCount,
    diffCount,
    scores,
  };
}

/**
 * Tie-breaker comparison
 * Returns: -1 if a < b, 0 if equal, 1 if a > b
 */
export function comparePlayers(
  a: { totalPoints: number; exactCount: number; signCount: number; premiumPoints?: number },
  b: { totalPoints: number; exactCount: number; signCount: number; premiumPoints?: number }
): number {
  // 1. Total points
  if (a.totalPoints !== b.totalPoints) {
    return b.totalPoints - a.totalPoints;
  }

  // 2. More exact scores
  if (a.exactCount !== b.exactCount) {
    return b.exactCount - a.exactCount;
  }

  // 3. More correct signs
  if (a.signCount !== b.signCount) {
    return b.signCount - a.signCount;
  }

  // 4. Premium match points (if available)
  if (a.premiumPoints !== undefined && b.premiumPoints !== undefined) {
    if (a.premiumPoints !== b.premiumPoints) {
      return b.premiumPoints - a.premiumPoints;
    }
  }

  // 5. Tie (would need custom tie-breaker question)
  return 0;
}

/**
 * Generate leaderboard from player scores
 */
export function generateLeaderboard<T extends { userId: string }>(
  players: Array<
    T & {
      totalPoints: number;
      exactCount: number;
      signCount: number;
      premiumPoints?: number;
    }
  >
): Array<
  T & {
    totalPoints: number;
    exactCount: number;
    signCount: number;
    premiumPoints?: number;
    rank: number;
  }
> {
  // Sort players
  const sorted = [...players].sort((a, b) => comparePlayers(a, b));

  // Assign ranks (handle ties)
  let currentRank = 1;
  const withRanks = sorted.map((player, index) => {
    if (index > 0) {
      const prev = sorted[index - 1];
      if (prev && comparePlayers(player, prev) !== 0) {
        currentRank = index + 1;
      }
    }

    return {
      ...player,
      rank: currentRank,
    };
  });

  return withRanks;
}

/**
 * Validate rule set
 */
export function validateRuleSet(ruleSet: unknown): ruleSet is RuleSet {
  if (typeof ruleSet !== "object" || ruleSet === null) {
    return false;
  }

  const rs = ruleSet as Partial<RuleSet>;

  return (
    typeof rs.exactScore === "number" &&
    rs.exactScore >= 0 &&
    typeof rs.correctSign === "number" &&
    rs.correctSign >= 0 &&
    typeof rs.goalDiffBonus === "number" &&
    rs.goalDiffBonus >= 0 &&
    (rs.premiumMatchMultiplier === undefined ||
      (typeof rs.premiumMatchMultiplier === "number" && rs.premiumMatchMultiplier >= 1))
  );
}
