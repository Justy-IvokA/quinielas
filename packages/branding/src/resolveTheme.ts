import type { BrandTheme, BrandThemeTokens } from "./types";

/**
 * Default theme tokens (fallback when no brand theme is provided)
 */
const defaultTokens: BrandThemeTokens = {
  colors: {
    background: "0 0% 100%",
    foreground: "222.2 84% 4.9%",
    primary: "221.2 83.2% 53.3%",
    primaryForeground: "210 40% 98%",
    secondary: "210 40% 96.1%",
    secondaryForeground: "222.2 47.4% 11.2%",
    accent: "210 40% 96.1%",
    accentForeground: "222.2 47.4% 11.2%",
    muted: "210 40% 96.1%",
    mutedForeground: "215.4 16.3% 46.9%",
    destructive: "0 84.2% 60.2%",
    destructiveForeground: "210 40% 98%",
    border: "214.3 31.8% 91.4%",
    ring: "221.2 83.2% 53.3%",
    input: "214.3 31.8% 91.4%",
    card: "0 0% 100%",
    cardForeground: "222.2 84% 4.9%",
    popover: "0 0% 100%",
    popoverForeground: "222.2 84% 4.9%"
  },
  radius: "0.5rem"
};

/**
 * Converts brand theme tokens to CSS variables object
 */
export function tokensToCssVariables(tokens: BrandThemeTokens): Record<string, string> {
  return {
    "--background": tokens.colors.background,
    "--foreground": tokens.colors.foreground,
    "--primary": tokens.colors.primary,
    "--primary-foreground": tokens.colors.primaryForeground,
    "--secondary": tokens.colors.secondary,
    "--secondary-foreground": tokens.colors.secondaryForeground,
    "--accent": tokens.colors.accent,
    "--accent-foreground": tokens.colors.accentForeground,
    "--muted": tokens.colors.muted,
    "--muted-foreground": tokens.colors.mutedForeground,
    "--destructive": tokens.colors.destructive,
    "--destructive-foreground": tokens.colors.destructiveForeground,
    "--border": tokens.colors.border,
    "--ring": tokens.colors.ring,
    "--input": tokens.colors.input,
    "--card": tokens.colors.card,
    "--card-foreground": tokens.colors.cardForeground,
    "--popover": tokens.colors.popover,
    "--popover-foreground": tokens.colors.popoverForeground,
    "--radius": tokens.radius
  };
}

/**
 * Applies brand theme by generating a <style> tag with CSS variables
 * Can be injected into <head> on the server
 */
export function applyBrandTheme(theme: BrandTheme | null): string {
  const tokens = theme?.tokens ?? defaultTokens;
  const typography = theme?.typography ?? {
    sans: "Inter, system-ui, sans-serif",
    heading: "Inter, system-ui, sans-serif"
  };

  const cssVars = tokensToCssVariables(tokens);
  
  // Build CSS variable declarations
  const varDeclarations = Object.entries(cssVars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join("\n");

  // Add font family variables
  const fontVars = `  --font-sans: ${typography.sans};
  --font-heading: ${typography.heading};`;

  return `<style id="brand-theme">
:root {
${varDeclarations}
${fontVars}
}
</style>`;
}

/**
 * Resolves theme from brand configuration
 * Merges brand-specific overrides with defaults
 */
export function resolveTheme(brandTheme?: Partial<BrandTheme>): BrandTheme {
  const mergedTokens: BrandThemeTokens = {
    colors: {
      ...defaultTokens.colors,
      ...(brandTheme?.tokens?.colors ?? {})
    },
    radius: brandTheme?.tokens?.radius ?? defaultTokens.radius
  };

  return {
    name: brandTheme?.name ?? "Default Theme",
    slug: brandTheme?.slug ?? "default",
    tokens: mergedTokens,
    typography: brandTheme?.typography ?? {
      sans: "Inter, system-ui, sans-serif",
      heading: "Inter, system-ui, sans-serif"
    },
    cssVariables: tokensToCssVariables(mergedTokens)
  };
}
