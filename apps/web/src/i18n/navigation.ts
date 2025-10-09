import { createNavigation } from "next-intl/navigation";

import { locales, type Locale } from "./config";

/**
 * Type-safe navigation utilities for i18n
 * 
 * These utilities automatically handle locale prefixes in URLs:
 * - Link: Replacement for next/link that includes locale prefix
 * - redirect: Server-side redirect with locale
 * - usePathname: Get current pathname without locale prefix
 * - useRouter: Router with locale-aware navigation
 * 
 * @example
 * ```tsx
 * import { Link, useRouter } from '@/i18n/navigation';
 * 
 * // Automatically adds locale prefix: /es-MX/register
 * <Link href="/register">Register</Link>
 * 
 * // Programmatic navigation with locale
 * const router = useRouter();
 * router.push('/pools');
 * ```
 */
export const { Link, redirect, usePathname, useRouter } = createNavigation({
  locales,
});
