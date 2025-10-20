# Registration Flows Implementation

## Overview

This document describes the implementation of the three registration flows for the Quinielas WL platform based on access policy types: **PUBLIC**, **CODE**, and **EMAIL_INVITE**.

## Architecture

### Flow Detection

The registration system automatically detects the access policy type from the pool configuration and renders the appropriate form:

1. **Entry Point**: `/[locale]/auth/register/[poolSlug]`
2. **Policy Detection**: Server-side query of `Pool.accessPolicy.accessType`
3. **Form Routing**: Conditional rendering based on access type

### Components Structure

```
apps/web/app/[locale]/auth/
├── register/
│   └── [poolSlug]/
│       ├── page.tsx                                    # Main registration page (server)
│       └── _components/
│           ├── public-registration-form.tsx            # PUBLIC access form
│           ├── code-registration-form.tsx              # CODE access form
│           └── email-invite-registration-form.tsx      # EMAIL_INVITE access form
└── signin/
    └── _components/
        ├── captcha-widget.tsx                          # CAPTCHA component
        └── registration-success-modal.tsx              # Success modal
```

## Registration Flows

### 1. Public Registration (PUBLIC)

**URL**: `/auth/register/[poolSlug]`

**Features**:
- Display name, email, phone (optional)
- Terms & conditions checkbox
- CAPTCHA widget (conditional)
- Registration window validation
- User capacity tracking
- Countdown timer if not started

**Validations**:
- Registration window (start/end dates)
- Maximum registrations cap
- CAPTCHA verification (if enabled)
- Terms acceptance required

**Backend Mutation**: `trpc.registration.registerPublic`

### 2. Code Registration (CODE)

**URL**: `/auth/register/[poolSlug]?code=XXXXXXXX` (optional prefill)

**Features**:
- Two-step process:
  1. Validate invite code
  2. Complete registration form
- Code format: 8 characters (A-Z, 0-9)
- Real-time code validation
- Shows remaining uses after validation
- Display name, email, phone (optional)
- Terms & conditions checkbox

**Validations**:
- Code format (8 chars, uppercase alphanumeric)
- Code existence and validity
- Code expiration check
- Code usage limit check
- Terms acceptance required

**Backend Mutations**:
- `trpc.registration.validateInviteCode` (validation)
- `trpc.registration.registerWithCode` (registration)

### 3. Email Invite Registration (EMAIL_INVITE)

**URL**: `/auth/register/[poolSlug]?token=<64-char-hex>`

**Features**:
- Token validation on mount
- Email auto-filled from invitation (read-only)
- Display name, phone (optional)
- Terms & conditions checkbox
- Expired token handling with resend option

**Validations**:
- Token format (64 chars, hexadecimal)
- Token validity and expiration
- Email match with invitation
- Terms acceptance required

**Backend Mutations**:
- `trpc.registration.validateInviteToken` (validation)
- `trpc.registration.registerWithEmailInvite` (registration)

## CAPTCHA Integration

### Supported Providers

1. **hCaptcha** (default)
2. **Cloudflare Turnstile**

### Component: `CaptchaWidget`

**Props**:
```typescript
{
  provider: "hcaptcha" | "turnstile"
  siteKey: string
  onVerify: (token: string) => void
  onError?: (error: Error) => void
  onExpire?: () => void
  theme?: "light" | "dark"
  size?: "normal" | "compact"
}
```

**Features**:
- Dynamic script loading
- Auto-cleanup on unmount
- Error handling
- Loading states
- Theme support

### Configuration

Set environment variables:
```env
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=your_site_key
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key
```

### When CAPTCHA is Required

CAPTCHA appears based on `settings.antiAbuse.captchaLevel`:
- `force`: Always required
- `auto`: Required when anomaly detected
- `off`: Never required

## Registration Success Flow

After successful registration:

1. **Success Modal** displays:
   - Confirmation message
   - Pool name
   - Next steps guidance
   - CTA to dashboard
   - Social share buttons (WhatsApp, Twitter)

2. **Redirect** to `/pool/[poolSlug]/predict`

## Access Control

### Pre-Registration Checks

1. **Authentication**: User must be logged in
   - If not → redirect to `/auth/signin?callbackUrl=/auth/register/[poolSlug]`

2. **Already Registered**: Check existing registration
   - If registered → redirect to `/pool/[poolSlug]/predict`

3. **Pool Status**: Pool must be active
   - If inactive → show error message

4. **Registration Window**: Check dates
   - Before start → show countdown
   - After end → show error message

5. **Capacity**: Check user limit
   - If full → show error message

### Post-Registration

- Registration record created with `tenantId`, `poolId`, `userId`
- Audit log entry created
- For CODE: Invite code usage incremented
- For EMAIL_INVITE: Invitation marked as accepted

## Form Validation

All forms use:
- **react-hook-form** for form state
- **Zod** for schema validation
- **@hookform/resolvers/zod** for integration

### Common Schemas

```typescript
// Display Name
z.string().min(2).max(50)

// Email
z.string().email()

// Phone (optional, E.164 format)
z.string().regex(/^\+[1-9]\d{1,14}$/).optional()

// Invite Code
z.string().length(8).regex(/^[A-Z0-9]+$/)

// Invite Token
z.string().length(64).regex(/^[a-f0-9]+$/)

// Terms Acceptance
z.boolean().refine((val) => val === true)
```

## i18n Messages

All user-facing text is internationalized using `next-intl`.

**Namespace**: `auth.registration`

**Key Sections**:
- `fields.*` - Form field labels and placeholders
- `errors.*` - Error messages
- `success.*` - Success modal content
- `window.*` - Registration window messages
- `code.*` - Code-specific messages
- `invite.*` - Email invite-specific messages

**Namespace**: `auth.captcha`
- `loading` - Loading state
- `loadError` - Script load error
- `initError` - Initialization error

## Backend Integration

### tRPC Routers

**Registration Router** (`packages/api/src/routers/registration/index.ts`):

```typescript
// Queries
- checkRegistration(userId, poolId)
- checkByPoolSlug(poolSlug)
- validateInviteCode(poolId, code)
- validateInviteToken(poolId, token)

// Mutations
- registerPublic(poolId, userId, displayName, email, phone?, captchaToken?)
- registerWithCode(poolId, userId, inviteCode, displayName, email, phone?)
- registerWithEmailInvite(poolId, userId, inviteToken, email, displayName, phone?)
```

### Services

**RegistrationService** (`packages/api/src/services/registration.service.ts`):
- Handles business logic
- Validates access policies
- Creates registration records
- Updates invite code/invitation status
- Creates audit logs

**AccessService** (`packages/api/src/services/access.service.ts`):
- Manages access policies
- CRUD operations for policies

## Testing Checklist

### Public Registration
- [ ] Form renders with all fields
- [ ] CAPTCHA appears when required
- [ ] Registration window validation works
- [ ] Capacity limit enforced
- [ ] Terms checkbox required
- [ ] Success modal appears
- [ ] Redirect to dashboard works
- [ ] Already registered check works

### Code Registration
- [ ] Code validation works
- [ ] Invalid code shows error
- [ ] Expired code shows error
- [ ] Maxed out code shows error
- [ ] Form appears after validation
- [ ] Prefilled code works
- [ ] Success modal appears
- [ ] Code usage incremented

### Email Invite Registration
- [ ] Token validation on mount
- [ ] Email auto-filled and locked
- [ ] Invalid token shows error
- [ ] Expired token shows error with resend
- [ ] Form submission works
- [ ] Invitation marked as accepted
- [ ] Success modal appears

### CAPTCHA
- [ ] hCaptcha loads and renders
- [ ] Turnstile loads and renders
- [ ] Token passed to mutation
- [ ] Error handling works
- [ ] Expiration handled

## Environment Variables

```env
# CAPTCHA (choose one or both)
NEXT_PUBLIC_HCAPTCHA_SITE_KEY=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=

# Backend validates with secret keys
HCAPTCHA_SECRET_KEY=
TURNSTILE_SECRET_KEY=
```

## Known Limitations

1. **CAPTCHA Validation**: Backend TODO - actual token verification not implemented
2. **Resend Invitation**: Frontend placeholder - backend endpoint needed
3. **Rate Limiting**: Placeholder implementation - needs Redis or similar
4. **Phone Verification**: Not implemented in MVP

## Future Enhancements

1. **Email Verification Flow**: Send verification email after registration
2. **Phone Verification**: SMS/WhatsApp verification
3. **Social Registration**: OAuth-based registration
4. **Multi-step Forms**: Break long forms into steps
5. **Progressive Disclosure**: Show fields conditionally
6. **Real-time Availability**: WebSocket updates for capacity
7. **QR Code Registration**: Generate QR codes for invite codes

## Related Documentation

- `AUTH_MODULE_IMPLEMENTATION.md` - Authentication system
- `ANTI_ABUSE_INTEGRATION.md` - Anti-abuse measures
- `INVITATIONS_CODES_IMPLEMENTATION.md` - Invitation system
- `.windsurfrules` - Project conventions

## Migration Notes

If updating from old registration system:

1. Update pool landing links to use new `/auth/register/[poolSlug]` route
2. Ensure `AccessPolicy` records exist for all pools
3. Migrate any existing invite codes to new format (8 chars uppercase)
4. Update email templates to use new token-based URLs
5. Configure CAPTCHA provider and keys

## Support

For issues or questions:
1. Check backend logs for tRPC errors
2. Verify access policy configuration
3. Test with different access types
4. Check browser console for client errors
5. Validate environment variables are set
