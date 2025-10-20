import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

import { resolveTenantAndBrandFromHost } from "@qp/api/lib/host-tenant";
import { adminEnv } from "@admin/env";
import { Link } from "@admin/navigation";
import { DashboardWelcome } from "../../components/dashboard-welcome";
import { DashboardAnalytics } from "../../components/dashboard-analytics";

const quickActionKeys = [
  {
    key: "pools",
    href: "/pools",
  },
  {
    key: "branding",
    href: "/branding",
  },
] as const;

export default async function AdminHome() {
  // Resolve brand from host
  const headersList = await headers();
  let host = headersList.get("host") || "localhost";
  if (host.includes(":")) {
    host = host.split(":")[0];
  }
  const { brand, tenant } = await resolveTenantAndBrandFromHost(host);
  
  const brandName = brand?.name || adminEnv.NEXT_PUBLIC_APP_NAME;
  const tenantName = tenant?.name || adminEnv.NEXT_PUBLIC_TENANT_SLUG;
  const t = await getTranslations("dashboard");

  return (
    <div className="flex flex-col gap-8 [text-shadow:_2px_2px_4px_rgb(0_0_0_/_40%)]">
      <DashboardWelcome
        tenantName={tenantName}
        brandName={brandName}
      />

      {/* Analytics Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-primary">{t("analytics.title")}</h2>
        <DashboardAnalytics />
      </section>

      {/* Quick Actions Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-primary">{t("quickActions.title")}</h2>
        <div className="grid gap-6 md:grid-cols-2">
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
              className="text-sm font-medium text-secondary hover:underline hover:text-foreground"
            >
              {t(`quickActions.${key}.cta`)}
            </Link>
          </article>
        ))}
        </div>
      </section>
    </div>
  );
}
