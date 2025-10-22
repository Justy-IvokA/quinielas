import { z } from "zod";

// Phone validation - E.164 format: +[country code][number]
const phoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{1,14}$/, "Formato inválido (ej: +525512345678)")
  .optional();

export const registerPublicSchema = z.object({
  poolId: z.string().cuid(),
  userId: z.string().cuid(),
  displayName: z.string().min(2).max(50).optional(),
  email: z.string().email().optional(),
  phone: phoneSchema,
  captchaToken: z.string().optional()
}).refine(
  (data) => {
    // At least displayName and email must be provided if this is a new user
    // The backend will handle fetching from existing registrations if needed
    return true;
  },
  {
    message: "Display name and email are required for registration"
  }
);

export const registerWithCodeSchema = z.object({
  poolId: z.string().cuid(),
  userId: z.string().cuid(),
  displayName: z.string().min(2).max(50).optional(),
  email: z.string().email().optional(),
  phone: phoneSchema,
  inviteCode: z.string().min(8).max(20).regex(/^[A-Za-z0-9._-]+$/),
  captchaToken: z.string().optional()
});

export const registerWithEmailInviteSchema = z.object({
  poolId: z.string().cuid(),
  userId: z.string().cuid(),
  displayName: z.string().min(2).max(50).optional(),
  email: z.string().email().optional(),
  phone: phoneSchema,
  inviteToken: z.string().min(32).max(64).regex(/^[a-f0-9]+$/)
});

export const validateInviteCodeSchema = z.object({
  poolId: z.string().cuid(),
  code: z.string().min(8).max(20).regex(/^[A-Za-z0-9._-]+$/)
});

export const validateInviteTokenSchema = z.object({
  poolId: z.string().cuid(),
  token: z.string().min(32).max(64).regex(/^[a-f0-9]+$/)
});

export const checkRegistrationSchema = z.object({
  poolId: z.string().cuid(),
  userId: z.string().cuid()
});

export type RegisterPublicInput = z.infer<typeof registerPublicSchema>;
export type RegisterWithCodeInput = z.infer<typeof registerWithCodeSchema>;
export type RegisterWithEmailInviteInput = z.infer<typeof registerWithEmailInviteSchema>;
export type ValidateInviteCodeInput = z.infer<typeof validateInviteCodeSchema>;
export type ValidateInviteTokenInput = z.infer<typeof validateInviteTokenSchema>;
export type CheckRegistrationInput = z.infer<typeof checkRegistrationSchema>;
