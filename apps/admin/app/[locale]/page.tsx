import { getDemoBranding } from "@qp/branding";
import { useTranslations } from "next-intl";

import { adminEnv } from "@admin/env";
import { Link } from "@admin/navigation";
import { DashboardWelcome } from "../components/dashboard-welcome";
import { DemoSaveButton } from "@admin/components/demo-save-button";

const branding = getDemoBranding();

const quickActionKeys = [
  {
    key: "pools",
    href: "/pools",
  },
  {
    key: "fixtures",
    href: "/fixtures",
  },
  {
    key: "access",
    href: "/access",
  },
] as const;

export default function AdminHome() {
  const t = useTranslations("dashboard");

  return (
    <div className="flex flex-col gap-10">
      <DashboardWelcome
        tenantName={adminEnv.NEXT_PUBLIC_TENANT_SLUG}
        brandName={branding.brand.name}
      />

      <section className="grid gap-6 md:grid-cols-3">
        {quickActionKeys.map(({ key, href }) => (
          <article
            key={key}
            className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-card/70 p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-foreground">
              {t(`quickActions.${key}.title`)}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t(`quickActions.${key}.description`)}
            </p>
            <Link
              href={href}
              className="text-sm font-medium text-primary hover:underline"
            >
              {t(`quickActions.${key}.cta`)}
            </Link>
          </article>
        ))}
      </section>

      <DemoSaveButton />
    </div>
  );
}
