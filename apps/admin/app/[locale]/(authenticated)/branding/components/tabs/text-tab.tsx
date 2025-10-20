"use client";

import { useTranslations } from "next-intl";
import { Label } from "@qp/ui";
import { Input } from "@qp/ui";
import { Textarea } from "@qp/ui";
import type { BrandText } from "@qp/branding";

interface TextTabProps {
  text?: BrandText;
  onChange: (text: BrandText) => void;
}

const MAX_LENGTHS = {
  title: 30,
  description: 255,
  slogan: 75,
  paragraph: 375,
  link: 50
};

export function TextTab({ text, onChange }: TextTabProps) {
  const t = useTranslations("branding.tabs.text");

  const handleChange = (field: keyof BrandText, value: string) => {
    onChange({
      ...text,
      [field]: value
    });
  };

  const getCharCount = (value: string | undefined) => value?.length || 0;

  const getCounterColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 90) return "text-destructive";
    if (percentage >= 75) return "text-orange-500";
    return "text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="text-title">{t("title.label")}</Label>
          <span className={`text-xs ${getCounterColor(getCharCount(text?.title), MAX_LENGTHS.title)}`}>
            {getCharCount(text?.title)}/{MAX_LENGTHS.title}
          </span>
        </div>
        <Input
          id="text-title"
          placeholder={t("title.placeholder")}
          value={text?.title || ""}
          onChange={(e) => handleChange("title", e.target.value)}
          maxLength={MAX_LENGTHS.title}
        />
        <p className="text-xs text-muted-foreground">
          {t("title.description")}
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="text-description">{t("description.label")}</Label>
          <span className={`text-xs ${getCounterColor(getCharCount(text?.description), MAX_LENGTHS.description)}`}>
            {getCharCount(text?.description)}/{MAX_LENGTHS.description}
          </span>
        </div>
        <Textarea
          id="text-description"
          placeholder={t("description.placeholder")}
          value={text?.description || ""}
          onChange={(e) => handleChange("description", e.target.value)}
          maxLength={MAX_LENGTHS.description}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          {t("description.description")}
        </p>
      </div>

      {/* Slogan */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="text-slogan">{t("slogan.label")}</Label>
          <span className={`text-xs ${getCounterColor(getCharCount(text?.slogan), MAX_LENGTHS.slogan)}`}>
            {getCharCount(text?.slogan)}/{MAX_LENGTHS.slogan}
          </span>
        </div>
        <Input
          id="text-slogan"
          placeholder={t("slogan.placeholder")}
          value={text?.slogan || ""}
          onChange={(e) => handleChange("slogan", e.target.value)}
          maxLength={MAX_LENGTHS.slogan}
        />
        <p className="text-xs text-muted-foreground">
          {t("slogan.description")}
        </p>
      </div>

      {/* Paragraph */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="text-paragraph">{t("paragraph.label")}</Label>
          <span className={`text-xs ${getCounterColor(getCharCount(text?.paragraph), MAX_LENGTHS.paragraph)}`}>
            {getCharCount(text?.paragraph)}/{MAX_LENGTHS.paragraph}
          </span>
        </div>
        <Textarea
          id="text-paragraph"
          placeholder={t("paragraph.placeholder")}
          value={text?.paragraph || ""}
          onChange={(e) => handleChange("paragraph", e.target.value)}
          maxLength={MAX_LENGTHS.paragraph}
          rows={5}
        />
        <p className="text-xs text-muted-foreground">
          {t("paragraph.description")}
        </p>
      </div>

      {/* Link */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="text-link">{t("link.label")}</Label>
          <span className={`text-xs ${getCounterColor(getCharCount(text?.link), MAX_LENGTHS.link)}`}>
            {getCharCount(text?.link)}/{MAX_LENGTHS.link}
          </span>
        </div>
        <Input
          id="text-link"
          type="url"
          placeholder={t("link.placeholder")}
          value={text?.link || ""}
          onChange={(e) => handleChange("link", e.target.value)}
          maxLength={MAX_LENGTHS.link}
        />
        <p className="text-xs text-muted-foreground">
          {t("link.description")}
        </p>
      </div>
    </div>
  );
}
