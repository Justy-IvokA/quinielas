# Anti-Abuse Integration Guide

This document shows how to integrate the compliance settings into existing endpoints, particularly for registration and authentication flows.

## Integration Points

### 1. Registration Endpoint

Update your registration router to respect CAPTCHA and IP logging settings:

```typescript
// packages/api/src/routers/registration/index.ts

import { shouldRequireCaptcha, sanitizeIpAddress } from "../../lib/anti-abuse";

export const registrationRouter = router({
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input, ctx }) => {
      const { poolId, email, captchaToken } = input;

      // Get pool and tenant info
      const pool = await db.pool.findUnique({
        where: { id: poolId },
        include: { accessPolicy: true },
      });

      if (!pool) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pool not found" });
      }

      // Check if CAPTCHA is required
      const hasAnomaly = false; // Implement your anomaly detection logic
      const captchaRequired = await shouldRequireCaptcha(
        { tenantId: pool.tenantId, poolId },
        hasAnomaly
      );

      if (captchaRequired && !captchaToken) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "CAPTCHA verification required",
        });
      }

      if (captchaRequired && captchaToken) {
        // Verify CAPTCHA token (implement your verification logic)
        const isValid = await verifyCaptcha(captchaToken);
        if (!isValid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid CAPTCHA",
          });
        }
      }

      // Sanitize IP address based on privacy settings
      const sanitizedIp = await sanitizeIpAddress(ctx.ip, {
        tenantId: pool.tenantId,
        poolId,
      });

      // Create registration
      const registration = await db.registration.create({
        data: {
          poolId,
          userId: ctx.session.user.id,
          tenantId: pool.tenantId,
          email,
          // ... other fields
        },
      });

      // Log the action with sanitized IP
      await db.auditLog.create({
        data: {
          tenantId: pool.tenantId,
          actorId: ctx.session.user.id,
          action: "REGISTRATION_CREATE",
          ipAddress: sanitizedIp,
          userAgent: ctx.userAgent,
          metadata: {
            poolId,
            registrationId: registration.id,
          },
        },
      });

      return registration;
    }),
});
```

### 2. Invitation Acceptance

```typescript
// packages/api/src/routers/registration/index.ts

acceptInvitation: publicProcedure
  .input(acceptInvitationSchema)
  .mutation(async ({ input, ctx }) => {
    const { token } = input;

    const invitation = await db.invitation.findUnique({
      where: { token },
      include: { pool: true },
    });

    if (!invitation) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    // Sanitize IP
    const sanitizedIp = await sanitizeIpAddress(ctx.ip, {
      tenantId: invitation.tenantId,
      poolId: invitation.poolId,
    });

    // Update invitation with sanitized IP
    await db.invitation.update({
      where: { id: invitation.id },
      data: {
        acceptedAt: new Date(),
        status: "ACCEPTED",
        // Store IP only if logging is enabled
        // (you might add an ipAddress field to Invitation model)
      },
    });

    // Log with sanitized IP
    await db.auditLog.create({
      data: {
        tenantId: invitation.tenantId,
        actorId: ctx.session?.user?.id,
        action: "INVITATION_ACCEPT",
        ipAddress: sanitizedIp,
        userAgent: ctx.userAgent,
        metadata: { invitationId: invitation.id },
      },
    });

    return { success: true };
  }),
```

### 3. Access Policy Enforcement

Update access policy checks to respect CAPTCHA settings:

```typescript
// packages/api/src/services/access.service.ts

export async function checkAccessPolicy(
  poolId: string,
  userId: string,
  captchaToken?: string
): Promise<{ allowed: boolean; reason?: string }> {
  const pool = await db.pool.findUnique({
    where: { id: poolId },
    include: { accessPolicy: true },
  });

  if (!pool?.accessPolicy) {
    return { allowed: false, reason: "No access policy configured" };
  }

  // Check dynamic CAPTCHA requirement
  const captchaRequired = await shouldRequireCaptcha(
    { tenantId: pool.tenantId, poolId },
    false // or implement anomaly detection
  );

  // Override static policy setting with dynamic setting
  if (captchaRequired && !captchaToken) {
    return { allowed: false, reason: "CAPTCHA required" };
  }

  // ... rest of access policy checks

  return { allowed: true };
}
```

### 4. Audit Log Creation Helper

Create a helper function for consistent audit logging:

```typescript
// packages/api/src/lib/audit-helper.ts

import { db } from "@qp/db/client";
import { sanitizeIpAddress } from "./anti-abuse";

export async function createAuditLog(params: {
  tenantId: string;
  actorId?: string;
  userId?: string;
  action: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: any;
  resourceType?: string;
  resourceId?: string;
  poolId?: string;
}) {
  const { tenantId, poolId, ipAddress, ...rest } = params;

  // Sanitize IP based on settings
  const sanitizedIp = await sanitizeIpAddress(ipAddress, {
    tenantId,
    poolId,
  });

  return db.auditLog.create({
    data: {
      ...rest,
      tenantId,
      ipAddress: sanitizedIp,
    },
  });
}

// Usage example:
await createAuditLog({
  tenantId: pool.tenantId,
  poolId: pool.id,
  actorId: ctx.session.user.id,
  action: "PREDICTION_CREATE",
  ipAddress: ctx.ip,
  userAgent: ctx.userAgent,
  metadata: { matchId, prediction },
});
```

### 5. Context Enhancement

Update your tRPC context to include IP and user agent:

```typescript
// packages/api/src/context.ts

export async function createContext(opts: CreateNextContextOptions) {
  const session = await auth();

  // Extract IP from headers
  const forwarded = opts.req.headers["x-forwarded-for"];
  const ip = typeof forwarded === "string"
    ? forwarded.split(",")[0]
    : opts.req.socket.remoteAddress;

  const userAgent = opts.req.headers["user-agent"];

  return {
    session,
    ip,
    userAgent,
    // ... other context
  };
}
```

## Migration Checklist

- [ ] Update registration endpoints to check `shouldRequireCaptcha()`
- [ ] Replace direct IP logging with `sanitizeIpAddress()`
- [ ] Update audit log creation to use helper function
- [ ] Add CAPTCHA verification logic
- [ ] Test with different setting combinations:
  - [ ] `captchaLevel: "off"` - no CAPTCHA required
  - [ ] `captchaLevel: "auto"` - CAPTCHA on anomaly
  - [ ] `captchaLevel: "force"` - always require CAPTCHA
  - [ ] `ipLogging: false` - IPs should be null in logs
  - [ ] `ipLogging: true` - IPs should be stored
- [ ] Update frontend to show/hide CAPTCHA based on requirements
- [ ] Document setting changes for tenant admins

## Frontend Integration

### CAPTCHA Component

```typescript
// apps/web/src/components/captcha.tsx

"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/src/lib/trpc-client";

export function CaptchaField({ tenantId, poolId, onChange }) {
  const [required, setRequired] = useState(false);

  const { data: settings } = trpc.settings.effective.useQuery({
    tenantId,
    poolId,
  });

  useEffect(() => {
    const level = settings?.["antiAbuse.captchaLevel"];
    setRequired(level === "force");
    // For "auto", you'd check for anomalies server-side
  }, [settings]);

  if (!required) return null;

  return (
    <div className="captcha-container">
      {/* Integrate your CAPTCHA provider (reCAPTCHA, hCaptcha, etc.) */}
      <div id="captcha-widget"></div>
    </div>
  );
}
```

## Testing

### Unit Tests

```typescript
import { shouldRequireCaptcha, sanitizeIpAddress } from "./anti-abuse";

describe("Anti-Abuse", () => {
  it("should require CAPTCHA when level is force", async () => {
    // Mock settings to return "force"
    const required = await shouldRequireCaptcha({ tenantId: "test" }, false);
    expect(required).toBe(true);
  });

  it("should sanitize IP when logging is disabled", async () => {
    // Mock settings to return ipLogging: false
    const sanitized = await sanitizeIpAddress("192.168.1.1", {
      tenantId: "test",
    });
    expect(sanitized).toBeNull();
  });
});
```

### Integration Tests

```typescript
describe("Registration with CAPTCHA", () => {
  it("should reject registration without CAPTCHA when forced", async () => {
    // Set captchaLevel to "force" for test tenant
    await trpc.settings.upsert.mutate({
      scope: "TENANT",
      tenantId: testTenantId,
      key: "antiAbuse.captchaLevel",
      value: "force",
    });

    // Attempt registration without CAPTCHA
    await expect(
      trpc.registration.register.mutate({
        poolId: testPoolId,
        email: "test@example.com",
        // no captchaToken
      })
    ).rejects.toThrow("CAPTCHA verification required");
  });
});
```

## Rollout Strategy

1. **Phase 1**: Deploy with all settings at default values
2. **Phase 2**: Enable IP logging opt-out for privacy-conscious tenants
3. **Phase 3**: Enable CAPTCHA "auto" mode with anomaly detection
4. **Phase 4**: Allow tenants to configure their own settings

## Support

For questions or issues, refer to:
- `COMPLIANCE_SETTINGS_GUIDE.md` for settings documentation
- `packages/api/src/lib/anti-abuse.ts` for utility functions
- `packages/api/src/lib/settings.ts` for settings resolution
