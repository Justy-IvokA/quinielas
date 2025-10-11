import { describe, it, expect } from "vitest";
import { tokensToCssVariables, applyBrandTheme, resolveTheme } from "../resolveTheme";
import type { BrandTheme, BrandThemeTokens } from "../types";

describe("tokensToCssVariables", () => {
  it("should convert tokens to CSS variables object", () => {
    const tokens: BrandThemeTokens = {
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

    const cssVars = tokensToCssVariables(tokens);

    expect(cssVars["--background"]).toBe("0 0% 100%");
    expect(cssVars["--foreground"]).toBe("222.2 84% 4.9%");
    expect(cssVars["--primary"]).toBe("221.2 83.2% 53.3%");
    expect(cssVars["--radius"]).toBe("0.5rem");
  });

  it("should include all required CSS variables", () => {
    const tokens: BrandThemeTokens = {
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

    const cssVars = tokensToCssVariables(tokens);
    const requiredVars = [
      "--background",
      "--foreground",
      "--primary",
      "--primary-foreground",
      "--secondary",
      "--secondary-foreground",
      "--accent",
      "--accent-foreground",
      "--muted",
      "--muted-foreground",
      "--destructive",
      "--destructive-foreground",
      "--border",
      "--ring",
      "--input",
      "--card",
      "--card-foreground",
      "--popover",
      "--popover-foreground",
      "--radius"
    ];

    requiredVars.forEach((varName) => {
      expect(cssVars).toHaveProperty(varName);
    });
  });
});

describe("applyBrandTheme", () => {
  it("should generate CSS variables string", () => {
    const theme: BrandTheme = {
      name: "Test Theme",
      slug: "test",
      tokens: {
        colors: {
          background: "0 0% 100%",
          foreground: "222.2 84% 4.9%",
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
      },
      typography: {
        sans: "Inter, system-ui",
        heading: "Poppins, system-ui"
      },
      cssVariables: {}
    };

    const styleTag = applyBrandTheme(theme);

    expect(styleTag.startsWith(":root {\n")).toBe(true);
    expect(styleTag).toContain("--primary: 199 84% 55%");
    expect(styleTag).toContain("--radius: 0.75rem");
    expect(styleTag).toContain("--font-sans: Inter, system-ui");
    expect(styleTag).toContain("--font-heading: Poppins, system-ui");
  });

  it("should use default tokens when theme is null", () => {
    const styleTag = applyBrandTheme(null);

    expect(styleTag.startsWith(":root {\n")).toBe(true);
    expect(styleTag).toContain("--background:");
    expect(styleTag).toContain("--foreground:");
    expect(styleTag).toContain("--font-sans:");
  });

  it("should include custom brand colors", () => {
    const theme: BrandTheme = {
      name: "Custom Brand",
      slug: "custom",
      tokens: {
        colors: {
          background: "0 0% 10%",
          foreground: "0 0% 90%",
          primary: "280 100% 70%",
          primaryForeground: "0 0% 100%",
          secondary: "200 50% 50%",
          secondaryForeground: "0 0% 100%",
          accent: "150 60% 60%",
          accentForeground: "0 0% 10%",
          muted: "0 0% 20%",
          mutedForeground: "0 0% 70%",
          destructive: "0 100% 50%",
          destructiveForeground: "0 0% 100%",
          border: "0 0% 30%",
          ring: "280 100% 70%",
          input: "0 0% 30%",
          card: "0 0% 15%",
          cardForeground: "0 0% 90%",
          popover: "0 0% 15%",
          popoverForeground: "0 0% 90%"
        },
        radius: "1rem"
      },
      typography: {
        sans: "Roboto, sans-serif",
        heading: "Montserrat, sans-serif"
      },
      cssVariables: {}
    };

    const styleTag = applyBrandTheme(theme);

    expect(styleTag.startsWith(":root {\n")).toBe(true);
    expect(styleTag).toContain("--primary: 280 100% 70%");
    expect(styleTag).toContain("--background: 0 0% 10%");
    expect(styleTag).toContain("--radius: 1rem");
    expect(styleTag).toContain("--font-heading: Montserrat, sans-serif");
  });
});

describe("resolveTheme", () => {
  it("should merge partial theme with defaults", () => {
    const partialTheme: Partial<BrandTheme> = {
      name: "Partial Theme",
      tokens: {
        colors: {
          primary: "199 84% 55%",
          primaryForeground: "0 0% 100%"
        } as any,
        radius: "0.75rem"
      }
    };

    const resolved = resolveTheme(partialTheme);

    expect(resolved.name).toBe("Partial Theme");
    expect(resolved.tokens.colors.primary).toBe("199 84% 55%");
    // Should have default values for non-overridden colors
    expect(resolved.tokens.colors.background).toBeDefined();
    expect(resolved.tokens.colors.foreground).toBeDefined();
  });

  it("should use defaults when no theme is provided", () => {
    const resolved = resolveTheme();

    expect(resolved.name).toBe("Default Theme");
    expect(resolved.slug).toBe("default");
    expect(resolved.tokens.colors.background).toBe("0 0% 100%");
    expect(resolved.typography.sans).toContain("Inter");
  });

  it("should preserve custom typography", () => {
    const partialTheme: Partial<BrandTheme> = {
      typography: {
        sans: "Custom Sans",
        heading: "Custom Heading"
      }
    };

    const resolved = resolveTheme(partialTheme);

    expect(resolved.typography.sans).toBe("Custom Sans");
    expect(resolved.typography.heading).toBe("Custom Heading");
  });

  it("should generate cssVariables from merged tokens", () => {
    const partialTheme: Partial<BrandTheme> = {
      tokens: {
        colors: {
          primary: "280 100% 70%"
        } as any,
        radius: "1rem"
      }
    };

    const resolved = resolveTheme(partialTheme);

    expect(resolved.cssVariables["--primary"]).toBe("280 100% 70%");
    expect(resolved.cssVariables["--radius"]).toBe("1rem");
    expect(resolved.cssVariables["--background"]).toBeDefined();
  });
});
