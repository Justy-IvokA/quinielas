import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { prisma, parseUserMetadata, mergeUserMetadata, type UserMetadata } from "@qp/db";

import { protectedProcedure, router } from "../../trpc";

// Schema for updating current user's profile
const updateProfileSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100).optional(),
  phone: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, "Teléfono debe estar en formato internacional (+525512345678)")
    .optional()
    .nullable(),
});

export const userRouter = router({
  /**
   * Get current user's profile
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        phoneVerified: true,
        image: true,
        metadata: true,
        createdAt: true,
        lastSignInAt: true,
        _count: {
          select: {
            registrations: true,
            predictions: true,
            prizeAwards: true,
          },
        },
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    // Parse metadata
    const metadata = parseUserMetadata(user.metadata);

    return {
      ...user,
      metadata,
    };
  }),

  /**
   * Update current user's profile
   * Used after email verification to complete profile
   * Limited to 3 changes to prevent abuse
   */
  updateProfile: protectedProcedure
    .input(updateProfileSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Get current user data
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          phone: true, 
          name: true,
          metadata: true,
        },
      });

      if (!currentUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Usuario no encontrado",
        });
      }

      // Parse metadata and get profile changes limit
      const metadata = parseUserMetadata(currentUser.metadata);
      const profileChangesUsed = metadata?.limits?.profileChanges?.used ?? 0;
      const profileChangesMax = metadata?.limits?.profileChanges?.max ?? 3;

      // Check if user has exceeded the limit
      if (profileChangesUsed >= profileChangesMax) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Has alcanzado el límite de ${profileChangesMax} cambios de perfil. Contacta al soporte si necesitas más cambios.`,
        });
      }

      // If phone is being updated, check if it's already in use
      if (input.phone) {
        const existingUser = await prisma.user.findUnique({
          where: { phone: input.phone },
        });

        if (existingUser && existingUser.id !== userId) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Este número de teléfono ya está registrado",
          });
        }
      }

      // Determine if this is an actual change
      const hasNameChanged = input.name !== undefined && input.name !== currentUser.name;
      const hasPhoneChanged = input.phone !== undefined && input.phone !== currentUser.phone;
      const shouldIncrementCounter = hasNameChanged || hasPhoneChanged;

      // Update metadata with new profile changes count
      const updatedMetadata = shouldIncrementCounter
        ? mergeUserMetadata(metadata, {
            limits: {
              profileChanges: {
                used: profileChangesUsed + 1,
                max: profileChangesMax,
              },
            },
          })
        : metadata;

      // Update user profile
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          name: input.name,
          phone: input.phone,
          phoneVerified: hasPhoneChanged ? false : undefined, // Reset verification if phone changed
          metadata: shouldIncrementCounter ? updatedMetadata : undefined,
        },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          phoneVerified: true,
          metadata: true,
          updatedAt: true,
        },
      });

      return {
        ...updatedUser,
        metadata: parseUserMetadata(updatedUser.metadata),
      };
    }),
});
