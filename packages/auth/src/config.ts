import type { NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { PrismaClient, TenantRole } from "@qp/db";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import { parseAuthEnv } from "./env";

export interface AuthConfigOptions {
  prisma: PrismaClient;
  baseUrl?: string;
}

/**
 * Derive highest role from user's tenant memberships
 * Order: SUPERADMIN > TENANT_ADMIN > TENANT_EDITOR > PLAYER
 */
function getHighestRole(roles: TenantRole[]): TenantRole | null {
  const roleOrder: TenantRole[] = ["SUPERADMIN", "TENANT_ADMIN", "TENANT_EDITOR", "PLAYER"];
  
  for (const role of roleOrder) {
    if (roles.includes(role)) {
      return role;
    }
  }
  
  return null;
}

/**
 * Create Auth.js configuration
 */
export function createAuthConfig(options: AuthConfigOptions): NextAuthConfig {
  const env = parseAuthEnv();
  const { prisma, baseUrl } = options;

  const providers: NextAuthConfig["providers"] = [];

  // Email magic link provider (dev/prod)
  if (env.EMAIL_SERVER_HOST && env.EMAIL_FROM) {
    providers.push(
      EmailProvider({
        server: {
          host: env.EMAIL_SERVER_HOST,
          port: env.EMAIL_SERVER_PORT || 587,
          auth: {
            user: env.EMAIL_SERVER_USER,
            pass: env.EMAIL_SERVER_PASSWORD
          }
        },
        from: env.EMAIL_FROM
      })
    );
  }

  // Google OAuth (optional)
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      GoogleProvider({
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET
      })
    );
  }

  // Microsoft OAuth (optional) - add when needed
  // if (env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET) { ... }

  return {
    adapter: PrismaAdapter(prisma) as any,
    providers,
    
    session: {
      strategy: "jwt",
      maxAge: 30 * 24 * 60 * 60 // 30 days
    },

    pages: {
      signIn: "/auth/signin",
      verifyRequest: "/auth/verify-request",
      error: "/auth/error"
    },

    callbacks: {
      async jwt({ token, user, trigger }) {
        // Initial sign in
        if (user) {
          token.userId = user.id;
          token.email = user.email;
          
          // Fetch user's roles from all tenant memberships
          const memberships = await prisma.tenantMember.findMany({
            where: { userId: user.id },
            select: { role: true, tenantId: true }
          });
          
          const roles = memberships.map(m => m.role);
          const highestRole = getHighestRole(roles);
          
          token.highestRole = highestRole;
          token.tenantRoles = memberships.reduce((acc, m) => {
            acc[m.tenantId] = m.role;
            return acc;
          }, {} as Record<string, TenantRole>);
        }

        // Update trigger (e.g., role changed)
        if (trigger === "update") {
          if (token.userId) {
            const memberships = await prisma.tenantMember.findMany({
              where: { userId: token.userId as string },
              select: { role: true, tenantId: true }
            });
            
            const roles = memberships.map(m => m.role);
            const highestRole = getHighestRole(roles);
            
            token.highestRole = highestRole;
            token.tenantRoles = memberships.reduce((acc, m) => {
              acc[m.tenantId] = m.role;
              return acc;
            }, {} as Record<string, TenantRole>);
          }
        }

        return token;
      },

      async session({ session, token }) {
        if (token && session.user) {
          session.user.id = token.userId as string;
          session.user.email = token.email as string;
          session.user.highestRole = token.highestRole as TenantRole | null;
          session.user.tenantRoles = token.tenantRoles as Record<string, TenantRole>;
        }

        return session;
      }
    },

    events: {
      async signIn({ user }) {
        // Update lastSignInAt
        if (user.id) {
          await prisma.user.update({
            where: { id: user.id },
            data: { lastSignInAt: new Date() }
          });
        }
      }
    },

    debug: env.NODE_ENV === "development"
  };
}
