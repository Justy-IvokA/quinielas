"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { trpc as api } from "@admin/trpc";
import { toast } from "sonner";
import { SportsLoader } from "@qp/ui";
import { BrandingForm } from "./components/branding-form";
import { BrandingPreview } from "./components/branding-preview";
import type { BrandThemeInputPartial } from "@qp/branding";
import { applyBrandTheme, resolveTheme } from "@qp/branding";
import { BackButton } from "@admin/app/components/back-button";

export default function BrandingPage() {
  const t = useTranslations("branding");
  const [previewTheme, setPreviewTheme] = useState<BrandThemeInputPartial | null>(null);

  // Fetch current brand
  const { data: brand, isLoading, refetch } = api.branding.getCurrentBrand.useQuery();

  // Update mutation
  const updateMutation = api.branding.updateBrandTheme.useMutation({
    onSuccess: () => {
      toast.success(t("saveSuccess"));
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || t("saveError"));
    }
  });

  // Reset mutation
  const resetMutation = api.branding.resetTheme.useMutation({
    onSuccess: () => {
      toast.success(t("resetSuccess"));
      refetch();
      setPreviewTheme(null);
    },
    onError: (error) => {
      toast.error(error.message || t("resetError"));
    }
  });

  const handleSave = (theme: BrandThemeInputPartial) => {
    updateMutation.mutate({ theme });
  };

  const handleReset = () => {
    if (confirm(t("resetConfirm"))) {
      resetMutation.mutate({});
    }
  };

  const handlePreviewChange = (theme: BrandThemeInputPartial) => {
    setPreviewTheme(theme);
  };

  // Get current theme from brand
  const currentTheme = (brand?.theme as BrandThemeInputPartial) || {};

  // Inject preview theme into the page in real-time
  useEffect(() => {
    if (!brand) return;
    
    const themeToApply = previewTheme || currentTheme;
    
    // Convert BrandThemeInputPartial to BrandTheme format
    const brandTheme = {
      name: "Live Preview",
      slug: "live-preview",
      tokens: {
        colors: {
          background: themeToApply.colors?.background || "0 0% 100%",
          foreground: themeToApply.colors?.foreground || "222 84% 5%",
          primary: themeToApply.colors?.primary || "221 83% 53%",
          primaryForeground: themeToApply.colors?.primaryForeground || "210 40% 98%",
          secondary: themeToApply.colors?.secondary || "210 40% 96%",
          secondaryForeground: themeToApply.colors?.secondaryForeground || "222 47% 11%",
          accent: themeToApply.colors?.accent || "210 40% 96%",
          accentForeground: themeToApply.colors?.accentForeground || "222 47% 11%",
          muted: themeToApply.colors?.muted || "210 40% 96%",
          mutedForeground: themeToApply.colors?.mutedForeground || "215 16% 47%",
          destructive: themeToApply.colors?.destructive || "0 84% 60%",
          destructiveForeground: themeToApply.colors?.destructiveForeground || "210 40% 98%",
          border: themeToApply.colors?.border || "214 32% 91%",
          ring: themeToApply.colors?.ring || "221 83% 53%",
          input: themeToApply.colors?.input || "214 32% 91%",
          card: themeToApply.colors?.card || "0 0% 100%",
          cardForeground: themeToApply.colors?.cardForeground || "222 84% 5%",
          popover: themeToApply.colors?.popover || "0 0% 100%",
          popoverForeground: themeToApply.colors?.popoverForeground || "222 84% 5%"
        },
        radius: "0.5rem"
      },
      // Auto-generate dark theme tokens based on light theme
      darkTokens: {
        colors: {
          // Dark backgrounds
          background: "222 47% 11%",
          foreground: "210 40% 98%",
          card: "222 47% 11%",
          cardForeground: "210 40% 98%",
          popover: "222 47% 11%",
          popoverForeground: "210 40% 98%",
          // Keep brand colors but ensure good contrast
          primary: themeToApply.colors?.primary || "217 91% 60%",
          primaryForeground: "222 47% 11%",
          secondary: themeToApply.colors?.secondary || "217 33% 17%",
          secondaryForeground: "210 40% 98%",
          accent: themeToApply.colors?.accent || "217 33% 17%",
          accentForeground: "210 40% 98%",
          // Dark mode UI colors
          muted: "217 33% 17%",
          mutedForeground: "215 20% 65%",
          border: "217 33% 17%",
          input: "217 33% 17%",
          ring: themeToApply.colors?.primary || "224 76% 48%",
          destructive: themeToApply.colors?.destructive || "0 84% 60%",
          destructiveForeground: "210 40% 98%"
        }
      },
      typography: {
        sans: themeToApply.typography?.fontFamily || "Inter, system-ui, sans-serif",
        heading: themeToApply.typography?.headingsFamily || themeToApply.typography?.fontFamily || "Inter, system-ui, sans-serif"
      }
    };

    const resolved = resolveTheme(brandTheme);
    let css = applyBrandTheme(resolved);
    
    // Replace html:root with html:root:root for higher specificity
    // This ensures the preview theme overrides the layout theme
    css = css.replace(/html:root/g, 'html:root:root');
    // Also increase specificity for dark mode
    css = css.replace(/html\.dark/g, 'html.dark:root');

    // Inject or update the style tag
    let styleTag = document.getElementById("brand-theme-live-preview");
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = "brand-theme-live-preview";
      document.head.appendChild(styleTag);
    }
    styleTag.textContent = css;

    // Cleanup on unmount
    return () => {
      const tag = document.getElementById("brand-theme-live-preview");
      if (tag) {
        tag.remove();
      }
    };
  }, [previewTheme, brand?.theme]);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <SportsLoader size="lg" text={t("loading") || "Cargando"} />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-muted-foreground">{t("noBrand")}</p>
        </div>
      </div>
    );
  }

  const displayTheme = previewTheme || currentTheme;

  return (
    <div className="space-y-6 [text-shadow:_2px_2px_4px_rgb(0_0_0_/_80%)]">
      {/* Header */}
      <div className="flex flex-col gap-8">
        <header className="flex items-center gap-4">
          <BackButton fallbackHref="/" />
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold text-primary">{t("title")}</h1>
            <p className="text-muted-foreground">
              {t("description")}
            </p>
          </div>
        </header>
      </div>

      {/* Main Content: Form + Preview */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Form Editor */}
        <div className="space-y-4">
          <BrandingForm
            initialTheme={currentTheme}
            onSave={handleSave}
            onReset={handleReset}
            onPreviewChange={handlePreviewChange}
            isSaving={updateMutation.isPending}
            isResetting={resetMutation.isPending}
          />
        </div>

        {/* Right: Live Preview */}
        <div className="lg:sticky lg:top-6 lg:h-fit">
          <BrandingPreview theme={displayTheme} />
        </div>
      </div>
    </div>
  );
}
