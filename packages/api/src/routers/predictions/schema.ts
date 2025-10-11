import { z } from "zod";

export const createPredictionSchema = z.object({
  poolId: z.string().cuid(),
  matchId: z.string().cuid(),
  homeScore: z.number().int().min(0).max(99),
  awayScore: z.number().int().min(0).max(99)
});

export const updatePredictionSchema = z.object({
  predictionId: z.string().cuid(),
  homeScore: z.number().int().min(0).max(99),
  awayScore: z.number().int().min(0).max(99)
});

export const bulkSavePredictionsSchema = z.object({
  poolId: z.string().cuid(),
  predictions: z.array(
    z.object({
      matchId: z.string().cuid(),
      homeScore: z.number().int().min(0).max(99),
      awayScore: z.number().int().min(0).max(99)
    })
  )
});

export const getPredictionsByPoolSchema = z.object({
  poolId: z.string().cuid()
});

export const getPredictionsByMatchSchema = z.object({
  matchId: z.string().cuid(),
  poolId: z.string().cuid()
});

export const deletePredictionSchema = z.object({
  predictionId: z.string().cuid()
});

export type CreatePredictionInput = z.infer<typeof createPredictionSchema>;
export type UpdatePredictionInput = z.infer<typeof updatePredictionSchema>;
export type BulkSavePredictionsInput = z.infer<typeof bulkSavePredictionsSchema>;
export type GetPredictionsByPoolInput = z.infer<typeof getPredictionsByPoolSchema>;
export type GetPredictionsByMatchInput = z.infer<typeof getPredictionsByMatchSchema>;
export type DeletePredictionInput = z.infer<typeof deletePredictionSchema>;
