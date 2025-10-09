"use client";

import { useTranslations } from "next-intl";
import { Sparkles, Zap, TrendingUp } from "lucide-react";

import { Button, ThemeToggle } from "@qp/ui";

import { Link } from "@web/i18n/navigation";
import { trpc } from "@web/trpc/react";

interface HomeHeroProps {
  brandName: string;
  tagline: string;
  ctaLabel: string;
  ctaHref: string;
}

export function HomeHero({ brandName, tagline, ctaLabel, ctaHref }: HomeHeroProps) {
  const t = useTranslations("home.hero");
  const { data, isLoading } = trpc.health.useQuery();

  const healthStatus = isLoading 
    ? t("healthChecking") 
    : data?.ok 
      ? t("healthOnline") 
      : t("healthIssue");
  const healthTone = data?.ok ? "text-emerald-500" : "text-amber-500";

  return (
    <section className="relative group">
      {/* Animated gradient background */}
      {/* <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200 animate-pulse" /> */}
      
      {/* Main content */}
      <div className="relative backdrop-blur-2xl bg-white/60 dark:bg-white/5 border border-white/10 rounded-3xl p-10 md:p-14 overflow-hidden shadow-xl">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col gap-8">
          {/* Status badge */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl bg-white/70 dark:bg-black/40 border border-white/20`}>
              <div className={`w-2 h-2 rounded-full ${data?.ok ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className={`text-xs font-medium uppercase tracking-wider ${healthTone}`}>{healthStatus}</span>
            </div>
            <div className="ml-auto">
              <ThemeToggle />
            </div>
          </div>

          {/* Hero text */}
          <div className="flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 text-primary">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span className="text-sm font-semibold uppercase tracking-wider">{t("platformLabel")}</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600">
                {brandName}
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground md:w-4/5 leading-relaxed">
              {tagline}
            </p>
          </div>

          {/* CTA and features */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Button asChild size="lg" className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
              <Link href={ctaHref} className="flex items-center gap-2">
                {ctaLabel}
                <Zap className="w-5 h-5" />
              </Link>
            </Button>
            
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">{t("multiTenantBadge")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">{t("realTimeBadge")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
