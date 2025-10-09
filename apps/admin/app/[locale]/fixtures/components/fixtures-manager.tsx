"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Calendar, Clock, Lock, RefreshCw } from "lucide-react";

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
  TabsTrigger,
  toastError,
  toastSuccess
} from "@qp/ui";

import { trpc } from "@admin/trpc";

export function FixturesManager() {
  const t = useTranslations("fixtures");
  const [activeTab, setActiveTab] = useState("upcoming");
  const seasonId = "demo-season-id"; // Replace with actual season selector

  const { data: upcomingMatches, isLoading: isLoadingUpcoming } = trpc.fixtures.getUpcoming.useQuery({ seasonId });
  const { data: liveMatches, isLoading: isLoadingLive } = trpc.fixtures.getLive.useQuery({ seasonId });

  const syncMutation = trpc.fixtures.syncSeasonFixtures.useMutation({
    onSuccess: (data) => {
      toastSuccess(t("sync.success", { count: data.synced }));
    },
    onError: (error) => {
      toastError(t("sync.error", { message: error.message }));
    }
  });

  const handleSync = () => {
    const externalSourceId = "demo-source-id"; // Replace with actual source selector
    syncMutation.mutate({ seasonId, externalSourceId });
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("sync.title")}</CardTitle>
              <CardDescription>{t("sync.description")}</CardDescription>
            </div>
            <Button onClick={handleSync} loading={syncMutation.isPending} StartIcon={RefreshCw}>
              {t("sync.button")}
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming">
            <Calendar className="mr-2 h-4 w-4" />
            {t("tabs.upcoming")}
          </TabsTrigger>
          <TabsTrigger value="live">
            <Clock className="mr-2 h-4 w-4" />
            {t("tabs.live")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {isLoadingUpcoming ? (
            <FixturesSkeleton />
          ) : !upcomingMatches || upcomingMatches.length === 0 ? (
            <EmptyState
              title={t("empty.upcoming.title")}
              description={t("empty.upcoming.description")}
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("table.date")}</TableHead>
                      <TableHead>{t("table.match")}</TableHead>
                      <TableHead>{t("table.round")}</TableHead>
                      <TableHead>{t("table.status")}</TableHead>
                      <TableHead>{t("table.predictions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingMatches.map((match) => (
                      <TableRow key={match.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(match.kickoffTime).toLocaleDateString("es-MX", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <span>{match.homeTeam.shortName || match.homeTeam.name}</span>
                            <span className="text-muted-foreground">vs</span>
                            <span>{match.awayTeam.shortName || match.awayTeam.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{match.round}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={match.locked ? "gray" : "default"}>
                            {match.locked ? (
                              <>
                                <Lock className="mr-1 h-3 w-3" />
                                {t("status.locked")}
                              </>
                            ) : (
                              t("status.open")
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {(match as any)._count?.predictions || 0}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="live" className="mt-6">
          {isLoadingLive ? (
            <FixturesSkeleton />
          ) : !liveMatches || liveMatches.length === 0 ? (
            <EmptyState
              title={t("empty.live.title")}
              description={t("empty.live.description")}
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("table.match")}</TableHead>
                      <TableHead>{t("table.score")}</TableHead>
                      <TableHead>{t("table.round")}</TableHead>
                      <TableHead>{t("table.predictions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {liveMatches.map((match) => (
                      <TableRow key={match.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <span>{match.homeTeam.shortName || match.homeTeam.name}</span>
                            <span className="text-muted-foreground">vs</span>
                            <span>{match.awayTeam.shortName || match.awayTeam.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 font-mono text-lg font-bold">
                            <span>{match.homeScore ?? "-"}</span>
                            <span className="text-muted-foreground">:</span>
                            <span>{match.awayScore ?? "-"}</span>
                            <Badge variant="error" className="ml-2">
                              {t("table.liveBadge")}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{match.round}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {(match as any)._count?.predictions || 0}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FixturesSkeleton() {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 py-6">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}
