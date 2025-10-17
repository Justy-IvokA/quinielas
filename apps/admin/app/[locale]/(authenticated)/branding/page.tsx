"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { trpc as api } from "@admin/trpc";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { BrandingForm } from "./components/branding-form";
import { BrandingPreview } from "./components/branding-preview";
import type { BrandThemeInputPartial } from "@qp/branding";
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

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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

  const currentTheme = (brand.theme as BrandThemeInputPartial) || {};
  const displayTheme = previewTheme || currentTheme;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-8">
      <header className="flex items-center gap-4">
        <BackButton fallbackHref="/" />
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">{t("title")}</h1>
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
