"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { Globe } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@qp/ui";

import { locales, localeMetadata, type Locale } from "@web/i18n/config";

/**
 * Locale Switcher Component
 * 
 * Allows users to switch between available locales.
 * Preserves the current path when switching locales.
 * 
 * @example
 * ```tsx
 * import { LocaleSwitcher } from './components/locale-switcher';
 * 
 * <LocaleSwitcher />
 * ```
 */
export function LocaleSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const handleLocaleChange = (newLocale: Locale) => {
    // Remove current locale prefix from pathname
    const pathWithoutLocale = pathname.replace(`/${locale}`, "");
    
    // Navigate to the same path with new locale
    router.push(`/${newLocale}${pathWithoutLocale}`);
  };

  return (
    <div className="relative inline-block">
      <span id="locale-select-label" className="sr-only">
        {t("selectLanguage")}
      </span>
      <Select
        value={locale}
        onValueChange={(value) => handleLocaleChange(value as Locale)}
      >
        <SelectTrigger
          aria-labelledby="locale-select-label"
          className="w-auto gap-2 rounded-lg border-border/50 bg-muted/50 px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          <Globe className="h-4 w-4 text-muted-foreground" />
          <SelectValue aria-label={localeMetadata[locale].name} />
        </SelectTrigger>
        <SelectContent>
          {locales.map((loc) => (
            <SelectItem key={loc} value={loc}>
              {localeMetadata[loc].flag} {localeMetadata[loc].name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
