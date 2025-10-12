import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Edit } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@qp/ui";

import { PoolDetails } from "./components/pool-details";
import { PrizesManager } from "./components/prizes-manager";

export const metadata: Metadata = {
  title: "Detalles del Pool"
};

interface PoolPageProps {
  params: {
    id: string;
  };
}

export default async function PoolPage({ params }: PoolPageProps) {
  const { id } = await params;
  const t = await getTranslations();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="minimal" size="sm">
            <Link href="/pools">
              <ArrowLeft className="h-4 w-4" />
              {t("common.back")}
            </Link>
          </Button>
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold">{t("pools.details.title")}</h1>
          </div>
        </div>
        <Button asChild StartIcon={Edit}>
          <Link href={`/pools/${id}/edit`}>{t("common.edit")}</Link>
        </Button>
      </header>

      <PoolDetails poolId={id} />
      <PrizesManager poolId={id} />
    </div>
  );
}
