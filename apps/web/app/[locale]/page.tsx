import {
  Trophy,
  Users,
  BarChart3,
  Shield,
  Zap,
  Globe,
  Code,
  Terminal,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

import { resolveTenantAndBrandFromHost } from "@qp/api/lib/host-tenant";
import { getOptimizedMediaUrl } from "@qp/utils/client";
import { webEnv } from "@web/env";
import { HomeHero } from "../components/home-hero";
import { StatsSection } from "../components/stats-section";
import { BrandThemeInjector } from "../components/brand-theme-injector";

export default async function HomePage() {
  // Resolve brand from host
  const headersList = await headers();
  let host = headersList.get("host") || "localhost";
  if (host.includes(":")) {
    host = host.split(":")[0];
  }
  const { brand } = await resolveTenantAndBrandFromHost(host);
  
  const brandName = brand?.name || webEnv.NEXT_PUBLIC_APP_NAME;
  const t = await getTranslations("home");
  const tCommon = await getTranslations("common");
  const appName = webEnv.NEXT_PUBLIC_APP_NAME;

  // Use brand primary color for gradients
  const featureHighlights = [
    {
      title: t("features.multiTenant.title"),
      description: t("features.multiTenant.description"),
      icon: Trophy,
      // Uses CSS variables from brand theme
      gradientClass: "bg-gradient-to-br from-primary to-primary/70",
    },
    {
      title: t("features.realTime.title"),
      description: t("features.realTime.description"),
      icon: Zap,
      gradientClass: "bg-gradient-to-br from-primary/90 to-accent",
    },
    {
      title: t("features.leaderboard.title"),
      description: t("features.leaderboard.description"),
      icon: BarChart3,
      gradientClass: "bg-gradient-to-br from-accent to-primary/80",
    },
  ];

  const techFeatures = [
    { icon: Shield, label: t("techFeatures.secure") },
    { icon: Users, label: t("techFeatures.multiTenant") },
    { icon: Globe, label: t("techFeatures.whiteLabel") },
    { icon: Code, label: t("techFeatures.apiFirst") },
  ];

  // Get hero assets from brand theme with URL optimization
  const heroAssets = brand?.theme && typeof brand.theme === 'object' 
    ? (brand.theme as any).heroAssets 
    : null;
  
  // Convert Google Drive URLs to direct download links
  const optimizedAssetUrl = getOptimizedMediaUrl(heroAssets?.assetUrl);
  const optimizedFallbackUrl = getOptimizedMediaUrl(heroAssets?.fallbackImageUrl);
  const hasHeroMedia = optimizedAssetUrl;

  return (
    <div className="relative isolate overflow-hidden min-h-screen">
      {/* Inject brand theme dynamically on client */}
      {brand?.theme && <BrandThemeInjector brandTheme={brand.theme} />}
      
      {/* Hero background media (video or image) */}
      {hasHeroMedia && (
        <div className="pointer-events-none fixed inset-0 -z-10">
          {heroAssets.video ? (
            // Video background
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              poster={optimizedFallbackUrl || undefined}
            >
              <source src={optimizedAssetUrl} type="video/mp4" />
            </video>
          ) : (
            // Image background
            <img
              src={optimizedAssetUrl}
              alt="Hero background"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          {/* Gradient overlay for readability (Comentado por VEMG) */}
          {/* <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" /> */}
        </div>
      )}

      {/* Animated background gradients - uses brand primary color */}
      {/* <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary))/20%,_transparent_50%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[600px] bg-[radial-gradient(ellipse_at_bottom,_hsl(var(--accent))/15%,_transparent_50%)]" />
        <div className="absolute right-0 top-1/4 h-96 w-96 bg-[radial-gradient(circle,_hsl(var(--primary))/15%,_transparent_70%)] blur-3xl" />
        <div className="absolute left-0 bottom-1/4 h-96 w-96 bg-[radial-gradient(circle,_hsl(var(--accent))/15%,_transparent_70%)] blur-3xl" />
      </div> */}

      {/* Hero Section - Full viewport height */}
      <div className="flex items-center justify-center min-h-screen w-full px-6 py-16 md:px-10 md:py-24">
        <div className="mx-auto w-full max-w-6xl">
          <HomeHero
            brandName={brandName}
            tagline={t("hero.tagline")}
            ctaLabel={t("hero.cta")}
            ctaHref="/register"
            logoUrl={brand?.logoUrl}
            mascotUrl={brand?.theme && typeof brand.theme === 'object' ? (brand.theme as any).mascotUrl : null}
          />
        </div>
      </div>

      {/* Content Sections - Rendered below hero */}
      <div className="mx-auto w-full max-w-6xl flex flex-col gap-20 px-6 py-16 md:px-10 md:py-24">
        {/* Stats Section */}
        <StatsSection />

        {/* Features Grid */}
        <section className="grid gap-6 md:grid-cols-3">
          {featureHighlights.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="group relative flex h-full flex-col gap-4 rounded-2xl backdrop-blur-2xl bg-white/60 dark:bg-white/5 border border-white/10 p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
              >
                {/* Icon with gradient background - uses brand colors */}
                <div
                  className={`inline-flex w-fit rounded-xl ${feature.gradientClass} p-3 shadow-lg`}
                >
                  <Icon className="w-6 h-6 text-primary-foreground" />
                </div>

                <div className="flex flex-col gap-2">
                  <h2 className="text-xl font-bold text-foreground transition-all">
                    {feature.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Hover effect border - uses brand primary */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/0 via-accent/0 to-primary/0 group-hover:from-primary/10 group-hover:via-accent/10 group-hover:to-primary/10 transition-all duration-500" />
              </article>
            );
          })}
        </section>

        {/* Tech Stack Pills */}
        <section className="flex flex-wrap items-center justify-center gap-4">
          {techFeatures.map((tech) => {
            const Icon = tech.icon;
            return (
              <div
                key={tech.label}
                className="flex items-center gap-2 px-5 py-3 rounded-full backdrop-blur-xl bg-white/70 dark:bg-black/40 border border-primary/20 hover:border-primary/40 transition-all hover:scale-105 cursor-default"
              >
                <Icon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{tech.label}</span>
              </div>
            );
          })}
        </section>

        {/* Dev Info Card */}
        <section className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
          <div className="relative rounded-2xl backdrop-blur-2xl bg-white/60 dark:bg-white/5 border border-white/10 p-8 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Terminal className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">
                  {t("devInfo.title")}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("devInfo.description")}
                </p>
                <div className="flex flex-col gap-2">
                  <code className="inline-flex items-center gap-2 text-xs bg-muted/50 px-4 py-2 rounded-lg font-mono border border-border/50">
                    <span className="text-primary">$</span>
                    <span>{t("devInfo.runDev")}</span>
                  </code>
                  <code className="inline-flex items-center gap-2 text-xs bg-muted/50 px-4 py-2 rounded-lg font-mono border border-border/50">
                    <span className="text-primary">→</span>
                    <span>{t("devInfo.localUrl")}</span>
                  </code>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer spacer */}
        <div className="h-8" />
      </div>
    </div>
  );
}
