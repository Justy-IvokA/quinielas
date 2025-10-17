import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";

export const authRouter = router({
  /**
   * Get current session
   */
  getSession: publicProcedure.query(({ ctx }) => {
    return ctx.session;
  }),

  /**
   * Check if an email has admin privileges (SUPERADMIN or TENANT_ADMIN)
   * Used by admin app to validate before sending magic links
   */
  checkAdminEmail: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { email: input.email },
        include: {
          memberships: {
            select: {
              role: true,
            },
          },
        },
      });

      if (!user) {
        return { hasAdminAccess: false, reason: "USER_NOT_FOUND" };
      }

      // Check if user has SUPERADMIN or TENANT_ADMIN role
      const hasAdminRole = user.memberships.some(
        (m) => m.role === "SUPERADMIN" || m.role === "TENANT_ADMIN"
      );

      return {
        hasAdminAccess: hasAdminRole,
        reason: hasAdminRole ? null : "INSUFFICIENT_PRIVILEGES",
      };
    }),
});
