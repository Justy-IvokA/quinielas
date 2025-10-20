"use client";

import { FullPageLoader } from "@qp/ui";
import { useTranslations } from "next-intl";

export function PageLoader() {
  const t = useTranslations("common");
  
  return <FullPageLoader text={t("loading") || "Cargando"} size="xl" />;
}
