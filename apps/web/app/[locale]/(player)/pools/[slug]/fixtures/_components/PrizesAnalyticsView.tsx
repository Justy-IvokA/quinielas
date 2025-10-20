"use client";

import { trpc } from "@web/trpc";
import { SportsLoader } from "@qp/ui";
import { useTranslations } from "next-intl";

import { PrizePoolHero } from "./prizes/PrizePoolHero";
import { MyPotentialPrizes } from "./prizes/MyPotentialPrizes";
import { PrizesGrid } from "./prizes/PrizesGrid";
import { PoolStatsCards } from "./prizes/PoolStatsCards";

interface PrizesAnalyticsViewProps {
  poolId: string;
  userId: string;
}

export function PrizesAnalyticsView({ poolId, userId }: PrizesAnalyticsViewProps) {
  const tCommon = useTranslations("common");

  // Fetch prizes
  const { data: prizes, isLoading: prizesLoading } = trpc.prizes.listByPool.useQuery({ poolId });

  // Fetch pool details
  const { data: pool, isLoading: poolLoading } = trpc.pools.getById.useQuery({ id: poolId });

  // Fetch leaderboard for user rank
  const { data: leaderboard } = trpc.leaderboard.get.useQuery({ 
    poolId, 
    useLive: true,
    limit: 100,
    offset: 0
  });

  // Find current user's rank in leaderboard
  const myEntry = leaderboard?.entries.find((entry: any) => entry.userId === userId);
  const myRank = myEntry?.rank || null;

  const isLoading = prizesLoading || poolLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <SportsLoader size="lg" text={tCommon("loading")} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hero Section - Prize Pool Summary */}
      <PrizePoolHero prizes={prizes || []} pool={pool} />

      {/* My Chances Section - Show user's potential prizes */}
      <MyPotentialPrizes myRank={myRank} prizes={prizes || []} poolSlug={pool?.slug || ""} />

      {/* All Prizes Grid - Visual cards */}
      <PrizesGrid prizes={prizes || []} />

      {/* Pool Stats - Analytics for engagement */}
      <PoolStatsCards poolId={poolId} leaderboard={leaderboard} />
    </div>
  );
}
