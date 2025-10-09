# i18n Quick Start Guide

## 🚀 What Was Implemented

Internationalization (i18n) has been successfully implemented using `next-intl` with:

- ✅ **Default Locale**: `es-MX` (Spanish - Mexico)
- ✅ **Secondary Locale**: `en-US` (English - United States)
- ✅ **Locale-based routing**: `/es-MX/*` and `/en-US/*`
- ✅ **Dynamic locale switching** via LocaleSwitcher component
- ✅ **Type-safe translations** with TypeScript
- ✅ **No hardcoded strings** - all text in locale files

## 📁 Key Files Created/Modified

### Configuration Files
- `src/i18n/config.ts` - Locale configuration
- `src/i18n/request.ts` - Request configuration for next-intl
- `src/i18n/navigation.ts` - Type-safe navigation helpers
- `src/middleware.ts` - Locale detection middleware
- `next.config.js` - Updated with next-intl plugin

### Locale Files
- `messages/es-MX.json` - Spanish translations
- `messages/en-US.json` - English translations

### Layout & Components
- `app/[locale]/layout.tsx` - Locale-specific layout with NextIntlClientProvider
- `app/[locale]/page.tsx` - Home page with translations
- `app/components/locale-switcher.tsx` - Language switcher component
- `app/components/site-header.tsx` - Updated with i18n navigation
- `app/components/home-hero.tsx` - Updated with translations
- `app/components/stats-section.tsx` - Updated with translations

### Documentation
- `I18N_IMPLEMENTATION.md` - Comprehensive implementation guide
- `I18N_QUICK_START.md` - This file

## 🎯 Quick Usage

### 1. Use Translations in Components

```tsx
import { useTranslations } from "next-intl";

export default function MyPage() {
  const t = useTranslations("common");
  
  return (
    <div>
      <h1>{t("appName")}</h1>
      <button>{t("submit")}</button>
    </div>
  );
}
```

### 2. Use Locale-Aware Links

```tsx
// ❌ Don't use next/link
import Link from "next/link";

// ✅ Use i18n Link instead
import { Link } from "@/i18n/navigation";

<Link href="/register">Register</Link>
// Automatically becomes /es-MX/register or /en-US/register
```

### 3. Add New Translations

1. Add to `messages/es-MX.json`:
```json
{
  "myFeature": {
    "title": "Mi Característica"
  }
}
```

2. Add to `messages/en-US.json`:
```json
{
  "myFeature": {
    "title": "My Feature"
  }
}
```

3. Use in component:
```tsx
const t = useTranslations("myFeature");
<h1>{t("title")}</h1>
```

## 🧪 Testing

### Manual Testing

1. Start the dev server:
```bash
pnpm dev
```

2. Visit `http://localhost:3000`
   - Should redirect to `/es-MX`

3. Click the locale switcher (🌐) in the header
   - Should switch to `/en-US` and update all text

4. Navigate to different pages
   - Locale should persist across navigation

5. Visit the example page:
   - `/es-MX/example` or `/en-US/example`

### Check Translation Coverage

All pages should now use translations from locale files. Check:
- ✅ Home page (`/`)
- ✅ Site header navigation
- ✅ Hero section
- ✅ Stats section
- ✅ Example page (`/example`)

## 🔧 Next Steps

### For Existing Pages

When migrating existing pages to use i18n:

1. **Move page to `[locale]` directory**
   ```
   app/my-page/page.tsx → app/[locale]/my-page/page.tsx
   ```

2. **Replace `next/link` imports**
   ```tsx
   // Before
   import Link from "next/link";
   
   // After
   import { Link } from "@/i18n/navigation";
   ```

3. **Extract hardcoded strings**
   ```tsx
   // Before
   <h1>Welcome</h1>
   
   // After
   const t = useTranslations("myPage");
   <h1>{t("welcome")}</h1>
   ```

4. **Add translations to locale files**
   ```json
   // messages/es-MX.json
   { "myPage": { "welcome": "Bienvenido" } }
   
   // messages/en-US.json
   { "myPage": { "welcome": "Welcome" } }
   ```

### For New Pages

1. Create page in `app/[locale]/my-new-page/page.tsx`
2. Use `useTranslations()` for all text
3. Use `Link` from `@/i18n/navigation`
4. Add translations to both locale files

## 📚 Translation File Structure

Current structure in `messages/*.json`:

```
common          - Common UI elements (buttons, labels)
nav             - Navigation items
home            - Home page content
  hero          - Hero section
  features      - Feature cards
  techFeatures  - Tech badges
  devInfo       - Developer info
stats           - Statistics section
register        - Registration page
pool            - Pool pages
predictions     - Predictions
leaderboard     - Leaderboard
matches         - Matches/fixtures
errors          - Error messages
footer          - Footer content
metadata        - SEO metadata
```

## 🌐 URL Structure

- `/` → Redirects to `/es-MX`
- `/es-MX/*` → Spanish version
- `/en-US/*` → English version

Examples:
- `/es-MX/register` - Spanish registration
- `/en-US/register` - English registration
- `/es-MX/pools` - Spanish pools
- `/en-US/pools` - English pools

## 🎨 Locale Switcher

The locale switcher is already integrated in the site header. It:
- Shows current locale with flag emoji
- Allows switching between es-MX and en-US
- Preserves current path when switching
- Stores preference in cookie

## ⚠️ Important Notes

1. **Always use `Link` from `@/i18n/navigation`**, not `next/link`
2. **Never hardcode strings** - always use `t()` function
3. **Keep locale files in sync** - same structure in both files
4. **Test in both locales** before committing changes

## 📖 Full Documentation

See `I18N_IMPLEMENTATION.md` for:
- Detailed API reference
- Advanced usage patterns
- Server-side translations
- Metadata generation
- Adding new locales
- Troubleshooting guide

## ✅ Implementation Status

- ✅ Core i18n infrastructure
- ✅ Middleware configuration
- ✅ Locale files (es-MX, en-US)
- ✅ Navigation helpers
- ✅ Locale switcher component
- ✅ Home page translations
- ✅ Site header translations
- ✅ Example page
- ✅ Documentation

## 🚧 Remaining Work

Pages that still need translation migration:
- `/register/*` - Registration pages
- `/pools/*` - Pool pages (when created)
- `/leaderboard/*` - Leaderboard pages (when created)
- `/fixtures/*` - Fixtures pages (when created)

Follow the migration pattern shown in the home page and example page.
