import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";

import { Button } from "@qp/ui";

import { BackButton } from "@admin/app/components/back-button";
import { PoolsList } from "./components/pools-list";
import { Link } from "@admin/navigation";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pools" });

  return {
    title: t("title")
  };
}

export default function PoolsPage() {
  const t = useTranslations("pools");

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton fallbackHref="/" />
          <div className="flex flex-col gap-0 [text-shadow:_2px_2px_4px_rgb(0_0_0_/_40%)]">
            <h1 className="text-primary text-3xl font-bold">{t("title")}</h1>
            <p className="text-accent">{t("description")}</p>
          </div>
        </div>
        <Button StartIcon={Plus}>
          <Link href="/pools/new">{t("create")}</Link>
        </Button>
      </header>

      <PoolsList />
    </div>
  );
}
