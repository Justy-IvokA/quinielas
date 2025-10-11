# Tenant ID Cleanup Checklist

**Status:** Optional Follow-up Tasks  
**Priority:** Low (non-blocking)

## Remaining Client Components with `tenantId` Props

These components currently accept `tenantId` as a prop. They should be refactored to use server-side resolution or tRPC context.

### 1. PolicyGate Component
**File:** `apps/web/src/components/policy-gate.tsx`

**Current Usage:**
```tsx
<PolicyGate tenantId={tenantId} poolId={poolId}>
  {children}
</PolicyGate>
```

**Recommended Fix:**
- Option A: Convert to server component, resolve tenant from headers
- Option B: Create tRPC query `consent.getConsentStatus` that uses `ctx.tenant.id`
- Option C: Pass tenant from parent server component (already resolved)

**Impact:** Low - only used in pool pages where tenant is already resolved

---

### 2. CookieBanner Component
**File:** `apps/web/src/components/cookie-banner.tsx`

**Current Usage:**
```tsx
<CookieBanner tenantId={tenantId} poolId={poolId} />
```

**Recommended Fix:**
- Similar to PolicyGate - use tRPC context
- Banner can be rendered server-side with resolved tenant

**Impact:** Low - cosmetic component

---

## Worker Jobs (Already Correct)

The following worker jobs correctly use `tenantId` from database records:

✅ `apps/worker/src/jobs/score-final.ts` - Gets `tenantId` from pool record  
✅ `apps/worker/src/jobs/purge-invitations.ts` - Iterates tenant records  
✅ `apps/worker/src/jobs/purge-audit-logs.ts` - Iterates tenant records  
✅ `apps/worker/src/jobs/leaderboard-snapshot.ts` - Gets from pool  
✅ `apps/worker/src/jobs/finalize-pool.ts` - Accepts as job input (from trigger)  
✅ `apps/worker/src/jobs/award-prizes.ts` - Accepts as job input

**No changes needed** - these are background jobs with explicit tenant context.

---

## Verification Commands

### 1. Search for Remaining Hardcoded Tenant IDs
```bash
# Search for tenantId assignments in client code
grep -r "tenantId.*=.*['\"]" apps/web/src apps/admin/src --include="*.tsx" --include="*.ts"

# Search for tenantId props being passed
grep -r "tenantId={" apps/web/app apps/admin/app --include="*.tsx"
```

### 2. Run Type Check
```bash
pnpm --filter @qp/web typecheck
pnpm --filter @qp/admin typecheck
```

### 3. Run Linter
```bash
pnpm lint
```

### 4. Run Tests
```bash
# API tests (includes host-tenant tests)
pnpm --filter @qp/api test

# Branding tests
pnpm --filter @qp/branding test
```

---

## Migration Strategy for PolicyGate & CookieBanner

### Step 1: Create Server-Side Wrapper
```tsx
// apps/web/app/components/policy-gate-wrapper.tsx
import { headers } from "next/headers";
import { resolveTenantAndBrandFromHost } from "@qp/api/lib/host-tenant";
import { PolicyGate } from "@web/src/components/policy-gate";

export async function PolicyGateWrapper({ 
  poolId, 
  children 
}: { 
  poolId?: string; 
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost";
  const { tenant } = await resolveTenantAndBrandFromHost(host);
  
  if (!tenant) {
    return <>{children}</>;
  }
  
  return (
    <PolicyGate tenantId={tenant.id} poolId={poolId}>
      {children}
    </PolicyGate>
  );
}
```

### Step 2: Update tRPC Routers
```typescript
// packages/api/src/routers/consent/index.ts
export const consentRouter = router({
  getConsentStatus: publicProcedure
    .use(withTenant)
    .use(withAuth)
    .input(z.object({ poolId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      // Use ctx.tenant.id instead of client-provided tenantId
      // ...
    })
});
```

### Step 3: Update Client Component
```tsx
// apps/web/src/components/policy-gate.tsx
export function PolicyGate({ poolId, children }: { poolId?: string; children: React.ReactNode }) {
  // Remove tenantId prop
  const { data: consentStatus } = trpc.consent.getConsentStatus.useQuery({ poolId });
  // ...
}
```

---

## Testing Checklist

After making changes:

- [ ] Pool landing page loads correctly
- [ ] Tenant theme applies (check CSS variables in DevTools)
- [ ] Dark mode toggle works
- [ ] Registration status shows correctly for authenticated users
- [ ] Pool expiration logic works (test with past endDate)
- [ ] 404 page shows for non-existent pools
- [ ] 404 page shows for pools in different tenant
- [ ] Custom domain resolution works (if configured)
- [ ] Subdomain resolution works (e.g., demo.quinielas.mx)
- [ ] Development fallback works (localhost → demo tenant)

---

## Performance Considerations

### Caching Tenant Resolution
Currently, tenant/brand resolution happens on every request. Consider adding:

```typescript
// packages/api/src/lib/host-tenant.ts
import { LRUCache } from "lru-cache";

const tenantCache = new LRUCache<string, TenantBrandResolution>({
  max: 100,
  ttl: 1000 * 60 * 5 // 5 minutes
});

export async function resolveTenantAndBrandFromHost(
  hostname: string,
  pathname?: string
): Promise<TenantBrandResolution> {
  const cacheKey = `${hostname}:${pathname || ""}`;
  const cached = tenantCache.get(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  // ... existing resolution logic
  
  tenantCache.set(cacheKey, result);
  return result;
}
```

### Database Indexes
Ensure these indexes exist:
```sql
CREATE INDEX idx_brand_domains ON "Brand" USING GIN (domains);
CREATE INDEX idx_tenant_slug ON "Tenant" (slug);
CREATE INDEX idx_brand_tenant_slug ON "Brand" (tenantId, slug);
```

---

## Documentation Updates Needed

- [ ] Update `README.md` with tenant resolution examples
- [ ] Add section on custom domain setup
- [ ] Document environment variables (`NEXT_PUBLIC_BASE_DOMAIN`)
- [ ] Add troubleshooting guide for tenant resolution issues

---

## Rollback Plan

If issues arise:

1. **Revert layout changes:**
   ```bash
   git checkout HEAD~1 apps/web/app/[locale]/layout.tsx
   ```

2. **Re-enable demo branding:**
   ```typescript
   import { getDemoBranding } from "@qp/branding";
   const branding = getDemoBranding();
   ```

3. **Disable pool landing route:**
   - Remove `apps/web/app/[locale]/[poolSlug]` directory
   - Traffic falls back to existing `/pool/[poolSlug]` route

---

## Success Metrics

Track these after deployment:

- **Tenant Resolution Success Rate:** % of requests with valid tenant
- **404 Rate:** Should remain stable (invalid pools)
- **Page Load Time:** Should not increase significantly
- **Cache Hit Rate:** If caching implemented
- **Theme Application:** All pages use correct brand colors

---

## Support & Troubleshooting

### Common Issues

**Issue:** Tenant not resolved (null)
- Check `Brand.domains` array includes the hostname
- Verify subdomain format: `{tenant}.{baseDomain}`
- Check development fallback is enabled

**Issue:** Wrong theme applied
- Verify `Brand.theme` JSON is valid
- Check CSS variables in browser DevTools
- Ensure `<style id="brand-theme">` is in `<head>`

**Issue:** Pool not found
- Verify pool slug matches exactly (case-sensitive)
- Check pool belongs to resolved tenant
- Inspect `ctx.tenant.id` in tRPC context

---

**Last Updated:** 2025-01-10  
**Maintainer:** Development Team
