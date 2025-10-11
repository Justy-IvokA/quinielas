"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Trophy, Medal, Award, RefreshCw, TrendingUp } from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@qp/ui";

import { trpc } from "@web/trpc";

interface LeaderboardViewProps {
  pool: any;
}

export function LeaderboardView({ pool }: LeaderboardViewProps) {
  const t = useTranslations("pool.leaderboard");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: leaderboard, isLoading, refetch } = trpc.leaderboard.get.useQuery({
    poolId: pool.id,
    useLive: true,
    limit: 100,
    offset: 0
  });

  const { data: snapshots } = trpc.leaderboard.getSnapshots.useQuery({
    poolId: pool.id,
    limit: 5
  });

  // Auto-refetch every 30s if live
  useEffect(() => {
    if (!autoRefresh || !leaderboard?.isLive) return;

    const interval = setInterval(() => {
      refetch();
    }, 30000); // 30s

    return () => clearInterval(interval);
  }, [autoRefresh, leaderboard?.isLive, refetch]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return null;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge variant="success">{rank}</Badge>;
    if (rank <= 3) return <Badge variant="default">{rank}</Badge>;
    return <Badge variant="outline">{rank}</Badge>;
  };

  if (isLoading) {
    return <LeaderboardSkeleton />;
  }

  if (!leaderboard || leaderboard.entries.length === 0) {
    return (
      <EmptyState
        title={t("empty.title")}
        description={t("empty.description")}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {t("title")}
              </CardTitle>
              <CardDescription>
                {leaderboard.isLive ? (
                  <span className="flex items-center gap-2">
                    <Badge variant="error" className="animate-pulse">
                      {t("live")}
                    </Badge>
                    {t("liveDescription")}
                  </span>
                ) : leaderboard.isFinal ? (
                  <span className="flex items-center gap-2">
                    <Badge variant="success">{t("final")}</Badge>
                    {t("finalDescription")}
                  </span>
                ) : (
                  t("description")
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                StartIcon={RefreshCw}
              >
                {t("refresh")}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="current">
        <TabsList>
          <TabsTrigger value="current">{t("tabs.current")}</TabsTrigger>
          {snapshots && snapshots.length > 0 && (
            <TabsTrigger value="history">{t("tabs.history")}</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="current" className="mt-6">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">{t("table.rank")}</TableHead>
                    <TableHead>{t("table.player")}</TableHead>
                    <TableHead className="text-right">{t("table.points")}</TableHead>
                    <TableHead className="text-right">{t("table.exact")}</TableHead>
                    <TableHead className="text-right">{t("table.sign")}</TableHead>
                    <TableHead className="text-right">{t("table.predictions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.entries.map((entry: any) => (
                    <TableRow key={entry.userId} className={entry.rank <= 3 ? "bg-muted/50" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRankIcon(entry.rank)}
                          {getRankBadge(entry.rank)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-1">
                          <span>{entry.userName || t("anonymous")}</span>
                          <span className="text-xs text-muted-foreground">{entry.userEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono text-lg font-bold">{entry.totalPoints}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{entry.exactCount}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{entry.signCount}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {entry.predictionsCount}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {leaderboard.total > leaderboard.entries.length && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              {t("showing", {
                shown: leaderboard.entries.length,
                total: leaderboard.total
              })}
            </div>
          )}
        </TabsContent>

        {snapshots && snapshots.length > 0 && (
          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("snapshots.title")}</CardTitle>
                <CardDescription>{t("snapshots.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {snapshots.map((snapshot: any) => (
                    <div
                      key={snapshot.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">
                          {new Date(snapshot.createdAt).toLocaleDateString("es-MX", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {t("snapshots.entries", { count: snapshot.entriesCount })}
                        </span>
                      </div>
                      <Button variant="outline" size="sm">
                        {t("snapshots.view")}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 py-6">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}
