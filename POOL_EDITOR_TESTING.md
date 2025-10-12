# Pool Editor - Testing Guide

## 🧪 Test Scenarios

### Pre-requisites
```bash
# 1. Ensure database is seeded
cd packages/db
pnpm db:seed

# 2. Start the admin app
cd apps/admin
pnpm dev

# 3. Sign in as TENANT_ADMIN
# Navigate to: http://localhost:3001/es-MX/auth/signin
```

## Test Suite 1: Authorization & Access Control

### TC-001: TENANT_ADMIN Access
**Steps:**
1. Sign in as user with TENANT_ADMIN role
2. Navigate to `/es-MX/pools`
3. Click on any pool
4. Click "Editar" button

**Expected:**
- ✅ Edit page loads successfully
- ✅ All tabs are visible
- ✅ Forms are editable

### TC-002: PLAYER Access Denied
**Steps:**
1. Sign in as user with PLAYER role
2. Navigate directly to `/es-MX/pools/{id}/edit`

**Expected:**
- ✅ Redirected to pool details page
- ✅ Error toast appears: "No tienes permisos para editar esta quiniela"

### TC-003: Unauthenticated Access
**Steps:**
1. Sign out
2. Navigate directly to `/es-MX/pools/{id}/edit`

**Expected:**
- ✅ Redirected to sign-in page

## Test Suite 2: General Tab

### TC-101: Edit Pool Name
**Steps:**
1. Navigate to General tab
2. Change pool name to "Test Pool Updated"
3. Click "Guardar cambios"

**Expected:**
- ✅ Success toast appears
- ✅ Form resets to clean state (isDirty = false)
- ✅ Refresh page → new name persists

### TC-102: Edit Slug (Active Pool)
**Steps:**
1. Ensure pool is active (`isActive = true`)
2. Try to edit slug field

**Expected:**
- ✅ Slug field is editable
- ✅ Validation enforces lowercase, numbers, hyphens only

### TC-103: Edit Slug (Finalized Pool)
**Steps:**
1. Set pool to inactive (`isActive = false`)
2. Try to edit slug field

**Expected:**
- ✅ Slug field is disabled
- ✅ Tooltip or helper text explains why

### TC-104: Change Brand
**Steps:**
1. Select different brand from dropdown
2. Click "Guardar cambios"

**Expected:**
- ✅ Brand updates successfully
- ✅ Copy URL button updates with new brand domain

### TC-105: Toggle Active Status
**Steps:**
1. Toggle "Quiniela activa" switch
2. Click "Guardar cambios"

**Expected:**
- ✅ Status updates
- ✅ Badge in pool list reflects new status

### TC-106: Form Validation
**Steps:**
1. Clear pool name field
2. Try to submit

**Expected:**
- ✅ Validation error appears: "Mínimo 3 caracteres"
- ✅ Submit button disabled or form doesn't submit

### TC-107: Cancel Changes
**Steps:**
1. Edit pool name
2. Click "Cancelar" button

**Expected:**
- ✅ Form resets to original values
- ✅ isDirty = false
- ✅ Save button disabled

## Test Suite 3: Access Tab

### TC-201: Create Access Policy (PUBLIC)
**Steps:**
1. Navigate to Access tab
2. Select "Público (sin restricciones)"
3. Toggle CAPTCHA on
4. Click "Guardar cambios"

**Expected:**
- ✅ Policy created successfully
- ✅ Success toast appears
- ✅ Refresh → policy persists

### TC-202: Update Access Policy (CODE)
**Steps:**
1. Change access type to "Por código de invitación"
2. Click "Guardar cambios"

**Expected:**
- ✅ Policy updates (not creates duplicate)
- ✅ Quick link to codes page appears

### TC-203: Add Domain Restriction
**Steps:**
1. Type "example.com" in domain field
2. Click "Agregar" or press Enter
3. Verify chip appears
4. Click "Guardar cambios"

**Expected:**
- ✅ Domain chip appears immediately
- ✅ Domain saved to policy
- ✅ Can remove domain by clicking ×

### TC-204: Set Max Registrations
**Steps:**
1. Enter "100" in max registrations field
2. Click "Guardar cambios"

**Expected:**
- ✅ Value saves correctly
- ✅ Only accepts positive integers

### TC-205: Quick Links Navigation
**Steps:**
1. Click "Gestionar invitaciones" link
2. Verify navigation to `/pools/{id}/invitations`
3. Go back, click "Gestionar códigos"
4. Verify navigation to `/pools/{id}/codes`

**Expected:**
- ✅ Links navigate correctly
- ✅ Links open in same tab

## Test Suite 4: Prizes Tab

### TC-301: Create First Prize
**Steps:**
1. Navigate to Prizes tab
2. Click "Agregar premio"
3. Fill form:
   - Posición desde: 1
   - Posición hasta: 1
   - Título: "Primer lugar"
   - Tipo: CASH
   - Valor: "$10,000 MXN"
4. Click "Crear premio"

**Expected:**
- ✅ Dialog closes
- ✅ Prize appears in table
- ✅ Success toast appears

### TC-302: Create Prize Range
**Steps:**
1. Click "Agregar premio"
2. Fill form:
   - Posición desde: 2
   - Posición hasta: 5
   - Título: "Top 5"
3. Submit

**Expected:**
- ✅ Prize created for ranks 2-5
- ✅ Table shows range correctly

### TC-303: Overlap Detection
**Steps:**
1. Create prize for ranks 1-3
2. Try to create prize for ranks 2-5

**Expected:**
- ✅ Error toast: "Las posiciones se superponen con otro premio"
- ✅ Prize NOT created
- ✅ Dialog remains open

### TC-304: Invalid Rank Range
**Steps:**
1. Click "Agregar premio"
2. Set "Posición desde" = 5
3. Set "Posición hasta" = 3
4. Try to submit

**Expected:**
- ✅ Error toast: "La posición 'hasta' debe ser mayor o igual a 'desde'"
- ✅ Prize NOT created

### TC-305: Delete Prize
**Steps:**
1. Click trash icon on existing prize
2. Confirm deletion in dialog

**Expected:**
- ✅ Confirmation dialog appears
- ✅ Prize removed from table
- ✅ Success toast appears

### TC-306: Prize Type Selection
**Steps:**
1. Create prizes with each type:
   - CASH, DISCOUNT, SERVICE, DAY_OFF, EXPERIENCE, OTHER

**Expected:**
- ✅ All types selectable
- ✅ Type badge displays correctly in table

### TC-307: Optional Fields
**Steps:**
1. Create prize with only required fields (rank, title, type)
2. Create prize with all fields filled

**Expected:**
- ✅ Both save successfully
- ✅ Optional fields show "—" when empty

## Test Suite 5: Settings Tab

### TC-401: View Inherited Settings
**Steps:**
1. Navigate to Settings tab
2. Verify display of tenant settings

**Expected:**
- ✅ Settings list appears
- ✅ Badge shows "Heredado" for tenant settings
- ✅ Badge shows "Personalizado" for pool overrides

### TC-402: No Settings Message
**Steps:**
1. Ensure pool has no custom settings
2. Navigate to Settings tab

**Expected:**
- ✅ Message: "No hay configuraciones personalizadas"
- ✅ Explanation about inherited settings

## Test Suite 6: Fixtures Tab

### TC-501: View Season Info
**Steps:**
1. Navigate to Fixtures tab
2. Verify season information displays

**Expected:**
- ✅ Season name and year shown
- ✅ Total match count shown
- ✅ Next match info shown (if available)

### TC-502: View Fixtures Link
**Steps:**
1. Click "Ver partidos" button

**Expected:**
- ✅ Navigates to `/es-MX/fixtures`
- ✅ Fixtures page loads

### TC-503: No Matches Scenario
**Steps:**
1. Use pool with season that has no matches
2. Navigate to Fixtures tab

**Expected:**
- ✅ Shows "0 partidos"
- ✅ Next match shows "—"

## Test Suite 7: Header Actions

### TC-601: Copy Public URL (Valid)
**Steps:**
1. Ensure pool has:
   - Brand with domains configured
   - Valid slug
2. Click "Copiar URL pública"

**Expected:**
- ✅ URL copied to clipboard
- ✅ Success toast appears
- ✅ Button shows checkmark briefly
- ✅ URL format: `https://{domain}/{slug}`

### TC-602: Copy URL (No Domain)
**Steps:**
1. Use pool with brand that has no domains
2. Check "Copiar URL pública" button

**Expected:**
- ✅ Button is disabled
- ✅ Tooltip explains why (optional)

### TC-603: Copy URL (No Slug)
**Steps:**
1. Use pool with no slug
2. Check "Copiar URL pública" button

**Expected:**
- ✅ Button is disabled

## Test Suite 8: Data Persistence

### TC-701: Concurrent Edits
**Steps:**
1. Open pool editor in two browser tabs
2. Edit name in Tab 1, save
3. Edit description in Tab 2, save
4. Refresh both tabs

**Expected:**
- ✅ Both changes persist
- ✅ No data loss
- ✅ Last write wins for conflicting fields

### TC-702: Network Error Handling
**Steps:**
1. Open DevTools → Network tab
2. Set to "Offline"
3. Try to save changes

**Expected:**
- ✅ Error toast appears
- ✅ Form remains in dirty state
- ✅ User can retry after reconnecting

### TC-703: Cache Invalidation
**Steps:**
1. Edit pool name
2. Save successfully
3. Navigate to pool list
4. Verify updated name appears

**Expected:**
- ✅ Pool list shows new name immediately
- ✅ No stale cache data

## Test Suite 9: Tenant Isolation

### TC-801: Cross-Tenant Access
**Steps:**
1. Sign in as admin of Tenant A
2. Get pool ID from Tenant B
3. Try to navigate to `/pools/{tenantB-pool-id}/edit`

**Expected:**
- ✅ Access denied or 404
- ✅ Cannot view/edit other tenant's pools

### TC-802: Brand Selection Scoped
**Steps:**
1. Sign in as admin of Tenant A
2. Open pool editor
3. Check brand dropdown

**Expected:**
- ✅ Only Tenant A's brands appear
- ✅ Cannot select other tenant's brands

## Test Suite 10: Internationalization

### TC-901: Spanish Locale
**Steps:**
1. Navigate to `/es-MX/pools/{id}/edit`
2. Check all labels, buttons, messages

**Expected:**
- ✅ All text in Spanish
- ✅ No English fallbacks visible
- ✅ Error messages in Spanish

### TC-902: Locale Switching
**Steps:**
1. Switch locale to English (if implemented)
2. Navigate to pool editor

**Expected:**
- ✅ All text updates to English
- ✅ Form validation messages in English

## Test Suite 11: Mobile Responsiveness

### TC-1001: Mobile Layout
**Steps:**
1. Open pool editor on mobile device or DevTools mobile view
2. Check all tabs

**Expected:**
- ✅ Tabs are scrollable horizontally
- ✅ Forms stack vertically
- ✅ Buttons are touch-friendly (min 44px)
- ✅ No horizontal scroll on content

### TC-1002: Tablet Layout
**Steps:**
1. Open on tablet (768px width)
2. Navigate through all tabs

**Expected:**
- ✅ Forms use available width efficiently
- ✅ Tables are scrollable if needed
- ✅ Dialogs fit on screen

## Test Suite 12: Performance

### TC-1101: Initial Load Time
**Steps:**
1. Open pool editor
2. Measure time to interactive

**Expected:**
- ✅ Page loads in < 2 seconds
- ✅ Skeleton loaders show during fetch

### TC-1102: Form Submission Speed
**Steps:**
1. Edit form
2. Click save
3. Measure time to success toast

**Expected:**
- ✅ Mutation completes in < 1 second
- ✅ Optimistic updates (if implemented)

## Automated Test Examples

### Unit Test: Prize Overlap Detection
```typescript
import { describe, it, expect } from 'vitest';

describe('Prize overlap detection', () => {
  it('detects overlapping ranges', () => {
    const existing = [
      { rankFrom: 1, rankTo: 3 },
      { rankFrom: 4, rankTo: 10 }
    ];
    
    const newPrize = { rankFrom: 2, rankTo: 5 };
    
    const hasOverlap = existing.some((prize) => {
      const overlapStart = Math.max(newPrize.rankFrom, prize.rankFrom);
      const overlapEnd = Math.min(newPrize.rankTo, prize.rankTo);
      return overlapStart <= overlapEnd;
    });
    
    expect(hasOverlap).toBe(true);
  });

  it('allows non-overlapping ranges', () => {
    const existing = [{ rankFrom: 1, rankTo: 3 }];
    const newPrize = { rankFrom: 4, rankTo: 6 };
    
    const hasOverlap = existing.some((prize) => {
      const overlapStart = Math.max(newPrize.rankFrom, prize.rankFrom);
      const overlapEnd = Math.min(newPrize.rankTo, prize.rankTo);
      return overlapStart <= overlapEnd;
    });
    
    expect(hasOverlap).toBe(false);
  });
});
```

### Integration Test: Pool Update
```typescript
import { describe, it, expect } from 'vitest';
import { createCaller } from '@qp/api';

describe('pool.update', () => {
  it('updates pool name', async () => {
    const caller = createCaller({
      session: mockAdminSession,
      tenant: mockTenant
    });

    const result = await caller.pools.update({
      id: 'pool-123',
      name: 'Updated Name'
    });

    expect(result.name).toBe('Updated Name');
  });

  it('rejects non-admin users', async () => {
    const caller = createCaller({
      session: mockPlayerSession,
      tenant: mockTenant
    });

    await expect(
      caller.pools.update({ id: 'pool-123', name: 'Hacked' })
    ).rejects.toThrow('FORBIDDEN');
  });
});
```

### E2E Test: Complete Flow
```typescript
import { test, expect } from '@playwright/test';

test('complete pool edit flow', async ({ page }) => {
  // Sign in
  await page.goto('/es-MX/auth/signin');
  await page.fill('input[name="email"]', 'admin@example.com');
  await page.click('button[type="submit"]');

  // Navigate to pool editor
  await page.goto('/es-MX/pools');
  await page.click('text=Ver detalles >> nth=0');
  await page.click('text=Editar');

  // Edit general info
  await page.fill('input[name="name"]', 'E2E Test Pool');
  await page.click('button:has-text("Guardar cambios")');
  await expect(page.locator('text=Cambios guardados')).toBeVisible();

  // Add prize
  await page.click('text=Premios');
  await page.click('text=Agregar premio');
  await page.fill('input[name="rankFrom"]', '1');
  await page.fill('input[name="rankTo"]', '1');
  await page.fill('input[name="title"]', 'E2E Prize');
  await page.click('button:has-text("Crear premio")');
  await expect(page.locator('text=Premio creado')).toBeVisible();

  // Verify persistence
  await page.reload();
  await expect(page.locator('input[name="name"]')).toHaveValue('E2E Test Pool');
  await page.click('text=Premios');
  await expect(page.locator('text=E2E Prize')).toBeVisible();
});
```

## Bug Report Template

When reporting issues, include:

```markdown
**Test Case ID**: TC-XXX
**Environment**: Development / Staging / Production
**Browser**: Chrome 120 / Firefox 121 / Safari 17
**User Role**: TENANT_ADMIN / SUPERADMIN

**Steps to Reproduce**:
1. Navigate to...
2. Click on...
3. Enter...

**Expected Result**:
- Should show...

**Actual Result**:
- Shows...

**Screenshots**:
[Attach screenshots]

**Console Errors**:
[Paste console errors]

**Network Errors**:
[Paste failed requests]
```

## Test Coverage Goals

- **Unit Tests**: > 80% coverage
- **Integration Tests**: All tRPC procedures
- **E2E Tests**: Critical user flows
- **Manual Tests**: All test cases above

## Continuous Testing

```bash
# Run all tests
pnpm test

# Run specific suite
pnpm test pool-editor

# Run with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e
```

---

**Testing Status**: Ready for QA  
**Last Updated**: 2025-01-11  
**Maintained By**: Development Team
