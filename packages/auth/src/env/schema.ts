import { z } from "zod";

export const authEnvSchema = z.object({
  AUTH_SECRET: z.string().min(1),
  AUTH_EMAIL_FROM: z.string().email(),
  AUTH_EMAIL_SERVER: z.string().min(1)
});

export type AuthEnv = z.infer<typeof authEnvSchema>;
