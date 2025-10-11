# Testing Guide - Tenant/Brand Resolution & Pool URLs

**Last Updated:** 2025-01-10  
**Purpose:** Test the new tenant/brand resolution system in development

---

## 🚀 Quick Start

### 1. Reset and Seed Database

```bash
# Reset database and apply migrations
pnpm db:reset

# Run the updated seed script
pnpm db:seed
```

The seed script now creates:
- ✅ **Demo tenant** with updated theme (dark mode + hero assets)
- ✅ **Innotecnia tenant** (superadmin) with purple theme
- ✅ **World Cup 2026 pool** with slug `world-cup-2026`
- ✅ Sample users, teams, matches, and predictions

### 2. Start Development Server

```bash
# Start the web app
pnpm --filter @qp/web dev
```

---

## 🧪 Test Scenarios

### **Scenario 1: Localhost Resolution (Development Fallback)**

**URL:** `http://localhost:3000/es-MX/world-cup-2026`

**Expected Behavior:**
1. ✅ Resolves to **demo tenant** (development fallback)
2. ✅ Applies demo brand theme (blue primary color)
3. ✅ Shows pool landing page with:
   - Pool name: "World Cup 2026 Demo Pool"
   - Competition: FIFA World Cup 2026
   - Prizes: 5 prizes displayed
   - Hero image from Unsplash
   - Registration count: 2 participants

**How to Verify:**
- Open browser DevTools → Elements
- Check `<style id="brand-theme">` in `<head>`
- Verify CSS variables:
  ```css
  :root {
    --primary: 199 84% 55%; /* Blue */
    --background: 0 0% 100%; /* White */
  }
  
  .dark {
    --primary: 199 84% 65%; /* Lighter blue */
    --background: 224 71% 4%; /* Dark */
  }
  ```

---

### **Scenario 2: Dark Mode Toggle**

**Steps:**
1. Visit pool page: `http://localhost:3000/es-MX/world-cup-2026`
2. Toggle dark mode (if theme switcher exists in header)

**Expected Behavior:**
- ✅ Background changes from white to dark blue
- ✅ Text changes from dark to light
- ✅ Primary color adjusts for better contrast
- ✅ All UI components adapt to dark theme

---

### **Scenario 3: Pool Not Found (404)**

**URL:** `http://localhost:3000/es-MX/non-existent-pool`

**Expected Behavior:**
1. ✅ Returns 404 Not Found
2. ✅ Shows Next.js 404 page with tenant theme applied
3. ✅ Console shows: Pool not found for slug "non-existent-pool"

---

### **Scenario 4: Authenticated User - Registered**

**Setup:**
```bash
# Use magic link or OAuth to sign in as:
# Email: player1@demo.com
```

**URL:** `http://localhost:3000/es-MX/world-cup-2026`

**Expected Behavior:**
1. ✅ Shows "Registrado" badge
2. ✅ Displays two CTAs:
   - "Hacer pronósticos" → `/world-cup-2026/fixtures`
   - "Ver tabla" → `/world-cup-2026/leaderboard`
3. ✅ No registration form shown

**How to Test:**
- tRPC query `registration.checkByPoolSlug` should return `isRegistered: true`
- Check Network tab for the query

---

### **Scenario 5: Authenticated User - Not Registered**

**Setup:**
```bash
# Sign in as a user NOT registered in the pool
# Email: admin@demo.com
```

**URL:** `http://localhost:3000/es-MX/world-cup-2026`

**Expected Behavior:**
1. ✅ Shows "Únete ahora" button (PUBLIC pool)
2. ✅ Button links to `/register?pool=world-cup-2026`
3. ✅ No "Registrado" badge

---

### **Scenario 6: Guest User (Not Logged In)**

**URL:** `http://localhost:3000/es-MX/world-cup-2026`

**Expected Behavior:**
1. ✅ Shows pool landing with public information
2. ✅ "Únete ahora" CTA visible
3. ✅ Message: "Inicia sesión para participar"
4. ✅ Prizes and rules visible (public pool)

---

### **Scenario 7: Expired Pool**

**Setup:**
Manually update pool end date to past:
```sql
UPDATE "Pool" 
SET "endDate" = '2024-01-01' 
WHERE slug = 'world-cup-2026';
```

**URL:** `http://localhost:3000/es-MX/world-cup-2026`

**Expected Behavior:**
1. ✅ Shows "Finalizado" badge with lock icon
2. ✅ Only CTA: "Ver tabla final" → `/world-cup-2026/leaderboard`
3. ✅ Predictions disabled
4. ✅ Leaderboard shows final snapshot

**Reset:**
```sql
UPDATE "Pool" 
SET "endDate" = '2026-07-21' 
WHERE slug = 'world-cup-2026';
```

---

### **Scenario 8: Custom Subdomain (Simulated)**

**Setup:**
Update brand domains in database:
```sql
UPDATE "Brand" 
SET domains = ARRAY['demo.localhost:3000'] 
WHERE slug = 'default';
```

**URL:** `http://demo.localhost:3000/es-MX/world-cup-2026`

**Expected Behavior:**
1. ✅ Resolves to demo tenant via subdomain
2. ✅ Same theme and behavior as Scenario 1

**Note:** You may need to add `demo.localhost` to your hosts file:
```
# Windows: C:\Windows\System32\drivers\etc\hosts
# Mac/Linux: /etc/hosts
127.0.0.1 demo.localhost
```

---

### **Scenario 9: Home Page with Resolved Brand**

**URL:** `http://localhost:3000/es-MX`

**Expected Behavior:**
1. ✅ Shows home page with demo brand name
2. ✅ Hero section displays: "Quinielas WL · Demo Brand"
3. ✅ Theme applied correctly
4. ✅ No hardcoded "Demo Brand" text (comes from DB)

---

### **Scenario 10: Multiple Tenants (Advanced)**

**Setup:**
Create a second tenant:
```sql
-- Create CEMEX tenant
INSERT INTO "Tenant" (id, slug, name, description)
VALUES ('cemex-tenant-id', 'cemex', 'CEMEX', 'CEMEX tenant for testing');

-- Create CEMEX brand with custom theme
INSERT INTO "Brand" (id, "tenantId", slug, name, "logoUrl", theme, domains)
VALUES (
  'cemex-brand-id',
  'cemex-tenant-id',
  'default',
  'CEMEX Quinielas',
  '/cemex/logo.svg',
  '{
    "name": "CEMEX Theme",
    "slug": "cemex-default",
    "tokens": {
      "colors": {
        "primary": "210 100% 50%",
        "background": "0 0% 100%"
      },
      "radius": "0.5rem"
    },
    "typography": {
      "sans": "Arial, sans-serif",
      "heading": "Arial, sans-serif"
    }
  }',
  ARRAY['cemex.localhost:3000']
);
```

**URL:** `http://cemex.localhost:3000/es-MX`

**Expected Behavior:**
1. ✅ Resolves to CEMEX tenant
2. ✅ Shows CEMEX brand theme (different primary color)
3. ✅ Logo and branding specific to CEMEX

---

## 🔍 Debugging Tips

### Check Tenant Resolution

Add console logs in `packages/api/src/lib/host-tenant.ts`:

```typescript
export async function resolveTenantAndBrandFromHost(...) {
  console.log('[DEBUG] Resolving tenant for hostname:', hostname);
  
  const result = await resolveTenantAndBrandFromHost(hostname, pathname);
  
  console.log('[DEBUG] Resolution result:', {
    tenant: result.tenant?.slug,
    brand: result.brand?.slug,
    source: result.source
  });
  
  return result;
}
```

### Check tRPC Context

In `packages/api/src/context.ts`:

```typescript
export const createContext = async (opts?: FetchCreateContextFnOptions) => {
  // ... existing code
  
  console.log('[TRPC Context]', {
    tenant: tenant?.slug,
    brand: brand?.slug,
    session: session?.user?.email
  });
  
  return { ... };
};
```

### Check Theme Application

In browser console:

```javascript
// Get computed CSS variables
const root = document.documentElement;
const primary = getComputedStyle(root).getPropertyValue('--primary');
console.log('Primary color:', primary);

// Check dark mode
console.log('Dark mode active:', document.documentElement.classList.contains('dark'));
```

---

## 📊 Database Queries for Testing

### View Current Brands and Themes

```sql
SELECT 
  t.slug as tenant_slug,
  b.slug as brand_slug,
  b.name as brand_name,
  b.domains,
  b.theme->>'name' as theme_name
FROM "Brand" b
JOIN "Tenant" t ON b."tenantId" = t.id;
```

### View Pools

```sql
SELECT 
  p.slug,
  p.name,
  p."endDate",
  t.slug as tenant_slug,
  b.slug as brand_slug,
  COUNT(r.id) as registrations
FROM "Pool" p
JOIN "Tenant" t ON p."tenantId" = t.id
LEFT JOIN "Brand" b ON p."brandId" = b.id
LEFT JOIN "Registration" r ON p.id = r."poolId"
GROUP BY p.id, t.slug, b.slug;
```

### View Registrations

```sql
SELECT 
  u.email,
  u.name,
  p.slug as pool_slug,
  r."joinedAt"
FROM "Registration" r
JOIN "User" u ON r."userId" = u.id
JOIN "Pool" p ON r."poolId" = p.id
ORDER BY r."joinedAt" DESC;
```

---

## ✅ Success Checklist

After running all scenarios, verify:

- [ ] Localhost resolves to demo tenant
- [ ] Pool landing page loads correctly
- [ ] Dark mode works (if implemented)
- [ ] 404 page shows for non-existent pools
- [ ] Registered users see appropriate CTAs
- [ ] Guest users see public landing
- [ ] Expired pools show "Finalizado" state
- [ ] Theme CSS variables are correct
- [ ] No hardcoded tenant IDs in client code
- [ ] tRPC queries use `ctx.tenant.id`
- [ ] Hero assets display correctly
- [ ] Prizes section renders
- [ ] Registration status check works

---

## 🐛 Common Issues

### Issue: Tenant Not Resolved (null)

**Symptoms:** Page shows error or default theme

**Solutions:**
1. Check `Brand.domains` includes the hostname
2. Verify development fallback is enabled
3. Check database seed ran successfully
4. Restart dev server

### Issue: Theme Not Applied

**Symptoms:** Default colors instead of brand colors

**Solutions:**
1. Check `<style id="brand-theme">` exists in `<head>`
2. Verify `Brand.theme` JSON is valid
3. Check browser console for errors
4. Clear browser cache

### Issue: Pool Not Found

**Symptoms:** 404 error for valid pool

**Solutions:**
1. Verify pool exists: `SELECT * FROM "Pool" WHERE slug = 'world-cup-2026'`
2. Check tenant ID matches resolved tenant
3. Verify pool is active: `isActive = true`

### Issue: Registration Status Wrong

**Symptoms:** Shows "Join" when already registered

**Solutions:**
1. Check tRPC query in Network tab
2. Verify session is active
3. Check `Registration` table for user/pool combo
4. Clear cookies and re-login

---

## 📝 Test Report Template

```markdown
## Test Report - [Date]

### Environment
- Node: [version]
- Next.js: 15.5.4
- Database: PostgreSQL

### Scenarios Tested
- [ ] Scenario 1: Localhost Resolution
- [ ] Scenario 2: Dark Mode
- [ ] Scenario 3: 404 Handling
- [ ] Scenario 4: Registered User
- [ ] Scenario 5: Non-Registered User
- [ ] Scenario 6: Guest User
- [ ] Scenario 7: Expired Pool
- [ ] Scenario 8: Custom Subdomain
- [ ] Scenario 9: Home Page
- [ ] Scenario 10: Multiple Tenants

### Issues Found
1. [Issue description]
   - **Severity:** High/Medium/Low
   - **Steps to reproduce:**
   - **Expected:** 
   - **Actual:**

### Screenshots
[Attach screenshots]

### Notes
[Additional observations]
```

---

## 🎯 Next Steps After Testing

1. **Fix any issues** found during testing
2. **Add E2E tests** with Playwright for critical flows
3. **Performance testing** - measure tenant resolution time
4. **Load testing** - simulate multiple tenants
5. **Production deployment** - configure custom domains

---

**Happy Testing! 🚀**
