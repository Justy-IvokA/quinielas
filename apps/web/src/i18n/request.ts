import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";

import { locales, type Locale } from "./config";

/**
 * Request configuration for next-intl
 * 
 * This function is called on every request to load the appropriate
 * locale messages. It validates the locale and loads the corresponding
 * translation file.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Validate that the incoming `locale` parameter is valid
  if (!locale || !locales.includes(locale as Locale)) {
    notFound();
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
