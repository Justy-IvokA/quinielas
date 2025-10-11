/**
 * Finalize pool job
 * Orchestrates pool closure: verify matches, create final snapshot, award prizes, notify admin
 */

import { prisma } from "@qp/db";
import { awardPrizesJob } from "./award-prizes";

export interface FinalizePoolInput {
  poolId: string;
  tenantId: string;
  force?: boolean;
}

export async function finalizePoolJob(input: FinalizePoolInput) {
  const { poolId, tenantId, force = false } = input;

  console.log(`[FinalizePool] Starting finalization for pool ${poolId}...`);

  // Get pool with season info
  const pool = await prisma.pool.findUnique({
    where: { id: poolId, tenantId },
    include: {
      season: {
        include: {
          matches: {
            where: {
              status: { in: ["SCHEDULED", "LIVE", "POSTPONED"] }
            }
          }
        }
      },
      _count: {
        select: {
          registrations: true,
          predictions: true
        }
      }
    }
  });

  if (!pool) {
    throw new Error(`Pool ${poolId} not found`);
  }

  console.log(`[FinalizePool] Pool: ${pool.name}`);
  console.log(`[FinalizePool] Registrations: ${pool._count.registrations}`);
  console.log(`[FinalizePool] Predictions: ${pool._count.predictions}`);

  // Check if all matches are finished
  const unfinishedMatches = pool.season.matches.filter(
    (m) => m.status !== "FINISHED" && m.status !== "CANCELLED"
  );

  if (unfinishedMatches.length > 0 && !force) {
    throw new Error(
      `Pool has ${unfinishedMatches.length} unfinished matches. Use force=true to finalize anyway.`
    );
  }

  if (unfinishedMatches.length > 0) {
    console.warn(
      `[FinalizePool] WARNING: Finalizing pool with ${unfinishedMatches.length} unfinished matches (forced)`
    );
  }

  // Check if already finalized
  const existingFinalSnapshot = await prisma.leaderboardSnapshot.findFirst({
    where: {
      poolId,
      tenantId,
      kind: "FINAL"
    }
  });

  if (existingFinalSnapshot && !force) {
    throw new Error(
      `Pool already has a FINAL snapshot (${existingFinalSnapshot.id}). Use force=true to create a new one.`
    );
  }

  // Get current leaderboard
  const predictions = await prisma.prediction.findMany({
    where: { poolId, tenantId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    }
  });

  // Calculate leaderboard
  const userScores = new Map<
    string,
    {
      userId: string;
      email: string;
      name: string | null;
      points: number;
      exactCount: number;
      signCount: number;
    }
  >();

  for (const pred of predictions) {
    const existing = userScores.get(pred.userId);
    if (existing) {
      existing.points += pred.awardedPoints;
      if (pred.isExact) existing.exactCount++;
      else if (pred.awardedPoints > 0) existing.signCount++;
    } else {
      userScores.set(pred.userId, {
        userId: pred.userId,
        email: pred.user.email,
        name: pred.user.name,
        points: pred.awardedPoints,
        exactCount: pred.isExact ? 1 : 0,
        signCount: pred.awardedPoints > 0 && !pred.isExact ? 1 : 0
      });
    }
  }

  // Sort by points (desc), then by exact count (desc), then by sign count (desc)
  const sortedEntries = Array.from(userScores.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.exactCount !== a.exactCount) return b.exactCount - a.exactCount;
    return b.signCount - a.signCount;
  });

  // Assign ranks (handle ties)
  let currentRank = 1;
  for (let i = 0; i < sortedEntries.length; i++) {
    if (i > 0) {
      const prev = sortedEntries[i - 1];
      const curr = sortedEntries[i];
      if (
        curr.points !== prev.points ||
        curr.exactCount !== prev.exactCount ||
        curr.signCount !== prev.signCount
      ) {
        currentRank = i + 1;
      }
    }
    (sortedEntries[i] as any).rank = currentRank;
  }

  console.log(`[FinalizePool] Leaderboard has ${sortedEntries.length} entries`);

  // Create final snapshot
  const finalSnapshot = await prisma.leaderboardSnapshot.create({
    data: {
      poolId,
      tenantId,
      kind: "FINAL",
      data: {
        entries: sortedEntries,
        finalizedAt: new Date().toISOString(),
        totalPredictions: predictions.length,
        totalUsers: sortedEntries.length
      }
    }
  });

  console.log(`[FinalizePool] Created final snapshot: ${finalSnapshot.id}`);

  // Award prizes
  let awardResults = null;
  try {
    awardResults = await awardPrizesJob({
      poolId,
      tenantId,
      dryRun: false
    });
    console.log(`[FinalizePool] Awarded ${awardResults.awardsCreated} prizes`);
  } catch (error) {
    console.error(`[FinalizePool] Error awarding prizes:`, error);
    // Continue even if prize awarding fails
  }

  // Mark pool as inactive (optional)
  await prisma.pool.update({
    where: { id: poolId },
    data: {
      isActive: false,
      endDate: new Date()
    }
  });

  console.log(`[FinalizePool] Pool marked as inactive`);

  // Create audit log
  await prisma.auditLog.create({
    data: {
      tenantId,
      action: "POOL_FINALIZED",
      resourceType: "Pool",
      resourceId: poolId,
      metadata: {
        snapshotId: finalSnapshot.id,
        totalUsers: sortedEntries.length,
        totalPredictions: predictions.length,
        awardsCreated: awardResults?.awardsCreated || 0,
        unfinishedMatches: unfinishedMatches.length,
        forced: force
      }
    }
  });

  console.log(`[FinalizePool] Job complete`);

  return {
    success: true,
    snapshotId: finalSnapshot.id,
    leaderboardSize: sortedEntries.length,
    awardsCreated: awardResults?.awardsCreated || 0,
    topWinners: sortedEntries.slice(0, 10).map((e: any) => ({
      rank: e.rank,
      email: e.email,
      name: e.name,
      points: e.points
    }))
  };
}
