/**
 * i18n Configuration
 * 
 * Defines supported locales and default locale for the application.
 * Per .windsurfrules: es-MX is default, en-US is secondary.
 */

export const locales = ["es-MX", "en-US"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "es-MX";

/**
 * Locale metadata for display purposes
 */
export const localeMetadata: Record<Locale, { name: string; flag: string }> = {
  "es-MX": {
    name: "Español (México)",
    flag: "🇲🇽",
  },
  "en-US": {
    name: "English (US)",
    flag: "🇺🇸",
  },
};
