import { TRPCError } from "@trpc/server";
import { procedure } from "../trpc";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Simple in-memory rate limiter (use Redis in production)
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

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  keyPrefix?: string;
}

/**
 * Rate limit by IP address
 */
export function rateLimitByIP(options: RateLimitOptions) {
  const { maxRequests, windowMs, keyPrefix = "ip" } = options;

  return procedure.use(async ({ ctx, next }) => {
    // Extract IP from request
    const ip = getClientIP(ctx.req);
    if (!ip) {
      // If we can't get IP, allow the request (fail open)
      return next();
    }

    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();

    const entry = rateLimitStore.get(key);

    if (!entry || entry.resetAt < now) {
      // Create new entry
      rateLimitStore.set(key, {
        count: 1,
        resetAt: now + windowMs
      });
      return next();
    }

    if (entry.count >= maxRequests) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Rate limit exceeded. Please try again later."
      });
    }

    // Increment count
    entry.count++;
    rateLimitStore.set(key, entry);

    return next();
  });
}

/**
 * Rate limit by email
 */
export function rateLimitByEmail(options: RateLimitOptions) {
  const { maxRequests, windowMs, keyPrefix = "email" } = options;

  return procedure.use(async ({ ctx, input, next }) => {
    // Extract email from input
    const email = (input as { email?: string })?.email;
    if (!email) {
      // If no email in input, skip rate limiting
      return next();
    }

    const key = `${keyPrefix}:${email.toLowerCase()}`;
    const now = Date.now();

    const entry = rateLimitStore.get(key);

    if (!entry || entry.resetAt < now) {
      rateLimitStore.set(key, {
        count: 1,
        resetAt: now + windowMs
      });
      return next();
    }

    if (entry.count >= maxRequests) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Too many requests for this email. Please try again later."
      });
    }

    entry.count++;
    rateLimitStore.set(key, entry);

    return next();
  });
}

/**
 * Rate limit by user ID (requires auth)
 */
export function rateLimitByUser(options: RateLimitOptions) {
  const { maxRequests, windowMs, keyPrefix = "user" } = options;

  return procedure.use(async ({ ctx, next }) => {
    const userId = ctx.session?.user?.id;
    if (!userId) {
      // If not authenticated, skip
      return next();
    }

    const key = `${keyPrefix}:${userId}`;
    const now = Date.now();

    const entry = rateLimitStore.get(key);

    if (!entry || entry.resetAt < now) {
      rateLimitStore.set(key, {
        count: 1,
        resetAt: now + windowMs
      });
      return next();
    }

    if (entry.count >= maxRequests) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Rate limit exceeded. Please try again later."
      });
    }

    entry.count++;
    rateLimitStore.set(key, entry);

    return next();
  });
}

/**
 * Extract client IP from request
 */
function getClientIP(req?: Request): string | null {
  if (!req) return null;

  // Check common headers
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? null;
  }

  const realIP = req.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  // Fallback to connection info (not available in all environments)
  return null;
}

// Pre-configured rate limiters for common use cases
export const registrationRateLimit = rateLimitByIP({
  maxRequests: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  keyPrefix: "registration"
});

export const inviteRateLimit = rateLimitByEmail({
  maxRequests: 3,
  windowMs: 60 * 60 * 1000, // 1 hour
  keyPrefix: "invite"
});

export const predictionRateLimit = rateLimitByUser({
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
  keyPrefix: "prediction"
});
