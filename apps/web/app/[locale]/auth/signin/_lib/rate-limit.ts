/**
 * Simple in-memory rate limiter for auth attempts
 * In production, use Redis or similar distributed cache
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  windowSec: number;
  max: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

/**
 * Check if an identifier is rate limited
 * @param identifier - Email or IP address
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const key = `auth:${identifier}`;
  const entry = rateLimitStore.get(key);

  // No entry or expired window
  if (!entry || entry.resetAt < now) {
    const resetAt = now + config.windowSec * 1000;
    rateLimitStore.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: config.max - 1,
      resetAt,
    };
  }

  // Within window
  if (entry.count < config.max) {
    entry.count++;
    return {
      allowed: true,
      remaining: config.max - entry.count,
      resetAt: entry.resetAt,
    };
  }

  // Rate limited
  const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
  return {
    allowed: false,
    remaining: 0,
    resetAt: entry.resetAt,
    retryAfter,
  };
}

/**
 * Reset rate limit for an identifier (e.g., after successful auth)
 * @param identifier - Email or IP address
 */
export function resetRateLimit(identifier: string): void {
  const key = `auth:${identifier}`;
  rateLimitStore.delete(key);
}

/**
 * Check if identifier has anomaly (multiple failed attempts)
 * Used for adaptive captcha
 * @param identifier - Email or IP address
 * @param threshold - Number of attempts to consider anomaly
 * @returns true if anomaly detected
 */
export function hasAnomaly(identifier: string, threshold: number = 3): boolean {
  const key = `auth:${identifier}`;
  const entry = rateLimitStore.get(key);
  return entry ? entry.count >= threshold : false;
}
