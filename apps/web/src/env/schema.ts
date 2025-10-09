import { z } from "zod";

export const webEnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_BRAND_SLUG: z.string().min(1).default("default"),
  NEXT_PUBLIC_TENANT_SLUG: z.string().min(1).default("demo"),
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("Quinielas WL"),
  NEXT_PUBLIC_WEBAPP_URL: z.string().url().default("https://quinielas.app")
});

export type WebEnv = z.infer<typeof webEnvSchema>;
