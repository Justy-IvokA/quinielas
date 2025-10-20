"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Label } from "@qp/ui";
import { Input } from "@qp/ui";
import { Switch } from "@qp/ui";
import { RadioGroup, RadioGroupItem } from "@qp/ui";
import { SportsLoader } from "@qp/ui";
import { toast } from "sonner";
import { trpc as api } from "@admin/trpc";
import type { HeroAssetsPartial } from "@qp/branding";

interface HeroTabProps {
  heroAssets?: HeroAssetsPartial;
  onChange: (heroAssets: HeroAssetsPartial) => void;
}

export function HeroTab({ heroAssets, onChange }: HeroTabProps) {
  const t = useTranslations("branding.hero");
  const [uploading, setUploading] = useState<"asset" | "poster" | null>(null);

  const uploadMutation = api.branding.uploadMedia.useMutation({
    onSuccess: (data, variables) => {
      if (variables.kind === "hero") {
        onChange({
          ...heroAssets,
          kind: heroAssets?.kind || "image",
          url: data.url
        });
      } else if (variables.kind === "poster") {
        onChange({
          ...heroAssets,
          kind: heroAssets?.kind || "video",
          poster: data.url
        });
      }
      toast.success(t("uploadSuccess"));
      setUploading(null);
    },
    onError: (error) => {
      toast.error(error.message || t("uploadError"));
      setUploading(null);
    }
  });

  const handleFileUpload = async (file: File, kind: "hero" | "poster") => {
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isVideo && !isImage) {
      toast.error(t("invalidFileType"));
      return;
    }

    const maxSize = isVideo ? 20 * 1024 * 1024 : 2 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(t("fileTooLarge"));
      return;
    }

    setUploading(kind === "hero" ? "asset" : "poster");

    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const data = base64.split(",")[1];

        uploadMutation.mutate({
          kind,
          filename: file.name,
          contentType: file.type,
          size: file.size,
          data
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error(t("uploadError"));
      setUploading(null);
    }
  };

  const currentKind = heroAssets?.kind || "none";

  return (
    <div className="space-y-6">
      {/* Kind Selection */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">{t("kindLabel")}</Label>
        <RadioGroup
          value={currentKind}
          onValueChange={(value) =>
            onChange({
              ...heroAssets,
              kind: value as "image" | "video" | "none"
            } as HeroAssetsPartial)
          }
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="none" id="hero-none" />
            <Label htmlFor="hero-none" className="font-normal">
              {t("kindNone")}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="image" id="hero-image" />
            <Label htmlFor="hero-image" className="font-normal">
              {t("kindImage")}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="video" id="hero-video" />
            <Label htmlFor="hero-video" className="font-normal">
              {t("kindVideo")}
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Image Configuration */}
      {currentKind === "image" && (
        <div className="space-y-4 border-t pt-4">
          <div className="space-y-2">
            <Label htmlFor="hero-url">{t("imageUrl")}</Label>
            <Input
              id="hero-url"
              type="url"
              value={heroAssets?.url || ""}
              onChange={(e) =>
                onChange({ ...heroAssets, kind: "image", url: e.target.value } as HeroAssetsPartial)
              }
              placeholder="https://example.com/hero.jpg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hero-alt">{t("altText")}</Label>
            <Input
              id="hero-alt"
              type="text"
              value={heroAssets?.alt || ""}
              onChange={(e) =>
                onChange({ ...heroAssets, kind: "image", alt: e.target.value } as HeroAssetsPartial)
              }
              placeholder={t("altPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("uploadFile")}</Label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, "hero");
                }}
                disabled={uploading === "asset"}
                className="flex-1"
              />
              {uploading === "asset" && <SportsLoader size="sm" />}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="hero-overlay">{t("overlay")}</Label>
            <Switch
              id="hero-overlay"
              checked={heroAssets?.overlay || false}
              onCheckedChange={(checked) =>
                onChange({ ...heroAssets, kind: "image", overlay: checked } as HeroAssetsPartial)
              }
            />
          </div>
        </div>
      )}

      {/* Video Configuration */}
      {currentKind === "video" && (
        <div className="space-y-4 border-t pt-4">
          <div className="space-y-2">
            <Label htmlFor="hero-video-url">{t("videoUrl")}</Label>
            <Input
              id="hero-video-url"
              type="url"
              value={heroAssets?.url || ""}
              onChange={(e) =>
                onChange({ ...heroAssets, kind: "video", url: e.target.value } as HeroAssetsPartial)
              }
              placeholder="https://example.com/hero.mp4"
            />
          </div>

          <div className="space-y-2">
            <Label>{t("uploadFile")}</Label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="video/mp4,video/webm"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, "hero");
                }}
                disabled={uploading === "asset"}
                className="flex-1"
              />
              {uploading === "asset" && <SportsLoader size="sm" />}
            </div>
            <p className="text-xs text-muted-foreground">{t("videoHint")}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hero-poster">{t("posterUrl")}</Label>
            <Input
              id="hero-poster"
              type="url"
              value={heroAssets?.poster || ""}
              onChange={(e) =>
                onChange({ ...heroAssets, kind: "video", poster: e.target.value } as HeroAssetsPartial)
              }
              placeholder="https://example.com/poster.jpg"
            />
          </div>

          <div className="space-y-2">
            <Label>{t("uploadPoster")}</Label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, "poster");
                }}
                disabled={uploading === "poster"}
                className="flex-1"
              />
              {uploading === "poster" && <SportsLoader size="sm" />}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="hero-loop">{t("loop")}</Label>
              <Switch
                id="hero-loop"
                checked={heroAssets?.loop ?? true}
                onCheckedChange={(checked) =>
                  onChange({ ...heroAssets, kind: "video", loop: checked } as HeroAssetsPartial)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="hero-muted">{t("muted")}</Label>
              <Switch
                id="hero-muted"
                checked={heroAssets?.muted ?? true}
                onCheckedChange={(checked) =>
                  onChange({ ...heroAssets, kind: "video", muted: checked } as HeroAssetsPartial)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="hero-autoplay">{t("autoplay")}</Label>
              <Switch
                id="hero-autoplay"
                checked={heroAssets?.autoplay ?? true}
                onCheckedChange={(checked) =>
                  onChange({ ...heroAssets, kind: "video", autoplay: checked } as HeroAssetsPartial)
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
