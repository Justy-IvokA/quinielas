import { z } from "zod";

export const getLeaderboardSchema = z.object({
  poolId: z.string().cuid(),
  useLive: z.boolean().default(true),
  limit: z.number().int().min(1).max(1000).default(100),
  offset: z.number().int().min(0).default(0)
});

export const getLeaderboardSnapshotsSchema = z.object({
  poolId: z.string().cuid(),
  limit: z.number().int().min(1).max(50).default(10)
});

export type GetLeaderboardInput = z.infer<typeof getLeaderboardSchema>;
export type GetLeaderboardSnapshotsInput = z.infer<typeof getLeaderboardSnapshotsSchema>;
