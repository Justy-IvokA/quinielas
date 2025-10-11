import { z } from "zod";

export const searchAuditLogsSchema = z.object({
  tenantId: z.string(),
  poolId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  action: z.string().optional(),
  userEmail: z.string().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(50),
});

export const exportAuditLogsSchema = z.object({
  tenantId: z.string(),
  poolId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  action: z.string().optional(),
  userEmail: z.string().optional(),
  format: z.enum(["csv", "json"]).default("csv"),
});
