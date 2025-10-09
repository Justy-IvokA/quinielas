/**
 * i18n Configuration for Admin app
 */

export const locales = ["es-MX", "en-US"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "es-MX";

export const localeMetadata: Record<Locale, { name: string; flag: string }> = {
  "es-MX": {
    name: "Español (México)",
    flag: "🇲🇽"
  },
  "en-US": {
    name: "English (US)",
    flag: "🇺🇸"
  }
};
