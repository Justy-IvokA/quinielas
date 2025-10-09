# Admin App Internationalization (i18n) Guide

## Overview

The admin panel now uses `next-intl` for localized routing and translations.

- Default locale: `es-MX`
- Secondary locale: `en-US`
- Routes live under `app/[locale]/`
- Providers and metadata are locale-aware
- All UI strings reside in `messages/*.json`

## Directory Structure

```
apps/admin/
├── app/
│   ├── layout.tsx                # Pass-through root layout
│   ├── page.tsx                  # Redirect to /{defaultLocale}
│   └── [locale]/                 # Localized routes
│       ├── layout.tsx            # NextIntlClientProvider + providers
│       ├── page.tsx              # Dashboard home (localized)
│       ├── access/
│       ├── fixtures/
│       └── pools/
├── messages/
│   ├── es-MX.json
│   └── en-US.json
├── middleware.ts                 # Locale routing middleware
├── next.config.js                # Wrapped with next-intl plugin
└── src/
    └── i18n/
        ├── config.ts
        ├── request.ts
        ├── navigation.ts
        └── index.ts
```

## Configuration Steps

1. **Install**
   ```bash
   pnpm add next-intl --filter @qp/admin
   ```

2. **Next config** (`next.config.js`)
   ```js
   const createNextIntlPlugin = require("next-intl/plugin");
   const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

   module.exports = withNextIntl({
     reactStrictMode: true,
     transpilePackages: ["@qp/ui", "@qp/api", "@qp/branding", "@qp/utils"],
     experimental: {
       optimizePackageImports: ["@qp/ui", "lucide-react"],
     },
   });
   ```

3. **Middleware** (`middleware.ts`)
   ```ts
   import createMiddleware from "next-intl/middleware";

   import { locales, defaultLocale } from "./src/i18n/config";

   export default createMiddleware({
     locales,
     defaultLocale,
     localePrefix: "always",
   });

   export const config = {
     matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
   };
   ```

4. **Layout changes**
   - `app/layout.tsx` is now a pass-through.
   - `app/[locale]/layout.tsx` loads messages with `getMessages()`, wraps children with `NextIntlClientProvider`, and sets metadata using `getTranslations()`.
   - `app/page.tsx` redirects `/` to `/${defaultLocale}`.

## Translation Namespaces

`messages/es-MX.json` and `messages/en-US.json` share identical structure with namespaces:

- `common` – Miscellaneous UI strings
- `dashboard` – Welcome banner, quick actions
- `pools` – Pool list, empty states, metadata
- `fixtures` – Fixtures sync panel, table columns, statuses
- `access` – Policies, code batches, email invites
- `demo` – Demo save button component
- `metadata` – SEO strings consumed by layout

### Example: Pools namespace (excerpt)
```json
"pools": {
  "title": "Pools",
  "description": "Manage your active and inactive pools.",
  "create": "Create pool",
  "empty": {
    "title": "No pools created",
    "description": "Start by creating your first pool.",
    "cta": "Create first pool"
  },
  "actions": {
    "view": "View details",
    "edit": "Edit",
    "delete": "Delete"
  }
}
```

## Component Patterns

- Client components import `useTranslations()` and reference namespace keys.
- Navigation uses `Link` from `src/i18n/navigation` to preserve locale prefixes.
- Toast messages (success/error) now draw from `messages` to avoid hardcoded strings.

### Example: `DashboardWelcome`
```tsx
const t = useTranslations("dashboard");

return (
  <section>
    <p>{t("statusOnline")}</p>
    <Button asChild>
      <Link href="/pools/new">{t("createPool")}</Link>
    </Button>
  </section>
);
```

### Example: `AccessPolicyForm`
```tsx
const t = useTranslations("access.form");

<FormField label={t("accessType.label")}>...
toastSuccess(t("success"));
toastError(t("error", { message: error.message }));
```

## Testing Checklist

- Run `pnpm dev --filter @qp/admin`.
- Visit `/es-MX` and `/en-US` versions of dashboard, pools, access, fixtures.
- Verify locale switcher (if added) maintains path.
- Confirm toasts/dialogs display localized copy.
- Ensure metadata (OpenGraph, Twitter) reads the correct locale strings.

## Adding New Pages

1. Create files under `app/[locale]/new-page/`.
2. Use `generateMetadata` with `getTranslations()`.
3. Add new translation keys to both locale JSON files.
4. Replace `next/link` with locale-aware `Link` from `src/i18n/navigation`.

## Tips

- Keep locale files in sync; structure must match exactly across languages.
- Prefer descriptive keys (e.g., `access.tabs.invitations`) over ambiguous names.
- When using interpolations, ensure placeholders exist in both translations.
- Run `pnpm typecheck --filter @qp/admin` to catch missing imports or types.

