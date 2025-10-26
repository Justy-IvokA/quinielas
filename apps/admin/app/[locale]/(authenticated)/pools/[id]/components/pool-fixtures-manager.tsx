"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Calendar, CheckCircle, Clock, Lock, RefreshCw } from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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

interface PoolFixturesManagerProps {
  poolId: string;
}

export function PoolFixturesManager({ poolId }: PoolFixturesManagerProps) {
  const t = useTranslations("fixtures");
  const [activeTab, setActiveTab] = useState("upcoming");

  // Get pool data to extract seasonId and other info
  const { data: pool, isLoading: isLoadingPool } = trpc.pools.getById.useQuery({ id: poolId });
  
  const seasonId = pool?.seasonId || "";
  const seasonName = pool?.season?.name || "";
  const competitionName = pool?.season?.competition?.name || "";

  // Get external sources for sync
  const { data: sources, isLoading: isLoadingSources } = trpc.fixtures.getExternalSources.useQuery();
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const sourceId = selectedSourceId || sources?.[0]?.id || "";

  // Get all matches for the season
  const { data: allMatches, isLoading: isLoadingMatches } = trpc.fixtures.getBySeasonId.useQuery(
    { seasonId, includeFinished: true },
    { enabled: !!seasonId }
  );
  
  // ✅ Filter matches by rounds if specified in pool rules
  const ruleSet = pool?.ruleSet as any;
  const roundsFilter = ruleSet?.rounds;
  
  const filteredMatches = allMatches?.filter(m => {
    if (!roundsFilter) return true; // No filter - show all
    if (m.round === null || m.round === undefined) return false; // Skip matches without round
    return m.round >= roundsFilter.start && m.round <= roundsFilter.end;
  }) || [];
  
  // Filter matches by status
  const upcomingMatches = filteredMatches.filter(m => m.status === "SCHEDULED") || [];
  const liveMatches = filteredMatches.filter(m => m.status === "LIVE") || [];
  const finishedMatches = filteredMatches.filter(m => m.status === "FINISHED") || [];
  
  const isLoadingUpcoming = isLoadingMatches;
  const isLoadingLive = isLoadingMatches;
  const isLoadingFinished = isLoadingMatches;

  const utils = trpc.useUtils();

  const syncMutation = trpc.fixtures.syncSeasonFixtures.useMutation({
    onSuccess: (data) => {
      toastSuccess(t("sync.success", { count: data.synced }));
      utils.fixtures.getBySeasonId.invalidate();
    },
    onError: (error) => {
      toastError(t("sync.error", { message: error.message }));
    }
  });

  const handleSync = () => {
    if (!seasonId || !sourceId) {
      toastError("Por favor selecciona una fuente de datos");
      return;
    }
    syncMutation.mutate({ seasonId, externalSourceId: sourceId });
  };

  if (isLoadingPool) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-4 py-6">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!pool) {
    return (
      <EmptyState
        title="Pool no encontrado"
        description="No se pudo cargar la información del pool"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Pool Info Header */}
      <Card>
        <CardHeader>
          <CardTitle>{pool.name}</CardTitle>
          <CardDescription>
            {competitionName} - {seasonName} ({filteredMatches.length} partidos{roundsFilter ? ` - Jornadas ${roundsFilter.start}-${roundsFilter.end}` : ""})
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Sync Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("sync.title")}</CardTitle>
                <CardDescription>{t("sync.description")}</CardDescription>
              </div>
              <Button 
                onClick={handleSync} 
                loading={syncMutation.isPending} 
                StartIcon={RefreshCw} 
                disabled={!seasonId || !sourceId}
              >
                {t("sync.button")}
              </Button>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Fuente de datos</label>
                <Select 
                  value={sourceId} 
                  onValueChange={setSelectedSourceId} 
                  disabled={isLoadingSources}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una fuente" />
                  </SelectTrigger>
                  <SelectContent>
                    {sources?.map((source) => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.name} ({source.slug})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Fixtures Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="upcoming">
            <Calendar className="mr-2 h-4 w-4" />
            {t("tabs.upcoming")} ({upcomingMatches.length})
          </TabsTrigger>
          <TabsTrigger value="live">
            <Clock className="mr-2 h-4 w-4" />
            {t("tabs.live")} ({liveMatches.length})
          </TabsTrigger>
          <TabsTrigger value="finished">
            <CheckCircle className="mr-2 h-4 w-4" />
            Finalizados ({finishedMatches.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {isLoadingUpcoming ? (
            <FixturesSkeleton />
          ) : upcomingMatches.length === 0 ? (
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
          ) : liveMatches.length === 0 ? (
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

        <TabsContent value="finished" className="mt-6">
          {isLoadingFinished ? (
            <FixturesSkeleton />
          ) : finishedMatches.length === 0 ? (
            <EmptyState
              title="No hay partidos finalizados"
              description="Los partidos finalizados aparecerán aquí"
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("table.date")}</TableHead>
                      <TableHead>{t("table.match")}</TableHead>
                      <TableHead>{t("table.score")}</TableHead>
                      <TableHead>{t("table.round")}</TableHead>
                      <TableHead>{t("table.predictions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {finishedMatches.map((match) => (
                      <TableRow key={match.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(match.kickoffTime).toLocaleDateString("es-MX", {
                            month: "short",
                            day: "numeric"
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
                          <div className="flex items-center gap-2 font-mono text-lg font-bold">
                            <span>{match.homeScore ?? "-"}</span>
                            <span className="text-muted-foreground">:</span>
                            <span>{match.awayScore ?? "-"}</span>
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
