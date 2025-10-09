# Migration Steps - Theming & Toast Implementation

## Prerequisites

Ensure you have:
- Node 20+
- PNPM 9+

## Step-by-Step Migration

### 1. Install Dependencies

```bash
# From repository root
pnpm install
```

This will install all updated dependencies including:
- Next.js 15.5.4+
- React 19
- TypeScript 5.9.0-beta
- Prisma 6.17.0
- next-themes, sonner, lucide-react

### 2. Update Prisma (if using database)

```bash
# Generate Prisma client with new version
pnpm db:generate

# Push schema changes (if any)
pnpm db:push
```

### 3. Verify Build

```bash
# Build all packages
pnpm build

# Run type checking
pnpm typecheck

# Run linting
pnpm lint
```

### 4. Run Tests

```bash
# Run all tests
pnpm test

# Or test specific packages
pnpm --filter @qp/branding test
pnpm --filter @qp/ui test
```

### 5. Start Development Servers

```bash
# Start all apps in parallel
pnpm dev
```

This will start:
- `apps/web` on http://localhost:3000
- `apps/admin` on http://localhost:3001 (check port in console)

### 6. Verify Theming

1. **Open apps/web** (http://localhost:3000)
   - Look for the theme toggle button (sun/moon icon)
   - Click to switch between Light, Dark, and System modes
   - Refresh page - theme should persist
   - Check DevTools > Elements > `<html>` - should have `class="dark"` or no class

2. **Open apps/admin** (http://localhost:3001)
   - Same theme toggle verification
   - Click "Guardar (Manual)" or "Guardar (Promise)" buttons
   - Verify toast notifications appear in bottom-right

### 7. Verify Branding

1. Open DevTools > Elements > `<head>`
2. Look for `<style id="brand-theme">`
3. Verify CSS variables are injected:
   ```css
   :root {
     --primary: 199 84% 55%;
     --background: 0 0% 100%;
     /* ... */
   }
   ```

### 8. Test Toast Functionality

**In apps/web:**
- Click "Unirse a la Quiniela" button
- Should see success toast: "¡Bienvenido a la quiniela!"

**In apps/admin:**
- Click "Guardar (Manual)" - should show loading, then success/error
- Click "Guardar (Promise)" - should show promise-based toast

## Troubleshooting

### Issue: Build fails with TypeScript errors

**Solution:**
```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm build
```

### Issue: Theme doesn't persist across page refresh

**Check:**
1. `suppressHydrationWarning` is on `<html>` tag
2. `ThemeProvider` wraps the app
3. Browser localStorage is enabled
4. Check console for `next-themes` errors

### Issue: Toasts don't appear

**Check:**
1. `ToastProvider` is in the layout
2. Import toast helpers from `@qp/ui`
3. Check console for errors
4. Verify Sonner CSS is loaded

### Issue: Dark mode colors look wrong

**Check:**
1. `darkMode: "class"` in Tailwind config
2. CSS variables defined in both `:root` and `.dark`
3. Colors use `hsl(var(--variable))` format
4. No hardcoded color values in components

### Issue: Prisma generate fails

**Solution:**
```bash
# Update Prisma CLI
pnpm add -D prisma@6.17.0 -w

# Regenerate client
pnpm --filter @qp/db exec prisma generate
```

### Issue: React 19 compatibility warnings

React 19 is in RC. If you encounter issues:
1. Check component prop types (some changed)
2. Verify `@types/react` version matches React version
3. Update peer dependencies if needed

## Rollback Plan

If you need to rollback:

1. **Revert package.json changes:**
   ```bash
   git checkout HEAD -- package.json apps/*/package.json packages/*/package.json
   ```

2. **Reinstall old dependencies:**
   ```bash
   pnpm install
   ```

3. **Revert layout changes:**
   ```bash
   git checkout HEAD -- apps/web/app/layout.tsx apps/admin/app/layout.tsx
   ```

## Next Actions

After successful migration:

1. **Customize branding:**
   - Update `packages/branding/src/demo.ts` with your brand colors
   - Or fetch from database based on domain

2. **Add more toast usage:**
   - Use in form submissions
   - Add to API error handling
   - Integrate with tRPC mutations

3. **Extend theme:**
   - Add custom color tokens if needed
   - Configure font loading (next/font)
   - Add brand-specific animations

4. **Production considerations:**
   - Set up brand management UI
   - Implement domain-based theme resolution
   - Add brand asset CDN integration

## Support

For issues or questions:
1. Check `THEMING_AND_TOAST.md` for detailed documentation
2. Review test files for usage examples
3. Inspect demo components in `apps/*/src/components/demo-*`
