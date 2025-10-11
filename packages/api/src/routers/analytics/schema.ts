import { z } from "zod";

export const analyticsInputSchema = z.object({
  poolId: z.string().cuid(),
  tenantId: z.string().cuid(),
  startDate: z.date().optional(),
  endDate: z.date().optional()
});

export const adoptionMetricsSchema = analyticsInputSchema;
export const predictionsMetricsSchema = analyticsInputSchema;
export const trafficMetricsSchema = analyticsInputSchema;
