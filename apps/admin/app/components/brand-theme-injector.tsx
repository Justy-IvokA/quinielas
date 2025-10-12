"use client";

import { useEffect } from "react";
import { applyBrandTheme, resolveTheme, hexToHsl } from "@qp/branding";

interface BrandThemeInjectorProps {
  brandTheme: any; // The theme object from the database
}

export function BrandThemeInjector({ brandTheme }: BrandThemeInjectorProps) {
  useEffect(() => {
    if (!brandTheme) {
      console.log("[BrandThemeInjector] No brand theme provided");
      return;
    }

    console.log("[BrandThemeInjector] Applying brand theme:", brandTheme);

    // Check if style tag already exists
    let styleTag = document.getElementById("brand-theme-dynamic");
    
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = "brand-theme-dynamic";
      document.head.appendChild(styleTag);
    }

    // Handle legacy format where colors are at root level
    let normalizedTheme = brandTheme;
    if (brandTheme.colors && !brandTheme.tokens) {
      normalizedTheme = {
        ...brandTheme,
        tokens: {
          colors: {
            primary: brandTheme.colors.primary,
            primaryForeground: brandTheme.colors.primaryForeground || "0 0% 100%",
            secondary: brandTheme.colors.secondary,
            secondaryForeground: brandTheme.colors.secondaryForeground || "0 0% 100%",
            background: brandTheme.colors.background,
            foreground: brandTheme.colors.foreground,
            accent: brandTheme.colors.accent || brandTheme.colors.secondary,
            accentForeground: brandTheme.colors.accentForeground || "0 0% 100%",
          },
          radius: brandTheme.radius || "0.5rem"
        },
        // Generate dark theme tokens based on light theme
        darkTokens: {
          colors: {
            // Keep the same brand colors for dark mode (convert HEX to HSL)
            primary: brandTheme.colors.primary.startsWith("#") 
              ? hexToHsl(brandTheme.colors.primary) 
              : brandTheme.colors.primary,
            primaryForeground: "0 0% 100%", // Always white for dark mode
            secondary: brandTheme.colors.secondary.startsWith("#")
              ? hexToHsl(brandTheme.colors.secondary)
              : brandTheme.colors.secondary,
            secondaryForeground: "0 0% 100%", // Always white for dark mode
            accent: (brandTheme.colors.accent || brandTheme.colors.secondary).startsWith("#")
              ? hexToHsl(brandTheme.colors.accent || brandTheme.colors.secondary)
              : (brandTheme.colors.accent || brandTheme.colors.secondary),
            accentForeground: "0 0% 100%", // Always white for dark mode
            // Dark mode specific colors
            background: "240 10% 3.9%",
            foreground: "0 0% 98%",
          }
        }
      };
    }

    const resolvedTheme = resolveTheme(normalizedTheme);
    const css = applyBrandTheme(resolvedTheme);
    styleTag.textContent = css;
    
    console.log("[BrandThemeInjector] Theme CSS applied successfully");
    console.log("[BrandThemeInjector] Resolved theme:", resolvedTheme);
  }, [brandTheme]);

  return null; // This component doesn't render anything
}
