import { z } from "zod";

export const adminEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("Quinielas WL Admin"),
  NEXT_PUBLIC_TENANT_SLUG: z.string().min(1).default("demo"),
  NEXT_PUBLIC_BRAND_SLUG: z.string().min(1).default("default")
});

export type AdminEnv = z.infer<typeof adminEnvSchema>;
