import { TRPCError } from "@trpc/server";
import { prisma } from "@qp/db";
import { generateLeaderboard } from "@qp/scoring";

import { publicProcedure, router } from "../../trpc";
import { leaderboardCache, cacheKey } from "../../lib/cache";
import { getLeaderboardSchema, getLeaderboardSnapshotsSchema } from "./schema";

export const leaderboardRouter = router({
  // Get leaderboard (live or from snapshot)
  get: publicProcedure.input(getLeaderboardSchema).query(async ({ input }) => {
    const pool = await prisma.pool.findUnique({
      where: { id: input.poolId },
      select: {
        id: true,
        name: true,
        tenantId: true,
        seasonId: true,
        endDate: true
      }
    });

    if (!pool) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Pool not found"
      });
    }

    // Check cache first
    const cKey = cacheKey("pool", input.poolId, "leaderboard", input.useLive, input.limit, input.offset);
    const cached = leaderboardCache.get(cKey);
    if (cached) {
      return cached;
    }

    // Check if we should use snapshot
    const latestSnapshot = await prisma.leaderboardSnapshot.findFirst({
      where: { poolId: input.poolId },
      orderBy: { createdAt: "desc" }
    });

    const now = new Date();
    const snapshotAge = latestSnapshot ? now.getTime() - latestSnapshot.createdAt.getTime() : Infinity;
    const useSnapshot = !input.useLive || (latestSnapshot && snapshotAge < 60000); // 60s

    if (useSnapshot && latestSnapshot) {
      const snapshotData = latestSnapshot.data as any;
      const result = {
        poolId: input.poolId,
        isLive: false,
        isFinal: pool.endDate ? pool.endDate < now : false,
        snapshotAt: latestSnapshot.createdAt,
        entries: snapshotData.entries || [],
        total: snapshotData.total || 0
      };

      leaderboardCache.set(cKey, result, 30);
      return result;
    }

    // Compute live leaderboard
    const predictions = await prisma.prediction.findMany({
      where: {
        poolId: input.poolId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
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

    // Group by user
    const userStats = new Map<
      string,
      {
        userId: string;
        userName: string | null;
        userEmail: string;
        totalPoints: number;
        exactCount: number;
        signCount: number;
        predictionsCount: number;
      }
    >();

    for (const pred of predictions) {
      if (!userStats.has(pred.userId)) {
        userStats.set(pred.userId, {
          userId: pred.userId,
          userName: pred.user.name,
          userEmail: pred.user.email,
          totalPoints: 0,
          exactCount: 0,
          signCount: 0,
          predictionsCount: 0
        });
      }

      const stats = userStats.get(pred.userId)!;
      stats.predictionsCount++;

      // Only count scored predictions (finished matches)
      if (pred.match.status === "FINISHED" && pred.awardedPoints > 0) {
        stats.totalPoints += pred.awardedPoints;
        if (pred.isExact) {
          stats.exactCount++;
        }
        // Check for correct sign
        const predSign = Math.sign(pred.homeScore - pred.awayScore);
        const resultSign =
          pred.match.homeScore !== null && pred.match.awayScore !== null
            ? Math.sign(pred.match.homeScore - pred.match.awayScore)
            : 0;
        if (predSign === resultSign) {
          stats.signCount++;
        }
      }
    }

    // Convert to array and generate leaderboard
    const players = Array.from(userStats.values());
    const ranked = generateLeaderboard(players);

    // Apply pagination
    const total = ranked.length;
    const entries = ranked.slice(input.offset, input.offset + input.limit);

    const result = {
      poolId: input.poolId,
      isLive: true,
      isFinal: false,
      snapshotAt: null,
      entries,
      total
    };

    leaderboardCache.set(cKey, result, 15); // Cache live for 15s
    return result;
  }),

  // Get leaderboard snapshots history
  getSnapshots: publicProcedure.input(getLeaderboardSnapshotsSchema).query(async ({ input }) => {
    const snapshots = await prisma.leaderboardSnapshot.findMany({
      where: { poolId: input.poolId },
      orderBy: { createdAt: "desc" },
      take: input.limit,
      select: {
        id: true,
        createdAt: true,
        data: true
      }
    });

    return snapshots.map((s) => ({
      id: s.id,
      createdAt: s.createdAt,
      entriesCount: (s.data as any).total || 0
    }));
  })
});
