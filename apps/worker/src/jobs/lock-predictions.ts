import { prisma } from "@qp/db";

/**
 * Lock predictions for matches that have reached kickoff time
 * This job should run every minute
 */
export async function lockPredictionsJob() {
  console.log("[LockPredictions] Starting job...");

  const now = new Date();

  // Find matches that should be locked (kickoff time has passed, not yet locked)
  const matchesToLock = await prisma.match.findMany({
    where: {
      kickoffTime: {
        lte: now  
      },
      locked: false,
      status: "SCHEDULED"
    },
    select: {
      id: true,
      kickoffTime: true,
      homeTeam: {
        select: {
          name: true
        }
      },
      awayTeam: {
        select: {
          name: true
        }
      }
    }
  });

  if (matchesToLock.length === 0) {
    console.log("[LockPredictions] No matches to lock");
    return { lockedCount: 0 };
  }

  console.log(`[LockPredictions] Found ${matchesToLock.length} matches to lock`);

  let lockedCount = 0;

  for (const match of matchesToLock) {
    try {
      await prisma.match.update({
        where: { id: match.id },
        data: {
          locked: true,
          status: "LIVE" // Transition to live once locked
        }
      });

      console.log(
        `[LockPredictions] Locked match: ${match.homeTeam.name} vs ${match.awayTeam.name} (kickoff: ${match.kickoffTime.toISOString()})`
      );

      lockedCount++;
    } catch (error) {
      console.error(`[LockPredictions] Error locking match ${match.id}:`, error);
    }
  }

  console.log(`[LockPredictions] Completed. Locked ${lockedCount} matches`);

  return { lockedCount };
}
