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

async function PrivacyContent() {
  const headersList = await headers();
  let host = headersList.get("host") || "localhost";
  if (host.includes(":")) {
    host = host.split(":")[0];
  }
  const pathname = headersList.get("x-pathname") || "";

  const { brand } = await resolveTenantAndBrandFromHost(host, pathname);
  const t = await getTranslations("legal.privacy");
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

          {/* Section 2: Information We Collect */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              {t("section2.title")}
            </h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  {t("section2.subsection1.title")}
                </h3>
                <p className="text-sm leading-relaxed">
                  {t("section2.subsection1.content")}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  {t("section2.subsection2.title")}
                </h3>
                <p className="text-sm leading-relaxed">
                  {t("section2.subsection2.content")}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  {t("section2.subsection3.title")}
                </h3>
                <p className="text-sm leading-relaxed">
                  {t("section2.subsection3.content")}
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: How We Use Information */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              {t("section3.title")}
            </h2>
            <p className="leading-relaxed">{t("section3.intro")}</p>
            <ul className="space-y-2 list-disc list-inside text-sm">
              <li>{t("section3.use1")}</li>
              <li>{t("section3.use2")}</li>
              <li>{t("section3.use3")}</li>
              <li>{t("section3.use4")}</li>
              <li>{t("section3.use5")}</li>
              <li>{t("section3.use6")}</li>
            </ul>
          </section>

          {/* Section 4: Data Sharing */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              {t("section4.title")}
            </h2>
            <p className="leading-relaxed">{t("section4.content")}</p>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm space-y-2">
              <p className="font-semibold text-foreground">
                {t("section4.note")}
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>{t("section4.sharing1")}</li>
                <li>{t("section4.sharing2")}</li>
                <li>{t("section4.sharing3")}</li>
              </ul>
            </div>
          </section>

          {/* Section 5: Data Security */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              {t("section5.title")}
            </h2>
            <p className="leading-relaxed">{t("section5.content")}</p>
            <p className="text-sm text-foreground/75 italic">
              {t("section5.disclaimer")}
            </p>
          </section>

          {/* Section 6: Data Retention */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              {t("section6.title")}
            </h2>
            <p className="leading-relaxed">{t("section6.content")}</p>
          </section>

          {/* Section 7: Your Rights */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              {t("section7.title")}
            </h2>
            <p className="leading-relaxed">{t("section7.intro")}</p>
            <ul className="space-y-2 list-disc list-inside text-sm">
              <li>{t("section7.right1")}</li>
              <li>{t("section7.right2")}</li>
              <li>{t("section7.right3")}</li>
              <li>{t("section7.right4")}</li>
              <li>{t("section7.right5")}</li>
            </ul>
          </section>

          {/* Section 8: Cookies and Tracking */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              {t("section8.title")}
            </h2>
            <p className="leading-relaxed">{t("section8.content")}</p>
            <p className="text-sm leading-relaxed">
              {t("section8.details")}
            </p>
          </section>

          {/* Section 9: Third-Party Links */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              {t("section9.title")}
            </h2>
            <p className="leading-relaxed">{t("section9.content")}</p>
          </section>

          {/* Section 10: Children's Privacy */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              {t("section10.title")}
            </h2>
            <p className="leading-relaxed">{t("section10.content")}</p>
          </section>

          {/* Section 11: GDPR Compliance */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              {t("section11.title")}
            </h2>
            <p className="leading-relaxed">{t("section11.content")}</p>
          </section>

          {/* Section 12: Contact */}
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              {t("section12.title")}
            </h2>
            <p className="leading-relaxed">{t("section12.content")}</p>
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

export default function PrivacyPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Cargando...</div>}>
      <PrivacyContent />
    </Suspense>
  );
}
