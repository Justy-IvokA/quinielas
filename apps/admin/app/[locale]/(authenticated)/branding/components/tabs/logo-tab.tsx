"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Label } from "@qp/ui";
import { Input } from "@qp/ui";
import { Button } from "@qp/ui";
import { Alert, AlertDescription } from "@qp/ui";
import { Upload, Loader2, Image as ImageIcon, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc as api } from "@admin/trpc";
import type { LogoPartial, LogotypePartial } from "@qp/branding";

interface LogoTabProps {
  logo?: LogoPartial;
  logotype?: LogotypePartial;
  onChange: (logo?: LogoPartial, logotype?: LogotypePartial) => void;
}

export function LogoTab({ logo, logotype, onChange }: LogoTabProps) {
  const t = useTranslations("branding.logo");
  const [uploading, setUploading] = useState<"logo" | "logotype" | null>(null);

  const uploadMutation = api.branding.uploadMedia.useMutation({
    onSuccess: (data, variables) => {
      if (variables.kind === "logo") {
        onChange({ url: data.url, alt: logo?.alt }, logotype);
      } else if (variables.kind === "logotype") {
        onChange(logo, { url: data.url, alt: logotype?.alt });
      }
      toast.success(t("uploadSuccess"));
      setUploading(null);
    },
    onError: (error) => {
      toast.error(error.message || t("uploadError"));
      setUploading(null);
    }
  });

  const handleFileUpload = async (
    file: File,
    kind: "logo" | "logotype"
  ) => {
    if (!file.type.startsWith("image/")) {
      toast.error(t("invalidFileType"));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("fileTooLarge"));
      return;
    }

    setUploading(kind);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const data = base64.split(",")[1]; // Remove data:image/...;base64, prefix

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

  return (
    <div className="space-y-6">
      {/* Logo */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold">{t("logoTitle")}</Label>
          <p className="text-sm text-muted-foreground">{t("logoDescription")}</p>
        </div>

        {/* Logo URL */}
        <div className="space-y-2">
          <Label htmlFor="logo-url">{t("url")}</Label>
          <Input
            id="logo-url"
            type="url"
            value={logo?.url || ""}
            onChange={(e) => onChange({ url: e.target.value, alt: logo?.alt }, logotype)}
            placeholder="https://example.com/logo.png"
          />
        </div>

        {/* Logo Alt Text */}
        <div className="space-y-2">
          <Label htmlFor="logo-alt">{t("altText")}</Label>
          <Input
            id="logo-alt"
            type="text"
            value={logo?.alt || ""}
            onChange={(e) => onChange({ url: logo?.url || "", alt: e.target.value }, logotype)}
            placeholder={t("altPlaceholder")}
          />
        </div>

        {/* Logo Upload */}
        <div className="space-y-2">
          <Label>{t("uploadFile")}</Label>
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, "logo");
              }}
              disabled={uploading === "logo"}
              className="flex-1"
            />
            {uploading === "logo" && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("uploadHint")}
          </p>
        </div>

        {/* Logo Preview */}
        {logo?.url && (
          <div className="rounded-lg border p-4">
            <Label className="mb-2 block text-sm">{t("preview")}</Label>
            <div className="flex items-center justify-center bg-muted/30 p-4">
              <img
                src={logo.url}
                alt={logo.alt || "Logo"}
                className="max-h-32 max-w-full object-contain"
              />
            </div>
          </div>
        )}
      </div>

      {/* Logotype (Optional) */}
      <div className="space-y-4 border-t pt-6">
        <div>
          <Label className="text-base font-semibold">{t("logotypeTitle")}</Label>
          <p className="text-sm text-muted-foreground">{t("logotypeDescription")}</p>
        </div>

        {/* Logotype URL */}
        <div className="space-y-2">
          <Label htmlFor="logotype-url">{t("url")}</Label>
          <Input
            id="logotype-url"
            type="url"
            value={logotype?.url || ""}
            onChange={(e) => onChange(logo, { url: e.target.value, alt: logotype?.alt })}
            placeholder="https://example.com/logotype.png"
          />
        </div>

        {/* Logotype Alt Text */}
        <div className="space-y-2">
          <Label htmlFor="logotype-alt">{t("altText")}</Label>
          <Input
            id="logotype-alt"
            type="text"
            value={logotype?.alt || ""}
            onChange={(e) => onChange(logo, { url: logotype?.url || "", alt: e.target.value })}
            placeholder={t("altPlaceholder")}
          />
        </div>

        {/* Logotype Upload */}
        <div className="space-y-2">
          <Label>{t("uploadFile")}</Label>
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, "logotype");
              }}
              disabled={uploading === "logotype"}
              className="flex-1"
            />
            {uploading === "logotype" && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Logotype Preview */}
        {logotype?.url && (
          <div className="rounded-lg border p-4">
            <Label className="mb-2 block text-sm">{t("preview")}</Label>
            <div className="flex items-center justify-center bg-muted/30 p-4">
              <img
                src={logotype.url}
                alt={logotype.alt || "Logotype"}
                className="max-h-32 max-w-full object-contain"
              />
            </div>
          </div>
        )}
      </div>

      {/* Guidelines */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {t("guidelines")}
        </AlertDescription>
      </Alert>
    </div>
  );
}
