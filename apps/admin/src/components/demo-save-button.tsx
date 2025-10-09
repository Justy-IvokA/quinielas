"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Separator,
  Alert,
  AlertTitle,
  AlertDescription,
  toastSuccess,
  toastError,
  toastPromise
} from "@qp/ui";
import { Save, Settings } from "lucide-react";

/**
 * Demo component for apps/admin showing toast usage with async operations
 */
export function DemoSaveButton() {
  const t = useTranslations("demo");
  const [isSaving, setIsSaving] = useState(false);
  const [poolName, setPoolName] = useState("");
  const [accessType, setAccessType] = useState("public");

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toastSuccess(t("toasts.successTitle"), {
        description: t("toasts.successDescription")
      });
    } catch (error) {
      toastError(t("toasts.errorTitle"), {
        description: t("toasts.errorDescription")
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveWithPromise = () => {
    const savePromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        // Randomly succeed or fail for demo
        Math.random() > 0.3 ? resolve("OK") : reject(new Error("Failed"));
      }, 2000);
    });

    toastPromise(savePromise, {
      loading: t("toasts.loading"),
      success: t("toasts.success"),
      error: t("toasts.error")
    });
  };

  return (
    <Card variant="default">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <CardTitle>{t("cardTitle")}</CardTitle>
        </div>
        <CardDescription>{t("cardDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="info">
          <AlertTitle>{t("bannerTitle")}</AlertTitle>
          <AlertDescription>{t("bannerDescription")}</AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="pool-name">{t("poolNameLabel")}</Label>
          <Input
            id="pool-name"
            placeholder={t("poolNamePlaceholder")}
            value={poolName}
            onChange={(e) => setPoolName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="access-type">{t("accessTypeLabel")}</Label>
          <Select value={accessType} onValueChange={setAccessType}>
            <SelectTrigger id="access-type">
              <SelectValue placeholder={t("accessTypePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">{t("accessTypeOptions.public")}</SelectItem>
              <SelectItem value="code">{t("accessTypeOptions.code")}</SelectItem>
              <SelectItem value="invite">{t("accessTypeOptions.invite")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="text-sm text-muted-foreground">{t("helper")}</div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          onClick={handleSave}
          loading={isSaving}
          StartIcon={Save}
        >
          {t("buttons.manual")}
        </Button>
        <Button
          onClick={handleSaveWithPromise}
          variant="secondary"
          StartIcon={Save}
        >
          {t("buttons.promise")}
        </Button>
      </CardFooter>
    </Card>
  );
}
