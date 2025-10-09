import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";

import { Button } from "@qp/ui";

import { PoolsList } from "./components/pools-list";
import { Link } from "@admin/navigation";

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string };
}): Promise<Metadata> {
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
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <Button asChild StartIcon={Plus}>
          <Link href="/pools/new">{t("create")}</Link>
        </Button>
      </header>

      <PoolsList />
    </div>
  );
}
