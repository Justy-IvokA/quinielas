import type { BrandTheme, BrandThemeTokens, BrandThemeDarkTokens } from "./types";
import { normalizeColorToHsl } from "./colorUtils";

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
 * Normalizes all color values in a token colors object to HSL format
 */
function normalizeTokenColors(colors: Partial<BrandThemeTokens["colors"]>): Partial<BrandThemeTokens["colors"]> {
  const normalized: Partial<BrandThemeTokens["colors"]> = {};
  
  for (const [key, value] of Object.entries(colors)) {
    if (value && typeof value === "string") {
      normalized[key as keyof BrandThemeTokens["colors"]] = normalizeColorToHsl(value);
    }
  }
  
  return normalized;
}

/**
 * Default dark theme tokens
 */
const defaultDarkTokens: BrandThemeDarkTokens = {
  colors: {
    background: "222.2 84% 4.9%",
    foreground: "210 40% 98%",
    card: "222.2 84% 4.9%",
    cardForeground: "210 40% 98%",
    popover: "222.2 84% 4.9%",
    popoverForeground: "210 40% 98%",
    primary: "217.2 91.2% 59.8%",
    primaryForeground: "222.2 47.4% 11.2%",
    secondary: "217.2 32.6% 17.5%",
    secondaryForeground: "210 40% 98%",
    muted: "217.2 32.6% 17.5%",
    mutedForeground: "215 20.2% 65.1%",
    accent: "217.2 32.6% 17.5%",
    accentForeground: "210 40% 98%",
    border: "217.2 32.6% 17.5%",
    input: "217.2 32.6% 17.5%",
    ring: "224.3 76.3% 48%"
  }
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
 * Applies brand theme by generating a CSS string with variables
 * Suitable for injection inside a <style> element server-side
 * Includes both light and dark theme support
 */
export function applyBrandTheme(theme: BrandTheme | null): string {
  const tokens = theme?.tokens ?? defaultTokens;
  const darkTokens = theme?.darkTokens ?? defaultDarkTokens;
  const typography = theme?.typography ?? {
    sans: "Inter, system-ui, sans-serif",
    heading: "Inter, system-ui, sans-serif"
  };

  const cssVars = tokensToCssVariables(tokens);
  
  // Build CSS variable declarations for light theme
  const varDeclarations = Object.entries(cssVars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join("\n");

  // Build dark theme overrides
  const mergedDarkTokens: BrandThemeTokens = {
    colors: {
      ...defaultTokens.colors, // Start with all required light theme colors
      ...defaultDarkTokens.colors, // Apply dark theme defaults
      ...(darkTokens.colors ?? {}) // Apply brand-specific dark overrides
    },
    radius: darkTokens.radius ?? tokens.radius
  };
  const darkCssVars = tokensToCssVariables(mergedDarkTokens);
  const darkVarDeclarations = Object.entries(darkCssVars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join("\n");

  // Add font family variables
  const fontVars = `  --font-sans: ${typography.sans};
  --font-heading: ${typography.heading};`;

  // Use html:root for higher specificity to override @layer base in globals.css
  return `html:root {
${varDeclarations}
${fontVars}
}

html.dark {
${darkVarDeclarations}
}`;
}

/**
 * Resolves theme from brand configuration
 * Merges brand-specific overrides with defaults
 * Automatically converts HEX colors to HSL format
 */
export function resolveTheme(brandTheme?: Partial<BrandTheme>): BrandTheme {
  // Normalize brand colors from HEX to HSL if needed
  const normalizedBrandColors = brandTheme?.tokens?.colors 
    ? normalizeTokenColors(brandTheme.tokens.colors)
    : {};
  
  const mergedTokens: BrandThemeTokens = {
    colors: {
      ...defaultTokens.colors,
      ...normalizedBrandColors
    },
    radius: brandTheme?.tokens?.radius ?? defaultTokens.radius
  };

  // Normalize dark theme colors
  const normalizedDarkColors = brandTheme?.darkTokens?.colors
    ? normalizeTokenColors(brandTheme.darkTokens.colors)
    : {};

  const mergedDarkTokens: BrandThemeTokens = {
    colors: {
      ...defaultTokens.colors, // Start with all required light theme colors
      ...defaultDarkTokens.colors, // Apply dark theme defaults
      ...normalizedDarkColors // Apply brand-specific dark overrides
    },
    radius: brandTheme?.darkTokens?.radius ?? mergedTokens.radius
  };

  return {
    name: brandTheme?.name ?? "Default Theme",
    slug: brandTheme?.slug ?? "default",
    tokens: mergedTokens,
    darkTokens: brandTheme?.darkTokens,
    typography: brandTheme?.typography ?? {
      sans: "Inter, system-ui, sans-serif",
      heading: "Inter, system-ui, sans-serif"
    },
    cssVariables: tokensToCssVariables(mergedTokens),
    darkCssVariables: tokensToCssVariables(mergedDarkTokens),
    heroAssets: brandTheme?.heroAssets
  };
}
