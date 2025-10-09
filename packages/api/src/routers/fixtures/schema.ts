import { z } from "zod";

export const getFixturesBySeasonSchema = z.object({
  seasonId: z.string().cuid(),
  includeFinished: z.boolean().default(false)
});

export const getFixtureByIdSchema = z.object({
  id: z.string().cuid()
});

export const syncSeasonFixturesSchema = z.object({
  seasonId: z.string().cuid(),
  externalSourceId: z.string().cuid()
});

export const updateMatchResultSchema = z.object({
  matchId: z.string().cuid(),
  homeScore: z.number().int().min(0),
  awayScore: z.number().int().min(0),
  status: z.enum(["SCHEDULED", "LIVE", "FINISHED", "POSTPONED", "CANCELLED"]),
  finishedAt: z.date().optional()
});

export const lockMatchPredictionsSchema = z.object({
  matchId: z.string().cuid()
});

export type GetFixturesBySeasonInput = z.infer<typeof getFixturesBySeasonSchema>;
export type GetFixtureByIdInput = z.infer<typeof getFixtureByIdSchema>;
export type SyncSeasonFixturesInput = z.infer<typeof syncSeasonFixturesSchema>;
export type UpdateMatchResultInput = z.infer<typeof updateMatchResultSchema>;
export type LockMatchPredictionsInput = z.infer<typeof lockMatchPredictionsSchema>;
