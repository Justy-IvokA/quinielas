# Authentication Quick Start Guide

## 🚀 Getting Started

### 1. Environment Setup

Create `.env` files in both apps with the following:

```bash
# Required for Auth.js
AUTH_SECRET="your-32-character-secret-here-generate-with-openssl"
AUTH_URL="http://localhost:3000"  # or your production URL

# Email Magic Link (Required)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@yourapp.com"

# Optional: OAuth Providers
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
MICROSOFT_CLIENT_ID=""
MICROSOFT_CLIENT_SECRET=""

# Optional: Captcha
CAPTCHA_PROVIDER="none"  # or "hcaptcha" or "turnstile"
CAPTCHA_SITE_KEY=""
CAPTCHA_SECRET_KEY=""
```

**Generate AUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 2. Database Setup

The auth tables are already in your Prisma schema. If you haven't migrated yet:

```bash
pnpm db:migrate
pnpm db:seed  # Creates demo tenant and users
```

### 3. Start Development Servers

```bash
# Terminal 1: Web app (player-facing)
pnpm --filter @qp/web dev

# Terminal 2: Admin app
pnpm --filter @qp/admin dev
```

### 4. Test Sign-in

#### Web App
Navigate to: `http://localhost:3000/auth/signin`

#### Admin App
Navigate to: `http://localhost:3001/auth/signin`

**In Development:**
- Email magic links are logged to the console
- Look for: `[next-auth][debug] SIGNIN_EMAIL_SENT`
- Copy the verification URL and paste in browser

## 📧 Email Provider Setup

### Gmail (Development)
1. Enable 2FA on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the app password in `EMAIL_SERVER_PASSWORD`

### Production Options
- **AWS SES**: High deliverability, pay-as-you-go
- **Resend**: Developer-friendly, generous free tier
- **SendGrid**: Popular, good documentation
- **Mailgun**: Reliable, good for transactional emails

## 🔑 OAuth Setup (Optional)

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://yourdomain.com/api/auth/callback/google` (prod)
6. Copy Client ID and Secret to `.env`

### Microsoft OAuth
1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to Azure Active Directory > App registrations
3. Create new registration
4. Add redirect URIs:
   - `http://localhost:3000/api/auth/callback/azure-ad` (dev)
   - `https://yourdomain.com/api/auth/callback/azure-ad` (prod)
5. Create client secret under Certificates & secrets
6. Copy Application (client) ID and secret to `.env`

## 🧪 Testing the Flow

### 1. Email Magic Link (Default)
```
1. Go to /auth/signin
2. Enter email address
3. Click "Enviar enlace de acceso"
4. Check console for magic link (dev) or email inbox (prod)
5. Click link to sign in
6. Redirected based on role:
   - SUPERADMIN → /superadmin/tenants
   - TENANT_ADMIN/EDITOR → /es-MX/dashboard
   - PLAYER → /es-MX/(player)/dashboard
```

### 2. OAuth Sign-in
```
1. Go to /auth/signin
2. Click "Continuar con Google" or "Continuar con Microsoft"
3. Complete OAuth flow
4. Redirected to dashboard
```

### 3. Rate Limiting
```
1. Try signing in 5+ times rapidly
2. Should see rate limit error
3. Wait 60 seconds (default window)
4. Try again
```

### 4. Captcha (when enabled)
```
1. Set CAPTCHA_PROVIDER="hcaptcha" in .env
2. Configure captcha keys
3. Go to /auth/signin
4. Captcha widget should appear
5. Complete captcha before submitting
```

## 🔐 User Roles & Permissions

### Default Roles (from seed)
- **SUPERADMIN**: Full system access
- **TENANT_ADMIN**: Manage tenant pools and settings
- **TENANT_EDITOR**: Edit pools, limited admin access
- **PLAYER**: Join pools, make predictions

### Creating Users

#### Via Seed Script
Edit `packages/db/src/seed.ts` and add users:
```typescript
await prisma.user.create({
  data: {
    email: "admin@example.com",
    name: "Admin User",
    tenantMembers: {
      create: {
        tenantId: tenant.id,
        role: "TENANT_ADMIN",
      },
    },
  },
});
```

#### Via Registration Flow
Users can register through pool access policies:
- PUBLIC: Anyone can register
- CODE: Requires invite code
- EMAIL_INVITE: Requires email invitation

## 🎨 Customizing Branding

### Per-Tenant Theming
Themes are stored in the `Brand.theme` JSON field:

```typescript
await prisma.brand.update({
  where: { id: brandId },
  data: {
    theme: {
      tokens: {
        colors: {
          primary: "221.2 83.2% 53.3%",  // HSL format
          background: "0 0% 100%",
        },
        radius: "0.5rem",
      },
      typography: {
        sans: "Inter, system-ui, sans-serif",
        heading: "Inter, system-ui, sans-serif",
      },
    },
  },
});
```

The signin page automatically applies tenant branding via server-side CSS injection.

## 🐛 Troubleshooting

### "Email not sent"
- Check EMAIL_SERVER_* credentials
- Verify SMTP port (587 for TLS, 465 for SSL)
- Check console for detailed error logs
- Test SMTP credentials with a tool like `telnet`

### "OAuth error"
- Verify redirect URIs match exactly (including protocol)
- Check OAuth credentials are correct
- Ensure OAuth app is enabled/published
- Check browser console for detailed errors

### "Rate limit exceeded"
- Wait for rate limit window to expire (default: 60 seconds)
- Clear rate limit manually: restart dev server (in-memory store)
- For production: implement Redis-based rate limiting

### "Callback URL invalid"
- Check that callback URL domain matches tenant's allowed domains
- In development, localhost is always allowed
- Verify Brand.domains array includes the target domain

### "Session not found"
- Clear browser cookies
- Check AUTH_SECRET is set correctly
- Verify database connection
- Check that user exists in database

## 📝 Common Tasks

### Sign Out a User
```typescript
"use client";
import { signOut } from "next-auth/react";

<Button onClick={() => signOut({ callbackUrl: "/" })}>
  Sign Out
</Button>
```

### Get Current Session (Server)
```typescript
import { authConfig } from "@qp/api/context";
import { getServerAuthSession } from "@qp/auth";

const session = await getServerAuthSession(authConfig);
if (session) {
  console.log(session.user.email);
  console.log(session.user.highestRole);
}
```

### Get Current Session (Client)
```typescript
"use client";
import { useSession } from "next-auth/react";

export function MyComponent() {
  const { data: session, status } = useSession();
  
  if (status === "loading") return <div>Loading...</div>;
  if (!session) return <div>Not signed in</div>;
  
  return <div>Welcome, {session.user.email}</div>;
}
```

### Protect a Page
```typescript
import { authConfig } from "@qp/api/context";
import { requireRole } from "@qp/auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  try {
    await requireRole(authConfig, ["TENANT_ADMIN", "SUPERADMIN"]);
  } catch {
    redirect("/auth/signin");
  }
  
  return <div>Admin content</div>;
}
```

### Check User Role
```typescript
import { getTenantRole } from "@qp/auth";

const role = getTenantRole(session, tenantId);

if (role === "TENANT_ADMIN") {
  // Show admin features
}
```

## 🚀 Production Deployment

### Checklist
- [ ] Generate strong AUTH_SECRET (32+ characters)
- [ ] Set production AUTH_URL
- [ ] Configure production email provider
- [ ] Set up OAuth apps with production redirect URIs
- [ ] Enable captcha (hCaptcha or Turnstile)
- [ ] Replace in-memory rate limiter with Redis
- [ ] Configure allowed domains per tenant
- [ ] Test email deliverability
- [ ] Set up monitoring for auth failures
- [ ] Review audit logs regularly
- [ ] Enable HTTPS (required for OAuth)
- [ ] Set secure cookie flags (handled by NextAuth)

### Environment Variables (Production)
```bash
AUTH_SECRET="<strong-secret-here>"
AUTH_URL="https://yourdomain.com"
EMAIL_SERVER_HOST="smtp.sendgrid.net"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="apikey"
EMAIL_SERVER_PASSWORD="<sendgrid-api-key>"
EMAIL_FROM="noreply@yourdomain.com"
GOOGLE_CLIENT_ID="<production-client-id>"
GOOGLE_CLIENT_SECRET="<production-secret>"
CAPTCHA_PROVIDER="hcaptcha"
CAPTCHA_SITE_KEY="<site-key>"
CAPTCHA_SECRET_KEY="<secret-key>"
```

## 📚 Next Steps

1. **Customize Email Templates**: Create branded email templates for magic links
2. **Add 2FA/MFA**: Implement two-factor authentication for admin users
3. **Consent Gate**: Integrate policy acceptance flow post-login
4. **Password Auth**: Add password-based authentication if needed
5. **Social Logins**: Add more OAuth providers (GitHub, LinkedIn, etc.)
6. **Session Management**: Add "Active Sessions" page to view/revoke sessions
7. **Audit Dashboard**: Create UI to view auth audit logs

## 🆘 Support

- Review [AUTH_MODULE_IMPLEMENTATION.md](./AUTH_MODULE_IMPLEMENTATION.md) for detailed architecture
- Check [.windsurfrules](./.windsurfrules) for project conventions
- Auth.js Docs: https://authjs.dev/
- Prisma Docs: https://www.prisma.io/docs
