"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@qp/ui";
import { ArrowLeftIcon } from "lucide-react";
import { CreateTemplateWizard } from "./components/CreateTemplateWizard";

export default function NewTemplatePage() {
  const router = useRouter();
  const t = useTranslations("superadmin.templates.create");

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
          StartIcon={ArrowLeftIcon}
        >
          {t("back")}
        </Button>
        <h1 className="text-3xl font-bold">{t("pageTitle")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("pageDescription")}
        </p>
      </div>

      <CreateTemplateWizard />
    </div>
  );
}
