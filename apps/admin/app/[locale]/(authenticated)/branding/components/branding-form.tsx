"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@qp/ui";
import { Button } from "@qp/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@qp/ui";
import { Loader2, Save, RotateCcw, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import type { BrandThemeInput, BrandThemeInputPartial } from "@qp/branding";
import { ColorsTab } from "./tabs/colors-tab";
import { LogoTab } from "./tabs/logo-tab";
import { HeroTab } from "./tabs/hero-tab";
import { MainCardTab } from "./tabs/main-card-tab";
import { TypographyTab } from "./tabs/typography-tab";

interface BrandingFormProps {
  initialTheme: BrandThemeInputPartial;
  onSave: (theme: BrandThemeInputPartial) => void;
  onReset: () => void;
  onPreviewChange: (theme: BrandThemeInputPartial) => void;
  isSaving: boolean;
  isResetting: boolean;
}

export function BrandingForm({
  initialTheme,
  onSave,
  onReset,
  onPreviewChange,
  isSaving,
  isResetting
}: BrandingFormProps) {
  const t = useTranslations("branding");
  const [theme, setTheme] = useState<BrandThemeInputPartial>(initialTheme);
  const [copied, setCopied] = useState(false);

  // Update preview on theme change
  useEffect(() => {
    onPreviewChange(theme);
  }, [theme, onPreviewChange]);

  // Sync with initial theme when it changes
  useEffect(() => {
    setTheme(initialTheme);
  }, [initialTheme]);

  const handleSave = () => {
    onSave(theme);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(theme, null, 2));
    setCopied(true);
    toast.success(t("copiedToClipboard"));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("formTitle")}</CardTitle>
        <CardDescription>{t("formDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="colors">{t("tabs.colors")}</TabsTrigger>
            <TabsTrigger value="logo">{t("tabs.logo")}</TabsTrigger>
            <TabsTrigger value="hero">{t("tabs.hero")}</TabsTrigger>
            <TabsTrigger value="mainCard">{t("tabs.mainCard")}</TabsTrigger>
            <TabsTrigger value="typography">{t("tabs.typography")}</TabsTrigger>
          </TabsList>

          <TabsContent value="colors" className="space-y-4 pt-4">
            <ColorsTab
              colors={theme.colors}
              onChange={(colors) => setTheme((prev) => ({ ...prev, colors }))}
            />
          </TabsContent>

          <TabsContent value="logo" className="space-y-4 pt-4">
            <LogoTab
              logo={theme.logo}
              logotype={theme.logotype}
              onChange={(logo, logotype) => setTheme({ ...theme, logo, logotype })}
            />
          </TabsContent>

          <TabsContent value="hero" className="space-y-4 pt-4">
            <HeroTab
              heroAssets={theme.heroAssets}
              onChange={(heroAssets) => setTheme({ ...theme, heroAssets })}
            />
          </TabsContent>

          <TabsContent value="mainCard" className="space-y-4 pt-4">
            <MainCardTab
              mainCard={theme.mainCard}
              onChange={(mainCard) => setTheme({ ...theme, mainCard })}
            />
          </TabsContent>

          <TabsContent value="typography" className="space-y-4 pt-4">
            <TypographyTab
              typography={theme.typography}
              onChange={(typography) => setTheme({ ...theme, typography })}
            />
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 border-t pt-4">
          <Button
            onClick={handleSave}
            disabled={isSaving || isResetting}
            className="flex-1"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("saving")}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {t("save")}
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={onReset}
            disabled={isSaving || isResetting}
          >
            {isResetting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("resetting")}
              </>
            ) : (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                {t("reset")}
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={handleCopyJson}
            disabled={isSaving || isResetting}
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                {t("copied")}
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                {t("copyJson")}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
