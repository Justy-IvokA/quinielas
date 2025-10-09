export interface BrandThemeTokens {
  colors: {
    background: string;
    foreground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    muted: string;
    mutedForeground: string;
    destructive: string;
    destructiveForeground: string;
    border: string;
    ring: string;
    input: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
  };
  radius: string;
}

export interface BrandTypographyConfig {
  sans: string;
  heading: string;
}

export interface BrandTheme {
  name: string;
  slug: string;
  tokens: BrandThemeTokens;
  typography: BrandTypographyConfig;
  cssVariables: Record<string, string>;
}

export interface BrandConfig {
  tenant: {
    name: string;
    slug: string;
  };
  brand: {
    name: string;
    slug: string;
    tagline: string;
    logoUrl: string;
  };
  theme: BrandTheme;
}
