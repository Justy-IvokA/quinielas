/**
 * Award prizes job
 * Assigns prizes to winners based on final leaderboard snapshot
 */

import { prisma } from "@qp/db";

export interface AwardPrizesInput {
  poolId: string;
  tenantId: string;
  dryRun?: boolean;
}

export async function awardPrizesJob(input: AwardPrizesInput) {
  const { poolId, tenantId, dryRun = false } = input;

  console.log(`[AwardPrizes] Starting job for pool ${poolId} (dryRun: ${dryRun})...`);

  // Get the final leaderboard snapshot
  const finalSnapshot = await prisma.leaderboardSnapshot.findFirst({
    where: {
      poolId,
      tenantId,
      kind: "FINAL"
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  if (!finalSnapshot) {
    throw new Error(`No FINAL leaderboard snapshot found for pool ${poolId}`);
  }

  console.log(`[AwardPrizes] Found final snapshot: ${finalSnapshot.id}`);

  // Get prizes for this pool
  const prizes = await prisma.prize.findMany({
    where: {
      poolId,
      tenantId
    },
    orderBy: {
      rankFrom: "asc"
    }
  });

  if (prizes.length === 0) {
    console.log(`[AwardPrizes] No prizes configured for pool ${poolId}`);
    return { awardsCreated: 0, prizes: [] };
  }

  console.log(`[AwardPrizes] Found ${prizes.length} prizes to award`);

  // Parse leaderboard data
  const leaderboard = finalSnapshot.data as {
    entries: Array<{ userId: string; rank: number; points: number }>;
  };

  if (!leaderboard.entries || leaderboard.entries.length === 0) {
    console.log(`[AwardPrizes] No entries in final leaderboard`);
    return { awardsCreated: 0, prizes: [] };
  }

  console.log(`[AwardPrizes] Leaderboard has ${leaderboard.entries.length} entries`);

  let awardsCreated = 0;
  const awardResults = [];

  for (const prize of prizes) {
    console.log(
      `[AwardPrizes] Processing prize "${prize.title}" for ranks ${prize.rankFrom}-${prize.rankTo}`
    );

    // Find users in this rank range
    const winners = leaderboard.entries.filter(
      (entry) => entry.rank >= prize.rankFrom && entry.rank <= prize.rankTo
    );

    if (winners.length === 0) {
      console.log(`[AwardPrizes] No winners for prize "${prize.title}"`);
      awardResults.push({
        prizeId: prize.id,
        prizeTitle: prize.title,
        winnersCount: 0,
        winners: []
      });
      continue;
    }

    console.log(`[AwardPrizes] Found ${winners.length} winners for prize "${prize.title}"`);

    if (dryRun) {
      awardResults.push({
        prizeId: prize.id,
        prizeTitle: prize.title,
        winnersCount: winners.length,
        winners: winners.map((w) => ({ userId: w.userId, rank: w.rank }))
      });
      continue;
    }

    // Check for existing awards (idempotency)
    const existingAwards = await prisma.prizeAward.findMany({
      where: {
        prizeId: prize.id,
        userId: { in: winners.map((w) => w.userId) }
      },
      select: { userId: true }
    });

    const existingUserIds = new Set(existingAwards.map((a) => a.userId));
    const newWinners = winners.filter((w) => !existingUserIds.has(w.userId));

    if (newWinners.length === 0) {
      console.log(`[AwardPrizes] All awards already exist for prize "${prize.title}"`);
      awardResults.push({
        prizeId: prize.id,
        prizeTitle: prize.title,
        winnersCount: 0,
        winners: []
      });
      continue;
    }

    // Create awards
    const awards = newWinners.map((winner) => ({
      prizeId: prize.id,
      userId: winner.userId,
      tenantId,
      rank: winner.rank,
      awardedAt: new Date(),
      notified: false
    }));

    await prisma.prizeAward.createMany({
      data: awards,
      skipDuplicates: true
    });

    awardsCreated += awards.length;

    awardResults.push({
      prizeId: prize.id,
      prizeTitle: prize.title,
      winnersCount: awards.length,
      winners: awards.map((a) => ({ userId: a.userId, rank: a.rank }))
    });

    console.log(`[AwardPrizes] Created ${awards.length} awards for prize "${prize.title}"`);
  }

  // Create audit log
  if (!dryRun) {
    await prisma.scoreAudit.create({
      data: {
        poolId,
        tenantId,
        runAt: new Date(),
        ruleSnapshot: {
          type: "AWARD_PRIZES",
          snapshotId: finalSnapshot.id,
          prizesProcessed: prizes.length,
          awardsCreated
        },
        metadata: {
          dryRun,
          results: awardResults
        }
      }
    });
  }

  console.log(`[AwardPrizes] Job complete. Created ${awardsCreated} awards.`);

  return {
    awardsCreated,
    prizes: awardResults
  };
}
