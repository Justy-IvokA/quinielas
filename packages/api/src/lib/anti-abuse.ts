/**
 * Anti-abuse utilities that respect settings
 */

import { getCaptchaLevel, getIpLoggingEnabled } from "./settings";
import type { SettingContext } from "./settings";

export interface AbuseCheckContext extends SettingContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Determines if CAPTCHA should be required based on settings
 */
export async function shouldRequireCaptcha(
  context: SettingContext,
  hasAnomaly: boolean = false
): Promise<boolean> {
  const level = await getCaptchaLevel(context);

  switch (level) {
    case "force":
      return true;
    case "auto":
      return hasAnomaly;
    case "off":
      return false;
    default:
      return hasAnomaly; // Fallback to auto behavior
  }
}

/**
 * Sanitizes IP address based on privacy settings
 */
export async function sanitizeIpAddress(
  ipAddress: string | null | undefined,
  context: SettingContext
): Promise<string | null> {
  if (!ipAddress) return null;

  const ipLoggingEnabled = await getIpLoggingEnabled(context);
  return ipLoggingEnabled ? ipAddress : null;
}

/**
 * Prepares audit log data respecting privacy settings
 */
export async function prepareAuditData(
  data: {
    ipAddress?: string | null;
    userAgent?: string | null;
    [key: string]: any;
  },
  context: SettingContext
): Promise<typeof data> {
  const sanitizedIp = await sanitizeIpAddress(data.ipAddress, context);

  return {
    ...data,
    ipAddress: sanitizedIp,
  };
}

/**
 * Example: Check if registration should be blocked due to rate limiting
 * This is a placeholder - implement actual rate limiting logic
 */
export async function checkRateLimit(
  identifier: string, // email or IP
  context: SettingContext
): Promise<{ allowed: boolean; retryAfter?: number }> {
  // TODO: Implement actual rate limiting using Redis or similar
  // For now, always allow
  return { allowed: true };
}
