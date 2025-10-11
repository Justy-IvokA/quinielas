"use client";

import { useTranslations } from "next-intl";
import { Sparkles, Zap, TrendingUp, Trophy, ArrowRight } from "lucide-react";
import Image from "next/image";

import { Button, ThemeToggle } from "@qp/ui";

import { Link } from "@web/i18n/navigation";
import { trpc } from "@web/trpc/react";

interface HomeHeroProps {
  brandName: string;
  tagline: string;
  ctaLabel: string;
  ctaHref: string;
  logoUrl?: string | null;
  mascotUrl?: string | null;
}

export function HomeHero({ 
  brandName, 
  tagline, 
  ctaLabel, 
  ctaHref,
  logoUrl,
  mascotUrl 
}: HomeHeroProps) {
  const t = useTranslations("home.hero");
  const { data, isLoading } = trpc.health.useQuery();

  const healthStatus = isLoading 
    ? t("healthChecking") 
    : data?.ok 
      ? t("healthOnline") 
      : t("healthIssue");

  // Use mascot if available, otherwise logo, otherwise trophy icon
  const heroImageUrl = mascotUrl || logoUrl;

  return (
    <section className="relative group">
      {/* Animated gradient background using brand colors */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200" />
      
      {/* Main content */}
      <div className="relative backdrop-blur-xl bg-white/[0.02] dark:bg-white/[0.02] border border-primary/20 rounded-3xl overflow-hidden shadow-2xl mt-4 md:mt-0">
        {/* Decorative elements using brand colors */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle,_hsl(var(--primary))/15%,_transparent_70%)] blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[radial-gradient(circle,_hsl(var(--accent))/15%,_transparent_70%)] blur-3xl" />
        
        {/* Two-column layout */}
        <div className="relative z-10 grid md:grid-cols-2 gap-8 md:gap-12 items-center p-8 md:p-14">
          {/* LEFT COLUMN - Image/Logo/Mascot */}
          <div className="relative flex items-center justify-center order-2 md:order-1">
            <div className="relative w-full max-w-md aspect-square">
              {/* Animated ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-accent opacity-20 blur-2xl animate-pulse" />
              
              {/* Image container */}
              <div className="relative w-full h-full flex items-center justify-center">
                {heroImageUrl ? (
                  <div className="relative w-4/5 h-4/5 rounded-3xl overflow-hidden shadow-2xl ring-4 ring-primary/20 hover:ring-primary/40 transition-all duration-500 hover:scale-105">
                    <Image
                      src={heroImageUrl}
                      alt={brandName}
                      fill
                      className="object-contain p-2 bg-gradient-to-br from-background to-muted rounded-3xl"
                      priority
                    />
                  </div>
                ) : (
                  // Fallback icon with brand colors
                  <div className="relative w-4/5 h-4/5 rounded-3xl bg-gradient-to-br from-primary to-accent p-12 shadow-2xl flex items-center justify-center hover:scale-105 transition-transform duration-500">
                    <Trophy className="w-full h-full text-primary-foreground drop-shadow-2xl" strokeWidth={1.5} />
                  </div>
                )}
              </div>

              {/* Floating badges */}
              {/* <div className="absolute -top-4 -right-4 px-4 py-2 rounded-full bg-gradient-to-r from-primary to-accent shadow-lg backdrop-blur-xl animate-bounce">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="absolute -bottom-4 -left-4 px-5 py-3 rounded-full bg-card border-2 border-primary shadow-lg backdrop-blur-xl">
                <span className="text-sm font-bold text-primary">WL Platform</span>
              </div> */}
            </div>
          </div>

          {/* RIGHT COLUMN - Brand Info */}
          <div className="relative flex flex-col gap-6 order-1 md:order-2">
            {/* Status badge and theme toggle */}
            <div className="flex items-center justify-end gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl bg-card/80 border border-primary/20 shadow-md">
                <div className={`w-2 h-2 rounded-full ${data?.ok ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className={`text-xs font-medium uppercase tracking-wider ${data?.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {healthStatus}
                </span>
              </div>
            </div>

            {/* Platform label */}
            <div className="inline-flex items-center gap-2 w-fit">
              <div className="w-1 h-8 bg-gradient-to-b from-primary to-accent rounded-full" />
              <span className="text-sm font-bold uppercase tracking-widest text-foreground dark:text-white">
                {t("platformLabel")}
              </span>
            </div>
            
            {/* Brand name - impactful typography */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-gradient [text-shadow:_2px_2px_4px_rgb(0_0_0_/_80%)]">
                {brandName}
              </span>
            </h1>
            
            {/* Tagline */}
            <p className="text-lg md:text-xl lg:text-2xl text-secondary dark:text-white leading-relaxed font-medium my-4 [text-shadow:_2px_2px_4px_rgb(0_0_0_/_80%)]">
              {tagline}
            </p>

            {/* Feature badges */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/90 dark:bg-secondary border border-primary/20">
                <TrendingUp className="w-4 h-4 text-white dark:text-secondary-foreground" />
                <span className="text-sm font-semibold text-white dark:text-secondary-foreground">{t("multiUserBadge")}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/90 dark:bg-accent border border-accent/20">
                <Zap className="w-4 h-4 text-white dark:text-accent-foreground" />
                <span className="text-sm font-semibold text-white dark:text-accent-foreground">{t("realTimeBadge")}</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row items-start gap-4 mt-2">
              <Button 
                asChild 
                size="lg" 
                className="group text-lg px-8 py-7 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                <Link href={ctaHref} className="flex items-center gap-3">
                  {ctaLabel}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              
              <Button 
                asChild 
                variant="outline" 
                size="lg"
                className="text-lg px-8 py-7 border-2 border-primary/30 hover:border-primary hover:bg-primary/5"
              >
                <Link href="/about">
                  {t("learnMore") || "Conocer más"}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Add gradient animation */}
      <style jsx>{`
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        :global(.animate-gradient) {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </section>
  );
}
