"use client";

import { useTranslations } from "next-intl";

import { Button, ThemeToggle } from "@qp/ui";

import { Link } from "@admin/navigation";
import { trpc } from "@admin/trpc";

interface DashboardWelcomeProps {
  tenantName: string;
  brandName: string;
}

export function DashboardWelcome({ tenantName, brandName }: DashboardWelcomeProps) {
  const t = useTranslations("dashboard");
  const { data } = trpc.health.useQuery();

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/60 p-8 shadow-sm backdrop-blur">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          {data?.ok ? t("statusOnline") : t("statusCheck")}
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          {t("welcome", { tenant: tenantName })}
        </h1>
        <p className="mt-1 text-base text-muted-foreground">
          {t("subtitle", { brand: brandName })}
        </p>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button asChild>
          <Link href="/pools/new">{t("createPool")}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/brands">{t("manageBrands")}</Link>
        </Button>
        <ThemeToggle />
      </div>
    </section>
  );
}
