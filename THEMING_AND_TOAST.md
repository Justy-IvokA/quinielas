# Theming & Toast Implementation Guide

## Overview

This document describes the light/dark theming and toast messaging implementation across the Quinielas WL monorepo, inspired by cal.com patterns.

## Architecture

### Design Tokens & Dark Mode

**Location:** `packages/ui/src/styles.css`

CSS variables define all color tokens in HSL format (without `hsl()` wrapper) for both light and dark modes:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  /* ... */
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  /* ... */
}
```

**Tailwind Configuration:** `packages/ui/src/tailwind/preset.ts`

- `darkMode: "class"` enables class-based dark mode
- All colors reference CSS variables via `hsl(var(--variable))`

### Branding System

**Location:** `packages/branding/src/resolveTheme.ts`

#### Key Functions

1. **`tokensToCssVariables(tokens)`**
   - Converts `BrandThemeTokens` to CSS variable object
   - Maps colors, radius, and typography

2. **`applyBrandTheme(theme)`**
   - Generates `<style>` tag with brand-specific CSS variables
   - Injects into `<head>` on server-side
   - Falls back to defaults if no theme provided

3. **`resolveTheme(brandTheme?)`**
   - Merges partial brand theme with defaults
   - Returns complete `BrandTheme` object

#### Usage in Apps

```tsx
// apps/web/app/layout.tsx or apps/admin/app/layout.tsx
import { getDemoBranding, applyBrandTheme } from "@qp/branding";

const branding = getDemoBranding();
const brandThemeStyle = applyBrandTheme(branding.theme);

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <div dangerouslySetInnerHTML={{ __html: brandThemeStyle }} />
      </head>
      <body>
        {/* ... */}
      </body>
    </html>
  );
}
```

### Theme Provider (next-themes)

**Location:** `packages/ui/src/providers/theme-provider.tsx`

Wraps `next-themes` with sensible defaults:

```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
>
  {children}
</ThemeProvider>
```

**Hook:** `useTheme()` re-exported from `next-themes`

### Theme Toggle Component

**Location:** `packages/ui/src/components/theme-toggle.tsx`

Dropdown menu with three options:
- **Light:** Force light mode
- **Dark:** Force dark mode
- **System:** Follow OS preference

Persists selection to `localStorage` via `next-themes`.

### Toast System (Sonner)

**Location:** `packages/ui/src/providers/toast-provider.tsx`

Global `<Toaster>` component:
- Auto-syncs with current theme
- Position: `bottom-right`
- Rich colors enabled
- Close button on all toasts

**Location:** `packages/ui/src/lib/toast.ts`

Typed helper functions:

```ts
toastSuccess(message, options?)
toastError(message, options?)
toastInfo(message, options?)
toastWarning(message, options?)
toastLoading(message, options?)
toastPromise(promise, { loading, success, error })
toastDismiss(toastId?)
```

#### Example: Promise Toast

```tsx
import { toastPromise } from "@qp/ui";

const saveData = async () => {
  await toastPromise(apiCall(), {
    loading: "Guardando...",
    success: "¡Guardado exitosamente!",
    error: "Error al guardar"
  });
};
```

### FormSubmit Component

**Location:** `packages/ui/src/components/form-submit.tsx`

Button with integrated promise toast handling:

```tsx
<FormSubmit
  onSubmit={async () => await saveConfig()}
  loadingText="Guardando..."
  successText="¡Configuración guardada!"
  errorText="Error al guardar"
>
  Guardar
</FormSubmit>
```

## Integration in Apps

### apps/web

**Layout:** `apps/web/app/layout.tsx`
- Injects brand theme CSS
- Wraps with `ThemeProvider` and `ToastProvider`
- `suppressHydrationWarning` on `<html>`

**Components:**
- `home-hero.tsx`: Includes `<ThemeToggle />`
- `demo-theme-cta.tsx`: Example CTA with success toast

### apps/admin

**Layout:** `apps/admin/app/layout.tsx`
- Same provider structure as web app

**Components:**
- `dashboard-welcome.tsx`: Includes `<ThemeToggle />`
- `demo-save-button.tsx`: Examples of manual and promise toasts

## Testing

### Branding Tests

**Location:** `packages/branding/src/__tests__/resolveTheme.test.ts`

Tests:
- `tokensToCssVariables`: Conversion accuracy
- `applyBrandTheme`: Style tag generation, defaults
- `resolveTheme`: Merging, fallbacks

### Toast Tests

**Location:** `packages/ui/src/lib/__tests__/toast.test.ts`

Tests:
- All helper functions call Sonner correctly
- Options passed through
- Promise toast with dynamic messages

Run tests:
```bash
pnpm --filter @qp/branding test
pnpm --filter @qp/ui test
```

## Dependencies Updated

| Package | Old Version | New Version |
|---------|-------------|-------------|
| Next.js | 14.2.5 | ^15.5.4 |
| React | 18.3.1 | ^19.0.0 |
| TypeScript | ^5.4.0 | 5.9.0-beta |
| Prisma | ^5.15.0 | ^6.17.0 |

**New Dependencies:**
- `next-themes` ^0.4.4
- `sonner` ^1.7.1
- `lucide-react` ^0.468.0
- `@radix-ui/react-dropdown-menu` ^2.1.4
- `prisma-kysely` ^1.8.0

## File Structure

```
packages/
├── ui/
│   ├── src/
│   │   ├── styles.css                    # CSS variables (light/dark)
│   │   ├── tailwind/preset.ts            # Tailwind config with darkMode
│   │   ├── providers/
│   │   │   ├── theme-provider.tsx        # next-themes wrapper
│   │   │   └── toast-provider.tsx        # Sonner wrapper
│   │   ├── components/
│   │   │   ├── theme-toggle.tsx          # Theme switcher dropdown
│   │   │   └── form-submit.tsx           # Button with toast promise
│   │   └── lib/
│   │       ├── toast.ts                  # Typed toast helpers
│   │       └── __tests__/toast.test.ts
│   └── vitest.config.ts
│
├── branding/
│   ├── src/
│   │   ├── resolveTheme.ts               # Brand CSS variable resolver
│   │   ├── types.ts                      # BrandTheme types
│   │   └── __tests__/resolveTheme.test.ts
│   └── vitest.config.ts
│
apps/
├── web/
│   ├── app/
│   │   ├── layout.tsx                    # Theme/Toast providers
│   │   ├── globals.css                   # @import "@qp/ui/styles"
│   │   └── components/home-hero.tsx      # ThemeToggle example
│   └── src/components/demo-theme-cta.tsx # Toast example
│
└── admin/
    ├── app/
    │   ├── layout.tsx                    # Theme/Toast providers
    │   ├── globals.css                   # @import "@qp/ui/styles"
    │   └── components/dashboard-welcome.tsx
    └── src/components/demo-save-button.tsx # Toast examples
```

## Acceptance Criteria ✅

- [x] Dark/Light/System toggling persists across refresh and routes
- [x] Branding overrides applied on both apps (inspectable via DevTools)
- [x] Sonner Toaster visible globally
- [x] Helper functions usable in both apps
- [x] Example actions show success/error toasts
- [x] All builds pass: `pnpm build`, lint/typecheck
- [x] Minimal tests included
- [x] No theming code hard-coupled to a single tenant
- [x] Domain-based branding works with defaults

## Usage Examples

### Adding a New Brand Theme

```ts
// In database or config
const customBrand: BrandTheme = {
  name: "Custom Brand",
  slug: "custom",
  tokens: {
    colors: {
      primary: "280 100% 70%",      // Purple
      background: "0 0% 10%",       // Dark bg
      // ... other colors
    },
    radius: "1rem"
  },
  typography: {
    sans: "Roboto, sans-serif",
    heading: "Montserrat, sans-serif"
  },
  cssVariables: {} // Auto-generated
};

// In layout
const brandThemeStyle = applyBrandTheme(customBrand);
```

### Using Toast in a Server Action

```tsx
"use client";

import { toastPromise } from "@qp/ui";
import { savePoolAction } from "./actions";

export function PoolForm() {
  const handleSubmit = async (formData: FormData) => {
    await toastPromise(savePoolAction(formData), {
      loading: "Guardando pool...",
      success: "Pool creado exitosamente",
      error: (err) => `Error: ${err.message}`
    });
  };

  return <form action={handleSubmit}>...</form>;
}
```

## Notes

- **CSS-first approach:** All theming via CSS variables, not Tailwind conditionals
- **Server-side branding:** Brand CSS injected on server, theme toggle on client
- **No hard-coupling:** Branding resolver works with any tenant/brand data
- **Incremental adoption:** Existing components work without changes

## Next Steps

1. Connect branding to database (fetch by domain/subdomain)
2. Add brand management UI in admin panel
3. Extend color palette for additional semantic tokens
4. Add Storybook stories for ThemeToggle and toast examples
5. Implement brand asset management (logos, favicons)
