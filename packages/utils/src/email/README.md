# 📧 Email Templates Package

Modern, branded email templates with i18n support for the Quinielas platform.

## Features

- 🎨 **Brand-aware**: Uses tenant's colors, logo, and branding
- 🌐 **i18n**: Spanish (es-MX) and English (en-US) support
- 📱 **Responsive**: Mobile-first design
- ✉️ **Compatible**: Works with all email clients (Gmail, Outlook, Apple Mail, etc.)
- 🎯 **Type-safe**: Full TypeScript support

## Available Templates

1. **Invitation Email**: Pool invitation with expiration date
2. **Invite Code Email**: Access code for pool registration
3. **Magic Link Email**: Authentication link (sign-in)

## Quick Start

```typescript
import { 
  emailTemplates, 
  createEmailBrandInfo, 
  parseEmailLocale 
} from "@qp/utils/email";

// Create brand info
const brandInfo = createEmailBrandInfo({
  name: "Coca-Cola",
  logoUrl: "https://cdn.example.com/logos/coca-cola.png",
  colors: {
    primary: "#FF0000",
    primaryForeground: "#FFFFFF",
    background: "#FFFFFF",
    foreground: "#000000",
    muted: "#F5F5F5",
    border: "#E0E0E0",
  }
});

// Create email
const email = emailTemplates.invitation({
  brand: brandInfo,
  locale: "es-MX",
  poolName: "Mundial FIFA 2026",
  inviteUrl: "https://cocacola.quinielas.mx/pools/mundial-2026/join?token=abc",
  expiresAt: new Date("2026-06-01")
});

// Send email
await emailAdapter.send({
  to: "user@example.com",
  subject: email.subject,
  html: email.html,
  text: email.text
});
```

## Files

- `types.ts` - TypeScript types and interfaces
- `translations.ts` - i18n translations (es-MX, en-US)
- `templates.ts` - HTML email templates
- `branding-helpers.ts` - Utility functions
- `adapter.ts` - Email adapter interface
- `smtp.ts` - SMTP implementation
- `mock.ts` - Mock adapter for testing
- `index.ts` - Public exports

## Documentation

See the root-level documentation:
- `EMAIL_TEMPLATES_REFACTOR.md` - Complete documentation
- `EMAIL_TEMPLATES_SUMMARY.md` - Quick reference

## Preview Templates

Generate HTML previews:

```bash
pnpm tsx scripts/preview-email-templates.ts
```

Open `email-previews/index.html` in your browser.

## Adding a New Language

1. Edit `translations.ts`
2. Add locale type: `export type EmailLocale = "es-MX" | "en-US" | "pt-BR";`
3. Create translations object
4. Add to translations map

## Design Principles

- **Mobile-first**: Optimized for small screens
- **Accessible**: High contrast, readable fonts
- **Brand-consistent**: Uses tenant's visual identity
- **Minimal**: Clean, focused design
- **Professional**: Corporate-grade quality

## Browser Support

- ✅ Gmail (Web, iOS, Android)
- ✅ Outlook (Web, Desktop, Mobile)
- ✅ Apple Mail (macOS, iOS)
- ✅ Yahoo Mail
- ✅ ProtonMail
- ✅ Thunderbird

## License

Private - Quinielas WL Platform
