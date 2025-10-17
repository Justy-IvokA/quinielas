import type { EmailBrandColors, EmailBrandInfo, EmailLocale } from "./types";

/**
 * Convert BrandThemeTokens to EmailBrandColors
 * This helper extracts the necessary colors from the full branding theme
 */
export function brandThemeToEmailColors(colors: {
  primary: string;
  primaryForeground: string;
  background: string;
  foreground: string;
  muted: string;
  border: string;
}): EmailBrandColors {
  return {
    primary: colors.primary,
    primaryForeground: colors.primaryForeground,
    background: colors.background,
    foreground: colors.foreground,
    muted: colors.muted,
    border: colors.border,
  };
}

/**
 * Create EmailBrandInfo from Brand entity
 * Useful when converting database Brand to email params
 */
export function createEmailBrandInfo(params: {
  name: string;
  logoUrl?: string | null;
  colors: {
    primary: string;
    primaryForeground: string;
    background: string;
    foreground: string;
    muted: string;
    border: string;
  };
}): EmailBrandInfo {
  return {
    name: params.name,
    logoUrl: params.logoUrl ?? undefined,
    colors: brandThemeToEmailColors(params.colors),
  };
}

/**
 * Get default brand colors (fallback)
 */
export function getDefaultEmailBrandColors(): EmailBrandColors {
  return {
    primary: "#0ea5e9",
    primaryForeground: "#ffffff",
    background: "#ffffff",
    foreground: "#0f172a",
    muted: "#f1f5f9",
    border: "#e2e8f0",
  };
}

/**
 * Get default brand info (fallback)
 */
export function getDefaultEmailBrandInfo(brandName = "Quinielas"): EmailBrandInfo {
  return {
    name: brandName,
    colors: getDefaultEmailBrandColors(),
  };
}

/**
 * Parse locale string to EmailLocale
 * Defaults to es-MX if invalid
 */
export function parseEmailLocale(locale?: string | null): EmailLocale {
  if (!locale) return "es-MX";
  
  const normalized = locale.toLowerCase();
  if (normalized.startsWith("en")) return "en-US";
  if (normalized.startsWith("es")) return "es-MX";
  
  return "es-MX"; // Default
}

/**
 * Example usage:
 * 
 * ```typescript
 * import { emailTemplates } from "@qp/utils/email";
 * import { createEmailBrandInfo, parseEmailLocale } from "@qp/utils/email/branding-helpers";
 * 
 * // From database Brand entity
 * const brand = await db.brand.findUnique({ where: { id: brandId } });
 * const brandInfo = createEmailBrandInfo({
 *   name: brand.name,
 *   logoUrl: brand.logoUrl,
 *   colors: {
 *     primary: brand.theme.colors.primary,
 *     primaryForeground: brand.theme.colors.primaryForeground,
 *     background: brand.theme.colors.background,
 *     foreground: brand.theme.colors.foreground,
 *     muted: brand.theme.colors.muted,
 *     border: brand.theme.colors.border,
 *   }
 * });
 * 
 * // Send invitation
 * const email = emailTemplates.invitation({
 *   brand: brandInfo,
 *   locale: parseEmailLocale(user.locale),
 *   poolName: pool.name,
 *   inviteUrl: "https://...",
 *   expiresAt: new Date()
 * });
 * 
 * await emailAdapter.send({
 *   to: user.email,
 *   ...email
 * });
 * ```
 */
