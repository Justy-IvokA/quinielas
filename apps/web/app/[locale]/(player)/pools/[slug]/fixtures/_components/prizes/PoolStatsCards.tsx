"use client";

import { useTranslations } from "next-intl";
import { Users, Target, Trophy, Calendar } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, SportsLoader } from "@qp/ui";
import { trpc } from "@web/trpc";

interface LeaderboardEntry {
  userId: string;
  userName: string | null;
  userEmail: string;
  rank: number;
  totalPoints: number;
  exactCount: number;
  signCount: number;
  predictionsCount: number;
}

interface Leaderboard {
  poolId: string;
  isLive: boolean;
  isFinal: boolean;
  snapshotAt: Date | null;
  entries: LeaderboardEntry[];
  total: number;
}

interface PoolStatsCardsProps {
  poolId: string;
  leaderboard: Leaderboard | undefined;
}

export function PoolStatsCards({ poolId, leaderboard }: PoolStatsCardsProps) {
  const t = useTranslations("prizes.stats");

  // Fetch pool registrations for participant count
  const { data: registrations, isLoading: registrationsLoading } = 
    trpc.pools.getRegistrations.useQuery({ poolId });

  // Fetch matches for match stats
  const { data: pool } = trpc.pools.getById.useQuery({ id: poolId });

  const { data: matches } = trpc.fixtures.listBySeason.useQuery(
    { seasonId: pool?.seasonId || "" },
    { enabled: !!pool?.seasonId }
  );

  // Calculate stats
  const totalParticipants = registrations?.length || 0;
  const activeParticipants = leaderboard?.entries.filter((e) => e.predictionsCount > 0).length || 0;

  const totalPredictions = leaderboard?.entries.reduce(
    (sum, entry) => sum + entry.predictionsCount,
    0
  ) || 0;

  const avgPoints = totalParticipants > 0
    ? (leaderboard?.entries.reduce((sum, entry) => sum + entry.totalPoints, 0) || 0) / totalParticipants
    : 0;

  const leader = leaderboard?.entries[0];

  const completedMatches = matches?.filter((m) => m.status === "FINISHED").length || 0;
  const pendingMatches = matches?.filter((m) => m.status === "SCHEDULED").length || 0;

  if (registrationsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <SportsLoader size="md" text={t("participants")} />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Participants */}
      <Card className="backdrop-blur-md bg-primary/10 border border-white/20 hover:bg-white/10 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-accent">
            {t("participants")}
          </CardTitle>
          <Users className="w-4 h-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-white">{totalParticipants}</div>
          <p className="text-xs text-secondary mt-1">
            {t("active", { count: activeParticipants })}
          </p>
        </CardContent>
      </Card>

      {/* Predictions */}
      <Card className="backdrop-blur-md bg-primary/10 border border-white/20 hover:bg-white/10 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-accent">
            {t("predictions")}
          </CardTitle>
          <Target className="w-4 h-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-white">{totalPredictions}</div>
          <p className="text-xs text-secondary mt-1">
            {t("totalMade", { count: totalPredictions })}
          </p>
        </CardContent>
      </Card>

      {/* Leader */}
      <Card className="backdrop-blur-md bg-primary/10 border border-white/20 hover:bg-white/10 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-accent">
            {t("leader")}
          </CardTitle>
          <Trophy className="w-4 h-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-white">
            {leader?.totalPoints || 0}
          </div>
          <p className="text-xs text-secondary mt-1 truncate">
            {leader?.userName || leader?.userEmail || "—"}
          </p>
        </CardContent>
      </Card>

      {/* Matches */}
      <Card className="backdrop-blur-md bg-primary/10 border border-white/20 hover:bg-white/10 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-accent">
            {t("matches")}
          </CardTitle>
          <Calendar className="w-4 h-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-white">{completedMatches}</div>
          <p className="text-xs text-secondary mt-1">
            {t("completed", { count: completedMatches })} / {t("pending", { count: pendingMatches })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
