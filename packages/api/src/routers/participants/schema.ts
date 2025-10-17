import { z } from "zod";

export const getParticipantsMetricsSchema = z.object({
  poolId: z.string().cuid(),
  search: z.string().optional(),
  sortBy: z.enum(["points", "exactCount", "signCount", "predictionsCount", "name"]).default("points"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20)
});

export type GetParticipantsMetricsInput = z.infer<typeof getParticipantsMetricsSchema>;
