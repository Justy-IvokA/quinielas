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

export function FixturesManager() {
  const t = useTranslations("fixtures");
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);

  // Datos hardcodeados temporalmente - actualizar con el nuevo Season ID de 2022
  const seasons = [{ id: "cmgjzoic30007uv5k3k5tc7p4", name: "World Cup 2022", year: 2022, competition: { name: "FIFA World Cup" }, _count: { matches: 3 } }];
  const sources = [{ id: "cmgjmobdm000cuvzkokqnyhwx", name: "API-Football", slug: "api-football" }];
  const isLoadingSeasons = false;
  const isLoadingSources = false;

  // Auto-select first season and source
  const seasonId = selectedSeasonId || seasons?.[0]?.id || "";
  const sourceId = selectedSourceId || sources?.[0]?.id || "";

  // Temporalmente comentado - usando getBySeasonId en su lugar
  const { data: allMatches, isLoading: isLoadingMatches } = trpc.fixtures.getBySeasonId.useQuery(
    { seasonId, includeFinished: true }, // Cambiar a true para ver partidos finalizados del Mundial 2022
    { enabled: !!seasonId }
  );
  
  // Filtrar matches por estado
  const upcomingMatches = allMatches?.filter(m => m.status === "SCHEDULED") || [];
  const liveMatches = allMatches?.filter(m => m.status === "LIVE") || [];
  const finishedMatches = allMatches?.filter(m => m.status === "FINISHED") || [];
  const isLoadingUpcoming = isLoadingMatches;
  const isLoadingLive = isLoadingMatches;
  const isLoadingFinished = isLoadingMatches;

  const utils = trpc.useUtils();

  const syncMutation = trpc.fixtures.syncSeasonFixtures.useMutation({
    onSuccess: (data) => {
      toastSuccess(t("sync.success", { count: data.synced }));
      // Invalidar las queries para recargar los datos
      utils.fixtures.getBySeasonId.invalidate();
    },
    onError: (error) => {
      toastError(t("sync.error", { message: error.message }));
    }
  });

  const handleSync = () => {
    if (!seasonId || !sourceId) {
      toastError("Por favor selecciona una temporada y una fuente");
      return;
    }
    syncMutation.mutate({ seasonId, externalSourceId: sourceId });
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("sync.title")}</CardTitle>
                <CardDescription>{t("sync.description")}</CardDescription>
              </div>
              <Button onClick={handleSync} loading={syncMutation.isPending} StartIcon={RefreshCw} disabled={!seasonId || !sourceId}>
                {t("sync.button")}
              </Button>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Temporada</label>
                <Select value={seasonId} onValueChange={setSelectedSeasonId} disabled={isLoadingSeasons}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una temporada" />
                  </SelectTrigger>
                  <SelectContent>
                    {seasons?.map((season) => (
                      <SelectItem key={season.id} value={season.id}>
                        {season.competition.name} - {season.year} ({season._count.matches} partidos)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Fuente de datos</label>
                <Select value={sourceId} onValueChange={setSelectedSourceId} disabled={isLoadingSources}>
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
          <TabsTrigger value="finished">
            <CheckCircle className="mr-2 h-4 w-4" />
            Finalizados ({finishedMatches.length})
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

        <TabsContent value="finished" className="mt-6">
          {isLoadingFinished ? (
            <FixturesSkeleton />
          ) : !finishedMatches || finishedMatches.length === 0 ? (
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
