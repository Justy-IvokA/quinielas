# Pool Editor - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
```bash
# Ensure database is seeded
cd packages/db
pnpm db:seed

# Start admin app
cd apps/admin
pnpm dev
```

### Access the Editor
1. Navigate to: `http://localhost:3001/es-MX/pools`
2. Click on any pool
3. Click "Editar" button
4. You'll be at: `/es-MX/pools/{poolId}/edit`

## 📑 Tabs Overview

### 1. General Tab
**Edit basic pool information**

Fields:
- **Nombre**: Pool display name (3-100 chars)
- **Slug**: URL-friendly identifier (lowercase, numbers, hyphens)
- **Descripción**: Optional description (max 500 chars)
- **Marca**: Select from tenant brands
- **Resumen de premios**: Brief prize description
- **Quiniela activa**: Toggle to enable/disable pool
- **Visible públicamente**: Toggle public visibility

Read-only:
- Season, Sport, Competition (set at creation)

### 2. Access Tab
**Configure registration rules**

Options:
- **Tipo de acceso**:
  - `PUBLIC`: Anyone can register
  - `CODE`: Requires invite code
  - `EMAIL_INVITE`: Requires email invitation
- **CAPTCHA**: Enable bot protection
- **Email verification**: Require email confirmation
- **Dominios permitidos**: Restrict by email domain (e.g., `company.com`)
- **Máximo de registros**: Cap total registrations

Quick links:
- Manage invitations → `/pools/{id}/invitations`
- Manage codes → `/pools/{id}/codes`

### 3. Prizes Tab
**Define leaderboard rewards**

Actions:
- **Add prize**: Click "Agregar premio"
- **Delete prize**: Click trash icon

Fields:
- **Posición desde/hasta**: Rank range (e.g., 1-3 for top 3)
- **Título**: Prize name (e.g., "Primer lugar")
- **Tipo**: CASH, DISCOUNT, SERVICE, DAY_OFF, EXPERIENCE, OTHER
- **Valor**: Prize value (e.g., "$10,000 MXN")
- **Descripción**: Optional details
- **URL de imagen**: Optional prize image

Validation:
- Rank ranges cannot overlap
- `rankTo` must be ≥ `rankFrom`

### 4. Settings Tab
**Pool-level configuration overrides**

Currently displays:
- Inherited tenant settings
- Pool-specific overrides (if any)

Future: Full CRUD for pool settings

### 5. Fixtures Tab
**Season and match information**

Displays:
- Season name and year
- Total match count
- Next scheduled match
- Quick link to fixtures admin

## 🔐 Authorization

### Required Role
- **TENANT_ADMIN** or **SUPERADMIN**

### What Happens Without Permission
- Redirect to pool details page
- Error toast: "No tienes permisos para editar esta quiniela"

### Testing Auth
```typescript
// As PLAYER (should fail)
await signIn({ email: "player@example.com" });
// Navigate to /pools/{id}/edit → redirected

// As TENANT_ADMIN (should succeed)
await signIn({ email: "admin@example.com" });
// Navigate to /pools/{id}/edit → access granted
```

## 🎨 UI Patterns

### Form Validation
All forms use `react-hook-form` + `zod`:
```typescript
const schema = z.object({
  name: z.string().min(3).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/)
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema)
});
```

### Toast Notifications
Success and error feedback via Sonner:
```typescript
toastSuccess("Cambios guardados exitosamente");
toastError("Error al guardar: {message}");
```

### Loading States
Skeleton loaders during data fetch:
```typescript
if (isLoading) {
  return <Skeleton className="h-10 w-full" />;
}
```

### Dirty State Tracking
Save button enabled only when form is modified:
```typescript
const { isDirty } = formState;
<Button disabled={!isDirty}>Guardar cambios</Button>
```

## 🔧 Common Tasks

### Add a New Form Field

1. **Update Zod schema**:
```typescript
// general-form.tsx
const generalFormSchema = z.object({
  // ... existing fields
  newField: z.string().optional()
});
```

2. **Add to form**:
```tsx
<FormField label="New Field" htmlFor="newField">
  <Input id="newField" {...register("newField")} />
</FormField>
```

3. **Update tRPC schema**:
```typescript
// packages/api/src/routers/pools/schema.ts
export const updatePoolSchema = z.object({
  // ... existing fields
  newField: z.string().optional()
});
```

### Add a New Tab

1. **Create component**:
```typescript
// _components/my-new-tab.tsx
export function MyNewTab({ poolId }: { poolId: string }) {
  return <Card>...</Card>;
}
```

2. **Add to tabs**:
```typescript
// pool-editor-tabs.tsx
<TabsTrigger value="myTab">My Tab</TabsTrigger>
<TabsContent value="myTab">
  <MyNewTab poolId={poolId} />
</TabsContent>
```

3. **Add i18n**:
```json
// messages/es-MX.json
"pools.edit.tabs.myTab": "Mi Pestaña"
```

### Customize Validation

```typescript
// Custom validation in form
const validatePrizeRange = (data: PrizeFormData) => {
  if (data.rankTo < data.rankFrom) {
    toastError("Rank 'to' must be >= 'from'");
    return false;
  }
  return true;
};

const onSubmit = (data: PrizeFormData) => {
  if (!validatePrizeRange(data)) return;
  // ... proceed with mutation
};
```

## 🧪 Testing

### Manual Testing Checklist

**General Tab**:
- [ ] Edit name and save
- [ ] Change slug (should be disabled if finalized)
- [ ] Select different brand
- [ ] Toggle active/public flags
- [ ] Cancel button resets form

**Access Tab**:
- [ ] Change access type
- [ ] Toggle CAPTCHA
- [ ] Add/remove domain restrictions
- [ ] Set max registrations
- [ ] Quick links navigate correctly

**Prizes Tab**:
- [ ] Create new prize
- [ ] Try creating overlapping prize (should fail)
- [ ] Delete existing prize (with confirmation)
- [ ] Verify table updates after mutations

**Settings Tab**:
- [ ] View inherited settings
- [ ] View pool overrides (if any)

**Fixtures Tab**:
- [ ] Season info displays correctly
- [ ] Next match shows if available
- [ ] Link to fixtures page works

**Header Actions**:
- [ ] Copy URL button works
- [ ] URL format is correct: `https://{domain}/{slug}`
- [ ] Button disabled if no domain/slug

### Automated Testing

```typescript
// Example Playwright test
test("saves general form changes", async ({ page }) => {
  await page.goto("/es-MX/pools/pool123/edit");
  
  // Edit name
  await page.fill('input[name="name"]', "Updated Name");
  
  // Submit
  await page.click('button[type="submit"]');
  
  // Verify toast
  await expect(page.locator('text=Cambios guardados')).toBeVisible();
  
  // Verify cache invalidation
  await page.reload();
  await expect(page.locator('input[name="name"]')).toHaveValue("Updated Name");
});
```

## 🐛 Troubleshooting

### Issue: "Tenant ID required" error
**Cause**: Context not resolving tenant from hostname  
**Fix**: Ensure you're accessing via proper domain or subdomain

### Issue: Form doesn't save
**Cause**: Validation errors or missing required fields  
**Fix**: Check browser console for validation errors

### Issue: "No tienes permisos" redirect
**Cause**: User doesn't have TENANT_ADMIN role  
**Fix**: Update user role in database:
```sql
UPDATE "TenantMember" 
SET role = 'TENANT_ADMIN' 
WHERE "userId" = 'user-id';
```

### Issue: Copy URL button disabled
**Cause**: Brand has no domains or pool has no slug  
**Fix**: 
1. Add domain to brand: `UPDATE "Brand" SET domains = ARRAY['example.com']`
2. Ensure pool has slug: `UPDATE "Pool" SET slug = 'my-pool'`

### Issue: Prizes overlap error
**Cause**: Rank ranges conflict with existing prizes  
**Fix**: Adjust rank ranges to avoid overlap:
- Prize 1: Ranks 1-3
- Prize 2: Ranks 4-10 (not 3-10)

## 📚 Related Documentation

- [Pool Editor Implementation](./POOL_EDITOR_IMPLEMENTATION.md) - Full technical details
- [.windsurfrules](./.windsurfrules) - Project conventions
- [AUTH_ARCHITECTURE.md](./AUTH_ARCHITECTURE.md) - Auth system
- [I18N_IMPLEMENTATION.md](./I18N_IMPLEMENTATION.md) - Internationalization

## 🔗 Useful Commands

```bash
# Verify implementation
pnpm tsx scripts/verify-pool-editor.ts

# Type check
cd apps/admin && pnpm typecheck

# Lint
cd apps/admin && pnpm lint

# Run tests
cd apps/admin && pnpm test

# Database migrations
cd packages/db && pnpm db:migrate

# Seed data
cd packages/db && pnpm db:seed
```

## 💡 Tips

1. **Always test with real tenant context**: Use proper domain/subdomain
2. **Check browser console**: Validation errors appear there first
3. **Use React DevTools**: Inspect form state and tRPC cache
4. **Test mobile**: Tabs should be scrollable on small screens
5. **Verify i18n**: All strings should come from translation files

## 🎯 Next Steps

After familiarizing yourself with the Pool Editor:
1. Explore other admin modules (Fixtures, Access, Analytics)
2. Review tRPC router implementations
3. Study tenant scoping patterns
4. Learn the branding system
5. Understand the scoring engine

---

**Need Help?** Check the implementation docs or ask in the team channel.
