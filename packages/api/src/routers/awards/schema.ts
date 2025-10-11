import { z } from "zod";

export const recordEvidenceSchema = z.object({
  awardId: z.string().cuid(),
  deliveredAt: z.date().optional(),
  evidence: z.record(z.any()).optional(),
  notes: z.string().max(1000).optional()
});

export const listAwardsSchema = z.object({
  poolId: z.string().cuid(),
  tenantId: z.string().cuid(),
  userId: z.string().cuid().optional(),
  delivered: z.boolean().optional()
});

export const exportAwardsSchema = z.object({
  poolId: z.string().cuid(),
  tenantId: z.string().cuid()
});
