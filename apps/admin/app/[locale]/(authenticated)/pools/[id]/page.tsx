import { Metadata } from "next";
import Link from "next/link";
import { Edit } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@qp/ui";

import { BackButton } from "@admin/app/components/back-button";
import { PoolDetailsTabs } from "./components/pool-details-tabs";

export const metadata: Metadata = {
  title: "Detalles del Pool"
};

interface PoolPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PoolPage({ params }: PoolPageProps) {
  const { id } = await params;
  const t = await getTranslations();

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton fallbackHref="/pools" />
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold">{t("pools.details.title")}</h1>
          </div>
        </div>
        <Button asChild StartIcon={Edit}>
          <Link href={`/pools/${id}/edit`}>{t("common.edit")}</Link>
        </Button>
      </header>

      <PoolDetailsTabs poolId={id} />
    </div>
  );
}
