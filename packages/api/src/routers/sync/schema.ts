import { z } from "zod";

export const getSyncStatsSchema = z.object({});

export const getSyncHistorySchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0)
});

export const clearCacheSchema = z.object({
  provider: z.string().optional()
});

export const triggerSyncSchema = z.object({
  seasonId: z.string(),
  forceRefresh: z.boolean().default(false)
});
