import { z } from "zod";

export const policyTypeSchema = z.enum(["TERMS", "PRIVACY"]);

export const listPoliciesSchema = z.object({
  tenantId: z.string(),
  poolId: z.string().optional(),
  type: policyTypeSchema.optional(),
});

export const publishPolicySchema = z.object({
  tenantId: z.string(),
  poolId: z.string().optional(),
  type: policyTypeSchema,
  title: z.string().min(1),
  content: z.string().min(1),
});

export const getCurrentPolicySchema = z.object({
  tenantId: z.string(),
  poolId: z.string().optional(),
  type: policyTypeSchema,
});

export const getPolicyByVersionSchema = z.object({
  tenantId: z.string(),
  poolId: z.string().optional(),
  type: policyTypeSchema,
  version: z.number().int().positive(),
});
