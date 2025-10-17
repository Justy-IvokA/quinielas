import { z } from "zod";

export const authEnvSchema = z.object({
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  AUTH_URL: z.string().url().optional(),
  AUTH_TRUST_HOST: z.coerce.boolean().default(true), // Trust host header for subdomain support
  
  // Email provider (magic link)
  EMAIL_SERVER_HOST: z.string().optional(),
  EMAIL_SERVER_PORT: z.coerce.number().optional(),
  EMAIL_SERVER_USER: z.string().optional(),
  EMAIL_SERVER_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  
  // OAuth providers (optional)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),
  
  NODE_ENV: z.enum(["development", "production", "test"]).default("development")
});

export type AuthEnv = z.infer<typeof authEnvSchema>;

export const parseAuthEnv = (): AuthEnv => {
  return authEnvSchema.parse(process.env);
};
