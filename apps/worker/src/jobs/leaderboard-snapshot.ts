/**
 * Leaderboard snapshot job
 * Generates and stores leaderboard snapshots for pools
 */

import { prisma } from "@qp/db";
import { generateLeaderboard } from "@qp/scoring";

interface PlayerScore {
  userId: string;
  displayName: string | null;
  email: string | null;
  totalPoints: number;
  exactCount: number;
  signCount: number;
  predictionCount: number;
}

export async function leaderboardSnapshotJob(poolId?: string) {
  console.log("[LeaderboardSnapshot] Starting job...");

  // Get pools to snapshot
  const pools = poolId
    ? await prisma.pool.findMany({
        where: { id: poolId, isActive: true }
      })
    : await prisma.pool.findMany({
        where: { isActive: true }
      });

  if (pools.length === 0) {
    console.log("[LeaderboardSnapshot] No active pools to snapshot");
    return { snapshotsCreated: 0 };
  }

  console.log(`[LeaderboardSnapshot] Processing ${pools.length} pools`);

  let snapshotsCreated = 0;

  for (const pool of pools) {
    try {
      // Get all predictions for this pool
      const predictions = await prisma.prediction.findMany({
        where: { poolId: pool.id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          },
          match: {
            select: {
              status: true,
              homeScore: true,
              awayScore: true
            }
          }
        }
      });

      // Get registrations to include display names
      const registrations = await prisma.registration.findMany({
        where: { poolId: pool.id },
        select: {
          userId: true,
          displayName: true,
          email: true
        }
      });

      const registrationMap = new Map(
        registrations.map((r) => [r.userId, { displayName: r.displayName, email: r.email }])
      );

      // Aggregate scores by user
      const userScores = new Map<string, PlayerScore>();

      for (const prediction of predictions) {
        const userId = prediction.userId;
        const reg = registrationMap.get(userId);

        if (!userScores.has(userId)) {
          userScores.set(userId, {
            userId,
            displayName: reg?.displayName || prediction.user.name || null,
            email: reg?.email || prediction.user.email,
            totalPoints: 0,
            exactCount: 0,
            signCount: 0,
            predictionCount: 0
          });
        }

        const score = userScores.get(userId)!;
        score.totalPoints += prediction.awardedPoints;
        score.predictionCount++;

        if (prediction.isExact) {
          score.exactCount++;
        }

        // Count correct signs (simple heuristic: if points > 0 and not exact, it's a sign)
        if (prediction.awardedPoints > 0 && !prediction.isExact) {
          score.signCount++;
        }
      }

      // Generate leaderboard
      const players = Array.from(userScores.values());
      const leaderboard = generateLeaderboard(players);

      // Count pending matches
      const pendingMatches = await prisma.match.count({
        where: {
          seasonId: pool.seasonId,
          status: { in: ["SCHEDULED", "LIVE"] }
        }
      });

      // Create snapshot
      await prisma.leaderboardSnapshot.create({
        data: {
          poolId: pool.id,
          tenantId: pool.tenantId,
          data: {
            leaderboard: leaderboard as any,
            metadata: {
              totalPlayers: leaderboard.length,
              pendingMatches,
              snapshotAt: new Date().toISOString()
            }
          }
        }
      });

      snapshotsCreated++;
      console.log(`[LeaderboardSnapshot] Created snapshot for pool ${pool.id} (${leaderboard.length} players)`);
    } catch (error) {
      console.error(`[LeaderboardSnapshot] Error creating snapshot for pool ${pool.id}:`, error);
    }
  }

  console.log(`[LeaderboardSnapshot] Completed. Created ${snapshotsCreated} snapshots`);

  return { snapshotsCreated };
}
