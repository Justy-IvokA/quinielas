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
    <div className="container mx-auto py-2 max-w-5xl [text-shadow:_2px_2px_4px_rgb(0_0_0_/_40%)]">
      <div className=" flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          StartIcon={ArrowLeftIcon}
        >
          {t("back")}
        </Button>
        <h1 className="text-3xl text-primary font-bold">{t("pageTitle")}</h1>
      </div>
      <p className="text-accent">
        {t("pageDescription")}
      </p>

      <CreateTemplateWizard />
    </div>
  );
}
