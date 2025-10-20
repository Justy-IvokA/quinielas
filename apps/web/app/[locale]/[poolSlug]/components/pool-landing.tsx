"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Trophy, Calendar, Users, Lock, CheckCircle2, TrendingUp, Target, Award } from "lucide-react";
import type { Pool, Tenant, Brand, Season, Competition, AccessPolicy, Prize } from "@qp/db";
import { getOptimizedMediaUrl } from "@qp/utils/client";
import { Button, Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, GlassCard } from "@qp/ui";
import { trpc } from "@web/trpc";

interface PoolLandingProps {
  pool: Pool & {
    tenant: { name: string; slug: string };
    brand: { name: string; slug: string; logoUrl: string | null; theme: any } | null;
    season: {
      name: string;
      year: number;
      startsAt: Date | null;
      endsAt: Date | null;
      competition: {
        name: string;
        logoUrl: string | null;
      };
    };
    accessPolicy: AccessPolicy | null;
    prizes: Prize[];
    _count: {
      registrations: number;
      predictions: number;
    };
  };
  isExpired: boolean;
  tenant: Tenant;
  brand: Brand | null;
}

export function PoolLanding({ pool, isExpired, tenant, brand }: PoolLandingProps) {
  const { data: session, status } = useSession();
  const t = useTranslations("pool");
  const tCommon = useTranslations("common");

  // Check if user is registered (only if authenticated)
  const { data: registrationData } = trpc.registration.checkByPoolSlug.useQuery(
    { poolSlug: pool.slug },
    { enabled: !!session?.user }
  );
  const isRegistered = registrationData?.isRegistered || false;

  // Determine CTA based on state
  const renderCTA = () => {
    if (isExpired) {
      return (
        <div className="flex flex-col gap-4">
          <Link href={`/pools/${pool.slug}/participants`}>
            <Button size="lg" className="w-full bg-white/90 hover:bg-white text-black">
              {t("actions.viewFinalLeaderboard")}
            </Button>
          </Link>
        </div>
      );
    }

    if (status === "loading") {
      return (
        <Button size="lg" disabled>
          {tCommon("loading")}
        </Button>
      );
    }

    if (session && isRegistered) {
      return (
        <div className="flex flex-col gap-4">
          <div className="flex gap-3">
            <Link href={`/pools/${pool.slug}/fixtures`} className="flex-1">
              <Button size="lg" className="w-full hover:bg-primary/60 hover:text-black">
                {t("actions.makePredictions")}
              </Button>
            </Link>
            <Link href={`/pools/${pool.slug}/participants`} className="flex-1">
              <Button size="lg" className="w-full bg-secondary hover:bg-secondary/60 hover:text-black border-secondary">
                {t("actions.viewLeaderboard")}
              </Button>
            </Link>
          </div>
        </div>
      );
    }

    // Not registered or not logged in
    const accessType = pool.accessPolicy?.accessType || "PUBLIC";
    
    // If logged in, go to registration page; otherwise go to signin
    const registrationUrl = session 
      ? `/auth/register/${pool.slug}`
      : `/auth/signin?callbackUrl=${encodeURIComponent(`/auth/register/${pool.slug}`)}`;
    
    return (
      <div className="flex flex-col gap-4">
        <Link href={registrationUrl}>
          <Button size="lg" className="w-full bg-white/90 hover:bg-white text-black">
            {accessType === "PUBLIC" 
              ? t("actions.joinNow")
              : accessType === "CODE"
              ? t("actions.joinWithCode")
              : t("actions.joinWithInvite")}
          </Button>
        </Link>
        {!session && (
          <p className="text-sm text-white/80 text-center drop-shadow">
            {t("messages.loginRequired")}
          </p>
        )}
      </div>
    );
  };

  // Render hero with brand assets (type assertion for Json field)
  const heroAssets = brand?.theme && typeof brand.theme === 'object' 
    ? (brand.theme as any).heroAssets 
    : null;
  
  // Convert Google Drive URLs to direct download links
  const optimizedAssetUrl = getOptimizedMediaUrl(heroAssets?.assetUrl);
  const optimizedFallbackUrl = getOptimizedMediaUrl(heroAssets?.fallbackImageUrl);
  const hasHeroMedia = optimizedAssetUrl;

  return (
    <div className="min-h-screen">
      {/* Hero Section with Glassmorphism */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background media */}
        {hasHeroMedia && (
          <div className="absolute inset-0 -z-10">
            {heroAssets?.video ? (
              <video
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                className="w-full h-full object-cover"
                poster={optimizedFallbackUrl || undefined}
              >
                <source src={optimizedAssetUrl} type="video/mp4" />
              </video>
            ) : (
              <img
                src={optimizedAssetUrl}
                alt={pool.name}
                className="w-full h-full object-cover"
              />
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-transparent dark:from-black/60 dark:via-black/40" />
          </div>
        )}

        {/* Glass card container */}
        <div className="container mx-auto px-4 py-16">
          <GlassCard className="max-w-4xl mx-auto text-center space-y-8" variant="xl" blur="lg">
            {/* Brand Logo */}
            {pool.brand?.theme.logo && (
              <img
                src={pool.brand.theme.logo.url}
                alt={pool.brand.name}
                className="h-16 md:h-24 mx-auto drop-shadow-lg"
              />
            )}

            {/* Pool Title */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-secondary drop-shadow-lg [text-shadow:_2px_2px_4px_rgb(0_0_0_/_80%)]">
                {pool.name}
              </h1>
              
              {/* Status Badge */}
              <div className="flex justify-center">
                {isExpired ? (
                  <Badge variant="error" className="text-base px-4 py-1.5">
                    <Lock className="w-4 h-4 mr-2" />
                    {t("status.expired")}
                  </Badge>
                ) : (
                  <Badge variant="default" className="text-base px-4 py-1.5 bg-green-500/90 hover:bg-green-600/90">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {t("status.active")}
                  </Badge>
                )}
              </div>
            </div>

            {/* Description */}
            {pool.description && (
              <p className="text-lg md:text-xl text-primary/90 max-w-2xl mx-auto drop-shadow [text-shadow:_2px_2px_4px_rgb(0_0_0_/_80%)]">
                {pool.description}
              </p>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 [text-shadow:_2px_2px_4px_rgb(0_0_0_/_80%)]">
                <Users className="w-6 h-6 text-white" />
                <span className="text-2xl font-bold text-white">
                  {pool._count.registrations}
                </span>
                <span className="text-sm text-white/70">
                  {t("stats.participants")}
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10">
                <Trophy className="w-6 h-6 text-white" />
                <span className="text-2xl font-bold text-white">
                  {pool.prizes.length}
                </span>
                <span className="text-sm text-white/70">
                  {t("stats.prizes")}
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10">
                <Calendar className="w-6 h-6 text-white" />
                <span className="text-2xl font-bold text-white">
                  {pool.season.year}
                </span>
                <span className="text-sm text-white/70">
                  {pool.season.competition.name}
                </span>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-6">
              {renderCTA()}
            </div>
          </GlassCard>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-6 py-16 bg-muted/30">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          {t("sections.howItWorks")}
        </h2>
        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          <GlassCard className="text-center space-y-4" variant="default">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
              <Target className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">{t("howItWorks.step1.title")}</h3>
            <p className="text-muted-foreground">{t("howItWorks.step1.description")}</p>
          </GlassCard>
          <GlassCard className="text-center space-y-4" variant="default">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">{t("howItWorks.step2.title")}</h3>
            <p className="text-muted-foreground">{t("howItWorks.step2.description")}</p>
          </GlassCard>
          <GlassCard className="text-center space-y-4" variant="default">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
              <Award className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">{t("howItWorks.step3.title")}</h3>
            <p className="text-muted-foreground">{t("howItWorks.step3.description")}</p>
          </GlassCard>
        </div>
      </section>

      {/* Prizes Section */}
      {pool.prizes.length > 0 && (
        <section className="container mx-auto px-6 py-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            {t("sections.prizes")}
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {pool.prizes.map((prize, idx) => (
              <GlassCard key={prize.id} className={idx === 0 ? "border-primary border-2" : ""} variant="default">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      {prize.rankFrom === prize.rankTo
                        ? `${t("prize.rank")} ${prize.rankFrom}`
                        : `${t("prize.ranks")} ${prize.rankFrom}-${prize.rankTo}`}
                    </h3>
                    {idx === 0 && <Trophy className="w-6 h-6 text-primary" />}
                  </div>
                  <p className="text-xl font-bold text-primary">{prize.title}</p>
                  {prize.description && (
                    <p className="text-sm text-muted-foreground">{prize.description}</p>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
        </section>
      )}

      {/* Rules Summary */}
      {pool.prizeSummary && (
        <section className="container mx-auto px-6 py-16 bg-muted/30">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
              {t("sections.rules")}
            </h2>
            <GlassCard variant="default">
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                {pool.prizeSummary}
              </p>
            </GlassCard>
          </div>
        </section>
      )}
    </div>
  );
}
