import { z } from "zod";

export const prizeTypeEnum = z.enum([
  "CASH",
  "DISCOUNT",
  "SERVICE",
  "DAY_OFF",
  "EXPERIENCE",
  "OTHER"
]);

export const createPrizeSchema = z.object({
  poolId: z.string().cuid(),
  tenantId: z.string().cuid(),
  rankFrom: z.number().int().positive(),
  rankTo: z.number().int().positive(),
  type: prizeTypeEnum,
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  value: z.string().max(100).optional(),
  metadata: z.record(z.any()).optional(),
  imageUrl: z.string().url().optional()
}).refine(
  (data) => data.rankTo >= data.rankFrom,
  {
    message: "rankTo must be greater than or equal to rankFrom",
    path: ["rankTo"]
  }
);

export const updatePrizeSchema = z.object({
  id: z.string().cuid(),
  rankFrom: z.number().int().positive().optional(),
  rankTo: z.number().int().positive().optional(),
  type: prizeTypeEnum.optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  value: z.string().max(100).optional().nullable(),
  metadata: z.record(z.any()).optional().nullable(),
  imageUrl: z.string().url().optional().nullable()
}).refine(
  (data) => {
    if (data.rankFrom !== undefined && data.rankTo !== undefined) {
      return data.rankTo >= data.rankFrom;
    }
    return true;
  },
  {
    message: "rankTo must be greater than or equal to rankFrom",
    path: ["rankTo"]
  }
);

export const reorderPrizesSchema = z.object({
  poolId: z.string().cuid(),
  tenantId: z.string().cuid(),
  prizes: z.array(
    z.object({
      id: z.string().cuid(),
      rankFrom: z.number().int().positive(),
      rankTo: z.number().int().positive()
    })
  )
});
