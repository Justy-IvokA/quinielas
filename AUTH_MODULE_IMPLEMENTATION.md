# Authentication Module Implementation Summary

## Overview
Implemented a complete authentication module for both `apps/web` and `apps/admin` using Auth.js v5.0.0-beta.4 with tenant-aware branding, RBAC, anti-abuse features, and audit logging.

## ✅ Completed Features

### 1. Auth Infrastructure (`packages/auth`)
- **Config**: `createAuthConfig()` with PrismaAdapter, JWT sessions, and role-based callbacks
- **Providers**: 
  - Email magic link (default)
  - Google OAuth (optional, env-based)
  - Microsoft OAuth (optional, env-based)
- **Helpers**: 
  - `getServerAuthSession()`, `requireSession()`, `requireRole()`
  - `getDefaultRedirectForRole()` - RBAC-based redirects
  - `isSuperAdmin()`, `getTenantRole()`
- **Types**: Extended NextAuth session with `highestRole` and `tenantRoles`

### 2. Sign-in Pages

#### Web App (`apps/web/app/auth/signin`)
- **Main page**: `/auth/signin/page.tsx`
  - Server-side tenant resolution and branding injection
  - Captcha level detection from settings
  - Safe callback URL validation
- **Components**:
  - `EmailForm`: Email magic link with validation and toast feedback
  - `OAuthButtons`: Dynamic OAuth buttons based on env config
- **Supporting pages**:
  - `/auth/verify-request` - Email sent confirmation
  - `/auth/error` - Auth error display

#### Admin App (`apps/admin/app/auth/signin`)
- **Main page**: `/auth/signin/page.tsx`
  - Admin-specific branding (Shield icon)
  - Role-based default redirects
  - Same component structure as web
- **Components**: Same as web (EmailForm, OAuthButtons)
- **Supporting pages**: verify-request, error

### 3. Security & Anti-Abuse

#### Callback URL Validation (`_lib/callback-safe.ts`)
- Validates callback URLs against tenant's allowed domains
- Allows localhost in development
- Prevents open redirect vulnerabilities

#### Rate Limiting (`_lib/rate-limit.ts`)
- In-memory rate limiter (production: use Redis)
- Configurable window and max attempts
- Anomaly detection for adaptive captcha
- Auto-cleanup of expired entries

#### Captcha Support (`_lib/captcha.ts`)
- Adapter for hCaptcha and Cloudflare Turnstile
- Stub implementation (ready for production integration)
- Respects settings: force/auto/off

### 4. Audit Logging (`packages/api/src/lib/auth-audit.ts`)
- Auth event types: `AUTH_SIGNIN_SUCCESS`, `AUTH_SIGNIN_FAIL`, `AUTH_SIGNIN_EMAIL_SENT`, `AUTH_SIGNOUT`
- Privacy-aware: respects `ipLogging` settings
- Integrated into Auth.js `signIn` event
- Helper functions: `logSignInSuccess()`, `logSignInFail()`, `logEmailSent()`

### 5. i18n Messages

#### Web (`apps/web/messages/es-MX.json`)
```json
"auth": {
  "signin": {
    "title": "Iniciar sesión",
    "emailLabel": "Correo electrónico",
    "sendLink": "Enviar enlace de acceso",
    "emailSent": "Te enviamos un enlace de acceso a {email}",
    "googleSignin": "Continuar con Google",
    "legal": "Al continuar, aceptas nuestros {terms} y {privacy}"
  },
  "errors": {
    "emailRequired": "El correo electrónico es requerido",
    "rateLimitExceeded": "Demasiados intentos...",
    "captchaRequired": "Por favor completa el captcha"
  }
}
```

#### Admin (`apps/admin/messages/es-MX.json`)
- Same structure with admin-specific copy ("Acceso Administrativo")

### 6. Branding & Theming
- Server-side theme injection via `applyBrandTheme()`
- CSS variables for light/dark mode
- Tenant-specific colors, typography, and logos
- Responsive design (mobile-first)

### 7. RBAC & Redirects
- **Role hierarchy**: SUPERADMIN > TENANT_ADMIN > TENANT_EDITOR > PLAYER
- **Default redirects**:
  - SUPERADMIN → `/superadmin/tenants`
  - TENANT_ADMIN/EDITOR → `/{locale}/dashboard`
  - PLAYER → `/{locale}/(player)/dashboard`
- Callback URL takes precedence over defaults

### 8. Accessibility
- Semantic HTML with proper ARIA attributes
- `aria-required`, `aria-invalid`, `aria-busy` on form elements
- Focus management (autoFocus on email input)
- Screen reader announcements for errors (role="alert", aria-live="polite")
- Keyboard navigation support

## 🔧 Configuration

### Environment Variables (`.env`)
```bash
# Auth.js
AUTH_SECRET=<32+ char secret>
AUTH_URL=http://localhost:3000

# Email Provider (required for magic links)
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=user@example.com
EMAIL_SERVER_PASSWORD=password
EMAIL_FROM=noreply@example.com

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=

# Captcha (optional)
CAPTCHA_PROVIDER=hcaptcha|turnstile|none
CAPTCHA_SITE_KEY=
CAPTCHA_SECRET_KEY=
```

### NextAuth Routes
Both apps have route handlers at:
- `app/api/auth/[...nextauth]/route.ts`

## 📁 File Structure

```
packages/auth/
├── src/
│   ├── config.ts          # Auth.js config with providers & callbacks
│   ├── helpers.ts         # Session helpers & RBAC utilities
│   ├── types.ts           # Extended NextAuth types
│   ├── env.ts             # Environment validation
│   └── index.ts           # Public exports

packages/api/
└── src/lib/
    └── auth-audit.ts      # Auth event logging

apps/web/
└── app/auth/
    ├── signin/
    │   ├── page.tsx                    # Main signin page
    │   ├── _components/
    │   │   ├── email-form.tsx          # Email magic link form
    │   │   └── oauth-buttons.tsx       # OAuth provider buttons
    │   └── _lib/
    │       ├── callback-safe.ts        # URL validation
    │       ├── rate-limit.ts           # Rate limiting
    │       └── captcha.ts              # Captcha adapter
    ├── verify-request/
    │   └── page.tsx                    # Email sent confirmation
    └── error/
        └── page.tsx                    # Error display

apps/admin/
└── app/auth/
    └── [same structure as web]
```

## 🧪 Testing Checklist

### Manual Testing
- [ ] Email magic link flow (dev: check console for link)
- [ ] OAuth sign-in (Google/Microsoft if configured)
- [ ] Rate limiting (multiple failed attempts)
- [ ] Captcha display (when settings = "force")
- [ ] Callback URL validation (safe/unsafe URLs)
- [ ] Role-based redirects (different user roles)
- [ ] Tenant branding (different tenants/brands)
- [ ] Dark mode toggle
- [ ] Mobile responsive layout
- [ ] Accessibility (keyboard nav, screen reader)

### Automated Testing (TODO)
```typescript
// Example test structure
describe("Email Sign-in", () => {
  it("validates email format", () => {});
  it("shows rate limit error after N attempts", () => {});
  it("requires captcha when settings = force", () => {});
  it("redirects to safe callback URL", () => {});
  it("blocks unsafe callback URLs", () => {});
});
```

## 🔐 Security Considerations

1. **Open Redirect Prevention**: All callback URLs validated against tenant domains
2. **Rate Limiting**: Prevents brute force attacks (in-memory, upgrade to Redis for production)
3. **Captcha**: Adaptive based on anomaly detection or forced via settings
4. **Audit Logging**: All auth events logged with IP/user-agent (respects privacy settings)
5. **CSRF Protection**: Built into NextAuth and App Router
6. **No Email Enumeration**: Generic messages ("If your email is valid, you'll receive a link")
7. **Session Security**: JWT with 30-day expiry, httpOnly cookies

## 🚀 Deployment Notes

### Production Checklist
- [ ] Set strong `AUTH_SECRET` (32+ characters)
- [ ] Configure production email provider (SMTP/SES/Resend)
- [ ] Set up OAuth apps (Google/Microsoft) with production redirect URIs
- [ ] Enable captcha provider (hCaptcha/Turnstile)
- [ ] Replace in-memory rate limiter with Redis
- [ ] Configure allowed domains per tenant/brand
- [ ] Test email deliverability (check spam folders)
- [ ] Set up monitoring for auth failures
- [ ] Review audit logs regularly

### Localhost Development
Auth.js works with `localhost:3000` and `localhost:3001` (admin) by default. The callback URL validator allows localhost in development mode.

## 📝 Usage Examples

### Protecting a Page (Server Component)
```typescript
import { authConfig } from "@qp/api/context";
import { requireSession } from "@qp/auth";

export default async function ProtectedPage() {
  const session = await requireSession(authConfig);
  return <div>Welcome, {session.user.email}</div>;
}
```

### Protecting a Page (Client Component)
```typescript
"use client";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function ProtectedPage() {
  const { data: session, status } = useSession();
  
  if (status === "loading") return <div>Loading...</div>;
  if (!session) redirect("/auth/signin");
  
  return <div>Welcome, {session.user.email}</div>;
}
```

### Sign Out
```typescript
"use client";
import { signOut } from "next-auth/react";

<Button onClick={() => signOut({ callbackUrl: "/" })}>
  Sign Out
</Button>
```

### Check Role
```typescript
import { isSuperAdmin, getTenantRole } from "@qp/auth";

const session = await getServerAuthSession(authConfig);
if (isSuperAdmin(session)) {
  // Admin-only logic
}

const role = getTenantRole(session, tenantId);
if (role === "TENANT_ADMIN") {
  // Tenant admin logic
}
```

## 🐛 Known Issues / TODs

1. **Rate Limiter**: In-memory implementation. Replace with Redis for multi-instance deployments.
2. **Captcha**: Stub implementation. Integrate with actual provider (hCaptcha/Turnstile).
3. **Consent Gate**: Not yet integrated into post-login flow (see `packages/api/src/routers/consent`).
4. **Email Templates**: Using default NextAuth templates. Customize with brand theming.
5. **Password Auth**: Not implemented (magic link only). Add if needed per requirements.
6. **2FA/MFA**: Not implemented. Consider for admin users.

## 📚 References

- [Auth.js v5 Docs](https://authjs.dev/)
- [NextAuth Migration Guide](https://authjs.dev/getting-started/migrating-to-v5)
- [Prisma Adapter](https://authjs.dev/reference/adapter/prisma)
- [.windsurfrules](/.windsurfrules) - Project conventions
