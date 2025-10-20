import type { NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { PrismaClient, TenantRole } from "@qp/db";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import { parseAuthEnv } from "./env";
import { createTransport } from "nodemailer";
import { emailTemplates, createEmailBrandInfo, parseEmailLocale, type EmailLocale } from "@qp/utils/email";

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
        // Custom sendVerificationRequest with branding support
        async sendVerificationRequest(params) {
          const { identifier: email, url, provider } = params;
          const { host } = new URL(url);
          
          console.log('[auth] sendVerificationRequest called');
          console.log('[auth] Email:', email);
          console.log('[auth] Generated URL:', url);
          console.log('[auth] Host from URL:', host);
          
          // Try to resolve brand from hostname
          let brandInfo;
          let locale: EmailLocale = "es-MX";
          
          try {
            // Extract tenant slug from subdomain (e.g., "ivoka" from "ivoka.localhost")
            const parts = host.split('.');
            let tenantSlug: string | null = null;
            
            if (parts.length >= 2 && parts[0] !== 'localhost' && parts[0] !== 'www') {
              tenantSlug = parts[0];
            }
            
            if (tenantSlug) {
              // Find tenant and its default brand
              const tenant = await prisma.tenant.findUnique({
                where: { slug: tenantSlug }
              });
              
              if (tenant) {
                const brand = await prisma.brand.findFirst({
                  where: { tenantId: tenant.id },
                  orderBy: { createdAt: 'asc' } // Get first brand (usually default)
                });
                
                if (brand) {
                  console.log('[auth] Found brand:', brand.name);
                  
                  // Get user's locale if exists
                  const user = await prisma.user.findUnique({
                    where: { email },
                    select: { metadata: true }
                  });
                  
                  locale = parseEmailLocale(
                    (user?.metadata as any)?.locale || 
                    (await prisma.setting.findFirst({
                      where: { tenantId: tenant.id, key: "defaultLocale" }
                    }))?.value as string || 
                    "es-MX"
                  );
                  
                  // Create brand info for email template
                  brandInfo = createEmailBrandInfo({
                    name: brand.name,
                    logoUrl: brand.logoUrl,
                    colors: {
                      primary: (brand.theme as any)?.colors?.primary || "#0ea5e9",
                      primaryForeground: (brand.theme as any)?.colors?.primaryForeground || "#ffffff",
                      background: (brand.theme as any)?.colors?.background || "#ffffff",
                      foreground: (brand.theme as any)?.colors?.foreground || "#0f172a",
                      muted: (brand.theme as any)?.colors?.muted || "#f1f5f9",
                      border: (brand.theme as any)?.colors?.border || "#e2e8f0"
                    },
                    themeLogoUrl: (brand.theme as any)?.logo?.url || null
                  });
                }
              }
            }
          } catch (error) {
            console.error('[auth] Error resolving brand:', error);
          }
          
          // Fallback to default brand if not found
          if (!brandInfo) {
            console.log('[auth] Using default brand info');
            brandInfo = {
              name: "Quinielas",
              colors: {
                primary: "#0ea5e9",
                primaryForeground: "#ffffff",
                background: "#ffffff",
                foreground: "#0f172a",
                muted: "#f1f5f9",
                border: "#e2e8f0"
              }
            };
          }
          
          // Create transport
          const transport = createTransport(provider.server);
          
          // Use new email template with branding
          const emailContent = emailTemplates.magicLink({
            brand: brandInfo,
            locale,
            url,
            email
          });
          
          console.log('[auth] Sending magic link email with branding');
          
          await transport.sendMail({
            to: email,
            from: provider.from,
            subject: emailContent.subject,
            text: emailContent.text,
            html: emailContent.html,
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
