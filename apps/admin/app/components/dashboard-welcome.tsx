"use client";

import Link from "next/link";

import { Button, ThemeToggle } from "@qp/ui";

import { trpc } from "../../src/trpc/react";

interface DashboardWelcomeProps {
  tenantName: string;
  brandName: string;
}

export function DashboardWelcome({ tenantName, brandName }: DashboardWelcomeProps) {
  const { data } = trpc.health.useQuery();

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/60 p-8 shadow-sm backdrop-blur">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          {data?.ok ? "Servicios operativos" : "Verifica el estado del API"}
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          Bienvenido, {tenantName}
        </h1>
        <p className="mt-1 text-base text-muted-foreground">
          Administra pools y marcas del portafolio {brandName}.
        </p>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button asChild>
          <Link href="/pools/new">Crear pool</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/brands">Gestionar marcas</Link>
        </Button>
        <ThemeToggle />
      </div>
    </section>
  );
}
