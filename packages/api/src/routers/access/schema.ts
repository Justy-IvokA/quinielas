import { z } from "zod";

export const createAccessPolicySchema = z.object({
  poolId: z.string().cuid(),
  tenantId: z.string().cuid(),
  accessType: z.enum(["PUBLIC", "CODE", "EMAIL_INVITE"]),
  requireCaptcha: z.boolean().default(false),
  requireEmailVerification: z.boolean().default(false),
  domainAllowList: z.array(z.string()).optional(),
  maxRegistrations: z.number().int().positive().optional(),
  registrationStartDate: z.date().optional(),
  registrationEndDate: z.date().optional(),
  userCap: z.number().int().positive().optional(),
  windowStart: z.date().optional(),
  windowEnd: z.date().optional()
});

export const updateAccessPolicySchema = z.object({
  id: z.string().cuid(),
  requireCaptcha: z.boolean().optional(),
  requireEmailVerification: z.boolean().optional(),
  domainAllowList: z.array(z.string()).optional(),
  maxRegistrations: z.number().int().positive().optional(),
  registrationStartDate: z.date().optional(),
  registrationEndDate: z.date().optional(),
  userCap: z.number().int().positive().optional(),
  windowStart: z.date().optional(),
  windowEnd: z.date().optional()
});

export const createCodeBatchSchema = z.object({
  accessPolicyId: z.string().cuid(),
  tenantId: z.string().cuid(),
  name: z.string().optional(),
  prefix: z.string().max(10).optional(),
  quantity: z.number().int().min(1).max(1000),
  usesPerCode: z.number().int().min(1).default(1),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  validFrom: z.date().optional(),
  validTo: z.date().optional(),
  expiresAt: z.date().optional()
});

export const createEmailInvitationSchema = z.object({
  poolId: z.string().cuid(),
  accessPolicyId: z.string().cuid(),
  tenantId: z.string().cuid(),
  email: z.string().email(),
  expiresAt: z.date().optional()
});

export const uploadInvitationsCsvSchema = z.object({
  poolId: z.string().cuid(),
  accessPolicyId: z.string().cuid(),
  tenantId: z.string().cuid(),
  emails: z.array(z.string().email()).min(1).max(1000),
  expiresAt: z.date().optional()
});

export const sendInvitationsSchema = z.object({
  poolId: z.string().cuid(),
  tenantId: z.string().cuid(),
  invitationIds: z.array(z.string().cuid()).optional()
});

export const invitationStatsSchema = z.object({
  poolId: z.string().cuid(),
  tenantId: z.string().cuid()
});

export const codeStatsSchema = z.object({
  poolId: z.string().cuid(),
  tenantId: z.string().cuid()
});

export const downloadCodesSchema = z.object({
  batchId: z.string().cuid(),
  tenantId: z.string().cuid()
});

export type CreateAccessPolicyInput = z.infer<typeof createAccessPolicySchema>;
export type UpdateAccessPolicyInput = z.infer<typeof updateAccessPolicySchema>;
export type CreateCodeBatchInput = z.infer<typeof createCodeBatchSchema>;
export type CreateEmailInvitationInput = z.infer<typeof createEmailInvitationSchema>;
