"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Label } from "@qp/ui";
import { Input } from "@qp/ui";
import { Switch } from "@qp/ui";
import { RadioGroup, RadioGroupItem } from "@qp/ui";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@admin/trpc";
import type { MainCardPartial } from "@qp/branding";

interface MainCardTabProps {
  mainCard?: MainCardPartial;
  onChange: (mainCard: MainCardPartial) => void;
}

export function MainCardTab({ mainCard, onChange }: MainCardTabProps) {
  const t = useTranslations("branding.mainCard");
  const [uploading, setUploading] = useState<"asset" | "poster" | null>(null);

  const uploadMutation = trpc.branding.uploadMedia.useMutation({
    onSuccess: (data, variables) => {
      if (variables.kind === "mainCard") {
        onChange({
          ...mainCard,
          kind: mainCard?.kind || "image",
          url: data.url
        });
      } else if (variables.kind === "poster") {
        onChange({
          ...mainCard,
          kind: mainCard?.kind || "video",
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

  const handleFileUpload = async (file: File, kind: "mainCard" | "poster") => {
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

    setUploading(kind === "mainCard" ? "asset" : "poster");

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

  const currentKind = mainCard?.kind || "none";

  return (
    <div className="space-y-6">
      {/* Kind Selection */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">{t("kindLabel")}</Label>
        <RadioGroup
          value={currentKind}
          onValueChange={(value) =>
            onChange({
              ...mainCard,
              kind: value as "image" | "video" | "none"
            } as MainCardPartial)
          }
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="none" id="card-none" />
            <Label htmlFor="card-none" className="font-normal">
              {t("kindNone")}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="image" id="card-image" />
            <Label htmlFor="card-image" className="font-normal">
              {t("kindImage")}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="video" id="card-video" />
            <Label htmlFor="card-video" className="font-normal">
              {t("kindVideo")}
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Image Configuration */}
      {currentKind === "image" && (
        <div className="space-y-4 border-t pt-4">
          <div className="space-y-2">
            <Label htmlFor="card-url">{t("imageUrl")}</Label>
            <Input
              id="card-url"
              type="url"
              value={mainCard?.url || ""}
              onChange={(e) =>
                onChange({ ...mainCard, kind: "image", url: e.target.value } as MainCardPartial)
              }
              placeholder="https://example.com/card.jpg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="card-alt">{t("altText")}</Label>
            <Input
              id="card-alt"
              type="text"
              value={mainCard?.alt || ""}
              onChange={(e) =>
                onChange({ ...mainCard, kind: "image", alt: e.target.value } as MainCardPartial)
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
                  if (file) handleFileUpload(file, "mainCard");
                }}
                disabled={uploading === "asset"}
                className="flex-1"
              />
              {uploading === "asset" && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Video Configuration */}
      {currentKind === "video" && (
        <div className="space-y-4 border-t pt-4">
          <div className="space-y-2">
            <Label htmlFor="card-video-url">{t("videoUrl")}</Label>
            <Input
              id="card-video-url"
              type="url"
              value={mainCard?.url || ""}
              onChange={(e) =>
                onChange({ ...mainCard, kind: "video", url: e.target.value } as MainCardPartial)
              }
              placeholder="https://example.com/card.mp4"
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
                  if (file) handleFileUpload(file, "mainCard");
                }}
                disabled={uploading === "asset"}
                className="flex-1"
              />
              {uploading === "asset" && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">{t("videoHint")}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="card-poster">{t("posterUrl")}</Label>
            <Input
              id="card-poster"
              type="url"
              value={mainCard?.poster || ""}
              onChange={(e) =>
                onChange({ ...mainCard, kind: "video", poster: e.target.value } as MainCardPartial)
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
              {uploading === "poster" && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="card-loop">{t("loop")}</Label>
              <Switch
                id="card-loop"
                checked={mainCard?.loop ?? true}
                onCheckedChange={(checked) =>
                  onChange({ ...mainCard, kind: "video", loop: checked } as MainCardPartial)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="card-muted">{t("muted")}</Label>
              <Switch
                id="card-muted"
                checked={mainCard?.muted ?? true}
                onCheckedChange={(checked) =>
                  onChange({ ...mainCard, kind: "video", muted: checked } as MainCardPartial)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="card-autoplay">{t("autoplay")}</Label>
              <Switch
                id="card-autoplay"
                checked={mainCard?.autoplay ?? false}
                onCheckedChange={(checked) =>
                  onChange({ ...mainCard, kind: "video", autoplay: checked } as MainCardPartial)
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
