import { z } from "zod";

// Regex para validar teléfonos internacionales (E.164 format)
// Ejemplos válidos: +525512345678, +14155552671, +34612345678
const phoneRegex = /^\+[1-9]\d{1,14}$/;

export const updateUserProfileSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(2).max(100).optional(),
  phone: z
    .string()
    .regex(phoneRegex, "Teléfono debe estar en formato internacional (+525512345678)")
    .optional()
    .nullable(),
  email: z.string().email().optional()
});

export const verifyPhoneSchema = z.object({
  userId: z.string().cuid(),
  phone: z.string().regex(phoneRegex),
  verificationCode: z.string().length(6).regex(/^\d{6}$/)
});

export const sendPhoneVerificationSchema = z.object({
  userId: z.string().cuid(),
  phone: z.string().regex(phoneRegex)
});

export const getUserByPhoneSchema = z.object({
  phone: z.string().regex(phoneRegex)
});

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;
export type VerifyPhoneInput = z.infer<typeof verifyPhoneSchema>;
export type SendPhoneVerificationInput = z.infer<typeof sendPhoneVerificationSchema>;
export type GetUserByPhoneInput = z.infer<typeof getUserByPhoneSchema>;
