"use client";

import { useState, useEffect } from "react";
import { Loader2, Target, Info } from "lucide-react";
import { Label, RadioGroup, RadioGroupItem, Alert, AlertDescription } from "@qp/ui";
import { trpc } from "@admin/trpc";

interface StepStageRoundProps {
  competitionExternalId: string;
  seasonYear: number;
  onSelect: (data: { stageLabel?: string; roundLabel?: string }) => void;
  initialData?: {
    stageLabel?: string;
    roundLabel?: string;
  };
}

export function StepStageRound({
  competitionExternalId,
  seasonYear,
  onSelect,
  initialData
}: StepStageRoundProps) {
  const [selectedStage, setSelectedStage] = useState<string | null>(initialData?.stageLabel || null);
  const [selectedRound, setSelectedRound] = useState<string | null>(initialData?.roundLabel || null);

  // Query stages
  const { data: stagesData, isLoading } = trpc.poolWizard.listStages.useQuery({
    competitionExternalId,
    seasonYear
  });

  // Query preview
  const { data: previewData, isLoading: loadingPreview } = trpc.poolWizard.previewFixtures.useQuery(
    {
      competitionExternalId,
      seasonYear,
      stageLabel: selectedStage || undefined,
      roundLabel: selectedRound || undefined
    },
    {
      enabled: !!(selectedStage || selectedRound)
    }
  );

  const selectedStageData = stagesData?.stages.find((s) => s.label === selectedStage);

  const handleStageSelect = (stage: string) => {
    setSelectedStage(stage);
    setSelectedRound(null);
  };

  const handleRoundSelect = (round: string) => {
    setSelectedRound(round);
    onSelect({ stageLabel: selectedStage || undefined, roundLabel: round });
  };

  // Update wizard data whenever selection changes
  useEffect(() => {
    onSelect({ stageLabel: selectedStage || undefined, roundLabel: selectedRound || undefined });
  }, [selectedStage, selectedRound]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stagesData || stagesData.stages.length === 0) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          No se encontraron etapas o rondas para esta temporada. Continúa para importar todos los partidos.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Selecciona una etapa específica (ej: "Semifinales") o continúa para importar toda la temporada.
        </AlertDescription>
      </Alert>

      {/* Stage Selection */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Etapa del torneo</h3>
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
                <RadioGroupItem value={stage.label} id={`stage-${stage.label}`} className="mt-1" />
                <Label htmlFor={`stage-${stage.label}`} className="flex-1 cursor-pointer">
                  <div className="font-medium">{stage.label}</div>
                  {stage.rounds && stage.rounds.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {stage.rounds.length} ronda{stage.rounds.length !== 1 ? "s" : ""}
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
          <h3 className="font-semibold">Ronda específica (opcional)</h3>

          <RadioGroup value={selectedRound || ""} onValueChange={handleRoundSelect}>
            <div className="grid gap-2">
              {selectedStageData.rounds.map((round) => (
                <div
                  key={round}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedRound === round
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <RadioGroupItem value={round} id={`round-${round}`} />
                  <Label htmlFor={`round-${round}`} className="flex-1 cursor-pointer">
                    {round}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>
      )}

      {/* Preview */}
      {previewData && (
        <div className="rounded-lg border bg-muted/50 p-4">
          <h4 className="font-medium mb-2">Vista previa del alcance</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Equipos:</span>
              <span className="ml-2 font-semibold">{previewData.teamsCount}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Partidos:</span>
              <span className="ml-2 font-semibold">{previewData.matchesCount}</span>
            </div>
          </div>

          {previewData.sampleMatches.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">Ejemplos de partidos:</p>
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

      {!selectedStage && !selectedRound && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Puedes continuar sin seleccionar una etapa para importar toda la temporada.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
