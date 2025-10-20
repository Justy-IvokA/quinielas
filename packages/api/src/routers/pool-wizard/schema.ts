import { z } from "zod";

// Step 1 & 2: Sport & Competition/Season
export const listCompetitionsSchema = z.object({
  query: z.string().optional(),
  country: z.string().optional(),
  youthOnly: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).optional()
});

export const listSeasonsSchema = z.object({
  competitionExternalId: z.string().min(1)
});

// Step 3: Stage/Round
export const listStagesSchema = z.object({
  competitionExternalId: z.string().min(1),
  seasonYear: z.number().int().min(2000).max(2100)
});

export const previewFixturesSchema = z.object({
  competitionExternalId: z.string().min(1),
  seasonYear: z.number().int().min(2000).max(2100),
  stageLabel: z.string().optional(),
  roundLabel: z.string().optional()
});

// Step 4: Pool Details
export const poolDetailsSchema = z.object({
  title: z.string().min(3).max(100),
  slug: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  description: z.string().max(500).optional()
});

// Step 5: Access Policy
export const accessPolicySchema = z.object({
  accessType: z.enum(["PUBLIC", "CODE", "EMAIL_INVITE"]),
  requireCaptcha: z.boolean().optional(),
  requireEmailVerification: z.boolean().optional(),
  emailDomains: z.array(z.string()).optional(),
  maxUsers: z.number().int().min(1).optional(),
  startAt: z.date().optional(),
  endAt: z.date().optional()
});

// Step 6: Prizes
export const prizeSchema = z.object({
  rankFrom: z.number().int().min(1),
  rankTo: z.number().int().min(1),
  type: z.enum(["CASH", "DISCOUNT", "SERVICE", "DAY_OFF", "EXPERIENCE", "OTHER"]).optional(),
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  value: z.string().max(100).optional(),
  imageUrl: z.string().url().optional().or(z.literal(""))
}).refine(data => data.rankTo >= data.rankFrom, {
  message: "rankTo must be greater than or equal to rankFrom"
});

// Step 7: Create and Import (combines all steps)
export const createAndImportSchema = z.object({
  // Sport (implicit: football for now)
  sportId: z.string().cuid().optional(),
  
  // Competition & Season
  competitionExternalId: z.string().min(1),
  competitionName: z.string().min(1), // Add competition name
  seasonYear: z.number().int().min(2000).max(2100),
  
  // Stage/Round scope
  stageLabel: z.string().optional(),
  roundLabel: z.string().optional(),
  
  // Pool details
  pool: poolDetailsSchema,
  
  // Access policy
  access: accessPolicySchema,
  
  // Prizes
  prizes: z.array(prizeSchema).optional()
});

// Wizard state (for localStorage persistence)
export const wizardStateSchema = z.object({
  step: z.number().int().min(1).max(7),
  sportId: z.string().cuid().optional(),
  competitionExternalId: z.string().optional(),
  competitionName: z.string().optional(),
  seasonYear: z.number().int().optional(),
  stageLabel: z.string().optional(),
  roundLabel: z.string().optional(),
  pool: poolDetailsSchema.partial().optional(),
  access: accessPolicySchema.partial().optional(),
  prizes: z.array(prizeSchema).optional()
});

// Type exports
export type ListCompetitionsInput = z.infer<typeof listCompetitionsSchema>;
export type ListSeasonsInput = z.infer<typeof listSeasonsSchema>;
export type ListStagesInput = z.infer<typeof listStagesSchema>;
export type PreviewFixturesInput = z.infer<typeof previewFixturesSchema>;
export type PoolDetailsInput = z.infer<typeof poolDetailsSchema>;
export type AccessPolicyInput = z.infer<typeof accessPolicySchema>;
export type PrizeInput = z.infer<typeof prizeSchema>;
export type CreateAndImportInput = z.infer<typeof createAndImportSchema>;
export type WizardState = z.infer<typeof wizardStateSchema>;
