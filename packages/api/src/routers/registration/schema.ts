import { z } from "zod";

// Phone validation - E.164 format: +[country code][number]
const phoneSchema = z
  .string()
  .regex(/^\+[1-9]\d{1,14}$/, "Formato inválido (ej: +525512345678)")
  .optional();

export const registerPublicSchema = z.object({
  poolId: z.string().cuid(),
  userId: z.string().cuid(),
  displayName: z.string().min(2).max(50),
  email: z.string().email(),
  phone: phoneSchema,
  captchaToken: z.string().optional()
});

export const registerWithCodeSchema = z.object({
  poolId: z.string().cuid(),
  userId: z.string().cuid(),
  displayName: z.string().min(2).max(50),
  email: z.string().email(),
  phone: phoneSchema,
  inviteCode: z.string().length(8).regex(/^[A-Z0-9]+$/),
  captchaToken: z.string().optional()
});

export const registerWithEmailInviteSchema = z.object({
  poolId: z.string().cuid(),
  userId: z.string().cuid(),
  displayName: z.string().min(2).max(50),
  email: z.string().email(),
  phone: phoneSchema,
  inviteToken: z.string().length(64).regex(/^[a-f0-9]+$/)
});

export const validateInviteCodeSchema = z.object({
  poolId: z.string().cuid(),
  code: z.string().length(8).regex(/^[A-Z0-9]+$/)
});

export const validateInviteTokenSchema = z.object({
  poolId: z.string().cuid(),
  token: z.string().length(64).regex(/^[a-f0-9]+$/)
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
