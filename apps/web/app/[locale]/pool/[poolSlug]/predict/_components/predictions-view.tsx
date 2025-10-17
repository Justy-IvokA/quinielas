"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Filter, Save, CheckCircle2 } from "lucide-react";
import { Button, GlassCard, Tabs, TabsList, TabsTrigger, TabsContent } from "@qp/ui";
import { toastPromise, toastError } from "@qp/ui";
import { trpc } from "@web/trpc";

import { MatchRow } from "./match-row";
import { PredictionsToolbar } from "./predictions-toolbar";

interface PredictionsViewProps {
  poolId: string;
  poolSlug: string;
  poolName: string;
  seasonId: string;
  seasonName: string;
  competitionName: string;
}

type FilterType = "all" | "pending" | "today" | "finished";

export function PredictionsView({
  poolId,
  poolSlug,
  poolName,
  seasonId,
  seasonName,
  competitionName
}: PredictionsViewProps) {
  const t = useTranslations("predictions");
  const [filter, setFilter] = useState<FilterType>("pending");
  const [dirtyMatches, setDirtyMatches] = useState<Set<string>>(new Set());
  const [predictions, setPredictions] = useState<Record<string, { homeScore: number; awayScore: number }>>({});

  // Fetch fixtures
  const { data: fixtures, isLoading: fixturesLoading } = trpc.fixtures.listBySeason.useQuery({
    seasonId
  });

  // Fetch user predictions
  const { data: userPredictions, isLoading: predictionsLoading } = trpc.predictions.getByPool.useQuery({
    poolId
  });

  // Bulk save mutation
  const bulkSaveMutation = trpc.predictions.bulkSave.useMutation({
    onSuccess: () => {
      setDirtyMatches(new Set());
    }
  });

  // Initialize predictions from server data
  useMemo(() => {
    if (userPredictions) {
      const predMap: Record<string, { homeScore: number; awayScore: number }> = {};
      userPredictions.forEach((pred) => {
        predMap[pred.matchId] = {
          homeScore: pred.homeScore,
          awayScore: pred.awayScore
        };
      });
      setPredictions(predMap);
    }
  }, [userPredictions]);

  // Filter matches
  const filteredMatches = useMemo(() => {
    if (!fixtures) return [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return fixtures.filter((match) => {
      switch (filter) {
        case "pending":
          return match.status === "SCHEDULED" && !match.locked;
        case "today":
          return match.kickoffTime >= today && match.kickoffTime < tomorrow;
        case "finished":
          return match.status === "FINISHED";
        case "all":
        default:
          return true;
      }
    });
  }, [fixtures, filter]);

  const handlePredictionChange = (matchId: string, homeScore: number, awayScore: number) => {
    setPredictions((prev) => ({
      ...prev,
      [matchId]: { homeScore, awayScore }
    }));
    setDirtyMatches((prev) => new Set(prev).add(matchId));
  };

  const handleSaveAll = async () => {
    const dirtyPredictions = Array.from(dirtyMatches).map((matchId) => ({
      matchId,
      homeScore: predictions[matchId]?.homeScore ?? 0,
      awayScore: predictions[matchId]?.awayScore ?? 0
    }));

    if (dirtyPredictions.length === 0) {
      toastError(t("errors.nothingToSave"));
      return;
    }

    await toastPromise(
      bulkSaveMutation.mutateAsync({
        poolId,
        predictions: dirtyPredictions
      }),
      {
        loading: t("saving"),
        success: (result) => {
          if (result.errors.length > 0) {
            return t("savedWithErrors", { count: result.saved, errors: result.errors.length });
          }
          return t("savedSuccess", { count: result.saved });
        },
        error: t("errors.saveFailed")
      }
    );
  };

  const hasDirtyChanges = dirtyMatches.size > 0;

  if (fixturesLoading || predictionsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <GlassCard className="p-8 text-center">
            <p className="text-muted-foreground">{t("loading")}</p>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <GlassCard variant="compact">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{poolName}</h1>
              <p className="text-muted-foreground">
                {competitionName} {seasonName}
              </p>
            </div>
            <Button
              size="lg"
              onClick={handleSaveAll}
              disabled={!hasDirtyChanges || bulkSaveMutation.isPending}
              className="gap-2"
            >
              {bulkSaveMutation.isPending ? (
                <>
                  <span className="animate-spin">⏳</span>
                  {t("saving")}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {t("saveAll")} {hasDirtyChanges && `(${dirtyMatches.size})`}
                </>
              )}
            </Button>
          </div>
        </GlassCard>

        {/* Filters */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending">{t("filters.pending")}</TabsTrigger>
            <TabsTrigger value="today">{t("filters.today")}</TabsTrigger>
            <TabsTrigger value="all">{t("filters.all")}</TabsTrigger>
            <TabsTrigger value="finished">{t("filters.finished")}</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Matches List */}
        <div className="space-y-4">
          {filteredMatches.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <p className="text-muted-foreground">{t("noMatches")}</p>
            </GlassCard>
          ) : (
            filteredMatches.map((match) => (
              <MatchRow
                key={match.id}
                match={match}
                prediction={predictions[match.id]}
                onChange={(homeScore, awayScore) =>
                  handlePredictionChange(match.id, homeScore, awayScore)
                }
                isDirty={dirtyMatches.has(match.id)}
              />
            ))
          )}
        </div>

        {/* Bottom Save Button */}
        {hasDirtyChanges && (
          <div className="sticky bottom-4">
            <GlassCard variant="compact" className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {t("unsavedChanges", { count: dirtyMatches.size })}
              </p>
              <Button
                onClick={handleSaveAll}
                disabled={bulkSaveMutation.isPending}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                {t("saveAll")}
              </Button>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}
