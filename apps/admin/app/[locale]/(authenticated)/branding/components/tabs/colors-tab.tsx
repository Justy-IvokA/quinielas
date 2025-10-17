"use client";

import { useTranslations } from "next-intl";
import { Label } from "@qp/ui";
import { Input } from "@qp/ui";
import { Button } from "@qp/ui";
import { Alert, AlertDescription } from "@qp/ui";
import { AlertTriangle, Palette } from "lucide-react";
import type { BrandColorsPartial } from "@qp/branding";
import { checkContrast } from "@qp/branding";
import { hexToHsl } from "@qp/branding";

interface ColorsTabProps {
  colors?: BrandColorsPartial;
  onChange: (colors: BrandColorsPartial) => void;
}

const colorPresets = [
  {
    name: "Blue",
    colors: {
      primary: "221 83% 53%",
      secondary: "210 40% 96%",
      accent: "210 40% 96%"
    }
  },
  {
    name: "Purple",
    colors: {
      primary: "262 83% 58%",
      secondary: "270 40% 96%",
      accent: "270 40% 96%"
    }
  },
  {
    name: "Green",
    colors: {
      primary: "142 76% 36%",
      secondary: "138 40% 96%",
      accent: "138 40% 96%"
    }
  },
  {
    name: "Orange",
    colors: {
      primary: "25 95% 53%",
      secondary: "24 40% 96%",
      accent: "24 40% 96%"
    }
  }
];

export function ColorsTab({ colors = {}, onChange }: ColorsTabProps) {
  const t = useTranslations("branding.colors");

  const handleColorChange = (key: keyof BrandColorsPartial, value: string) => {
    // Convert hex to HSL if needed
    let hslValue = value;
    if (value.startsWith("#")) {
      hslValue = hexToHsl(value);
    }
    onChange({ ...colors, [key]: hslValue });
  };

  const applyPreset = (preset: typeof colorPresets[0]) => {
    onChange({ ...colors, ...preset.colors });
  };

  // Check contrast between foreground and background
  const contrastCheck = colors.foreground && colors.background
    ? checkContrast(colors.foreground, colors.background)
    : null;

  return (
    <div className="space-y-6">
      {/* Presets */}
      <div>
        <Label className="mb-2 flex items-center gap-2">
          <Palette className="h-4 w-4" />
          {t("presets")}
        </Label>
        <div className="flex flex-wrap gap-2">
          {colorPresets.map((preset) => (
            <Button
              key={preset.name}
              variant="outline"
              size="sm"
              onClick={() => applyPreset(preset)}
            >
              {preset.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Contrast Warning */}
      {contrastCheck && !contrastCheck.meetsAA && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{contrastCheck.warning}</AlertDescription>
        </Alert>
      )}

      {/* Color Inputs */}
      <div className="grid gap-4 sm:grid-cols-2">
        <ColorInput
          label={t("primary")}
          value={colors.primary || ""}
          onChange={(value) => handleColorChange("primary", value)}
        />
        <ColorInput
          label={t("secondary")}
          value={colors.secondary || ""}
          onChange={(value) => handleColorChange("secondary", value)}
        />
        <ColorInput
          label={t("background")}
          value={colors.background || ""}
          onChange={(value) => handleColorChange("background", value)}
        />
        <ColorInput
          label={t("foreground")}
          value={colors.foreground || ""}
          onChange={(value) => handleColorChange("foreground", value)}
        />
        <ColorInput
          label={t("accent")}
          value={colors.accent || ""}
          onChange={(value) => handleColorChange("accent", value)}
        />
        <ColorInput
          label={t("card")}
          value={colors.card || ""}
          onChange={(value) => handleColorChange("card", value)}
          optional
        />
        <ColorInput
          label={t("muted")}
          value={colors.muted || ""}
          onChange={(value) => handleColorChange("muted", value)}
          optional
        />
        <ColorInput
          label={t("border")}
          value={colors.border || ""}
          onChange={(value) => handleColorChange("border", value)}
          optional
        />
      </div>

      {/* Help Text */}
      <p className="text-sm text-muted-foreground">
        {t("helpText")}
      </p>
    </div>
  );
}

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
}

function ColorInput({ label, value, onChange, optional }: ColorInputProps) {
  // Convert HSL to hex for color picker
  const hexValue = value.startsWith("#") ? value : "#3b82f6"; // Default blue

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {optional && <span className="ml-1 text-xs text-muted-foreground">(optional)</span>}
      </Label>
      <div className="flex gap-2">
        <Input
          type="color"
          value={hexValue}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-16 cursor-pointer"
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="221 83% 53%"
          className="flex-1"
        />
      </div>
    </div>
  );
}
