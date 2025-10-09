# Internationalization (i18n) Implementation Guide

## Overview

This document describes the internationalization implementation for the Quinielas WL platform using `next-intl`, following the requirements specified in `.windsurfrules`.

## Configuration

### Supported Locales

- **Default Locale**: `es-MX` (Spanish - Mexico)
- **Secondary Locale**: `en-US` (English - United States)

### Key Features

- ✅ Locale-based routing (`/es-MX/*`, `/en-US/*`)
- ✅ Automatic locale detection from URL, cookies, or Accept-Language header
- ✅ Type-safe translations with TypeScript
- ✅ Dynamic locale switching without page reload
- ✅ Separate locale files (no hardcoded strings)
- ✅ SEO-friendly with proper metadata per locale

## Project Structure

```
apps/web/
├── app/
│   ├── [locale]/              # Locale-specific routes
│   │   ├── layout.tsx         # Locale layout with NextIntlClientProvider
│   │   ├── page.tsx           # Home page with translations
│   │   └── ...                # Other locale-specific pages
│   ├── components/
│   │   ├── locale-switcher.tsx  # Language switcher component
│   │   ├── site-header.tsx      # Header with i18n navigation
│   │   └── ...
│   ├── layout.tsx             # Root layout (minimal)
│   └── page.tsx               # Root redirect to default locale
├── messages/
│   ├── es-MX.json             # Spanish translations
│   └── en-US.json             # English translations
├── src/
│   ├── i18n/
│   │   ├── config.ts          # Locale configuration
│   │   ├── request.ts         # Request configuration for next-intl
│   │   ├── navigation.ts      # Type-safe navigation helpers
│   │   └── index.ts           # Barrel export
│   └── middleware.ts          # Locale detection middleware
└── next.config.js             # Next.js config with next-intl plugin
```

## Usage Examples

### 1. Using Translations in Server Components

```tsx
import { useTranslations } from "next-intl";

export default function MyPage() {
  const t = useTranslations("home");

  return (
    <div>
      <h1>{t("hero.title", { brandName: "Quinielas WL" })}</h1>
      <p>{t("hero.subtitle")}</p>
    </div>
  );
}
```

### 2. Using Translations in Client Components

```tsx
"use client";

import { useTranslations } from "next-intl";

export function MyComponent() {
  const t = useTranslations("common");

  return (
    <button>{t("submit")}</button>
  );
}
```

### 3. Using Locale-Aware Navigation

Replace `next/link` imports with the i18n-aware `Link`:

```tsx
// ❌ Don't use this
import Link from "next/link";

// ✅ Use this instead
import { Link } from "@/i18n/navigation";

export function Navigation() {
  return (
    <nav>
      {/* Automatically adds locale prefix: /es-MX/register */}
      <Link href="/register">Register</Link>
      <Link href="/pools">Pools</Link>
    </nav>
  );
}
```

### 4. Programmatic Navigation

```tsx
"use client";

import { useRouter } from "@/i18n/navigation";

export function MyComponent() {
  const router = useRouter();

  const handleClick = () => {
    // Automatically includes locale prefix
    router.push("/dashboard");
  };

  return <button onClick={handleClick}>Go to Dashboard</button>;
}
```

### 5. Getting Current Pathname

```tsx
"use client";

import { usePathname } from "@/i18n/navigation";

export function MyComponent() {
  // Returns pathname without locale prefix
  // e.g., "/register" instead of "/es-MX/register"
  const pathname = usePathname();

  return <div>Current path: {pathname}</div>;
}
```

### 6. Server-Side Redirects

```tsx
import { redirect } from "@/i18n/navigation";

export default function MyPage() {
  const user = await getUser();

  if (!user) {
    // Automatically includes locale prefix
    redirect("/login");
  }

  return <div>Welcome {user.name}</div>;
}
```

### 7. Accessing Current Locale

```tsx
"use client";

import { useLocale } from "next-intl";

export function MyComponent() {
  const locale = useLocale(); // "es-MX" or "en-US"

  return <div>Current locale: {locale}</div>;
}
```

### 8. Generating Metadata with Translations

```tsx
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: t("title.default", { appName: "Quinielas WL" }),
    description: t("description"),
  };
}
```

## Translation File Structure

### Example: `messages/es-MX.json`

```json
{
  "common": {
    "loading": "Cargando...",
    "submit": "Enviar",
    "cancel": "Cancelar"
  },
  "nav": {
    "home": "Inicio",
    "register": "Registrarse",
    "pools": "Quinielas"
  },
  "home": {
    "hero": {
      "title": "Bienvenido a {brandName}",
      "subtitle": "La plataforma de quinielas deportivas más completa"
    }
  }
}
```

### Accessing Nested Translations

```tsx
// Access nested keys with dot notation
const t = useTranslations("home.hero");
const title = t("title", { brandName: "Quinielas WL" });

// Or use the full path
const tHome = useTranslations("home");
const subtitle = tHome("hero.subtitle");
```

## Locale Switcher Component

A pre-built locale switcher is available at `app/components/locale-switcher.tsx`:

```tsx
import { LocaleSwitcher } from "@/app/components/locale-switcher";

export function Header() {
  return (
    <header>
      <nav>{/* ... */}</nav>
      <LocaleSwitcher />
    </header>
  );
}
```

## Adding New Translations

### Step 1: Add to Locale Files

Add the new keys to both `es-MX.json` and `en-US.json`:

```json
// messages/es-MX.json
{
  "myFeature": {
    "title": "Mi Nueva Característica",
    "description": "Descripción de la característica"
  }
}

// messages/en-US.json
{
  "myFeature": {
    "title": "My New Feature",
    "description": "Feature description"
  }
}
```

### Step 2: Use in Components

```tsx
const t = useTranslations("myFeature");
return <h1>{t("title")}</h1>;
```

## Adding a New Locale

### Step 1: Update Configuration

Edit `src/i18n/config.ts`:

```ts
export const locales = ["es-MX", "en-US", "fr-FR"] as const;

export const localeMetadata: Record<Locale, { name: string; flag: string }> = {
  "es-MX": { name: "Español (México)", flag: "🇲🇽" },
  "en-US": { name: "English (US)", flag: "🇺🇸" },
  "fr-FR": { name: "Français", flag: "🇫🇷" },
};
```

### Step 2: Create Translation File

Create `messages/fr-FR.json` with all required translations.

### Step 3: Test

The new locale will automatically be available in the locale switcher and routing.

## Best Practices

### 1. Never Hardcode Strings

❌ **Bad:**
```tsx
<button>Submit</button>
```

✅ **Good:**
```tsx
const t = useTranslations("common");
<button>{t("submit")}</button>
```

### 2. Use Namespaces

Organize translations by feature or page:

```tsx
// Use specific namespaces
const tNav = useTranslations("nav");
const tHome = useTranslations("home");
const tCommon = useTranslations("common");
```

### 3. Use Interpolation for Dynamic Content

```json
{
  "welcome": "Welcome, {name}!",
  "itemCount": "You have {count} items"
}
```

```tsx
t("welcome", { name: user.name });
t("itemCount", { count: items.length });
```

### 4. Keep Keys Descriptive

❌ **Bad:**
```json
{ "btn1": "Submit", "txt2": "Loading" }
```

✅ **Good:**
```json
{ "submitButton": "Submit", "loadingMessage": "Loading" }
```

### 5. Use Consistent Structure

Keep the same structure across all locale files:

```json
// Both es-MX.json and en-US.json should have identical structure
{
  "common": { "submit": "..." },
  "nav": { "home": "..." },
  "home": { "hero": { "title": "..." } }
}
```

## Routing Behavior

### URL Structure

- Root path `/` → Redirects to `/es-MX` (default locale)
- `/es-MX/*` → Spanish version
- `/en-US/*` → English version

### Locale Detection Priority

1. **URL path** (highest priority): `/es-MX/register`
2. **Cookie**: `NEXT_LOCALE` cookie
3. **Accept-Language header**: Browser preference
4. **Default locale**: `es-MX` (fallback)

### Locale Persistence

The middleware automatically sets a cookie (`NEXT_LOCALE`) to remember the user's locale preference across sessions.

## TypeScript Support

All translation keys are type-safe. TypeScript will warn you if:
- You use a non-existent translation key
- You forget to provide required interpolation variables
- You use an invalid locale

## SEO Considerations

### Metadata per Locale

Each locale has its own metadata (title, description, Open Graph tags):

```tsx
// Automatically generated per locale in [locale]/layout.tsx
export async function generateMetadata({ params: { locale } }) {
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("title.default"),
    description: t("description"),
    openGraph: {
      locale: locale === "es-MX" ? "es_MX" : "en_US",
    },
  };
}
```

### Language Alternates

Consider adding `<link rel="alternate" hreflang="..." />` tags for better SEO:

```tsx
// In [locale]/layout.tsx
<head>
  <link rel="alternate" hreflang="es-MX" href="https://example.com/es-MX" />
  <link rel="alternate" hreflang="en-US" href="https://example.com/en-US" />
  <link rel="alternate" hreflang="x-default" href="https://example.com/es-MX" />
</head>
```

## Testing

### Manual Testing

1. Visit `http://localhost:3000` → Should redirect to `/es-MX`
2. Click locale switcher → Should switch to `/en-US` and update all text
3. Navigate to different pages → Locale should persist
4. Refresh page → Locale should remain the same (via cookie)

### Automated Testing

```tsx
// Example test with Vitest
import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/es-MX.json";

test("renders translated text", () => {
  render(
    <NextIntlClientProvider locale="es-MX" messages={messages}>
      <MyComponent />
    </NextIntlClientProvider>
  );

  expect(screen.getByText("Enviar")).toBeInTheDocument();
});
```

## Troubleshooting

### Issue: Translations not showing

**Solution**: Ensure the component is wrapped in `NextIntlClientProvider` (automatically done in `[locale]/layout.tsx`).

### Issue: "useTranslations can only be used in Client Components"

**Solution**: Add `"use client"` directive at the top of the file.

### Issue: Locale not persisting

**Solution**: Check that middleware is properly configured and the `NEXT_LOCALE` cookie is being set.

### Issue: 404 on locale routes

**Solution**: Ensure you've created the `[locale]` directory and moved pages into it.

## Migration Checklist

When migrating existing pages to use i18n:

- [ ] Move page from `app/` to `app/[locale]/`
- [ ] Replace `next/link` with `@/i18n/navigation` Link
- [ ] Replace hardcoded strings with `t()` calls
- [ ] Add translation keys to both `es-MX.json` and `en-US.json`
- [ ] Update metadata to use `getTranslations`
- [ ] Test in both locales

## Resources

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Next.js i18n Routing](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
- [ICU Message Format](https://unicode-org.github.io/icu/userguide/format_parse/messages/)

## Summary

The i18n implementation follows the `.windsurfrules` requirements:
- ✅ Default locale: `es-MX`
- ✅ Secondary locale: `en-US`
- ✅ All strings in separate locale files
- ✅ No hardcoded strings in components
- ✅ Scalable architecture using `next-intl`
- ✅ Seamless integration with Next.js App Router
- ✅ Dynamic locale switching
- ✅ Type-safe translations
