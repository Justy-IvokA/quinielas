"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Trophy, Calendar, Users, Lock, CheckCircle2 } from "lucide-react";
import type { Pool, Tenant, Brand, Season, Competition, AccessPolicy, Prize } from "@qp/db";
import { getOptimizedMediaUrl } from "@qp/utils/client";
import { Button, Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@qp/ui";
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
          <Badge variant="error" className="w-fit">
            <Lock className="w-4 h-4 mr-2" />
            {t("status.expired")}
          </Badge>
          <Link href={`/${pool.slug}/leaderboard`}>
            <Button size="lg" className="w-full">
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
          <Badge variant="default" className="w-fit">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {t("status.registered")}
          </Badge>
          <div className="flex gap-3">
            <Link href={`/${pool.slug}/fixtures`} className="flex-1">
              <Button size="lg" className="w-full">
                {t("actions.makePredictions")}
              </Button>
            </Link>
            <Link href={`/${pool.slug}/leaderboard`} className="flex-1">
              <Button size="lg" variant="outline" className="w-full">
                {t("actions.viewLeaderboard")}
              </Button>
            </Link>
          </div>
        </div>
      );
    }

    // Not registered or not logged in
    const accessType = pool.accessPolicy?.accessType || "PUBLIC";
    
    return (
      <div className="flex flex-col gap-4">
        <Link href={`/register?pool=${pool.slug}`}>
          <Button size="lg" className="w-full">
            {accessType === "PUBLIC" 
              ? t("actions.joinNow")
              : accessType === "CODE"
              ? t("actions.joinWithCode")
              : t("actions.joinWithInvite")}
          </Button>
        </Link>
        {!session && (
          <p className="text-sm text-muted-foreground text-center">
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
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background media */}
        {hasHeroMedia && (
          <div className="absolute inset-0 -z-10">
            {heroAssets?.video ? (
              <video
                autoPlay
                loop
                muted
                playsInline
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
            <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
          </div>
        )}

        <div className="container mx-auto px-6 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            {/* Brand Logo */}
            {pool.brand?.logoUrl && (
              <img
                src={pool.brand.logoUrl}
                alt={pool.brand.name}
                className="h-16 md:h-20 mx-auto"
              />
            )}

            {/* Pool Title */}
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              {pool.name}
            </h1>

            {/* Description */}
            {pool.description && (
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {pool.description}
              </p>
            )}

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="font-semibold">
                  {pool._count.registrations} {t("stats.participants")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                <span className="font-semibold">
                  {pool.prizes.length} {t("stats.prizes")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="font-semibold">
                  {pool.season.competition.name} {pool.season.year}
                </span>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-8">
              {renderCTA()}
            </div>
          </div>
        </div>
      </section>

      {/* Prizes Section */}
      {pool.prizes.length > 0 && (
        <section className="container mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t("sections.prizes")}
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {pool.prizes.map((prize, idx) => (
              <Card key={prize.id} className={idx === 0 ? "border-primary" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {prize.rankFrom === prize.rankTo
                        ? `${t("prize.rank")} ${prize.rankFrom}`
                        : `${t("prize.ranks")} ${prize.rankFrom}-${prize.rankTo}`}
                    </CardTitle>
                    {idx === 0 && <Trophy className="w-6 h-6 text-primary" />}
                  </div>
                  <CardDescription>{prize.title}</CardDescription>
                </CardHeader>
                {prize.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{prize.description}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Rules Summary */}
      {pool.prizeSummary && (
        <section className="container mx-auto px-6 py-16 bg-muted/30">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">
              {t("sections.howItWorks")}
            </h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground whitespace-pre-line">
                  {pool.prizeSummary}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      )}
    </div>
  );
}
