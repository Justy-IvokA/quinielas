import { TRPCError } from "@trpc/server";
import { prisma } from "@qp/db";

import { publicProcedure, router } from "../../trpc";
import { getParticipantsMetricsSchema } from "./schema";

export const participantsRouter = router({
  /**
   * Get participants with detailed metrics for a pool
   */
  metrics: publicProcedure.input(getParticipantsMetricsSchema).query(async ({ input }) => {
    // Verify pool exists
    const pool = await prisma.pool.findUnique({
      where: { id: input.poolId },
      select: {
        id: true,
        tenantId: true,
        seasonId: true
      }
    });

    if (!pool) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Pool not found"
      });
    }

    // Get all registrations for this pool
    const registrations = await prisma.registration.findMany({
      where: {
        poolId: input.poolId,
        tenantId: pool.tenantId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Get all predictions for this pool
    const predictions = await prisma.prediction.findMany({
      where: {
        poolId: input.poolId,
        tenantId: pool.tenantId
      },
      include: {
        match: {
          select: {
            id: true,
            status: true,
            homeScore: true,
            awayScore: true,
            kickoffTime: true,
            locked: true
          }
        }
      }
    });

    // Build metrics per user
    const userMetrics = registrations.map((reg) => {
      const userPredictions = predictions.filter((p) => p.userId === reg.userId);
      
      let totalPoints = 0;
      let exactCount = 0;
      let signCount = 0;
      let missCount = 0;
      let drawHits = 0;
      let onTimeCount = 0;
      let finishedMatches = 0;

      for (const pred of userPredictions) {
        const match = pred.match;
        
        // Count on-time predictions (made before kickoff)
        if (pred.createdAt < match.kickoffTime) {
          onTimeCount++;
        }

        // Only score finished matches
        if (match.status === "FINISHED" && match.homeScore !== null && match.awayScore !== null) {
          finishedMatches++;
          
          const predSign = Math.sign(pred.homeScore - pred.awayScore);
          const resultSign = Math.sign(match.homeScore - match.awayScore);
          
          // Exact score
          if (pred.homeScore === match.homeScore && pred.awayScore === match.awayScore) {
            exactCount++;
            signCount++; // Exact also counts as correct sign
            totalPoints += pred.awardedPoints;
            
            // Check if it's a draw
            if (predSign === 0) {
              drawHits++;
            }
          }
          // Correct sign (1X2)
          else if (predSign === resultSign) {
            signCount++;
            totalPoints += pred.awardedPoints;
            
            // Check if predicted draw correctly (but not exact score)
            if (predSign === 0) {
              drawHits++;
            }
          }
          // Miss
          else {
            missCount++;
          }
        }
      }

      const predictionsCount = userPredictions.length;
      const onTimePercentage = predictionsCount > 0 ? (onTimeCount / predictionsCount) * 100 : 0;

      // Apply search filter
      if (input.search) {
        const searchLower = input.search.toLowerCase();
        const nameMatch = reg.user.name?.toLowerCase().includes(searchLower);
        const emailMatch = reg.user.email.toLowerCase().includes(searchLower);
        const displayNameMatch = reg.displayName?.toLowerCase().includes(searchLower);
        
        if (!nameMatch && !emailMatch && !displayNameMatch) {
          return null;
        }
      }

      return {
        userId: reg.userId,
        userName: reg.user.name || reg.displayName || "Anonymous",
        userEmail: reg.user.email,
        displayName: reg.displayName,
        totalPoints,
        exactCount,
        signCount,
        missCount,
        drawHits,
        predictionsCount,
        finishedMatches,
        onTimeCount,
        onTimePercentage: Math.round(onTimePercentage),
        joinedAt: reg.joinedAt
      };
    }).filter(Boolean) as any[];

    // Sort
    userMetrics.sort((a, b) => {
      let comparison = 0;
      
      switch (input.sortBy) {
        case "points":
          comparison = a.totalPoints - b.totalPoints;
          break;
        case "exactCount":
          comparison = a.exactCount - b.exactCount;
          break;
        case "signCount":
          comparison = a.signCount - b.signCount;
          break;
        case "predictionsCount":
          comparison = a.predictionsCount - b.predictionsCount;
          break;
        case "name":
          comparison = (a.userName || "").localeCompare(b.userName || "");
          break;
        default:
          comparison = a.totalPoints - b.totalPoints;
      }

      return input.sortOrder === "desc" ? -comparison : comparison;
    });

    // Paginate
    const total = userMetrics.length;
    const offset = (input.page - 1) * input.pageSize;
    const paginatedMetrics = userMetrics.slice(offset, offset + input.pageSize);

    // Calculate summary stats
    const summary = {
      totalParticipants: registrations.length,
      averagePoints: userMetrics.length > 0 
        ? Math.round(userMetrics.reduce((sum, m) => sum + m.totalPoints, 0) / userMetrics.length)
        : 0,
      averageExacts: userMetrics.length > 0
        ? Math.round((userMetrics.reduce((sum, m) => sum + m.exactCount, 0) / userMetrics.length) * 10) / 10
        : 0,
      totalPredictions: predictions.length
    };

    return {
      participants: paginatedMetrics,
      total,
      page: input.page,
      pageSize: input.pageSize,
      totalPages: Math.ceil(total / input.pageSize),
      summary
    };
  })
});
