# Unified Registration Implementation

## Overview
Unified the user registration flow to capture all user information (name, phone) during the authentication process, eliminating the separate `/register` route to avoid confusion.

## Problem Statement
Previously, the platform had two separate flows:
1. **`/auth/signin`** - Email verification via magic link (no additional data capture)
2. **`/register`** - Separate registration form for name, phone, and other details

This created confusion about when and where users should register, and led to incomplete user profiles.

## Solution
Implemented a **two-step authentication flow**:
1. **Email verification** (`/auth/signin`) - User enters email and receives magic link
2. **Profile completion** (`/auth/complete-profile`) - After email verification, if user has no `name`, they're redirected to complete their profile

## Changes Made

### 1. Created Complete Profile Page
**File:** `apps/web/app/[locale]/auth/complete-profile/page.tsx`

- Server component that checks authentication
- Redirects to signin if not authenticated
- Redirects to dashboard if profile is already complete
- Shows profile completion form if `name` is missing

### 2. Created Complete Profile Form Component
**File:** `apps/web/app/[locale]/auth/complete-profile/_components/complete-profile-form.tsx`

**Fields captured:**
- **Email** (read-only, already verified)
- **Name** (required, 2-100 characters)
- **Phone** (optional, E.164 format: +525512345678)

**Features:**
- Form validation with zod
- Phone format validation (international format)
- tRPC mutation to update user profile
- Toast notifications for success/error
- Redirects to dashboard or callback URL after completion

### 3. Created User Router (tRPC)
**File:** `packages/api/src/routers/user/index.ts`

New router for authenticated user operations:

```typescript
user.getProfile()      // Get current user's profile
user.updateProfile()   // Update name and phone
```

**Key features:**
- Uses `protectedProcedure` (requires authentication)
- Automatically gets `userId` from session (no need to pass it)
- Validates phone uniqueness
- Resets `phoneVerified` if phone changes

### 4. Updated Sign In Flow
**File:** `apps/web/app/[locale]/auth/signin/page.tsx`

Added profile completeness check:

```typescript
if (session?.user) {
  // Check if profile is complete (has name)
  if (!session.user.name) {
    // Redirect to complete-profile
    redirect(`/${locale}/auth/complete-profile?callbackUrl=...`);
  }
  // Otherwise redirect to dashboard
}
```

### 5. Updated Landing Page CTA
**Files:**
- `apps/web/app/components/home-hero.tsx`
- `apps/web/app/[locale]/page.tsx`

Changed main CTA from `/register` to `/auth/signin`:

```tsx
<Link href="/auth/signin">
  {ctaLabel}
</Link>
```

### 6. Updated All References to `/register`

**Updated files:**
- `apps/web/app/[locale]/layout.tsx` - Prerender paths
- `apps/web/app/components/site-header.tsx` - Navigation menu
- `apps/web/app/[locale]/[poolSlug]/components/pool-landing.tsx` - Pool join button
- `apps/web/app/[locale]/pool/[poolSlug]/fixtures/components/fixtures-and-predictions.tsx` - Registration required state
- `apps/web/app/[locale]/example/page.tsx` - Example navigation

All now redirect to `/auth/signin` with appropriate callback URLs.

## User Flow

### New User Registration
1. User clicks "Registrarse" or "Únete" button
2. Redirected to `/es-MX/auth/signin`
3. Enters email address
4. Receives magic link via email
5. Clicks magic link → email verified, user created
6. **Automatically redirected to `/es-MX/auth/complete-profile`**
7. Fills in name (required) and phone (optional)
8. Clicks "Continuar"
9. Profile updated → redirected to dashboard

### Returning User
1. User clicks "Iniciar sesión"
2. Redirected to `/es-MX/auth/signin`
3. Enters email
4. Receives magic link
5. Clicks magic link
6. **If profile complete:** redirected to dashboard
7. **If profile incomplete:** redirected to complete-profile

### Deep Link Flow (e.g., Pool Access)
1. User tries to access `/es-MX/pools/world-cup-2026/fixtures`
2. Not authenticated → redirected to signin with callback
3. Signs in via magic link
4. **If profile incomplete:** complete-profile with callback preserved
5. **If profile complete:** redirected back to fixtures page

## Database Schema
Uses existing `User` model fields:

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?   // ← Captured in complete-profile
  phone         String?   @unique // ← Captured in complete-profile
  phoneVerified Boolean   @default(false)
  // ... other fields
}
```

## Benefits

✅ **Single entry point** - All registration starts at `/auth/signin`
✅ **No confusion** - Clear flow: email → verify → complete profile
✅ **Complete profiles** - Ensures all users have name before accessing platform
✅ **Flexible** - Phone is optional, can be added later
✅ **Callback preservation** - Deep links work correctly
✅ **Better UX** - Progressive disclosure (email first, then details)

## Migration Notes

### Old `/register` Route
The old `/register` route and its components are **deprecated** but not yet deleted:

**Location:** `apps/web/app/[locale]/register/`

**Contains:**
- `page.tsx` - Registration page wrapper
- `components/registration-flow.tsx` - Flow controller
- `components/public-registration-form.tsx` - Public registration
- `components/code-registration-form.tsx` - Code-based registration
- `components/email-invite-registration-form.tsx` - Email invite registration

**⚠️ Action Required:**
These files can be safely deleted once you've verified the new flow works correctly. They are no longer referenced anywhere in the application.

**To delete:**
```powershell
# From apps/web directory
Remove-Item -Recurse -Force "app/[locale]/register"
```

### Pool-Specific Registration
The old registration flow supported pool-specific registration with access codes and email invites. This functionality needs to be re-implemented if required:

**Options:**
1. **Extend complete-profile** - Add pool context and access validation
2. **Separate pool registration** - Create `/pools/[slug]/join` route
3. **Post-auth registration** - Handle pool registration after profile completion

## Testing Checklist

### Manual Testing

- [ ] **New User Flow**
  1. Clear cookies/use incognito
  2. Visit landing page
  3. Click "Registrarse"
  4. Enter email
  5. Check email for magic link
  6. Click magic link
  7. Verify redirected to complete-profile
  8. Fill name and phone
  9. Click "Continuar"
  10. Verify redirected to dashboard

- [ ] **Returning User (Complete Profile)**
  1. Sign out
  2. Sign in again
  3. Verify redirected directly to dashboard (no complete-profile)

- [ ] **Incomplete Profile**
  1. Manually set user's `name` to NULL in database
  2. Sign in
  3. Verify redirected to complete-profile

- [ ] **Deep Link Callback**
  1. Sign out
  2. Visit `/es-MX/pools/world-cup-2026/fixtures`
  3. Redirected to signin
  4. Sign in
  5. Complete profile (if needed)
  6. Verify redirected back to fixtures page

- [ ] **Phone Validation**
  1. Try invalid phone format (e.g., "1234567")
  2. Verify error message
  3. Try valid format (e.g., "+525512345678")
  4. Verify accepted

- [ ] **Phone Uniqueness**
  1. Complete profile with phone
  2. Create another user
  3. Try using same phone
  4. Verify error: "Este número de teléfono ya está registrado"

### Edge Cases

- [ ] User closes complete-profile page → can access it again
- [ ] User manually navigates to `/auth/complete-profile` when already complete → redirected to dashboard
- [ ] User manually navigates to `/auth/signin` when authenticated → redirected to dashboard (or complete-profile if incomplete)
- [ ] Callback URL is preserved through complete-profile flow

## API Endpoints

### tRPC Procedures

**`user.getProfile`** (protected)
- Returns current user's profile
- Includes registration/prediction counts

**`user.updateProfile`** (protected)
- Input: `{ name?, phone? }`
- Updates current user's profile
- Validates phone uniqueness
- Resets `phoneVerified` if phone changes

## i18n Keys

No new translation keys required. Reuses existing keys from `auth` namespace.

**Recommended additions** (optional):
```json
{
  "auth": {
    "completeProfile": {
      "title": "Completa tu perfil",
      "subtitle": "Solo necesitamos algunos datos más para comenzar",
      "nameLabel": "Nombre completo",
      "namePlaceholder": "Juan Pérez",
      "nameDescription": "Así aparecerás en las tablas de posiciones",
      "phoneLabel": "Teléfono (opcional)",
      "phonePlaceholder": "+525512345678",
      "phoneDescription": "Para recibir notificaciones por WhatsApp o SMS",
      "submit": "Continuar",
      "success": "¡Perfil completado exitosamente!"
    }
  }
}
```

## Security Considerations

✅ **Authentication required** - Complete-profile page checks session
✅ **Profile ownership** - User can only update their own profile (via session)
✅ **Phone uniqueness** - Prevents duplicate phone numbers
✅ **Input validation** - Zod schemas on client and server
✅ **CSRF protection** - Next.js default protection
✅ **Rate limiting** - Existing middleware applies

## Future Enhancements

1. **Phone Verification**
   - Send SMS code after phone entry
   - Verify code before setting `phoneVerified = true`
   - Use existing `users.sendPhoneVerification` and `users.verifyPhone` procedures

2. **Profile Picture Upload**
   - Add image upload to complete-profile
   - Store in `User.image` field

3. **Additional Fields**
   - Favorite team
   - Timezone
   - Notification preferences

4. **Pool-Specific Registration**
   - Re-implement access code validation
   - Re-implement email invite validation
   - Integrate with complete-profile flow

5. **Social Auth**
   - Google/Microsoft OAuth already configured
   - May auto-populate `name` from provider
   - Still show complete-profile if `name` is missing

## Related Documentation

- `AUTO_REDIRECT_DASHBOARD_IMPLEMENTATION.md` - Dashboard redirect after auth
- `PLAYER_DASHBOARD_IMPLEMENTATION.md` - Player dashboard features
- `AUTH_QUICK_START.md` - Authentication setup guide
- `PHONE_FEATURE_SUMMARY.md` - Phone field implementation

---

**Implementation Date:** January 2025  
**Status:** ✅ Complete - Ready for Testing  
**Breaking Changes:** `/register` route deprecated (can be deleted)
