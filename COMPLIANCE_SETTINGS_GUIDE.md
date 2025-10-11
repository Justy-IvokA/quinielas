# Compliance & Settings Implementation Guide

## Overview

This guide documents the hierarchical settings system, policy management, consent tracking, data retention, and audit capabilities implemented for Quinielas WL.

## Architecture

### 1. Settings Hierarchy

Settings cascade in the following order (highest priority first):
1. **Pool-level** override
2. **Tenant-level** override
3. **Global** default
4. **Hardcoded** fallback

#### Available Settings

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `antiAbuse.captchaLevel` | `"auto" \| "off" \| "force"` | `"auto"` | CAPTCHA enforcement level |
| `antiAbuse.rateLimit` | `{ windowSec: number, max: number }` | `{ windowSec: 60, max: 60 }` | Rate limiting configuration |
| `privacy.ipLogging` | `boolean` | `true` | Store IP addresses in logs |
| `privacy.cookieBanner` | `boolean` | `true` | Show cookie consent banner |
| `privacy.deviceFingerprint` | `boolean` | `false` | Enable device fingerprinting |

### 2. Policy Documents

Policy documents support versioning and tenant/pool scoping:

- **Types**: `TERMS` (Terms & Conditions), `PRIVACY` (Privacy Policy)
- **Versioning**: Auto-incremented on each publish
- **Scope**: Tenant-level or Pool-level
- **Content**: Markdown-supported text

### 3. Consent Tracking

User consent is tracked per policy type and version:

- **Uniqueness**: One consent record per user/tenant/pool/policy/version
- **Metadata**: IP address (if enabled), user agent, timestamp
- **Enforcement**: Policy gate blocks access until consent is given

### 4. Data Retention

Configurable retention policies per tenant:

```json
{
  "invitesDays": 90,      // Expired invitations
  "auditDays": 365,       // Audit logs
  "tokensDays": 30        // Verification tokens
}
```

### 5. Audit Logs

All administrative actions are logged:

- Setting changes
- Policy publications
- Consent acceptances
- Exports

## API Usage

### Settings

```typescript
// Get effective settings (merged cascade)
const settings = await trpc.settings.effective.query({
  tenantId: "tenant-id",
  poolId: "pool-id", // optional
});

// Get single setting with source info
const setting = await trpc.settings.allWithSources.query({
  tenantId: "tenant-id",
});

// Upsert a setting
await trpc.settings.upsert.mutate({
  scope: "TENANT",
  tenantId: "tenant-id",
  key: "antiAbuse.captchaLevel",
  value: "force",
});
```

### Policies

```typescript
// Get current policy version
const policy = await trpc.policies.getCurrent.query({
  tenantId: "tenant-id",
  type: "TERMS",
});

// Publish new version
await trpc.policies.publish.mutate({
  tenantId: "tenant-id",
  type: "TERMS",
  title: "Terms and Conditions v2",
  content: "# Terms...",
});
```

### Consent

```typescript
// Check consent status
const status = await trpc.consent.getConsentStatus.query({
  tenantId: "tenant-id",
  poolId: "pool-id",
});

// Accept policy
await trpc.consent.accept.mutate({
  tenantId: "tenant-id",
  policyType: "TERMS",
  version: 1,
});
```

### Audit

```typescript
// Search logs
const logs = await trpc.audit.search.query({
  tenantId: "tenant-id",
  startDate: new Date("2025-01-01"),
  action: "SETTING_UPSERT",
  page: 1,
  pageSize: 50,
});

// Export logs
const export = await trpc.audit.export.mutate({
  tenantId: "tenant-id",
  format: "csv",
});
```

## Worker Jobs

### Purge Jobs

Run data retention purge jobs:

```bash
# Purge expired invitations
pnpm worker run purge-invitations

# Purge old audit logs
pnpm worker run purge-audit-logs

# Purge expired tokens
pnpm worker run purge-tokens
```

### Scheduling

For production, schedule these jobs using cron or a job scheduler:

```cron
# Run daily at 2 AM
0 2 * * * cd /app && pnpm worker run purge-invitations
0 2 * * * cd /app && pnpm worker run purge-audit-logs
0 2 * * * cd /app && pnpm worker run purge-tokens
```

## UI Components

### Admin

1. **Settings Page** (`/settings`)
   - Configure anti-abuse and privacy settings
   - Tenant-level overrides
   - Visual toggles and selects

2. **Policies Page** (`/policies`)
   - Publish new policy versions
   - View version history
   - Markdown editor

3. **Audit Page** (`/audit`)
   - Search and filter logs
   - Export CSV/JSON
   - Pagination

### Web (Player-Facing)

1. **Policy Gate** (`<PolicyGate>`)
   - Blocks access until consent given
   - Shows policy summaries
   - "Accept All" button

2. **Cookie Banner** (`<CookieBanner>`)
   - Dismissible banner
   - Persists to localStorage
   - Respects `privacy.cookieBanner` setting

## RBAC Permissions

| Action | SUPERADMIN | TENANT_ADMIN | PLAYER |
|--------|------------|--------------|--------|
| View global settings | ✅ | ❌ | ❌ |
| Modify global settings | ✅ | ❌ | ❌ |
| View tenant settings | ✅ | ✅ (own) | ❌ |
| Modify tenant settings | ✅ | ✅ (own) | ❌ |
| View pool settings | ✅ | ✅ (own) | ❌ |
| Modify pool settings | ✅ | ✅ (own) | ❌ |
| Publish policies | ✅ | ✅ (own) | ❌ |
| View policies | ✅ | ✅ | ✅ |
| Accept policies | ✅ | ✅ | ✅ |
| View audit logs | ✅ | ✅ (own) | ❌ |
| Export audit logs | ✅ | ✅ (own) | ❌ |

## Database Schema

### Setting

```prisma
model Setting {
  id        String       @id @default(cuid())
  scope     SettingScope // GLOBAL | TENANT | POOL
  tenantId  String?
  poolId    String?
  key       String
  value     Json
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  @@unique([scope, tenantId, poolId, key])
}
```

### PolicyDocument

```prisma
model PolicyDocument {
  id          String     @id @default(cuid())
  tenantId    String
  poolId      String?
  type        PolicyType // TERMS | PRIVACY
  version     Int
  title       String
  content     String     @db.Text
  publishedAt DateTime   @default(now())

  @@unique([tenantId, poolId, type, version])
}
```

### ConsentRecord

```prisma
model ConsentRecord {
  id          String     @id @default(cuid())
  userId      String
  tenantId    String
  poolId      String?
  policyType  PolicyType
  version     Int
  consentedAt DateTime   @default(now())
  ipAddress   String?
  userAgent   String?

  @@unique([userId, tenantId, poolId, policyType, version])
}
```

### DataRetentionPolicy

```prisma
model DataRetentionPolicy {
  id        String   @id @default(cuid())
  tenantId  String
  poolId    String?
  rules     Json     // { invitesDays, auditDays, tokensDays }

  @@unique([tenantId, poolId])
}
```

## Testing

Run tests:

```bash
# Settings cascade tests
pnpm --filter @qp/api test src/lib/settings.test.ts

# Integration tests (future)
pnpm test
```

## Migration

To apply the schema changes:

```bash
# Push schema to database
pnpm --filter @qp/db db:push

# Seed default settings
pnpm --filter @qp/db seed
```

## Best Practices

1. **Always use the cascade resolver** (`getSetting`) instead of direct DB queries
2. **Validate setting values** using the provided schemas
3. **Log all administrative actions** for audit trail
4. **Respect privacy settings** (e.g., `privacy.ipLogging`)
5. **Version policies** incrementally, never overwrite
6. **Test consent flows** in staging before production
7. **Schedule purge jobs** appropriately for your data volume
8. **Export audit logs** regularly for compliance

## Troubleshooting

### Settings not cascading correctly

Check the resolution order in `packages/api/src/lib/settings.ts`. Ensure:
- Pool settings have both `tenantId` and `poolId`
- Tenant settings have `tenantId` but no `poolId`
- Global settings have neither

### Policy gate not showing

Verify:
1. Policies are published for the tenant/pool
2. User is authenticated
3. Consent records don't already exist

### Purge jobs not deleting

Check:
1. Data retention policies exist for the tenant
2. Records are older than the retention period
3. Database permissions allow deletion

## Support

For issues or questions, contact the development team or refer to:
- `.windsurfrules` for project conventions
- `AUTH_ARCHITECTURE.md` for authentication details
- `BACKEND_IMPLEMENTATION.md` for API patterns
