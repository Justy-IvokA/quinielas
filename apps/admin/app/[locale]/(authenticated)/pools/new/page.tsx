import { Metadata } from "next";
import { useTranslations } from "next-intl";
import { BackButton } from "@admin/app/components/back-button";

import { CreatePoolWizard } from "./components/CreatePoolWizard";

export const metadata: Metadata = {
  title: "Crear Quiniela"
};

export default function NewPoolPage() {
  const t = useTranslations("pools.new");

  return (
    <div className="flex flex-col gap-6 [text-shadow:_2px_2px_4px_rgb(0_0_0_/_80%)]">
      {/* Header Card */}
      <div className="flex flex-col gap-8">
        <header className="flex items-center gap-4">
          <BackButton fallbackHref="/" />
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold text-primary">{t("title")}</h1>
            <p className="text-muted-foreground">
              {t("description")}
            </p>
          </div>
        </header>
      </div>

      {/* Wizard Container */}
      <div className="rounded-2xl border border-border/70 bg-card/60 shadow-sm backdrop-blur">
        <CreatePoolWizard />
      </div>
    </div>
  );
}
