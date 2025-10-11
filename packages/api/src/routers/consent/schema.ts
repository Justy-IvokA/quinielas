import { z } from "zod";

export const policyTypeSchema = z.enum(["TERMS", "PRIVACY"]);

export const getMyConsentsSchema = z.object({
  tenantId: z.string(),
  poolId: z.string().optional(),
});

export const acceptPolicySchema = z.object({
  tenantId: z.string(),
  poolId: z.string().optional(),
  policyType: policyTypeSchema,
  version: z.number().int().positive(),
});

export const checkConsentSchema = z.object({
  tenantId: z.string(),
  poolId: z.string().optional(),
  policyType: policyTypeSchema,
});
