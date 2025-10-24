import { Suspense } from "react";
import { headers } from "next/headers";
import { resolveTenantAndBrandFromHost } from "@qp/api/lib/host-tenant";
import { BrandThemeInjector } from "../../../components/brand-theme-injector";
import { LegalLayout } from "../_components/legal-layout";
import { getTranslations } from "next-intl/server";

async function TermsContent() {
  const headersList = await headers();
  let host = headersList.get("host") || "localhost";
  if (host.includes(":")) {
    host = host.split(":")[0];
  }
  const pathname = headersList.get("x-pathname") || "";

  const { brand } = await resolveTenantAndBrandFromHost(host, pathname);
  const t = await getTranslations("legal.terms");
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
        <div className="max-w-6xl max-h-[60vh] rounded-lg overflow-y-auto mx-auto bg-background p-4">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-8">{t("title")}</h1>
          <div className="space-y-8 text-foreground">
              {/* Section 1: Introduction */}
              <section className="space-y-4">
                <p className="leading-relaxed">{t("section1.content")}</p>
              </section>

              {/* Section 2: Definitions */}
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">
                  {t("section2.title")}
                </h2>
                <ul className="space-y-3 list-disc list-inside">
                  <li className="leading-relaxed">{t("section2.item1")}</li>
                  <li className="leading-relaxed">{t("section2.item2")}</li>
                  <li className="leading-relaxed">{t("section2.item3")}</li>
                  <li className="leading-relaxed">{t("section2.item4")}</li>
                  <li className="leading-relaxed">{t("section2.item5")}</li>
                </ul>
              </section>

              {/* Section 3: User Eligibility */}
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">
                  {t("section3.title")}
                </h2>
                <p className="leading-relaxed">{t("section3.content")}</p>
                <ul className="space-y-2 list-disc list-inside text-sm">
                  <li>{t("section3.requirement1")}</li>
                  <li>{t("section3.requirement2")}</li>
                  <li>{t("section3.requirement3")}</li>
                  <li>{t("section3.requirement4")}</li>
                </ul>
              </section>

              {/* Section 4: Account Registration */}
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">
                  {t("section4.title")}
                </h2>
                <p className="leading-relaxed">{t("section4.content")}</p>
                <p className="leading-relaxed text-sm text-foreground/75">
                  {t("section4.disclaimer")}
                </p>
              </section>

              {/* Section 5: User Conduct */}
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">
                  {t("section5.title")}
                </h2>
                <p className="leading-relaxed">{t("section5.intro")}</p>
                <ul className="space-y-2 list-disc list-inside text-sm">
                  <li>{t("section5.prohibited1")}</li>
                  <li>{t("section5.prohibited2")}</li>
                  <li>{t("section5.prohibited3")}</li>
                  <li>{t("section5.prohibited4")}</li>
                  <li>{t("section5.prohibited5")}</li>
                  <li>{t("section5.prohibited6")}</li>
                </ul>
              </section>

              {/* Section 6: Predictions and Scoring */}
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">
                  {t("section6.title")}
                </h2>
                <p className="leading-relaxed">{t("section6.content")}</p>
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm">
                  <p className="font-semibold text-foreground mb-2">
                    {t("section6.scoringNote")}
                  </p>
                  <p className="text-foreground/80">{t("section6.scoringDetails")}</p>
                </div>
              </section>

              {/* Section 7: Intellectual Property */}
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">
                  {t("section7.title")}
                </h2>
                <p className="leading-relaxed">{t("section7.content")}</p>
              </section>

              {/* Section 8: Limitation of Liability */}
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">
                  {t("section8.title")}
                </h2>
                <p className="leading-relaxed">{t("section8.content")}</p>
                <div className="bg-accent/5 border border-accent/20 rounded-lg p-4 text-sm">
                  <p className="text-foreground/80">{t("section8.disclaimer")}</p>
                </div>
              </section>

              {/* Section 9: Indemnification */}
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">
                  {t("section9.title")}
                </h2>
                <p className="leading-relaxed">{t("section9.content")}</p>
              </section>

              {/* Section 10: Termination */}
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">
                  {t("section10.title")}
                </h2>
                <p className="leading-relaxed">{t("section10.content")}</p>
              </section>

              {/* Section 11: Modifications */}
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">
                  {t("section11.title")}
                </h2>
                <p className="leading-relaxed">{t("section11.content")}</p>
              </section>

              {/* Section 12: Governing Law */}
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">
                  {t("section12.title")}
                </h2>
                <p className="leading-relaxed">{t("section12.content")}</p>
              </section>

              {/* Section 13: Contact */}
              <section className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">
                  {t("section13.title")}
                </h2>
                <p className="leading-relaxed">{t("section13.content")}</p>
              </section>

              {/* Last Updated */}
              <div className="border-t border-border/40 pt-6 mt-8">
                <p className="text-xs text-foreground/60">
                  {t("lastUpdated", { date: new Date().toLocaleDateString() })}
                </p>
              </div>
          </div>
        </div>
      </LegalLayout>
    </div>
  );
}

export default function TermsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Cargando...</div>}>
      <TermsContent />
    </Suspense>
  );
}
