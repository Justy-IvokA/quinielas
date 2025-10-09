import { getDemoBranding } from "@qp/branding";

import { adminEnv } from "../src/env";
import { DashboardWelcome } from "./components/dashboard-welcome";
import { DemoSaveButton } from "../src/components/demo-save-button";

const branding = getDemoBranding();

const quickActions = [
  {
    title: "Pools activos",
    description: "Supervisa el estado, acceso y cronología de tus quinielas en vivo.",
    href: "/pools"
  },
  {
    title: "Próximos partidos",
    description: "Valida horarios, bloqueos de predicciones y resultados pendientes.",
    href: "/fixtures"
  },
  {
    title: "Invitaciones y códigos",
    description: "Gestiona batch de códigos, invitaciones por correo y consumo por jugador.",
    href: "/access"
  }
];

export default function AdminHome() {
  return (
    <div className="flex flex-col gap-10">
      <DashboardWelcome tenantName={adminEnv.NEXT_PUBLIC_TENANT_SLUG} brandName={branding.brand.name} />

      <section className="grid gap-6 md:grid-cols-3">
        {quickActions.map((action) => (
          <article
            key={action.title}
            className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-card/70 p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-foreground">{action.title}</h2>
            <p className="text-sm text-muted-foreground">{action.description}</p>
            <a href={action.href} className="text-sm font-medium text-primary hover:underline">
              Ir a {action.title.toLowerCase()}
            </a>
          </article>
        ))}
      </section>

      <DemoSaveButton />
    </div>
  );
}
