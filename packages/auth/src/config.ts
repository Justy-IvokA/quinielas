import type { NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { PrismaClient, TenantRole } from "@qp/db";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import { parseAuthEnv } from "./env";
import { createTransport } from "nodemailer";

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
        from: env.EMAIL_FROM,
        // Custom sendVerificationRequest to preserve subdomain in magic link
        async sendVerificationRequest(params) {
          const { identifier: email, url, provider } = params;
          const { host } = new URL(url);
          
          // Log for debugging
          console.log('[auth] sendVerificationRequest called');
          console.log('[auth] Email:', email);
          console.log('[auth] Generated URL:', url);
          console.log('[auth] Host from URL:', host);
          
          // Create transport
          const transport = createTransport(provider.server);
          
          // Determine protocol based on hostname
          const protocol = host.includes('localhost') ? 'http' : 'https';
          
          // Build email HTML
          const html = `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: #0ea5e9; color: white; padding: 20px; text-align: center; }
                  .content { padding: 20px; background: #f9fafb; }
                  .button { display: inline-block; padding: 12px 24px; background: #0ea5e9; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                  .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>Sign in to Quinielas</h1>
                  </div>
                  <div class="content">
                    <p>Click the button below to sign in to your account:</p>
                    <p style="text-align: center;">
                      <a href="${url}" class="button">Sign In</a>
                    </p>
                    <p><small>This link will expire in 24 hours.</small></p>
                    <p><small>If you didn't request this email, you can safely ignore it.</small></p>
                    <p><small>If the button doesn't work, copy and paste this link into your browser:<br>${url}</small></p>
                  </div>
                  <div class="footer">
                    <p>Quinielas WL - Sports Prediction Platform</p>
                  </div>
                </div>
              </body>
            </html>
          `;
          
          const text = `Sign in to Quinielas\n\nClick this link to sign in: ${url}\n\nThis link will expire in 24 hours.\nIf you didn't request this email, you can safely ignore it.`;
          
          await transport.sendMail({
            to: email,
            from: provider.from,
            subject: `Sign in to Quinielas`,
            text,
            html,
          });
        }
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
    
    // CRITICAL: Trust the host header for subdomain support
    trustHost: true,
    
    session: {
      strategy: "jwt",
      maxAge: 30 * 24 * 60 * 60 // 30 days
    },

    pages: {
      signIn: "/es-MX/auth/signin",
      verifyRequest: "/es-MX/auth/verify-request",
      error: "/es-MX/auth/error"
    },

    // Use JWT strategy to allow cross-subdomain sessions
    useSecureCookies: process.env.NODE_ENV === "production",
    
    // Set cookies to work across subdomains in production
    cookies: process.env.NODE_ENV === "production" ? {
      sessionToken: {
        name: `__Secure-next-auth.session-token`,
        options: {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          secure: true,
          domain: `.${process.env.NEXT_PUBLIC_BASE_DOMAIN || 'quinielas.mx'}` // Share across subdomains
        }
      }
    } : undefined,

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
          
          const roles = memberships.map((m: { role: TenantRole }) => m.role);
          const highestRole = getHighestRole(roles);
          
          token.highestRole = highestRole;
          token.tenantRoles = memberships.reduce((acc: Record<string, TenantRole>, m: { tenantId: string; role: TenantRole }) => {
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
            
            const roles = memberships.map((m: { role: TenantRole }) => m.role);
            const highestRole = getHighestRole(roles);
            
            token.highestRole = highestRole;
            token.tenantRoles = memberships.reduce((acc: Record<string, TenantRole>, m: { tenantId: string; role: TenantRole }) => {
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
      async signIn({ user, account }) {
        // Update lastSignInAt
        if (user.id) {
          await prisma.user.update({
            where: { id: user.id },
            data: { lastSignInAt: new Date() }
          });

          // Log successful sign-in
          // Note: tenantId is required by schema but we don't have it in auth context
          // This will be logged separately in the app layer where tenant context exists
          try {
            // Get user's first tenant for audit log
            const membership = await prisma.tenantMember.findFirst({
              where: { userId: user.id },
              select: { tenantId: true },
            });

            if (membership) {
              await prisma.auditLog.create({
                data: {
                  tenantId: membership.tenantId,
                  actorId: user.id,
                  userId: user.id,
                  action: "AUTH_SIGNIN_SUCCESS",
                  metadata: {
                    email: user.email,
                    provider: account?.provider || "unknown",
                  },
                },
              });
            }
          } catch (error) {
            console.error("[auth] Failed to log sign-in:", error);
          }
        }
      }
    },

    debug: env.NODE_ENV === "development"
  };
}
