"use client";

import { useTranslations } from "next-intl";

import { Button, cn, SportsLoader } from "@qp/ui";

import { Link } from "@admin/navigation";
import { trpc } from "@admin/trpc";

interface DashboardWelcomeProps {
  tenantName: string;
  brandName: string;
}

export function DashboardWelcome({ tenantName, brandName }: DashboardWelcomeProps) {
  const t = useTranslations("dashboard");
  const { data, isLoading } = trpc.health.useQuery();

  return (
    <section className="relative flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/60 p-4 shadow-sm backdrop-blur">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-background/80 backdrop-blur-sm">
          <SportsLoader size="sm" text={t("statusCheck")} />
        </div>
      )}
      <div>
        <p
          className={cn(
            "text-xs uppercase tracking-[0.2em] text-muted-foreground text-right",
            { "text-green-600": data?.ok, "text-orange-600": !data?.ok }
          )}
        >
          {data?.ok ? t("statusOnline") : t("statusCheck")}
        </p>
        <h1 className="-mt-2 text-3xl font-semibold text-primary">
          {t("welcome", { tenant: tenantName })}
        </h1>
        <p className="mt-1 text-base text-foreground">
          {t("subtitle", { brand: brandName })}
        </p>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant="default" className="bg-secondary border-secondary">
          <Link href="/pools/new">{t("createPool")}</Link>
        </Button>
        <Button variant="default" className="bg-secondary border-secondary">
          <Link href="/branding">{t("manageBrands")}</Link>
        </Button>
        
      </div>
    </section>
  );
}
