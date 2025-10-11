# Compliance & Settings - Quick Start

## 🚀 Getting Started (5 minutes)

### 1. Apply Schema Changes
```bash
cd packages/db
pnpm db:push
pnpm seed
```

### 2. Verify Installation
```bash
# Check that new tables exist
psql -d quinielas -c "\dt" | grep -E "(Setting|PolicyDocument|ConsentRecord|DataRetentionPolicy)"
```

### 3. Test Settings API
```typescript
// In your admin app or API test
import { trpc } from "@/src/lib/trpc-client";

// Get effective settings for a tenant
const settings = await trpc.settings.effective.query({
  tenantId: "your-tenant-id"
});

console.log(settings["antiAbuse.captchaLevel"]); // "auto"
console.log(settings["privacy.ipLogging"]); // true
```

## 📖 Common Tasks

### Configure Tenant Settings
```typescript
// Set CAPTCHA to always required
await trpc.settings.upsert.mutate({
  scope: "TENANT",
  tenantId: "tenant-id",
  key: "antiAbuse.captchaLevel",
  value: "force"
});

// Disable IP logging for privacy
await trpc.settings.upsert.mutate({
  scope: "TENANT",
  tenantId: "tenant-id",
  key: "privacy.ipLogging",
  value: false
});
```

### Publish a Policy
```typescript
await trpc.policies.publish.mutate({
  tenantId: "tenant-id",
  type: "TERMS",
  title: "Terms and Conditions",
  content: `
# Terms and Conditions

1. Acceptance of Terms
By participating in this pool, you agree to...

2. Eligibility
You must be 18 years or older...
  `
});
```

### Check User Consent
```typescript
const status = await trpc.consent.getConsentStatus.query({
  tenantId: "tenant-id",
  poolId: "pool-id"
});

if (!status.allAccepted) {
  // Show policy gate
  console.log("User needs to accept:", 
    !status.terms.hasConsented ? "Terms" : "",
    !status.privacy.hasConsented ? "Privacy" : ""
  );
}
```

### Export Audit Logs
```typescript
const result = await trpc.audit.export.mutate({
  tenantId: "tenant-id",
  format: "csv",
  startDate: new Date("2025-01-01"),
  endDate: new Date("2025-12-31")
});

// result.data contains CSV string
// result.count shows number of records
```

### Run Purge Jobs
```bash
# Manually trigger purge jobs
pnpm worker run purge-invitations
pnpm worker run purge-audit-logs
pnpm worker run purge-tokens

# Schedule in cron (production)
0 2 * * * cd /app && pnpm worker run purge-invitations
```

## 🎨 UI Components

### Admin Pages
- `/settings` - Configure anti-abuse and privacy
- `/policies` - Manage Terms & Privacy documents
- `/audit` - View and export audit logs

### Web Components
```tsx
// Wrap your pool page with policy gate
import { PolicyGate } from "@/src/components/policy-gate";

export default function PoolPage({ params }) {
  return (
    <PolicyGate tenantId={params.tenantId} poolId={params.poolId}>
      {/* Your pool content */}
    </PolicyGate>
  );
}

// Add cookie banner to layout
import { CookieBanner } from "@/src/components/cookie-banner";

export default function Layout({ children }) {
  return (
    <>
      {children}
      <CookieBanner tenantId={tenantId} />
    </>
  );
}
```

## 🔧 Integration Helpers

### Check if CAPTCHA Required
```typescript
import { shouldRequireCaptcha } from "@qp/api/lib/anti-abuse";

const required = await shouldRequireCaptcha(
  { tenantId, poolId },
  hasAnomaly // true if suspicious activity detected
);
```

### Sanitize IP Address
```typescript
import { sanitizeIpAddress } from "@qp/api/lib/anti-abuse";

const ip = await sanitizeIpAddress(
  ctx.ip,
  { tenantId, poolId }
);
// Returns null if privacy.ipLogging is false
```

### Create Audit Log
```typescript
await db.auditLog.create({
  data: {
    tenantId,
    actorId: userId,
    action: "PREDICTION_CREATE",
    ipAddress: await sanitizeIpAddress(ctx.ip, { tenantId, poolId }),
    userAgent: ctx.userAgent,
    metadata: { matchId, prediction }
  }
});
```

## 🧪 Testing

### Run Tests
```bash
pnpm --filter @qp/api test src/lib/settings.test.ts
```

### Manual Testing Checklist
- [ ] Create tenant setting override
- [ ] Verify cascade (pool > tenant > global)
- [ ] Publish policy and check version increment
- [ ] Accept policy and verify consent record
- [ ] Export audit logs as CSV and JSON
- [ ] Run purge job and verify deletion
- [ ] Test with `ipLogging: false` - IPs should be null
- [ ] Test with `captchaLevel: "force"` - CAPTCHA always required

## 📚 Documentation

- **Full Guide**: `COMPLIANCE_SETTINGS_GUIDE.md`
- **Integration**: `ANTI_ABUSE_INTEGRATION.md`
- **Summary**: `COMPLIANCE_IMPLEMENTATION_SUMMARY.md`

## 🆘 Troubleshooting

### Settings not taking effect
```typescript
// Debug: Check what settings are active
const allSettings = await trpc.settings.allWithSources.query({
  tenantId: "tenant-id",
  poolId: "pool-id"
});

console.log(allSettings["antiAbuse.captchaLevel"]);
// Shows: { value, scope, source: "pool"|"tenant"|"global"|"default" }
```

### Policy gate not showing
1. Check policies exist: `trpc.policies.getCurrent.query(...)`
2. Check user is authenticated
3. Check consent status: `trpc.consent.getConsentStatus.query(...)`

### Purge jobs not deleting
1. Verify retention policy exists for tenant
2. Check records are older than retention period
3. Check database permissions

## 🎯 Key Concepts

**Settings Cascade**: Pool → Tenant → Global → Default

**Policy Versioning**: Auto-increments, never overwrites

**Consent Uniqueness**: Per user/tenant/pool/type/version

**IP Sanitization**: Respects `privacy.ipLogging` setting

**RBAC**: SUPERADMIN (global), TENANT_ADMIN (own tenant), PLAYER (read-only)

## ✅ Quick Validation

```bash
# 1. Check schema
psql -d quinielas -c "SELECT COUNT(*) FROM \"Setting\";"

# 2. Check seed data
psql -d quinielas -c "SELECT key, value FROM \"Setting\" WHERE scope = 'GLOBAL';"

# 3. Test API
curl http://localhost:3000/api/trpc/settings.effective?input={\"tenantId\":\"demo\"}

# 4. Run tests
pnpm test

# 5. Check types
pnpm typecheck
```

---

**Need Help?** Check the full documentation or contact the dev team.
