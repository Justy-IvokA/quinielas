"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Lock, Clock, CheckCircle2, AlertCircle, Save } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toastError,
  toastPromise,
  toastSuccess,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@qp/ui";

import { trpc } from "@web/trpc";

interface FixturesAndPredictionsProps {
  pool: any;
}

export function FixturesAndPredictions({ pool }: FixturesAndPredictionsProps) {
  const t = useTranslations("pool.fixtures");
  const { data: session } = trpc.auth.getSession.useQuery();
  const router = useRouter();
  const [predictions, setPredictions] = useState<Record<string, { home: number; away: number }>>({});
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Check if user is registered
  const { data: registration, isLoading: isLoadingReg } = trpc.registration.checkRegistration.useQuery(
    { 
      poolId: pool.id,
      userId: session?.user?.id ?? ""
    },
    { enabled: !!session?.user?.id }
  );

  // Get fixtures
  const { data: matches, isLoading: isLoadingMatches, refetch } = trpc.fixtures.getBySeasonId.useQuery({
    seasonId: pool.seasonId,
    includeFinished: true
  });

  // Get user's predictions
  const { data: userPredictions, isLoading: isLoadingPreds } = trpc.predictions.getByPool.useQuery(
    { poolId: pool.id },
    { enabled: !!session && !!registration }
  );

  // Save prediction mutation
  const savePrediction = trpc.predictions.save.useMutation({
    onSuccess: () => {
      toastSuccess(t("save.success"));
      setEditingMatchId(null);
    },
    onError: (error) => {
      toastError(error.message);
    }
  });

  // Bulk save mutation
  const bulkSave = trpc.predictions.bulkSave.useMutation({
    onSuccess: (data) => {
      toastSuccess(t("bulkSave.success", { count: data.saved }));
      if (data.errors.length > 0) {
        toastError(t("bulkSave.partialError", { count: data.errors.length }));
      }
      setHasUnsavedChanges(false);
    },
    onError: (error) => {
      toastError(error.message);
    }
  });

  // Initialize predictions from user data
  useEffect(() => {
    if (userPredictions) {
      const predMap: Record<string, { home: number; away: number }> = {};
      for (const pred of userPredictions) {
        predMap[pred.matchId] = {
          home: pred.homeScore,
          away: pred.awayScore
        };
      }
      setPredictions(predMap);
      setHasUnsavedChanges(false);
    }
  }, [userPredictions]);

  // Auto-refetch every 60s during match windows
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 60000); // 60s

    return () => clearInterval(interval);
  }, [refetch]);

  const handlePredictionChange = (matchId: string, type: "home" | "away", value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0 || numValue > 99) return;

    setPredictions((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [type]: numValue
      }
    }));
    setHasUnsavedChanges(true);
  };

  const handleSavePrediction = (matchId: string) => {
    const pred = predictions[matchId];
    if (!pred || pred.home === undefined || pred.away === undefined) {
      toastError(t("validation.incomplete"));
      return;
    }

    savePrediction.mutate({
      poolId: pool.id,
      matchId,
      homeScore: pred.home,
      awayScore: pred.away
    });
  };

  const handleBulkSave = () => {
    // Only save predictions that have changed
    const changedPredictions = Object.entries(predictions)
      .filter(([matchId, pred]) => {
        // Check if prediction exists and has both scores
        if (pred.home === undefined || pred.away === undefined) return false;
        
        // Check if it's different from saved prediction
        const savedPred = userPredictions?.find(p => p.matchId === matchId);
        if (!savedPred) return true; // New prediction
        
        return savedPred.homeScore !== pred.home || savedPred.awayScore !== pred.away;
      })
      .map(([matchId, pred]) => ({
        matchId,
        homeScore: pred.home,
        awayScore: pred.away
      }));

    if (changedPredictions.length === 0) {
      toastError(t("validation.noChanges"));
      return;
    }

    bulkSave.mutate({
      poolId: pool.id,
      predictions: changedPredictions
    });
  };

  const isMatchLocked = (match: any) => {
    return match.locked || new Date(match.kickoffTime) <= new Date();
  };

  const getStatusBadge = (match: any) => {
    if (match.status === "FINISHED") {
      return (
        <Badge variant="success">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          {t("status.finished")}
        </Badge>
      );
    }
    if (match.status === "LIVE") {
      return (
        <Badge variant="error">
          <Clock className="mr-1 h-3 w-3" />
          {t("status.live")}
        </Badge>
      );
    }
    if (isMatchLocked(match)) {
      return (
        <Badge variant="gray">
          <Lock className="mr-1 h-3 w-3" />
          {t("status.locked")}
        </Badge>
      );
    }
    return (
      <Badge variant="default">
        <Clock className="mr-1 h-3 w-3" />
        {t("status.open")}
      </Badge>
    );
  };

  const getCountdown = (kickoffTime: Date) => {
    const now = new Date();
    const kickoff = new Date(kickoffTime);
    if (kickoff <= now) return null;

    return formatDistanceToNow(kickoff, { locale: es, addSuffix: true });
  };

  if (!session) {
    return (
      <EmptyState
        title={t("auth.required.title")}
        description={t("auth.required.description")}
        action={{
          label: t("auth.signIn"),
          onClick: () => router.push("/api/auth/signin")
        }}
      />
    );
  }

  if (isLoadingReg) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!registration) {
    return (
      <EmptyState
        title={t("registration.required.title")}
        description={t("registration.required.description")}
        action={{
          label: t("registration.join"),
          onClick: () => router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/pools/${pool.slug}/fixtures`)}`)
        }}
      />
    );
  }

  if (isLoadingMatches || isLoadingPreds) {
    return <FixturesSkeleton />;
  }

  if (!matches || matches.length === 0) {
    return (
      <EmptyState
        title={t("empty.title")}
        description={t("empty.description")}
      />
    );
  }

  // Group matches by date
  const groupedMatches = matches.reduce((acc, match) => {
    const date = new Date(match.kickoffTime).toLocaleDateString("es-MX", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(match);
    return acc;
  }, {} as Record<string, typeof matches>);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("title")}</CardTitle>
              <CardDescription>{t("description")}</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {hasUnsavedChanges && (
                <span className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {t("unsavedChanges")}
                </span>
              )}
              <Button
                onClick={handleBulkSave}
                loading={bulkSave.isPending}
                disabled={!hasUnsavedChanges || bulkSave.isPending}
                StartIcon={Save}
                variant={hasUnsavedChanges ? "default" : "secondary"}
              >
                {t("saveAll")}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {Object.entries(groupedMatches).map(([date, dateMatches]) => (
        <Card key={date}>
          <CardHeader>
            <CardTitle className="text-lg">{date}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.time")}</TableHead>
                  <TableHead>{t("table.match")}</TableHead>
                  <TableHead>{t("table.prediction")}</TableHead>
                  <TableHead>{t("table.result")}</TableHead>
                  <TableHead>{t("table.status")}</TableHead>
                  <TableHead>{t("table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dateMatches.map((match) => {
                  const locked = isMatchLocked(match);
                  const pred = predictions[match.id];
                  const countdown = getCountdown(match.kickoffTime);

                  return (
                    <TableRow key={match.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex flex-col gap-1">
                          <span>
                            {new Date(match.kickoffTime).toLocaleTimeString("es-MX", {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                          {countdown && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-xs text-muted-foreground">
                                    <Clock className="mr-1 inline h-3 w-3" />
                                    {countdown}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{t("tooltip.locksAt")}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {match.homeTeam.logoUrl && (
                              <img
                                src={match.homeTeam.logoUrl}
                                alt={match.homeTeam.name}
                                className="h-6 w-6"
                              />
                            )}
                            <span>{match.homeTeam.shortName || match.homeTeam.name}</span>
                          </div>
                          <span className="text-muted-foreground">vs</span>
                          <div className="flex items-center gap-2">
                            {match.awayTeam.logoUrl && (
                              <img
                                src={match.awayTeam.logoUrl}
                                alt={match.awayTeam.name}
                                className="h-6 w-6"
                              />
                            )}
                            <span>{match.awayTeam.shortName || match.awayTeam.name}</span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        {locked ? (
                          pred ? (
                            <div className="flex items-center gap-2 font-mono text-lg">
                              <span>{pred.home}</span>
                              <span className="text-muted-foreground">-</span>
                              <span>{pred.away}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">{t("noPrediction")}</span>
                          )
                        ) : (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="0"
                              max="99"
                              value={pred?.home ?? ""}
                              onChange={(e) => handlePredictionChange(match.id, "home", e.target.value)}
                              className="w-16 text-center"
                              placeholder="0"
                            />
                            <span className="text-muted-foreground">-</span>
                            <Input
                              type="number"
                              min="0"
                              max="99"
                              value={pred?.away ?? ""}
                              onChange={(e) => handlePredictionChange(match.id, "away", e.target.value)}
                              className="w-16 text-center"
                              placeholder="0"
                            />
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        {match.status === "FINISHED" ? (
                          <div className="flex items-center gap-2 font-mono text-lg font-bold">
                            <span>{match.homeScore ?? "-"}</span>
                            <span className="text-muted-foreground">-</span>
                            <span>{match.awayScore ?? "-"}</span>
                          </div>
                        ) : match.status === "LIVE" ? (
                          <div className="flex items-center gap-2 font-mono text-lg">
                            <span>{match.homeScore ?? 0}</span>
                            <span className="text-muted-foreground">-</span>
                            <span>{match.awayScore ?? 0}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>

                      <TableCell>{getStatusBadge(match)}</TableCell>

                      <TableCell>
                        {!locked && pred && (
                          <Button
                            size="sm"
                            onClick={() => handleSavePrediction(match.id)}
                            loading={savePrediction.isPending && editingMatchId === match.id}
                            disabled={pred.home === undefined || pred.away === undefined}
                          >
                            {t("save")}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function FixturesSkeleton() {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 py-6">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}
