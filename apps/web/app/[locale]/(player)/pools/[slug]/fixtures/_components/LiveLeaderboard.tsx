"use client";

import { useTranslations } from "next-intl";
import { Loader2, AlertCircle, Trophy, TrendingUp, Target } from "lucide-react";
import { Alert, AlertDescription, Badge, Skeleton, cn } from "@qp/ui";
import { trpc } from "@web/trpc";

interface LiveLeaderboardProps {
  poolId: string;
  userId: string;
}

export function LiveLeaderboard({ poolId, userId }: LiveLeaderboardProps) {
  const t = useTranslations("leaderboard");

  // Fetch leaderboard with auto-refresh every 30s
  const { data, isLoading, error } = trpc.leaderboard.get.useQuery(
    {
      poolId,
      useLive: true,
      limit: 100,
      offset: 0
    },
    {
      refetchInterval: 30000, // 30 seconds
      refetchOnWindowFocus: true
    }
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="backdrop-blur-md bg-white/10 border border-white/20 rounded-lg p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="flex-1 h-6" />
              <Skeleton className="w-16 h-6" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{t("errors.loadFailed")}</AlertDescription>
      </Alert>
    );
  }

  const entries = data?.entries || [];
  const isLive = data?.isLive || false;
  const isFinal = data?.isFinal || false;

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-16 h-16 text-white/30 mx-auto mb-4" />
        <p className="text-white/70">{t("noEntries")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Badge */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-white">{t("title")}</h2>
        {isLive && !isFinal && (
          <Badge variant="default" className="bg-primary animate-pulse">
            {t("live")}
          </Badge>
        )}
        {isFinal && (
          <Badge variant="default" className="bg-green-600">
            {t("final")}
          </Badge>
        )}
      </div>

      {/* Leaderboard Table */}
      <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/20 to-primary/10 p-4 border-b border-white/10">
          <div className="grid grid-cols-[60px_1fr_80px_80px_80px_100px] gap-4 text-white/70 text-sm font-medium">
            <div>{t("rank")}</div>
            <div>{t("player")}</div>
            <div className="text-center">{t("exact")}</div>
            <div className="text-center">{t("sign")}</div>
            <div className="text-center">{t("predictions")}</div>
            <div className="text-right">{t("points")}</div>
          </div>
        </div>

        {/* Entries */}
        <div className="divide-y divide-white/10">
          {entries.map((entry: any, index: number) => {
            const isCurrentUser = entry.userId === userId;
            const rank = index + 1;

            return (
              <div
                key={entry.userId}
                className={cn(
                  "p-4 transition-colors",
                  isCurrentUser && "bg-primary/20 border-l-4 border-primary"
                )}
              >
                <div className="grid grid-cols-[60px_1fr_80px_80px_80px_100px] gap-4 items-center">
                  {/* Rank */}
                  <div className="flex items-center gap-2">
                    {rank === 1 && <Trophy className="w-5 h-5 text-yellow-400" />}
                    {rank === 2 && <Trophy className="w-5 h-5 text-gray-400" />}
                    {rank === 3 && <Trophy className="w-5 h-5 text-amber-600" />}
                    <span className="text-white font-bold">{rank}</span>
                  </div>

                  {/* Player */}
                  <div>
                    <div className="text-white font-medium truncate flex items-center gap-2">
                      <span>{entry.userName || entry.userEmail}</span>
                      {isCurrentUser && (
                        <Badge variant="outline" className="text-xs border-primary text-primary">
                          {t("you")}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Exact */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-white">
                      <Target className="w-4 h-4 text-green-400" />
                      <span className="font-bold">{entry.exactCount || 0}</span>
                    </div>
                  </div>

                  {/* Sign */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-white">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                      <span className="font-bold">{entry.signCount || 0}</span>
                    </div>
                  </div>

                  {/* Predictions */}
                  <div className="text-center text-white/70">
                    {entry.predictionsCount || 0}
                  </div>

                  {/* Points */}
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary">
                      {entry.totalPoints || 0}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Last Updated */}
      {data?.snapshotAt && (
        <p className="text-white/50 text-sm text-center">
          {t("lastUpdated")}: {new Date(data.snapshotAt).toLocaleString("es-MX")}
        </p>
      )}
    </div>
  );
}
