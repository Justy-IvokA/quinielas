/**
 * Brand Theme Provider
 * 
 * Server component that injects brand-specific CSS variables into the HTML.
 * Should be used in the root layout to apply theming globally.
 */

import { applyBrandTheme, resolveTheme } from "@qp/branding";
import type { BrandTheme } from "@qp/branding";
import { getCurrentBrand } from "@web/lib/brandContext";

/**
 * Extracts and parses theme from brand's JSON theme field
 */
function parseBrandTheme(themeJson: unknown): Partial<BrandTheme> | null {
  if (!themeJson || typeof themeJson !== "object") {
    return null;
  }
  
  try {
    // The theme field in DB is a JSON object matching BrandTheme structure
    return themeJson as Partial<BrandTheme>;
  } catch (error) {
    console.error("[BrandThemeProvider] Error parsing brand theme:", error);
    return null;
  }
}

/**
 * Brand Theme Style Injector
 * 
 * Fetches current brand and injects CSS variables into a <style> tag.
 * Falls back to default theme if no brand is found.
 */
export async function BrandThemeProvider() {
  // Get current brand from request context
  const brand = await getCurrentBrand();
  
  let themeCSS: string;
  
  if (brand?.theme) {
    // Parse brand theme from JSON
    const brandThemeData = parseBrandTheme(brand.theme);
    
    if (brandThemeData) {
      // Resolve theme with brand overrides
      const resolvedTheme = resolveTheme(brandThemeData);
      themeCSS = applyBrandTheme(resolvedTheme);
    } else {
      // Fallback to default theme
      themeCSS = applyBrandTheme(null);
    }
  } else {
    // No brand or no theme, use defaults
    themeCSS = applyBrandTheme(null);
  }
  
  return (
    <style
      dangerouslySetInnerHTML={{ __html: themeCSS }}
      data-brand-theme={brand?.slug || "default"}
    />
  );
}

/**
 * Brand Metadata Provider
 * 
 * Injects brand-specific metadata (logo, name) for use in components.
 * This can be accessed via context or props drilling.
 */
export async function BrandMetadata() {
  const brand = await getCurrentBrand();
  
  if (!brand) {
    return null;
  }
  
  return (
    <script
      id="brand-metadata"
      type="application/json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          id: brand.id,
          slug: brand.slug,
          name: brand.name,
          logoUrl: brand.logoUrl,
          description: brand.description,
        }),
      }}
    />
  );
}
