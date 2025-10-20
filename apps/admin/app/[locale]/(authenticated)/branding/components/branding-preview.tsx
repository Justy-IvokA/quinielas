"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@qp/ui";
import { Button } from "@qp/ui";
import { Input } from "@qp/ui";
import { Checkbox } from "@qp/ui";
import { Label } from "@qp/ui";
import { Sparkles, Trophy } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import type { BrandThemeInputPartial } from "@qp/branding";
import { applyBrandTheme, resolveTheme } from "@qp/branding";

interface BrandingPreviewProps {
  theme: BrandThemeInputPartial;
}

export function BrandingPreview({ theme }: BrandingPreviewProps) {
  const t = useTranslations("branding");
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
    <Card className="bg-transparent backdrop-blur-xl border-border/50 shadow-2xl [text-shadow:_2px_2px_4px_rgb(0_0_0_/_80%)]">
      <CardHeader>
        <div className="flex items-center justify-center mb-2">
          <CardTitle>{t("preview.title")}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <style dangerouslySetInnerHTML={{ __html: cssString }} />
        <div className={mode === "dark" ? "dark" : ""}>
          {/* Registration Card Preview */}
          <div className="relative min-h-[600px]">
            <div className="relative w-full max-w-3xl">
              <div className="grid md:grid-cols-[45%,55%] rounded-2xl overflow-hidden shadow-2xl h-auto md:h-[600px]">
                                
                {/* LEFT SIDE - Hero Image/Video */}
                <div className="relative h-48 md:h-auto bg-gradient-to-br from-primary to-accent">
                  {theme.mainCard && theme.mainCard.kind !== "none" && theme.mainCard.url ? (
                    theme.mainCard.kind === "video" ? (
                      <video
                        src={theme.mainCard.url}
                        poster={theme.mainCard.poster || undefined}
                        loop={theme.mainCard.loop}
                        muted={theme.mainCard.muted}
                        autoPlay={theme.mainCard.autoplay}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={theme.mainCard.url}
                        alt={theme.mainCard.alt || "Card"}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center p-8">
                      <Trophy className="w-24 h-24 text-primary-foreground/80" strokeWidth={1.5} />
                    </div>
                  )}
                  
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  
                  {/* Content overlay */}
                  {theme.text?.title && (
                    <div className="absolute top-2 left-4 text-white">
                      <h2 className="text-md md:text-xl font-bold text-secondary">
                        {theme.text.title}
                      </h2>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-0 right-0 p-2 text-white">
                    <h2 className="text-lg md:text-xl font-bold mb-0 text-primary">
                      {t("preview.poolName") || "Nombre Quiniela"}
                    </h2>
                    <p className="text-xs md:text-xs text-white/90">
                      {t("preview.poolDescription") || "Descripcion que registraste al crear la quiniela."}
                    </p>
                  </div>
                </div>

                {/* RIGHT SIDE - Registration Form */}
                <div className="p-2 md:p-2 flex flex-col justify-center backdrop-blur-xl bg-white/20 dark:bg-gray-900/20 border-l border-white/20 dark:border-gray-700/50">
                  {theme.logo?.url && (
                    <div className="flex items-center justify-center mb-4">
                      <img
                        src={theme.logo.url}
                        alt={theme.logo.alt || "Logo"}
                        className={`h-auto w-auto object-contain ${mounted && tema === 'dark' ? 'invert brightness-0 dark:invert dark:brightness-100' : ''}`}
                      />
                    </div>
                  )}
                  
                  {theme.text?.slogan && (
                    <div className="text-xs text-secondary text-center mb-3 -mt-4">
                      {theme.text.slogan}
                    </div>
                  )}

                  {theme.text?.description && (
                    <div className="text-xs text-foreground text-justify mb-3">
                      {theme.text.description}
                    </div>
                  )}
                  
                  <div className="mb-1">
                    <h2 className="text-lg font-bold text-accent mb-1">
                      {t("preview.formTitle") || "Registro"}
                    </h2>
                  </div>

                  <div className="space-y-1">
                    {/* Invite Code */}
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">{t("preview.codeLabel") || "Código de Invitación"}</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="ABCD1234"
                          className="h-8 text-sm"
                        />
                        <Button size="sm" className="h-8 px-3">
                          {t("preview.validate") || "Validar"}
                        </Button>
                      </div>
                    </div>

                    {/* Name */}
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">{t("preview.nameLabel") || "Nombre Completo"}</Label>
                      <Input placeholder="ej: Lindsey Wilson" className="h-8 text-sm" />
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">{t("preview.emailLabel") || "Tu Email"}</Label>
                      <Input type="email" placeholder="example@email.com" className="h-8 text-sm" />
                    </div>

                    {/* Terms */}
                    <div className="flex items-start space-x-2">
                      <Checkbox className="mt-0.5" />
                      <Label className="text-xs text-muted-foreground cursor-pointer">
                        {t("preview.termsLabel") || "Acepto los términos y condiciones"}
                      </Label>
                    </div>

                    {/* Submit Button */}
                    <Button className="w-full h-8 text-sm font-semibold">
                      {t("preview.submitButton") || "Registrarse"}
                    </Button>
                  </div>

                  {theme.text?.link && (
                    <Button variant="link" className="text-xs mt-2" size="sm" StartIcon={Sparkles} EndIcon={Sparkles}>
                      {t("preview.learnMore") || "Conoce más"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
