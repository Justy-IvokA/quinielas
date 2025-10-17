/**
 * Auth event audit logging utilities
 */

import { prisma } from "@qp/db";
import { sanitizeIpAddress } from "./anti-abuse";
import type { SettingContext } from "./settings";

export type AuthAction =
  | "AUTH_SIGNIN_REQUEST"
  | "AUTH_SIGNIN_EMAIL_SENT"
  | "AUTH_SIGNIN_SUCCESS"
  | "AUTH_SIGNIN_FAIL"
  | "AUTH_SIGNOUT"
  | "AUTH_SESSION_REFRESH";

export interface AuthAuditData {
  action: AuthAction;
  userId?: string;
  email?: string;
  provider?: string;
  tenantId?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, any>;
}

/**
 * Log an auth event with privacy settings respected
 */
export async function logAuthEvent(data: AuthAuditData): Promise<void> {
  try {
    const context: SettingContext = {
      tenantId: data.tenantId,
    };

    // Sanitize IP based on privacy settings
    const sanitizedIp = await sanitizeIpAddress(data.ipAddress, context);

    // Skip audit log if no tenantId (system-level auth events)
    if (!data.tenantId) {
      return;
    }

    await prisma.auditLog.create({
      data: {
        tenantId: data.tenantId,
        actorId: data.userId || undefined,
        userId: data.userId || undefined,
        action: data.action,
        ipAddress: sanitizedIp,
        userAgent: data.userAgent,
        metadata: {
          email: data.email,
          provider: data.provider,
          ...data.metadata,
        },
      },
    });
  } catch (error) {
    // Don't throw - audit logging should not break auth flow
    console.error("[auth-audit] Failed to log auth event:", error);
  }
}

/**
 * Log successful sign-in
 */
export async function logSignInSuccess(
  userId: string,
  email: string,
  provider: string,
  context: {
    tenantId?: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  }
): Promise<void> {
  await logAuthEvent({
    action: "AUTH_SIGNIN_SUCCESS",
    userId,
    email,
    provider,
    ...context,
  });
}

/**
 * Log failed sign-in attempt
 */
export async function logSignInFail(
  email: string,
  reason: string,
  context: {
    tenantId?: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  }
): Promise<void> {
  await logAuthEvent({
    action: "AUTH_SIGNIN_FAIL",
    email,
    metadata: { reason },
    ...context,
  });
}

/**
 * Log email magic link sent
 */
export async function logEmailSent(
  email: string,
  context: {
    tenantId?: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  }
): Promise<void> {
  await logAuthEvent({
    action: "AUTH_SIGNIN_EMAIL_SENT",
    email,
    provider: "email",
    ...context,
  });
}

/**
 * Log sign-out
 */
export async function logSignOut(
  userId: string,
  context: {
    tenantId?: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  }
): Promise<void> {
  await logAuthEvent({
    action: "AUTH_SIGNOUT",
    userId,
    ...context,
  });
}
