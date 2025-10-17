"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@qp/ui";
import { Button } from "@qp/ui";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@qp/ui";
// import { Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import type { BrandThemeInputPartial } from "@qp/branding";
import { applyBrandTheme, resolveTheme } from "@qp/branding";

interface BrandingPreviewProps {
  theme: BrandThemeInputPartial;
}

export function BrandingPreview({ theme }: BrandingPreviewProps) {
  const t = useTranslations("branding.preview");
  const [mode, setMode] = useState<"light" | "dark">("light");
  const { theme: tema } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Convert theme to BrandTheme format for resolveTheme
  const brandTheme = theme
    ? {
        name: "Preview",
        slug: "preview",
        tokens: {
          colors: {
            background: theme.colors?.background || "0 0% 100%",
            foreground: theme.colors?.foreground || "222 84% 5%",
            primary: theme.colors?.primary || "221 83% 53%",
            primaryForeground: theme.colors?.primaryForeground || "210 40% 98%",
            secondary: theme.colors?.secondary || "210 40% 96%",
            secondaryForeground: theme.colors?.secondaryForeground || "222 47% 11%",
            accent: theme.colors?.accent || "210 40% 96%",
            accentForeground: theme.colors?.accentForeground || "222 47% 11%",
            muted: theme.colors?.muted || "210 40% 96%",
            mutedForeground: theme.colors?.mutedForeground || "215 16% 47%",
            destructive: theme.colors?.destructive || "0 84% 60%",
            destructiveForeground: theme.colors?.destructiveForeground || "210 40% 98%",
            border: theme.colors?.border || "214 32% 91%",
            ring: theme.colors?.ring || "221 83% 53%",
            input: theme.colors?.input || "214 32% 91%",
            card: theme.colors?.card || "0 0% 100%",
            cardForeground: theme.colors?.cardForeground || "222 84% 5%",
            popover: theme.colors?.popover || "0 0% 100%",
            popoverForeground: theme.colors?.popoverForeground || "222 84% 5%"
          },
          radius: "0.5rem"
        },
        typography: {
          sans: theme.typography?.fontFamily || "Inter, system-ui, sans-serif",
          heading: theme.typography?.headingsFamily || theme.typography?.fontFamily || "Inter, system-ui, sans-serif"
        },
        heroAssets: theme.heroAssets
          ? {
              video: theme.heroAssets.kind === "video",
              assetUrl: theme.heroAssets.url || null,
              fallbackImageUrl: theme.heroAssets.poster || null
            }
          : undefined
      }
    : null;

  const resolved = brandTheme ? resolveTheme(brandTheme) : null;
  const cssString = resolved ? applyBrandTheme(resolved) : "";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-1">
          <CardTitle>{t("title")}</CardTitle>
          {/* <Tabs value={mode} onValueChange={(v) => setMode(v as "light" | "dark")}>
            <TabsList>
              <TabsTrigger value="light">
                <Sun className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="dark">
                <Moon className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs> */}
        </div>
      </CardHeader>
      <CardContent>
        <style dangerouslySetInnerHTML={{ __html: cssString }} />
        
        <div className={mode === "dark" ? "dark" : ""}>
          <div className="space-y-6 rounded-lg border bg-background p-6 text-foreground">
            {/* Hero Preview */}
            {theme.heroAssets && theme.heroAssets.kind !== "none" && (
              <div className="relative overflow-hidden rounded-lg">
                <div className="relative h-48 w-full">
                  {theme.heroAssets.kind === "image" && theme.heroAssets.url && (
                    <>
                      <img
                        src={theme.heroAssets.url}
                        alt={theme.heroAssets.alt || "Hero"}
                        className="h-full w-full object-cover"
                      />
                      {theme.heroAssets.overlay && (
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                      )}
                    </>
                  )}
                  {theme.heroAssets.kind === "video" && theme.heroAssets.url && (
                    <video
                      src={theme.heroAssets.url}
                      poster={theme.heroAssets.poster || undefined}
                      loop={theme.heroAssets.loop}
                      muted={theme.heroAssets.muted}
                      autoPlay={theme.heroAssets.autoplay}
                      className="h-full w-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <h2 className="text-3xl font-bold text-white drop-shadow-lg">
                        {t("heroTitle")}
                      </h2>
                      <p className="mt-2 text-white/90 drop-shadow-md">
                        {t("heroSubtitle")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Logo Preview */}
            {theme.logo?.url && (
              <div className="flex justify-center border-b pb-4">
                <img
                  src={theme.logo.url}
                  alt={theme.logo.alt || "Logo"}
                  className={`object-contain p-0 transition-all duration-300 ${mounted && tema === 'dark' ? 'invert brightness-0 dark:invert dark:brightness-100' : '' }`}
                />
              </div>
            )}

            {/* Main Card Preview */}
            <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
              {theme.mainCard && theme.mainCard.kind !== "none" && theme.mainCard.url && (
                <div className="mb-4 overflow-hidden rounded-md">
                  {theme.mainCard.kind === "image" && (
                    <img
                      src={theme.mainCard.url}
                      alt={theme.mainCard.alt || "Card media"}
                      className="h-32 w-full object-cover"
                    />
                  )}
                  {theme.mainCard.kind === "video" && (
                    <video
                      src={theme.mainCard.url}
                      poster={theme.mainCard.poster || undefined}
                      loop={theme.mainCard.loop}
                      muted={theme.mainCard.muted}
                      autoPlay={theme.mainCard.autoplay}
                      className="h-32 w-full object-cover"
                    />
                  )}
                </div>
              )}
              
              <h3 className="mb-2 text-xl font-semibold">{t("cardTitle")}</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {t("cardDescription")}
              </p>
              
              <div className="flex gap-2">
                <Button size="sm">{t("primaryButton")}</Button>
                <Button size="sm" variant="secondary">
                  {t("secondaryButton")}
                </Button>
              </div>
            </div>

            {/* Color Swatches */}
            <div className="grid grid-cols-4 gap-2">
              <div className="space-y-1">
                <div className="h-12 rounded bg-primary" />
                <p className="text-xs text-muted-foreground">{t("primary")}</p>
              </div>
              <div className="space-y-1">
                <div className="h-12 rounded bg-secondary" />
                <p className="text-xs text-muted-foreground">{t("secondary")}</p>
              </div>
              <div className="space-y-1">
                <div className="h-12 rounded bg-accent" />
                <p className="text-xs text-muted-foreground">{t("accent")}</p>
              </div>
              <div className="space-y-1">
                <div className="h-12 rounded bg-muted" />
                <p className="text-xs text-muted-foreground">{t("muted")}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
