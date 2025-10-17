"use client";

import { useTranslations } from "next-intl";
import { Label } from "@qp/ui";
import { Input } from "@qp/ui";
import { Alert, AlertDescription } from "@qp/ui";
import { Info } from "lucide-react";
import type { Typography, TypographyPartial } from "@qp/branding";

interface TypographyTabProps {
  typography?: TypographyPartial;
  onChange: (typography: TypographyPartial) => void;
}

const fontPresets = [
  { name: "Inter", value: "Inter, system-ui, sans-serif" },
  { name: "Roboto", value: "Roboto, system-ui, sans-serif" },
  { name: "Poppins", value: "Poppins, system-ui, sans-serif" },
  { name: "Montserrat", value: "Montserrat, system-ui, sans-serif" },
  { name: "Open Sans", value: "'Open Sans', system-ui, sans-serif" },
  { name: "Lato", value: "Lato, system-ui, sans-serif" }
];

export function TypographyTab({ typography, onChange }: TypographyTabProps) {
  const t = useTranslations("branding.typography");

  const handleChange = (field: keyof TypographyPartial, value: string) => {
    onChange({
      fontFamily: typography?.fontFamily || "Inter, system-ui, sans-serif",
      baseSize: typography?.baseSize || "16px",
      lineHeight: typography?.lineHeight || "1.5",
      ...typography,
      [field]: value
    });
  };

  return (
    <div className="space-y-6">
      {/* Font Family */}
      <div className="space-y-3">
        <Label htmlFor="font-family" className="text-base font-semibold">
          {t("fontFamily")}
        </Label>
        <Input
          id="font-family"
          type="text"
          value={typography?.fontFamily || ""}
          onChange={(e) => handleChange("fontFamily", e.target.value)}
          placeholder="Inter, system-ui, sans-serif"
        />
        <div className="flex flex-wrap gap-2">
          {fontPresets.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => handleChange("fontFamily", preset.value)}
              className="rounded-md border px-3 py-1 text-sm hover:bg-muted"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Headings Font Family */}
      <div className="space-y-3">
        <Label htmlFor="headings-family" className="text-base font-semibold">
          {t("headingsFamily")}
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            {t("optional")}
          </span>
        </Label>
        <Input
          id="headings-family"
          type="text"
          value={typography?.headingsFamily || ""}
          onChange={(e) => handleChange("headingsFamily", e.target.value)}
          placeholder={typography?.fontFamily || "Inter, system-ui, sans-serif"}
        />
        <p className="text-sm text-muted-foreground">{t("headingsFamilyHint")}</p>
      </div>

      {/* Base Size */}
      <div className="space-y-3">
        <Label htmlFor="base-size" className="text-base font-semibold">
          {t("baseSize")}
        </Label>
        <Input
          id="base-size"
          type="text"
          value={typography?.baseSize || ""}
          onChange={(e) => handleChange("baseSize", e.target.value)}
          placeholder="16px"
        />
        <p className="text-sm text-muted-foreground">{t("baseSizeHint")}</p>
      </div>

      {/* Line Height */}
      <div className="space-y-3">
        <Label htmlFor="line-height" className="text-base font-semibold">
          {t("lineHeight")}
        </Label>
        <Input
          id="line-height"
          type="text"
          value={typography?.lineHeight || ""}
          onChange={(e) => handleChange("lineHeight", e.target.value)}
          placeholder="1.5"
        />
        <p className="text-sm text-muted-foreground">{t("lineHeightHint")}</p>
      </div>

      {/* Preview */}
      <div className="space-y-3 border-t pt-6">
        <Label className="text-base font-semibold">{t("preview")}</Label>
        <div
          className="rounded-lg border p-6"
          style={{
            fontFamily: typography?.fontFamily || "Inter, system-ui, sans-serif",
            fontSize: typography?.baseSize || "16px",
            lineHeight: typography?.lineHeight || "1.5"
          }}
        >
          <h1
            className="mb-2 text-3xl font-bold"
            style={{
              fontFamily: typography?.headingsFamily || typography?.fontFamily || "Inter, system-ui, sans-serif"
            }}
          >
            {t("previewHeading")}
          </h1>
          <p className="text-muted-foreground">{t("previewBody")}</p>
        </div>
      </div>

      {/* Google Fonts Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <p className="mb-2 font-medium">{t("googleFontsTitle")}</p>
          <p className="text-sm">{t("googleFontsDescription")}</p>
          <code className="mt-2 block rounded bg-muted p-2 text-xs">
            {`<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">`}
          </code>
        </AlertDescription>
      </Alert>
    </div>
  );
}
