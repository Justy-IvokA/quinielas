import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";

import { AccessPolicyManager } from "./components/access-policy-manager";

export async function generateMetadata({
  params
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const locale = await params.locale;
  const t = await getTranslations({ locale, namespace: "access" });

  return {
    title: t("title")
  };
}

export default function AccessPage() {
  const t = useTranslations("access");

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </header>

      <AccessPolicyManager />
    </div>
  );
}
