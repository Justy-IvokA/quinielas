/**
 * Score final job
 * Calculates points for finished matches and updates predictions
 */

import { prisma } from "@qp/db";
import { scoreMatch, DEFAULT_RULE_SET, type RuleSet } from "@qp/scoring";

export async function scoreFinalJob() {
  console.log("[ScoreFinal] Starting job...");

  // Only check matches from the last 7 days to avoid processing old matches
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Debug: Check all finished matches
  const allFinishedMatches = await prisma.match.count({
    where: {
      status: "FINISHED",
      kickoffTime: { gte: sevenDaysAgo }
    }
  });
  console.log(`[ScoreFinal] Total finished matches in last 7 days: ${allFinishedMatches}`);

  // Debug: Check matches with predictions
  const matchesWithPredictions = await prisma.match.count({
    where: {
      status: "FINISHED",
      kickoffTime: { gte: sevenDaysAgo },
      predictions: { some: {} }
    }
  });
  console.log(`[ScoreFinal] Finished matches with predictions: ${matchesWithPredictions}`);

  // Debug: Check unscored predictions
  const unscoredPredictions = await prisma.prediction.count({
    where: {
      awardedPoints: 0,
      match: {
        status: "FINISHED",
        kickoffTime: { gte: sevenDaysAgo }
      }
    }
  });
  console.log(`[ScoreFinal] Unscored predictions: ${unscoredPredictions}`);

  // Find finished matches that haven't been scored yet
  const finishedMatches = await prisma.match.findMany({
    where: {
      status: "FINISHED",
      homeScore: { not: null },
      awayScore: { not: null },
      kickoffTime: {
        gte: sevenDaysAgo // Only matches from last 7 days
      },
      predictions: {
        some: {
          awardedPoints: 0 // Only include matches with unscored predictions
        }
      }
    },
    include: {
      predictions: {
        where: {
          awardedPoints: 0 // Only score predictions that haven't been scored
        },
        include: {
          pool: {
            select: {
              id: true,
              ruleSet: true,
              tenantId: true
            }
          }
        }
      }
    }
  });

  if (finishedMatches.length === 0) {
    console.log("[ScoreFinal] No finished matches to score");
    return { matchesScored: 0, predictionsScored: 0 };
  }

  console.log(`[ScoreFinal] Found ${finishedMatches.length} finished matches to score`);

  let matchesScored = 0;
  let predictionsScored = 0;
  const poolsToAudit = new Set<string>();

  for (const match of finishedMatches) {
    if (match.homeScore === null || match.awayScore === null) {
      console.warn(`[ScoreFinal] Match ${match.id} is finished but missing scores`);
      continue;
    }

    const result = {
      homeScore: match.homeScore,
      awayScore: match.awayScore
    };

    console.log(`[ScoreFinal] Scoring ${match.predictions.length} predictions for match ${match.id}`);

    for (const prediction of match.predictions) {
      try {
        // Get rule set for this pool
        const ruleSet: RuleSet = prediction.pool.ruleSet
          ? (prediction.pool.ruleSet as any as RuleSet)
          : DEFAULT_RULE_SET;

        // Calculate score
        const score = scoreMatch(
          {
            homeScore: prediction.homeScore,
            awayScore: prediction.awayScore
          },
          result,
          ruleSet
        );

        // Update prediction with points
        await prisma.prediction.update({
          where: { id: prediction.id },
          data: {
            awardedPoints: score.points,
            isExact: score.exactScore
          }
        });

        predictionsScored++;
        poolsToAudit.add(prediction.pool.id);

        console.log(
          `[ScoreFinal] Scored prediction ${prediction.id}: ${score.points} points (exact: ${score.exactScore})`
        );
      } catch (error) {
        console.error(`[ScoreFinal] Error scoring prediction ${prediction.id}:`, error);
      }
    }

    matchesScored++;
  }

  // Create score audits for affected pools
  for (const poolId of poolsToAudit) {
    try {
      const pool = await prisma.pool.findUnique({
        where: { id: poolId },
        select: {
          tenantId: true,
          ruleSet: true
        }
      });

      if (pool) {
        await prisma.scoreAudit.create({
          data: {
            poolId,
            tenantId: pool.tenantId,
            ruleSnapshot: (pool.ruleSet || DEFAULT_RULE_SET) as any,
            metadata: {
              matchesScored,
              predictionsScored,
              jobRunAt: new Date().toISOString()
            }
          }
        });

        console.log(`[ScoreFinal] Created score audit for pool ${poolId}`);
      }
    } catch (error) {
      console.error(`[ScoreFinal] Error creating audit for pool ${poolId}:`, error);
    }
  }

  console.log(`[ScoreFinal] Completed. Matches: ${matchesScored}, Predictions: ${predictionsScored}`);

  return { matchesScored, predictionsScored };
}
