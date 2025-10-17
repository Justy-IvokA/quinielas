import { z } from "zod";

export const listUserPoolsSchema = z.object({
  filter: z.enum(["ALL", "ACTIVE", "FINALIZED", "PENDING"]).default("ALL"),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(24),
  sort: z.enum(["RECENT", "NEXT_KICKOFF", "FINALIZED_RECENT"]).default("RECENT")
});

export type ListUserPoolsInput = z.infer<typeof listUserPoolsSchema>;
