import { prisma } from "@qp/db";

import { publicProcedure, router } from "../../trpc";
import {
  adoptionMetricsSchema,
  predictionsMetricsSchema,
  trafficMetricsSchema
} from "./schema";

export const analyticsRouter = router({
  // Adoption metrics: registrations, invitations, predictions completion
  adoption: publicProcedure
    .input(adoptionMetricsSchema)
    .query(async ({ input }) => {
      const { poolId, tenantId, startDate, endDate } = input;

      const dateFilter = {
        ...(startDate ? { gte: startDate } : {}),
        ...(endDate ? { lte: endDate } : {})
      };

      // Total registrations
      const totalRegistrations = await prisma.registration.count({
        where: {
          poolId,
          tenantId,
          ...(startDate || endDate ? { joinedAt: dateFilter } : {})
        }
      });

      // Registrations by day
      const registrationsByDay = await prisma.$queryRaw<
        Array<{ date: Date; count: bigint }>
      >`
        SELECT DATE("joinedAt") as date, COUNT(*)::bigint as count
        FROM "Registration"
        WHERE "poolId" = ${poolId}
          AND "tenantId" = ${tenantId}
          ${startDate ? prisma.$queryRaw`AND "joinedAt" >= ${startDate}` : prisma.$queryRaw``}
          ${endDate ? prisma.$queryRaw`AND "joinedAt" <= ${endDate}` : prisma.$queryRaw``}
        GROUP BY DATE("joinedAt")
        ORDER BY date ASC
      `;

      // Invitation stats
      const invitationStats = await prisma.invitation.groupBy({
        by: ["status"],
        where: {
          poolId,
          tenantId,
          ...(startDate || endDate ? { createdAt: dateFilter } : {})
        },
        _count: true
      });

      const totalInvitations = invitationStats.reduce(
        (sum, stat) => sum + stat._count,
        0
      );
      const acceptedInvitations =
        invitationStats.find((s) => s.status === "ACCEPTED")?._count || 0;
      const activationRate =
        totalInvitations > 0 ? (acceptedInvitations / totalInvitations) * 100 : 0;

      // Users with predictions
      const usersWithPredictions = await prisma.prediction.groupBy({
        by: ["userId"],
        where: {
          poolId,
          tenantId
        },
        _count: true
      });

      const completionRate =
        totalRegistrations > 0
          ? (usersWithPredictions.length / totalRegistrations) * 100
          : 0;

      return {
        totalRegistrations,
        registrationsByDay: registrationsByDay.map((r) => ({
          date: r.date.toISOString().split("T")[0],
          count: Number(r.count)
        })),
        invitations: {
          total: totalInvitations,
          accepted: acceptedInvitations,
          activationRate: Math.round(activationRate * 100) / 100
        },
        predictions: {
          usersWithPredictions: usersWithPredictions.length,
          completionRate: Math.round(completionRate * 100) / 100
        }
      };
    }),

  // Predictions metrics: volume, timing, accuracy
  predictions: publicProcedure
    .input(predictionsMetricsSchema)
    .query(async ({ input }) => {
      const { poolId, tenantId, startDate, endDate } = input;

      const dateFilter = {
        ...(startDate ? { gte: startDate } : {}),
        ...(endDate ? { lte: endDate } : {})
      };

      // Total predictions
      const totalPredictions = await prisma.prediction.count({
        where: {
          poolId,
          tenantId,
          ...(startDate || endDate ? { createdAt: dateFilter } : {})
        }
      });

      // Predictions by matchday
      const predictionsByMatchday = await prisma.$queryRaw<
        Array<{ matchday: number | null; count: bigint }>
      >`
        SELECT m.matchday, COUNT(p.id)::bigint as count
        FROM "Prediction" p
        INNER JOIN "Match" m ON p."matchId" = m.id
        WHERE p."poolId" = ${poolId}
          AND p."tenantId" = ${tenantId}
          ${startDate ? prisma.$queryRaw`AND p."createdAt" >= ${startDate}` : prisma.$queryRaw``}
          ${endDate ? prisma.$queryRaw`AND p."createdAt" <= ${endDate}` : prisma.$queryRaw``}
        GROUP BY m.matchday
        ORDER BY m.matchday ASC
      `;

      // On-time predictions (created before match kickoff)
      const onTimePredictions = await prisma.$queryRaw<
        Array<{ count: bigint }>
      >`
        SELECT COUNT(*)::bigint as count
        FROM "Prediction" p
        INNER JOIN "Match" m ON p."matchId" = m.id
        WHERE p."poolId" = ${poolId}
          AND p."tenantId" = ${tenantId}
          AND p."createdAt" < m."kickoffTime"
          ${startDate ? prisma.$queryRaw`AND p."createdAt" >= ${startDate}` : prisma.$queryRaw``}
          ${endDate ? prisma.$queryRaw`AND p."createdAt" <= ${endDate}` : prisma.$queryRaw``}
      `;

      const onTimeRate =
        totalPredictions > 0
          ? (Number(onTimePredictions[0]?.count || 0) / totalPredictions) * 100
          : 0;

      // Exact vs sign predictions
      const exactCount = await prisma.prediction.count({
        where: {
          poolId,
          tenantId,
          isExact: true,
          ...(startDate || endDate ? { createdAt: dateFilter } : {})
        }
      });

      const signCount = await prisma.prediction.count({
        where: {
          poolId,
          tenantId,
          awardedPoints: { gt: 0 },
          isExact: false,
          ...(startDate || endDate ? { createdAt: dateFilter } : {})
        }
      });

      return {
        total: totalPredictions,
        byMatchday: predictionsByMatchday.map((p) => ({
          matchday: p.matchday || 0,
          count: Number(p.count)
        })),
        timing: {
          onTime: Number(onTimePredictions[0]?.count || 0),
          onTimeRate: Math.round(onTimeRate * 100) / 100
        },
        accuracy: {
          exact: exactCount,
          sign: signCount
        }
      };
    }),

  // Traffic metrics: registration peaks by hour
  traffic: publicProcedure
    .input(trafficMetricsSchema)
    .query(async ({ input }) => {
      const { poolId, tenantId, startDate, endDate } = input;

      // Registrations by hour
      const registrationsByHour = await prisma.$queryRaw<
        Array<{ hour: number; count: bigint }>
      >`
        SELECT EXTRACT(HOUR FROM "joinedAt")::int as hour, COUNT(*)::bigint as count
        FROM "Registration"
        WHERE "poolId" = ${poolId}
          AND "tenantId" = ${tenantId}
          ${startDate ? prisma.$queryRaw`AND "joinedAt" >= ${startDate}` : prisma.$queryRaw``}
          ${endDate ? prisma.$queryRaw`AND "joinedAt" <= ${endDate}` : prisma.$queryRaw``}
        GROUP BY hour
        ORDER BY hour ASC
      `;

      // Audit log actions (if tracking page views)
      const auditActions = await prisma.auditLog.groupBy({
        by: ["action"],
        where: {
          tenantId,
          ...(startDate || endDate
            ? {
                createdAt: {
                  ...(startDate ? { gte: startDate } : {}),
                  ...(endDate ? { lte: endDate } : {})
                }
              }
            : {})
        },
        _count: true,
        orderBy: {
          _count: {
            action: "desc"
          }
        },
        take: 10
      });

      return {
        registrationsByHour: registrationsByHour.map((r) => ({
          hour: r.hour,
          count: Number(r.count)
        })),
        topActions: auditActions.map((a) => ({
          action: a.action,
          count: a._count
        }))
      };
    })
});
