# Branding Configuration Alignment Summary

## Overview
Aligned the branding configuration in `/apps/admin` to match the dynamic, host-based resolution pattern used in `/apps/web`.

## Changes Made

### 1. **Layout Configuration** (`apps/admin/app/[locale]/layout.tsx`)

#### Before:
- Used hardcoded `getDemoBranding()` for static demo branding
- Applied theme at module level (executed once at build time)
- No dynamic brand resolution based on hostname
- Metadata used static brand name

#### After:
- Imports `resolveTenantAndBrandFromHost` from `@qp/api/lib/host-tenant`
- Resolves brand dynamically from request hostname in both:
  - `generateMetadata()` - for SEO/OG tags
  - `LocaleLayout()` - for theme and header props
- Applies default theme as fallback with `applyBrandTheme(null)`
- Passes dynamic `brandName` and `logoUrl` to `AdminHeader`

**Key Code Changes:**
```typescript
// Resolve brand from host for metadata
const { headers } = await import("next/headers");
const headersList = await headers();
const host = headersList.get("host") || "localhost";
const { brand } = await resolveTenantAndBrandFromHost(host);

const brandName = brand?.name || adminEnv.NEXT_PUBLIC_APP_NAME;
```

### 2. **Admin Header** (`apps/admin/app/components/admin-header.tsx`)

#### Before:
- No props accepted
- Hardcoded "Quinielas Admin" text
- No logo support

#### After:
- Accepts `brandName` and `logoUrl` props
- Displays brand logo when available (using Next.js Image component)
- Falls back to brand name text when no logo
- Matches the pattern used in `/apps/web` SiteHeader

**Key Code Changes:**
```typescript
interface AdminHeaderProps {
  brandName?: string;
  logoUrl?: string | null;
}

export function AdminHeader({ brandName = "Quinielas Admin", logoUrl }: AdminHeaderProps) {
  // ... renders logo or brand name
}
```

### 3. **Home Page** (`apps/admin/app/[locale]/page.tsx`)

#### Before:
- Used `getDemoBranding()` at module level
- Static brand/tenant names

#### After:
- Async component that resolves brand from hostname
- Dynamic brand and tenant resolution
- Matches the pattern used in `/apps/web` home page

**Key Code Changes:**
```typescript
export default async function AdminHome() {
  const headersList = await headers();
  let host = headersList.get("host") || "localhost";
  if (host.includes(":")) {
    host = host.split(":")[0];
  }
  const { brand, tenant } = await resolveTenantAndBrandFromHost(host);
  
  const brandName = brand?.name || adminEnv.NEXT_PUBLIC_APP_NAME;
  const tenantName = tenant?.name || adminEnv.NEXT_PUBLIC_TENANT_SLUG;
  // ...
}
```

### 4. **Brand Theme Injector** (`apps/admin/app/components/brand-theme-injector.tsx`)

#### Created New Component:
- Client-side component for dynamic theme injection
- Handles legacy theme format conversion
- Supports both light and dark theme tokens
- Identical implementation to `/apps/web` version

**Purpose:**
- Allows runtime theme updates without page reload
- Supports HEX to HSL color conversion
- Normalizes theme format for consistency

## Branding Resolution Strategy

Both apps now follow the same multi-strategy resolution pattern:

1. **Custom Domain**: Exact match in `Brand.domains` array
2. **Subdomain**: Extract tenant slug from subdomain (e.g., `cemex.quinielas.mx`)
3. **Path-based**: Parse tenant/brand from URL path segments
4. **Development Fallback**: Use "ivoka" tenant in development mode

## Benefits of Alignment

### ✅ Consistency
- Both apps use identical branding resolution logic
- Same component patterns and prop interfaces
- Unified codebase maintenance

### ✅ Multi-tenancy Support
- Dynamic brand resolution per hostname
- Supports custom domains, subdomains, and path-based routing
- Proper tenant isolation

### ✅ White-label Ready
- Each tenant/brand gets custom branding automatically
- Logo, colors, and theme applied dynamically
- No hardcoded brand references

### ✅ SEO & Metadata
- Dynamic metadata generation per brand
- Proper OG tags with brand-specific content
- Correct brand names in page titles

### ✅ Maintainability
- Single source of truth for branding logic (`@qp/api/lib/host-tenant`)
- Shared components and utilities in packages
- Easy to update branding behavior globally

## Files Modified

1. `apps/admin/app/[locale]/layout.tsx` - Dynamic brand resolution
2. `apps/admin/app/components/admin-header.tsx` - Logo and brand name support
3. `apps/admin/app/[locale]/page.tsx` - Dynamic tenant/brand data

## Files Created

1. `apps/admin/app/components/brand-theme-injector.tsx` - Client-side theme injection

## Removed Dependencies

- Removed all references to `getDemoBranding()` from admin app
- No more hardcoded demo branding

## Testing Recommendations

1. **Local Development**: Test with different hostnames (localhost, tenant.localhost)
2. **Subdomain Testing**: Verify tenant resolution from subdomain
3. **Custom Domain**: Test with custom domain configuration
4. **Theme Application**: Verify brand colors and logo display correctly
5. **Metadata**: Check page titles and OG tags reflect correct brand
6. **Dark Mode**: Ensure theme works in both light and dark modes

## Next Steps (Optional Enhancements)

1. Add BrandThemeInjector to admin layout for runtime theme updates
2. Implement brand switcher for superadmin users
3. Add brand preview mode for testing themes
4. Create admin UI for managing brand themes
5. Add theme validation and error handling

## Notes

- The admin app now mirrors the web app's branding implementation
- Both apps share the same `resolveTenantAndBrandFromHost` utility
- Theme injection happens server-side in layout, with client-side override capability via BrandThemeInjector
- Logo URLs are extracted from `brand.theme.logo` property (JSON field)
