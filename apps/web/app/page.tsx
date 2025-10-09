import { redirect } from "next/navigation";

import { defaultLocale } from "@web/i18n/config";

/**
 * Root Page
 * 
 * Redirects to the default locale.
 * This ensures that visiting "/" redirects to "/es-MX".
 */
export default function RootPage() {
  redirect(`/${defaultLocale}`);
}
