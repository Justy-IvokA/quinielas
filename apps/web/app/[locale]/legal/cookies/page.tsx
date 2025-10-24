import { Suspense } from "react";
import { headers } from "next/headers";
import { resolveTenantAndBrandFromHost } from "@qp/api/lib/host-tenant";
import { BrandThemeInjector } from "../../../components/brand-theme-injector";
import { LegalLayout } from "../_components/legal-layout";
import { getTranslations } from "next-intl/server";
import {
  Dialog,
  DialogContent,
} from "@qp/ui/components/dialog";

async function CookiesContent() {
  const headersList = await headers();
  let host = headersList.get("host") || "localhost";
  if (host.includes(":")) {
    host = host.split(":")[0];
  }
  const pathname = headersList.get("x-pathname") || "";

  const { brand } = await resolveTenantAndBrandFromHost(host, pathname);
  const t = await getTranslations("legal.cookies");
  const brandName = brand?.name || "Quinielas";
  const brandLogo = brand?.theme && typeof brand.theme === "object" ? (brand.theme as any).logo : null;
  const heroAssets = (brand?.theme && typeof brand.theme === 'object' 
    ? (brand.theme as any).heroAssets 
    : null);

  return (
    <div className="relative isolate overflow-hidden min-h-screen">
      {brand?.theme && <BrandThemeInjector brandTheme={brand.theme} />}

      <LegalLayout
        title={t("title")}
        brandLogo={brandLogo}
        brandName={brandName}
        heroAssets={heroAssets}
      >
        <Dialog open>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto z-30" showOverlay={false} showClose={false}>
            <div className="space-y-8 text-foreground/90">
          {/* Section 1: Introduction */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              {t("section1.title")}
            </h2>
            <p className="leading-relaxed">{t("section1.content")}</p>
          </section>

          {/* Section 2: What Are Cookies */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              {t("section2.title")}
            </h2>
            <p className="leading-relaxed">{t("section2.content")}</p>
          </section>

          {/* Section 3: Types of Cookies We Use */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              {t("section3.title")}
            </h2>
            <div className="space-y-4">
              <div className="border-l-4 border-primary/40 pl-4">
                <h3 className="font-semibold text-foreground mb-2">
                  {t("section3.essential.title")}
                </h3>
                <p className="text-sm leading-relaxed">
                  {t("section3.essential.content")}
                </p>
              </div>
              <div className="border-l-4 border-accent/40 pl-4">
                <h3 className="font-semibold text-foreground mb-2">
                  {t("section3.performance.title")}
                </h3>
                <p className="text-sm leading-relaxed">
                  {t("section3.performance.content")}
                </p>
              </div>
              <div className="border-l-4 border-primary/30 pl-4">
                <h3 className="font-semibold text-foreground mb-2">
                  {t("section3.functional.title")}
                </h3>
                <p className="text-sm leading-relaxed">
                  {t("section3.functional.content")}
                </p>
              </div>
              <div className="border-l-4 border-accent/30 pl-4">
                <h3 className="font-semibold text-foreground mb-2">
                  {t("section3.targeting.title")}
                </h3>
                <p className="text-sm leading-relaxed">
                  {t("section3.targeting.content")}
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Specific Cookies */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              {t("section4.title")}
            </h2>
            <p className="leading-relaxed mb-4">{t("section4.intro")}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="text-left py-2 px-3 font-semibold text-foreground">
                      {t("section4.table.name")}
                    </th>
                    <th className="text-left py-2 px-3 font-semibold text-foreground">
                      {t("section4.table.purpose")}
                    </th>
                    <th className="text-left py-2 px-3 font-semibold text-foreground">
                      {t("section4.table.duration")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/20">
                    <td className="py-2 px-3 text-foreground/80">
                      {t("section4.cookie1.name")}
                    </td>
                    <td className="py-2 px-3 text-foreground/70">
                      {t("section4.cookie1.purpose")}
                    </td>
                    <td className="py-2 px-3 text-foreground/70">
                      {t("section4.cookie1.duration")}
                    </td>
                  </tr>
                  <tr className="border-b border-border/20">
                    <td className="py-2 px-3 text-foreground/80">
                      {t("section4.cookie2.name")}
                    </td>
                    <td className="py-2 px-3 text-foreground/70">
                      {t("section4.cookie2.purpose")}
                    </td>
                    <td className="py-2 px-3 text-foreground/70">
                      {t("section4.cookie2.duration")}
                    </td>
                  </tr>
                  <tr className="border-b border-border/20">
                    <td className="py-2 px-3 text-foreground/80">
                      {t("section4.cookie3.name")}
                    </td>
                    <td className="py-2 px-3 text-foreground/70">
                      {t("section4.cookie3.purpose")}
                    </td>
                    <td className="py-2 px-3 text-foreground/70">
                      {t("section4.cookie3.duration")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 5: Managing Cookies */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              {t("section5.title")}
            </h2>
            <p className="leading-relaxed">{t("section5.content")}</p>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm space-y-2">
              <p className="font-semibold text-foreground">
                {t("section5.browsers")}
              </p>
              <ul className="list-disc list-inside space-y-1 text-foreground/80">
                <li>{t("section5.browser1")}</li>
                <li>{t("section5.browser2")}</li>
                <li>{t("section5.browser3")}</li>
                <li>{t("section5.browser4")}</li>
              </ul>
            </div>
          </section>

          {/* Section 6: Third-Party Cookies */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              {t("section6.title")}
            </h2>
            <p className="leading-relaxed">{t("section6.content")}</p>
          </section>

          {/* Section 7: Do Not Track */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              {t("section7.title")}
            </h2>
            <p className="leading-relaxed">{t("section7.content")}</p>
          </section>

          {/* Section 8: Changes to Policy */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              {t("section8.title")}
            </h2>
            <p className="leading-relaxed">{t("section8.content")}</p>
          </section>

          {/* Section 9: Contact */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              {t("section9.title")}
            </h2>
            <p className="leading-relaxed">{t("section9.content")}</p>
          </section>

              {/* Last Updated */}
              <div className="border-t border-border/40 pt-6 mt-8">
                <p className="text-xs text-foreground/60">
                  {t("lastUpdated", { date: new Date().toLocaleDateString() })}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </LegalLayout>
    </div>
  );
}

export default function CookiesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Cargando...</div>}>
      <CookiesContent />
    </Suspense>
  );
}
