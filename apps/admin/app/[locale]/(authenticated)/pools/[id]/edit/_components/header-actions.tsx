"use client";

import { useState } from "react";
import { Copy, CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button, toastSuccess, toastError } from "@qp/ui";
import { trpc } from "@admin/trpc";

interface HeaderActionsProps {
  poolId: string;
}

export function HeaderActions({ poolId }: HeaderActionsProps) {
  const t = useTranslations("pools");
  const [copied, setCopied] = useState(false);

  const { data: pool } = trpc.pools.getById.useQuery({ id: poolId });

  const handleCopyUrl = async () => {
    if (!pool?.brand?.domains?.[0] || !pool.slug) {
      toastError("No se puede generar URL: falta dominio o slug");
      return;
    }

    const domain = pool.brand.domains[0];
    const url = `https://${domain}/${pool.slug}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toastSuccess(t("actions.urlCopied"));
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toastError("Error al copiar URL");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="default"
        size="sm"
        StartIcon={copied ? CheckCircle : Copy}
        onClick={handleCopyUrl}
        disabled={!pool?.brand?.domains?.[0] || !pool.slug}
      >
        {pool?.accessPolicy?.accessType === "PUBLIC" ? t("actions.copyPublicUrl") : pool?.accessPolicy?.accessType === "CODE" ? t("actions.copyUrl") : t("actions.copyUrl")}
      </Button>
    </div>
  );
}
