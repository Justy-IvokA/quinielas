"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Info, Target, AlertCircle } from "lucide-react";
import { SportsLoader } from "@qp/ui";
import { Label, RadioGroup, RadioGroupItem, Alert, AlertDescription, Checkbox, Button } from "@qp/ui";
import { trpc } from "@admin/trpc";
import { toast } from "sonner";

interface StepStageRoundProps {
  competitionExternalId: string;
  seasonYear: number;
  onSelect: (data: { 
    stageLabel?: string; 
    selectedRounds?: string[]; // Array de rounds seleccionados
    roundsRange?: { start: number; end: number } | null; // Calculado automáticamente
  }) => void;
  initialData?: {
    stageLabel?: string;
    selectedRounds?: string[];
  };
}

export function StepStageRound({
  competitionExternalId,
  seasonYear,
  onSelect,
  initialData
}: StepStageRoundProps) {
  const t = useTranslations("superadmin.templates.create.wizard.steps.scope");
  const [selectedStage, setSelectedStage] = useState<string | null>(initialData?.stageLabel || null);
  const [selectedRounds, setSelectedRounds] = useState<Set<string>>(new Set(initialData?.selectedRounds || []));
  const [selectAllRounds, setSelectAllRounds] = useState(false);
  const [stagePreviewCache, setStagePreviewCache] = useState<Record<string, any>>({});
  const [roundsStatus, setRoundsStatus] = useState<Record<string, 'active' | 'expired' | 'unknown'>>({});
  const [loadingRounds, setLoadingRounds] = useState(false);
  const now = new Date();
  
  const utils = trpc.useUtils();

  // Query stages
  const { data: stagesData, isLoading } = trpc.poolWizard.listStages.useQuery({
    competitionExternalId,
    seasonYear
  });

  // Query preview (solo para el stage completo o primera ronda seleccionada)
  const firstSelectedRound = selectedRounds.size > 0 ? Array.from(selectedRounds)[0] : undefined;
  const { data: previewData, isLoading: loadingPreview } = trpc.poolWizard.previewFixtures.useQuery(
    {
      competitionExternalId,
      seasonYear,
      stageLabel: selectedStage || undefined,
      roundLabel: selectAllRounds ? undefined : firstSelectedRound
    },
    {
      enabled: !!(selectedStage || selectedRounds.size > 0 || selectAllRounds)
    }
  );

  const selectedStageData = stagesData?.stages.find((s) => s.label === selectedStage);

  const handleStageSelect = (stage: string) => {
    setSelectedStage(stage);
    setSelectedRounds(new Set());
    setSelectAllRounds(false);
  };

  const handleRoundToggle = (round: string) => {
    // Only validate if the round is marked as inactive
    if (!activeRounds.has(round)) {
      toast.error(t("roundExpiredError"), {
        description: t("roundExpiredDescription", { round })
      });
      return;
    }

    setSelectedRounds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(round)) {
        newSet.delete(round);
      } else {
        newSet.add(round);
      }
      setSelectAllRounds(false); // Desmarcar "todas" si se selecciona individual
      return newSet;
    });
  };

  const handleSelectAllRounds = (checked: boolean | "indeterminate") => {
    const isChecked = checked === true;
    setSelectAllRounds(isChecked);
    if (isChecked) {
      setSelectedRounds(new Set()); // Limpiar selección individual
    }
  };

  // Calcular rounds.start y rounds.end basado en selección
  const calculateRoundsRange = (): { start: number; end: number } | null => {
    if (selectAllRounds || selectedRounds.size === 0) {
      return null; // null = todos los partidos
    }

    const roundNumbers = Array.from(selectedRounds)
      .map(r => parseInt(r, 10))
      .filter(n => !isNaN(n))
      .sort((a, b) => a - b);

    if (roundNumbers.length === 0) {
      return null;
    }

    return {
      start: roundNumbers[0],
      end: roundNumbers[roundNumbers.length - 1]
    };
  };

  // Cache preview data when it loads
  useEffect(() => {
    if (previewData && selectedStage) {
      setStagePreviewCache(prev => ({
        ...prev,
        [selectedStage]: previewData
      }));
    }
  }, [previewData, selectedStage]);

  // Load preview for each round to determine if it's active or expired
  useEffect(() => {
    const loadRoundsStatus = async () => {
      if (!selectedStage || !selectedStageData?.rounds || selectedStageData.rounds.length === 0) {
        return;
      }

      setLoadingRounds(true);
      const newStatus: Record<string, 'active' | 'expired' | 'unknown'> = {};
      const currentTime = new Date(); // Create once inside the effect

      // Load preview for each round
      for (const round of selectedStageData.rounds) {
        try {
          const preview = await utils.poolWizard.previewFixtures.fetch({
            competitionExternalId,
            seasonYear,
            stageLabel: selectedStage,
            roundLabel: round
          });

          // Check if any match in this round is in the future
          const hasFutureMatches = preview.sampleMatches?.some(
            match => new Date(match.kickoffTime) > currentTime
          );

          newStatus[round] = hasFutureMatches ? 'active' : 'expired';
        } catch (error) {
          console.error(`Error loading preview for round ${round}:`, error);
          newStatus[round] = 'unknown';
        }
      }

      setRoundsStatus(newStatus);
      setLoadingRounds(false);
    };

    loadRoundsStatus();
  }, [selectedStage, selectedStageData, competitionExternalId, seasonYear, utils]);

  // Determine which rounds are active based on loaded status
  const getActiveRounds = () => {
    if (!selectedStage || !selectedStageData?.rounds) {
      return new Set(selectedStageData?.rounds || []);
    }

    // If still loading rounds status, show all as active temporarily
    if (loadingRounds) {
      return new Set(selectedStageData.rounds);
    }

    // Filter rounds based on their loaded status
    const activeRounds = selectedStageData.rounds.filter(round => {
      const status = roundsStatus[round];
      // Include active rounds and unknown rounds (benefit of the doubt)
      return status === 'active' || status === 'unknown' || !status;
    });

    return new Set(activeRounds);
  };

  const activeRounds = getActiveRounds();

  // Update wizard data whenever selection changes
  useEffect(() => {
    const roundsRange = calculateRoundsRange();
    onSelect({ 
      stageLabel: selectedStage || undefined, 
      selectedRounds: selectAllRounds ? [] : Array.from(selectedRounds),
      roundsRange: roundsRange
    });
  }, [selectedStage, selectedRounds, selectAllRounds]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <SportsLoader size="sm" text={t("loadingStages")} />
      </div>
    );
  }

  if (!stagesData || stagesData.stages.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {t("noStagesFound")}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {t("hint")}
        </AlertDescription>
      </Alert>

      {/* Stage Selection */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">{t("stageTitle")}</h3>
        </div>

        <RadioGroup value={selectedStage || ""} onValueChange={handleStageSelect}>
          <div className="grid gap-2">
            {stagesData.stages.map((stage) => (
              <div
                key={stage.label}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedStage === stage.label
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem 
                  value={stage.label} 
                  id={`stage-${stage.label}`} 
                  className="mt-1"
                />
                <Label 
                  htmlFor={`stage-${stage.label}`} 
                  className="flex-1 cursor-pointer"
                >
                  <div className="font-medium">{stage.label}</div>
                  {stage.rounds && stage.rounds.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {t("roundsCount", { count: stage.rounds.length })}
                    </div>
                  )}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>

      {/* Round Selection */}
      {selectedStage && selectedStageData && selectedStageData.rounds && selectedStageData.rounds.length > 0 && (
        <div className="flex flex-col gap-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{t("roundTitle")}</h3>
            <div className="flex items-center gap-2">
              <Checkbox 
                id="select-all-rounds"
                checked={selectAllRounds}
                onCheckedChange={(checked) => handleSelectAllRounds(checked)}
              />
              <Label htmlFor="select-all-rounds" className="text-sm cursor-pointer">
                {t("selectAllRounds") || "Todas las jornadas"}
              </Label>
            </div>
          </div>

          {!selectAllRounds && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[...selectedStageData.rounds]
                .sort((a, b) => {
                  const numA = parseInt(a, 10);
                  const numB = parseInt(b, 10);
                  
                  if (!isNaN(numA) && !isNaN(numB)) {
                    return numA - numB;
                  }
                  
                  return a.localeCompare(b, 'es-MX', { numeric: true, sensitivity: 'base' });
                })
                .map((round) => {
                  const isActive = activeRounds.has(round);
                  const isSelected = selectedRounds.has(round);
                  
                  return (
                    <div
                      key={round}
                      className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                        !isActive
                          ? "opacity-40 cursor-not-allowed border-muted"
                          : isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <Checkbox 
                        id={`round-${round}`}
                        checked={isSelected}
                        disabled={!isActive}
                        onCheckedChange={(checked) => {
                          if (isActive) {
                            handleRoundToggle(round);
                          }
                        }}
                      />
                      <Label 
                        htmlFor={`round-${round}`} 
                        className={`flex-1 text-sm ${!isActive ? "cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        {round}
                        {!isActive && (
                          <span className="ml-1 text-xs text-red-600 dark:text-red-400">✕</span>
                        )}
                      </Label>
                    </div>
                  );
                })}
            </div>
          )}

          {selectAllRounds && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {t("allRoundsSelected") || "Se incluirán todos los partidos de esta etapa"}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Preview */}
      {previewData && (
        <div className="rounded-lg border bg-muted/50 p-4">
          <h4 className="font-medium mb-2">{t("previewTitle")}</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">{t("teamsLabel")}:</span>
              <span className="ml-2 font-semibold">{previewData.teamsCount}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t("matchesLabel")}:</span>
              <span className="ml-2 font-semibold">{previewData.matchesCount}</span>
            </div>
          </div>

          {previewData.sampleMatches.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">{t("sampleMatchesLabel")}:</p>
              <div className="space-y-1">
                {previewData.sampleMatches.slice(0, 3).map((match, idx) => (
                  <div key={idx} className="text-xs">
                    {match.homeTeam} vs {match.awayTeam}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info sobre selección */}
      {selectedRounds.size > 0 && !selectAllRounds && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {t("roundsSelectedInfo", { 
              rounds: Array.from(selectedRounds).sort((a, b) => parseInt(a) - parseInt(b)).join(", ")
            })}
            {calculateRoundsRange() && (
              <div className="mt-1 text-xs">
                <strong>Rango:</strong> {calculateRoundsRange()?.start} - {calculateRoundsRange()?.end}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {!selectedStage && selectedRounds.size === 0 && !selectAllRounds && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {t("continueWithoutSelection")}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
