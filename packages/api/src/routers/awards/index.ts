import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { prisma } from "@qp/db";

import { publicProcedure, router } from "../../trpc";
import { recordEvidenceSchema, listAwardsSchema, exportAwardsSchema } from "./schema";

export const awardsRouter = router({
  // List awards by pool
  listByPool: publicProcedure
    .input(listAwardsSchema)
    .query(async ({ input }) => {
      return prisma.prizeAward.findMany({
        where: {
          tenantId: input.tenantId,
          prize: {
            poolId: input.poolId
          },
          ...(input.userId ? { userId: input.userId } : {}),
          ...(input.delivered !== undefined
            ? input.delivered
              ? { deliveredAt: { not: null } }
              : { deliveredAt: null }
            : {})
        },
        include: {
          prize: {
            select: {
              title: true,
              type: true,
              value: true,
              rankFrom: true,
              rankTo: true
            }
          },
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        },
        orderBy: [{ rank: "asc" }, { awardedAt: "desc" }]
      });
    }),

  // Get user awards (for player view)
  getUserAwards: publicProcedure
    .input(z.object({ userId: z.string().cuid() }))
    .query(async ({ input }) => {
      return prisma.prizeAward.findMany({
        where: {
          userId: input.userId
        },
        include: {
          prize: {
            select: {
              title: true,
              type: true,
              value: true,
              description: true,
              imageUrl: true,
              pool: {
                select: {
                  name: true,
                  slug: true
                }
              }
            }
          }
        },
        orderBy: { awardedAt: "desc" }
      });
    }),

  // Record evidence of delivery
  recordEvidence: publicProcedure
    .input(recordEvidenceSchema)
    .mutation(async ({ input }) => {
      const { awardId, ...data } = input;

      const award = await prisma.prizeAward.findUnique({
        where: { id: awardId },
        select: { id: true }
      });

      if (!award) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Award not found"
        });
      }

      return prisma.prizeAward.update({
        where: { id: awardId },
        data: {
          ...data,
          deliveredAt: data.deliveredAt ?? new Date()
        },
        include: {
          prize: {
            select: { title: true }
          },
          user: {
            select: { email: true, name: true }
          }
        }
      });
    }),

  // Export awards as CSV data
  exportCsv: publicProcedure
    .input(exportAwardsSchema)
    .query(async ({ input }) => {
      const awards = await prisma.prizeAward.findMany({
        where: {
          tenantId: input.tenantId,
          prize: {
            poolId: input.poolId
          }
        },
        include: {
          prize: {
            select: {
              title: true,
              type: true,
              value: true,
              rankFrom: true,
              rankTo: true
            }
          },
          user: {
            select: {
              email: true,
              name: true
            }
          }
        },
        orderBy: [{ rank: "asc" }, { awardedAt: "desc" }]
      });

      // Return structured data for CSV generation
      return awards.map((award) => ({
        userId: award.userId,
        userEmail: award.user.email,
        userName: award.user.name || "",
        rank: award.rank,
        prizeTitle: award.prize.title,
        prizeType: award.prize.type,
        prizeValue: award.prize.value || "",
        rankRange: `${award.prize.rankFrom}-${award.prize.rankTo}`,
        awardedAt: award.awardedAt.toISOString(),
        deliveredAt: award.deliveredAt?.toISOString() || "",
        notified: award.notified,
        notes: award.notes || ""
      }));
    })
});
