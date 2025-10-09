import type { BrandConfig, BrandThemeTokens } from "./types";

const tokenToCssVars = (tokens: BrandThemeTokens) => {
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
  } as const;
};

const demoTokens: BrandThemeTokens = {
  colors: {
    background: "0 0% 100%",
    foreground: "224 71% 4%",
    primary: "199 84% 55%",
    primaryForeground: "0 0% 100%",
    secondary: "222 47% 11%",
    secondaryForeground: "0 0% 100%",
    accent: "199 84% 90%",
    accentForeground: "199 84% 25%",
    muted: "210 40% 96%",
    mutedForeground: "215 16% 47%",
    destructive: "0 84% 60%",
    destructiveForeground: "0 0% 98%",
    border: "214 32% 91%",
    ring: "199 84% 55%",
    input: "214 32% 91%",
    card: "0 0% 100%",
    cardForeground: "224 71% 4%",
    popover: "0 0% 100%",
    popoverForeground: "224 71% 4%"
  },
  radius: "0.75rem"
};

export const demoBranding: BrandConfig = {
  tenant: {
    name: "Quinielas WL",
    slug: "demo"
  },
  brand: {
    name: "Demo Brand",
    slug: "default",
    tagline: "La quiniela oficial del Mundial 2026",
    logoUrl: "/demo/logo.svg"
  },
  theme: {
    name: "Demo Theme",
    slug: "demo-default",
    tokens: demoTokens,
    typography: {
      sans: "Inter, ui-sans-serif, system-ui",
      heading: "Poppins, ui-sans-serif, system-ui"
    },
    cssVariables: tokenToCssVars(demoTokens)
  }
};

export const getDemoBranding = () => demoBranding;
export const tokens2CssVariables = tokenToCssVars;
