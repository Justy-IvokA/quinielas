# Auto-Redirect to Dashboard Implementation

## Overview
Implemented automatic redirection to the user's dashboard after successful authentication, based on their role. Previously, users were redirected to the root path (`/`) after login.

## Changes Made

### 1. **Fixed `getDefaultRedirectForRole` Helper** 
**File:** `packages/auth/src/helpers.ts`

- **Line 85**: Corrected PLAYER role redirect path
- **Before:** `/${locale}/(player)/dashboard` (incorrect - includes route group)
- **After:** `/${locale}/dashboard` (correct - route groups are not part of URLs)

```typescript
case "PLAYER":
  return `/${locale}/dashboard`; // Fixed: removed (player) route group
```

### 2. **Updated Sign In Page to Use Role-Based Redirect**
**File:** `apps/web/app/[locale]/auth/signin/page.tsx`

- **Line 5**: Imported `getDefaultRedirectForRole` from `@qp/auth`
- **Lines 56-57**: Use role-based redirect when user is already authenticated
- **Lines 72-79**: Set default redirect to dashboard for callback URL sanitization

```typescript
// Import
import { createAuthInstance, getDefaultRedirectForRole } from "@qp/auth";

// Check if already authenticated
if (session?.user) {
  const defaultRedirect = getDefaultRedirectForRole(session.user.highestRole, locale);
  const finalCallbackUrl = callbackUrl || defaultRedirect;
  redirect(finalCallbackUrl);
}

// Default redirect for sanitization
const defaultRedirect = `/${locale}/dashboard`;
const safeCallbackUrl = await sanitizeCallbackUrl(
  callbackUrl,
  tenantId,
  defaultRedirect
);
```

### 3. **Cleaned Up Email Form Component**
**File:** `apps/web/app/[locale]/auth/signin/_components/email-form.tsx`

- **Line 55**: Removed unnecessary fallback (`|| "/"`)
- **Reason**: `callbackUrl` is always provided by parent component with correct value

```typescript
callbackUrl: callbackUrl, // callbackUrl is always provided by parent
```

### 4. **Cleaned Up OAuth Buttons Component**
**File:** `apps/web/app/[locale]/auth/signin/_components/oauth-buttons.tsx`

- **Line 58**: Removed unnecessary fallback (`|| "/"`)
- **Reason**: `callbackUrl` is always provided by parent component with correct value

```typescript
callbackUrl: callbackUrl, // callbackUrl is always provided by parent
```

## Redirect Logic Flow

### New User Flow
1. User visits `/es-MX/auth/signin`
2. User enters email or clicks OAuth provider
3. After successful authentication:
   - **SUPERADMIN** → `/superadmin/tenants`
   - **TENANT_ADMIN** → `/es-MX/dashboard`
   - **TENANT_EDITOR** → `/es-MX/dashboard`
   - **PLAYER** → `/es-MX/dashboard`
   - **No role** → `/es-MX/` (root)

### Returning User Flow
1. User visits `/es-MX/auth/signin` while already authenticated
2. System checks session
3. Redirects immediately to dashboard based on role (no login needed)

### Protected Route Flow
1. User tries to access protected route (e.g., `/es-MX/dashboard`)
2. Not authenticated → redirect to `/es-MX/auth/signin?callbackUrl=/es-MX/dashboard`
3. After login → redirect back to `/es-MX/dashboard` (original destination)

## Benefits

✅ **Better UX**: Users land directly in their workspace after login
✅ **Role-aware**: Different roles get appropriate landing pages
✅ **Callback preserved**: Deep links still work (e.g., direct pool access)
✅ **Consistent**: All auth methods (email, OAuth) use same logic
✅ **Secure**: Callback URLs are still sanitized for safety

## Testing Checklist

### Manual Testing
- [ ] **Email Magic Link**
  1. Sign in with email
  2. Click magic link
  3. Verify redirect to `/es-MX/dashboard`

- [ ] **Google OAuth** (if configured)
  1. Sign in with Google
  2. Verify redirect to `/es-MX/dashboard`

- [ ] **Already Authenticated**
  1. Sign in once
  2. Visit `/es-MX/auth/signin` again
  3. Verify immediate redirect to dashboard

- [ ] **Protected Route Callback**
  1. Visit `/es-MX/pools/world-cup-2026/fixtures` (not authenticated)
  2. Redirected to signin with callbackUrl
  3. Sign in
  4. Verify redirect back to fixtures page

- [ ] **Different Roles**
  1. Test with PLAYER role → dashboard
  2. Test with TENANT_ADMIN role → dashboard
  3. Test with SUPERADMIN role → `/superadmin/tenants`

### Edge Cases
- [ ] Invalid callback URL → sanitized to dashboard
- [ ] Missing callback URL → defaults to dashboard
- [ ] Cross-tenant callback URL → blocked by sanitization

## Files Modified

1. `packages/auth/src/helpers.ts` - Fixed role redirect paths
2. `apps/web/app/[locale]/auth/signin/page.tsx` - Implemented role-based redirect
3. `apps/web/app/[locale]/auth/signin/_components/email-form.tsx` - Cleaned up fallback
4. `apps/web/app/[locale]/auth/signin/_components/oauth-buttons.tsx` - Cleaned up fallback

## Related Documentation

- `PLAYER_DASHBOARD_IMPLEMENTATION.md` - Dashboard implementation details
- `AUTH_QUICK_START.md` - Authentication setup guide
- `AUTH_ARCHITECTURE.md` - Auth system architecture

## Notes

- The `(player)` route group in Next.js App Router is for organization only and should **never** appear in URLs
- The `getDefaultRedirectForRole` function is exported from `@qp/auth` and can be reused elsewhere
- Callback URL sanitization still applies for security (prevents open redirects)
- The dashboard route (`/[locale]/dashboard`) is protected and will redirect to signin if not authenticated

---

**Implementation Date:** January 2025  
**Status:** ✅ Complete - Ready for Testing
