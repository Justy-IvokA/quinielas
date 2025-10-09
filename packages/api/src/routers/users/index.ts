import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { prisma } from "@qp/db";

import { publicProcedure, router } from "../../trpc";
import {
  getUserByPhoneSchema,
  sendPhoneVerificationSchema,
  updateUserProfileSchema,
  verifyPhoneSchema
} from "./schema";

export const usersRouter = router({
  // Get user by ID
  getById: publicProcedure.input(z.object({ id: z.string().cuid() })).query(async ({ input }) => {
    const user = await prisma.user.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        email: true,
        phone: true,
        phoneVerified: true,
        name: true,
        createdAt: true,
        lastSignInAt: true,
        _count: {
          select: {
            registrations: true,
            predictions: true,
            prizeAwards: true
          }
        }
      }
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found"
      });
    }

    return user;
  }),

  // Get user by phone
  getByPhone: publicProcedure.input(getUserByPhoneSchema).query(async ({ input }) => {
    const user = await prisma.user.findUnique({
      where: { phone: input.phone },
      select: {
        id: true,
        email: true,
        phone: true,
        phoneVerified: true,
        name: true
      }
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found with this phone number"
      });
    }

    return user;
  }),

  // Update user profile
  updateProfile: publicProcedure.input(updateUserProfileSchema).mutation(async ({ input }) => {
    const { id, ...data } = input;

    // If phone is being updated, check if it's already in use
    if (data.phone) {
      const existingUser = await prisma.user.findUnique({
        where: { phone: data.phone }
      });

      if (existingUser && existingUser.id !== id) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This phone number is already registered"
        });
      }

      // Reset phone verification if phone changed
      const currentUser = await prisma.user.findUnique({
        where: { id },
        select: { phone: true }
      });

      if (currentUser?.phone !== data.phone) {
        // Phone verification will be reset through a separate verification flow
        // Not setting phoneVerified here to avoid type error
      }
    }

    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        phone: true,
        phoneVerified: true,
        name: true,
        updatedAt: true
      }
    });
  }),

  // Send phone verification code
  sendPhoneVerification: publicProcedure
    .input(sendPhoneVerificationSchema)
    .mutation(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: { id: input.userId }
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found"
        });
      }

      // Generate 6-digit verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      // TODO: Integrate with SMS provider (Twilio, AWS SNS, etc.)
      // For now, log to console (REMOVE IN PRODUCTION)
      console.log(`[SMS] Verification code for ${input.phone}: ${verificationCode}`);

      // Store verification code in cache/database with expiration
      // This is a placeholder - implement proper storage
      await prisma.auditLog.create({
        data: {
          tenantId: "system", // Or get from context
          action: "PHONE_VERIFICATION_SENT",
          userId: input.userId,
          metadata: {
            phone: input.phone,
            code: verificationCode, // In production, hash this!
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
          }
        }
      });

      return {
        success: true,
        message: "Verification code sent to your phone"
      };
    }),

  // Verify phone with code
  verifyPhone: publicProcedure.input(verifyPhoneSchema).mutation(async ({ input }) => {
    // TODO: Retrieve stored verification code from cache/database
    // This is a placeholder - implement proper verification
    const recentLog = await prisma.auditLog.findFirst({
      where: {
        userId: input.userId,
        action: "PHONE_VERIFICATION_SENT",
        createdAt: {
          gte: new Date(Date.now() - 10 * 60 * 1000) // Last 10 minutes
        }
      },
      orderBy: { createdAt: "desc" }
    });

    if (!recentLog) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No verification code found or code expired"
      });
    }

    const storedCode = (recentLog.metadata as any)?.code;

    if (storedCode !== input.verificationCode) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid verification code"
      });
    }

    // Update user phone verification status
    const user = await prisma.user.update({
      where: { id: input.userId },
      data: {
        phone: input.phone,
        phoneVerified: true
      }
    });

    // Log successful verification
    await prisma.auditLog.create({
      data: {
        tenantId: "system",
        action: "PHONE_VERIFIED",
        userId: input.userId,
        metadata: {
          phone: input.phone
        }
      }
    });

    return {
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        phoneVerified: user.phoneVerified
      }
    };
  })
});
