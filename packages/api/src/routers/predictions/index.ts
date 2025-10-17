import { TRPCError } from "@trpc/server";
import { prisma } from "@qp/db";

import { protectedProcedure, router } from "../../trpc";
import { requireRegistrationForPool } from "../../middleware/require-registration";
import {
  createPredictionSchema,
  updatePredictionSchema,
  bulkSavePredictionsSchema,
  getPredictionsByPoolSchema,
  getPredictionsByMatchSchema,
  deletePredictionSchema
} from "./schema";

export const predictionsRouter = router({
  // Get user's predictions for a pool
  getByPool: protectedProcedure
    .input(getPredictionsByPoolSchema)
    .use(requireRegistrationForPool())
    .query(async ({ input, ctx }) => {
    const userId = ctx.session.user.id;

    const predictions = await prisma.prediction.findMany({
      where: {
        userId,
        poolId: input.poolId
      },
      include: {
        match: {
          select: {
            id: true,
            kickoffTime: true,
            locked: true,
            status: true,
            homeScore: true,
            awayScore: true,
            homeTeam: {
              select: {
                id: true,
                name: true,
                shortName: true,
                logoUrl: true
              }
            },
            awayTeam: {
              select: {
                id: true,
                name: true,
                shortName: true,
                logoUrl: true
              }
            }
          }
        }
      },
      orderBy: {
        match: {
          kickoffTime: "asc"
        }
      }
    });

    return predictions;
  }),

  // Create or update a single prediction
  save: protectedProcedure
    .input(createPredictionSchema)
    .use(requireRegistrationForPool())
    .mutation(async ({ input, ctx }) => {
    const userId = ctx.session.user.id;
    
    if (!ctx.registration) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Registration not found in context"
      });
    }
    
    const registration = ctx.registration;

    // Check if match is locked
    const match = await prisma.match.findUnique({
      where: { id: input.matchId }
    });

    if (!match) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Match not found"
      });
    }

    // Check if match is locked or kickoff has passed
    const now = new Date();
    if (match.locked || match.kickoffTime <= now) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "MATCH_LOCKED"
      });
    }

    // Upsert prediction
    const prediction = await prisma.prediction.upsert({
      where: {
        matchId_poolId_userId: {
          matchId: input.matchId,
          poolId: input.poolId,
          userId
        }
      },
      create: {
        matchId: input.matchId,
        poolId: input.poolId,
        userId,
        tenantId: registration.tenantId,
        homeScore: input.homeScore,
        awayScore: input.awayScore
      },
      update: {
        homeScore: input.homeScore,
        awayScore: input.awayScore
      }
    });

    return prediction;
  }),

  // Bulk save predictions
  bulkSave: protectedProcedure
    .input(bulkSavePredictionsSchema)
    .use(requireRegistrationForPool())
    .mutation(async ({ input, ctx }) => {
    const userId = ctx.session.user.id;
    
    if (!ctx.registration) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Registration not found in context"
      });
    }
    
    const registration = ctx.registration;

    // Get all matches to validate
    const matchIds = input.predictions.map((p) => p.matchId);
    const matches = await prisma.match.findMany({
      where: {
        id: { in: matchIds }
      }
    });

    if (matches.length !== matchIds.length) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "One or more matches not found"
      });
    }

    const now = new Date();
    const results = [];
    const errors = [];

    for (const predInput of input.predictions) {
      const match = matches.find((m) => m.id === predInput.matchId);

      if (!match) {
        errors.push({ matchId: predInput.matchId, error: "Match not found" });
        continue;
      }

      // Skip locked or started matches
      if (match.locked || match.kickoffTime <= now) {
        errors.push({ matchId: predInput.matchId, error: "MATCH_LOCKED" });
        continue;
      }

      try {
        const prediction = await prisma.prediction.upsert({
          where: {
            matchId_poolId_userId: {
              matchId: predInput.matchId,
              poolId: input.poolId,
              userId
            }
          },
          create: {
            matchId: predInput.matchId,
            poolId: input.poolId,
            userId,
            tenantId: registration.tenantId,
            homeScore: predInput.homeScore,
            awayScore: predInput.awayScore
          },
          update: {
            homeScore: predInput.homeScore,
            awayScore: predInput.awayScore
          }
        });

        results.push(prediction);
      } catch (error) {
        errors.push({ matchId: predInput.matchId, error: "Failed to save" });
      }
    }

    return {
      saved: results.length,
      errors,
      predictions: results
    };
  }),

  // Delete a prediction (only if match not locked)
  delete: protectedProcedure.input(deletePredictionSchema).mutation(async ({ input, ctx }) => {
    const userId = ctx.session.user.id;

    const prediction = await prisma.prediction.findUnique({
      where: { id: input.predictionId },
      include: {
        match: true
      }
    });

    if (!prediction) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Prediction not found"
      });
    }

    if (prediction.userId !== userId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You can only delete your own predictions"
      });
    }

    if (prediction.match.locked || prediction.match.kickoffTime <= new Date()) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Cannot delete prediction: match has started or is locked"
      });
    }

    await prisma.prediction.delete({
      where: { id: input.predictionId }
    });

    return { success: true };
  })
});
