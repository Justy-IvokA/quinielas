"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@qp/ui";
import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@qp/ui";

interface StepTemplateDetailsProps {
  competitionName: string;
  seasonYear: number;
  stageLabel?: string;
  roundLabel?: string;
  onSubmit: (data: {
    title: string;
    slug: string;
    description?: string;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  }) => void;
  initialData?: {
    title: string;
    slug: string;
    description?: string;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  };
}

export function StepTemplateDetails({
  competitionName,
  seasonYear,
  stageLabel,
  roundLabel,
  onSubmit,
  initialData
}: StepTemplateDetailsProps) {
  const t = useTranslations("superadmin.templates.create.wizard.steps.details");
  
  // Generate suggested values
  const suggestedTitle = `${competitionName} ${seasonYear}${stageLabel ? ` - ${stageLabel}` : ""}`;
  const suggestedSlug = suggestedTitle
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

  const [formData, setFormData] = useState({
    title: initialData?.title || suggestedTitle,
    slug: initialData?.slug || suggestedSlug,
    description: initialData?.description || "",
    status: (initialData?.status || "DRAFT") as "DRAFT" | "PUBLISHED" | "ARCHIVED"
  });

  const [slugError, setSlugError] = useState("");

  const validateSlug = (slug: string) => {
    if (!slug) {
      setSlugError(t("slugRequired"));
      return false;
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setSlugError(t("slugInvalid"));
      return false;
    }
    setSlugError("");
    return true;
  };

  useEffect(() => {
    if (formData.title && formData.slug && validateSlug(formData.slug)) {
      onSubmit(formData);
    }
  }, [formData]);

  const handleSlugChange = (value: string) => {
    setFormData({ ...formData, slug: value });
    validateSlug(value);
  };

  const autoGenerateSlug = () => {
    const generatedSlug = formData.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    
    setFormData({ ...formData, slug: generatedSlug });
    validateSlug(generatedSlug);
  };

  return (
    <div className="flex flex-col gap-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {t("hint")}
        </AlertDescription>
      </Alert>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="title">{t("titleLabel")}</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder={t("titlePlaceholder")}
            required
          />
          <p className="text-xs text-muted-foreground">{t("titleHint")}</p>
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="slug">{t("slugLabel")}</Label>
            <button
              type="button"
              onClick={autoGenerateSlug}
              className="text-xs text-primary hover:underline"
            >
              {t("autoGenerate")}
            </button>
          </div>
          <Input
            id="slug"
            value={formData.slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder={t("slugPlaceholder")}
            pattern="[a-z0-9-]+"
            required
          />
          {slugError && (
            <p className="text-xs text-destructive">{slugError}</p>
          )}
          {!slugError && (
            <p className="text-xs text-muted-foreground">{t("slugHint")}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">{t("descriptionLabel")}</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder={t("descriptionPlaceholder")}
            rows={3}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="status">{t("statusLabel")}</Label>
          <Select
            value={formData.status}
            onValueChange={(value: any) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">{t("statusDraft")}</SelectItem>
              <SelectItem value="PUBLISHED">{t("statusPublished")}</SelectItem>
              <SelectItem value="ARCHIVED">{t("statusArchived")}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{t("statusHint")}</p>
        </div>
      </div>
    </div>
  );
}
