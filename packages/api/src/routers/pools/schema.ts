import { z } from "zod";

export const createPoolSchema = z.object({
  tenantId: z.string().cuid(),
  brandId: z.string().cuid(),
  seasonId: z.string().cuid(),
  name: z.string().min(3).max(100),
  slug: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  startDate: z.date(),
  endDate: z.date(),
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(false),
  rules: z.object({
    exactScore: z.number().int().min(0).default(5),
    correctSign: z.number().int().min(0).default(3),
    goalDiffBonus: z.number().int().min(0).default(1),
    tieBreakers: z.array(z.enum(["EXACT_SCORES", "CORRECT_SIGNS", "PREMIUM_MATCHES", "TIE_BREAKER_QUESTION"])).default(["EXACT_SCORES", "CORRECT_SIGNS"]),
    rounds: z.object({
      start: z.number().int().positive(),
      end: z.number().int().positive()
    }).optional()
  }).optional()
});

export const updatePoolSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(3).max(100).optional(),
  slug: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(500).optional(),
  brandId: z.string().cuid().optional(),
  prizeSummary: z.string().max(500).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  isActive: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  ruleSet: z.object({
    exactScore: z.number().int().min(0).optional(),
    correctSign: z.number().int().min(0).optional(),
    goalDiffBonus: z.number().int().min(0).optional(),
    tieBreakers: z.array(z.enum(["EXACT_SCORES", "CORRECT_SIGNS", "PREMIUM_MATCHES", "TIE_BREAKER_QUESTION"])).optional(),
    rounds: z.object({
      start: z.number().int().positive(),
      end: z.number().int().positive()
    }).optional()
  }).optional()
});

export const createPrizeSchema = z.object({
  poolId: z.string().cuid(),
  tenantId: z.string().cuid(),
  position: z.number().int().min(1),
  rankFrom: z.number().int().min(1),
  rankTo: z.number().int().min(1),
  type: z.enum(["CASH", "DISCOUNT", "SERVICE", "DAY_OFF", "EXPERIENCE", "OTHER"]).optional(),
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  value: z.string().max(100).optional(),
  imageUrl: z.string().url().optional()
});

export const updatePrizeSchema = z.object({
  id: z.string().cuid(),
  position: z.number().int().min(1).optional(),
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  value: z.string().max(100).optional(),
  imageUrl: z.string().url().optional()
});

export type CreatePoolInput = z.infer<typeof createPoolSchema>;
export type UpdatePoolInput = z.infer<typeof updatePoolSchema>;
export type CreatePrizeInput = z.infer<typeof createPrizeSchema>;
export type UpdatePrizeInput = z.infer<typeof updatePrizeSchema>;
