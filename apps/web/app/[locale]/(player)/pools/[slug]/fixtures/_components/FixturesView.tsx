"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, AlertCircle } from "lucide-react";
import { Button, Alert, AlertDescription, Tabs, TabsList, TabsTrigger, TabsContent } from "@qp/ui";
import { BackButton } from "../../../../../../components/back-button";
import { trpc } from "@web/trpc";

import { MatchCard } from "./MatchCard";
import { LiveLeaderboard } from "./LiveLeaderboard";
import { StatsWidget } from "./StatsWidget";

interface FixturesViewProps {
  locale: string;
  pool: {
    id: string;
    slug: string;
    name: string;
    seasonId: string;
    season: {
      id: string;
      name: string;
      year: number;
      competition: {
        name: string;
        logoUrl: string | null;
      };
    };
    brand: {
      name: string;
      logoUrl: string | null;
    } | null;
  };
  userId: string;
  initialFilter: "ALL" | "PENDING" | "LIVE" | "FINISHED";
}

export function FixturesView({ locale, pool, userId, initialFilter }: FixturesViewProps) {
  const t = useTranslations("fixtures");
  const tCommon = useTranslations("common");

  const [filter, setFilter] = useState<"ALL" | "PENDING" | "LIVE" | "FINISHED">(initialFilter);

  // Fetch matches
  const { data: matches, isLoading: matchesLoading, error: matchesError } = trpc.fixtures.listBySeason.useQuery({
    seasonId: pool.seasonId
  });

  // Fetch user predictions
  const { data: predictions, isLoading: predictionsLoading } = trpc.predictions.getByPool.useQuery({
    poolId: pool.id
  });

  const isLoading = matchesLoading || predictionsLoading;

  // Create prediction map
  const predictionMap = new Map(
    (predictions || []).map((p) => [p.matchId, p])
  );

  // Filter matches
  const now = new Date();
  const filteredMatches = (matches || []).filter((match) => {
    if (filter === "PENDING") {
      return match.status === "SCHEDULED" && match.kickoffTime > now;
    }
    if (filter === "LIVE") {
      return match.status === "LIVE";
    }
    if (filter === "FINISHED") {
      return match.status === "FINISHED";
    }
    return true;
  });

  // Group by round
  const matchesByRound = filteredMatches.reduce((acc, match) => {
    const round = match.round || 0;
    if (!acc[round]) {
      acc[round] = [];
    }
    acc[round].push(match);
    return acc;
  }, {} as Record<number, typeof filteredMatches>);

  const rounds = Object.keys(matchesByRound)
    .map(Number)
    .sort((a, b) => a - b);

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-white/70">{t("loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (matchesError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t("errors.loadFailed")}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-8 [text-shadow:_2px_2px_4px_rgb(0_0_0_/_80%)]">
        <div className="flex items-center gap-2 mb-4">
          <BackButton />
          {pool.brand?.logoUrl && (
            <img
              src={pool.brand.logoUrl}
              alt={pool.brand.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
          )}
          <div>
            <h1 className="text-primary/80 text-4xl font-bold">{pool.name}</h1>
            <p className="text-primary/70">{pool.season.competition.name} {pool.season.year}</p>
          </div>
        </div>
      </header>

      {/* Tabs: Fixtures, Leaderboard & Stats */}
      <Tabs defaultValue="fixtures" className="mb-8">
        <TabsList className="bg-white/10 border border-white/20">
          <TabsTrigger value="fixtures" className="data-[state=active]:bg-primary">
            {t("tabs.fixtures")}
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="data-[state=active]:bg-primary">
            {t("tabs.leaderboard")}
          </TabsTrigger>
          <TabsTrigger value="stats" className="data-[state=active]:bg-primary">
            {t("tabs.stats")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fixtures" className="mt-6">
          {/* Filter Buttons */}
          <div className="flex gap-2 mb-6 flex-wrap">
            <Button
              variant={filter === "ALL" ? "default" : "outline"}
              onClick={() => setFilter("ALL")}
              className={filter === "ALL" ? "bg-primary" : "bg-white/10 border-white/20 text-white"}
            >
              {t("filters.all")}
            </Button>
            <Button
              variant={filter === "PENDING" ? "default" : "outline"}
              onClick={() => setFilter("PENDING")}
              className={filter === "PENDING" ? "bg-primary" : "bg-white/10 border-white/20 text-white"}
            >
              {t("filters.pending")}
            </Button>
            <Button
              variant={filter === "LIVE" ? "default" : "outline"}
              onClick={() => setFilter("LIVE")}
              className={filter === "LIVE" ? "bg-primary" : "bg-white/10 border-white/20 text-white"}
            >
              {t("filters.live")}
            </Button>
            <Button
              variant={filter === "FINISHED" ? "default" : "outline"}
              onClick={() => setFilter("FINISHED")}
              className={filter === "FINISHED" ? "bg-primary" : "bg-white/10 border-white/20 text-white"}
            >
              {t("filters.finished")}
            </Button>
          </div>

          {/* Matches by Round */}
          {rounds.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/70">{t("noMatches")}</p>
            </div>
          ) : (
            <div className="space-y-8">
              {rounds.map((round) => (
                <div key={round}>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    {t("round", { number: round })}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {matchesByRound[round].map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        prediction={predictionMap.get(match.id)}
                        poolId={pool.id}
                        userId={userId}
                        locale={locale}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-6">
          <LiveLeaderboard poolId={pool.id} userId={userId} />
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <StatsWidget 
            seasonId={pool.seasonId}
            competitionName={pool.season.competition.name}
            locale={locale}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
