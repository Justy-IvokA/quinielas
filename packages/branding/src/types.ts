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

export interface BrandThemeDarkTokens {
  colors?: Partial<BrandThemeTokens["colors"]>;
  radius?: string;
}

export interface BrandTypographyConfig {
  sans: string;
  heading: string;
}

export interface BrandHeroAssets {
  /** Whether to use video for hero background */
  video: boolean;
  /** URL to video or image asset */
  assetUrl: string | null;
  /** Fallback image if video fails to load */
  fallbackImageUrl?: string | null;
}

export interface BrandTheme {
  name: string;
  slug: string;
  tokens: BrandThemeTokens;
  /** Optional dark theme overrides */
  darkTokens?: BrandThemeDarkTokens;
  typography: BrandTypographyConfig;
  cssVariables: Record<string, string>;
  /** Optional dark theme CSS variables */
  darkCssVariables?: Record<string, string>;
  /** Hero section assets configuration */
  heroAssets?: BrandHeroAssets;
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
