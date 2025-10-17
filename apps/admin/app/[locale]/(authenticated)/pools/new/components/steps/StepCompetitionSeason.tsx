"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, Trophy, Calendar } from "lucide-react";
import { Input, Button, Label, RadioGroup, RadioGroupItem, toastError } from "@qp/ui";
import { trpc } from "@admin/trpc";

interface StepCompetitionSeasonProps {
  onSelect: (data: { competitionExternalId: string; competitionName: string; seasonYear: number }) => void;
  initialData?: {
    competitionExternalId?: string;
    competitionName?: string;
    seasonYear?: number;
  };
}

export function StepCompetitionSeason({ onSelect, initialData }: StepCompetitionSeasonProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompetition, setSelectedCompetition] = useState<{
    externalId: string;
    name: string;
  } | null>(
    initialData?.competitionExternalId && initialData?.competitionName
      ? { externalId: initialData.competitionExternalId, name: initialData.competitionName }
      : null
  );
  const [selectedSeason, setSelectedSeason] = useState<number | null>(initialData?.seasonYear || null);
  const [youthOnly, setYouthOnly] = useState(false);

  // Query competitions
  const { data: competitionsData, isLoading: loadingCompetitions } = trpc.poolWizard.listCompetitions.useQuery(
    {
      query: searchQuery || undefined,
      youthOnly,
      limit: 20
    },
    {
      enabled: searchQuery.length >= 3 || youthOnly
    }
  );

  // Query seasons when competition is selected
  const { data: seasonsData, isLoading: loadingSeasons } = trpc.poolWizard.listSeasons.useQuery(
    {
      competitionExternalId: selectedCompetition?.externalId || ""
    },
    {
      enabled: !!selectedCompetition
    }
  );

  // Filter seasons to show only current and future (exclude past seasons)
  const currentYear = new Date().getFullYear();
  const availableSeasons = seasonsData?.seasons.filter(season => season.year >= currentYear) || [];

  const handleCompetitionSelect = (externalId: string, name: string) => {
    setSelectedCompetition({ externalId, name });
    setSelectedSeason(null);
  };

  const handleSeasonSelect = (year: number) => {
    setSelectedSeason(year);
    if (selectedCompetition) {
      onSelect({
        competitionExternalId: selectedCompetition.externalId,
        competitionName: selectedCompetition.name,
        seasonYear: year
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Competition Search */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar competencia (ej: World Cup, Champions League)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={youthOnly ? "default" : "outline"}
            onClick={() => setYouthOnly(!youthOnly)}
            size="sm"
          >
            Solo Sub-20
          </Button>
        </div>

        {searchQuery.length > 0 && searchQuery.length < 3 && (
          <p className="text-sm text-muted-foreground">
            Escribe al menos 3 caracteres para buscar...
          </p>
        )}

        {loadingCompetitions && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {competitionsData && competitionsData.competitions.length > 0 && (
          <div className="grid gap-2 max-h-64 overflow-y-auto">
            {competitionsData.competitions.map((comp) => (
              <button
                key={comp.externalId}
                onClick={() => handleCompetitionSelect(comp.externalId, comp.name)}
                className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                  selectedCompetition?.externalId === comp.externalId
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Trophy className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{comp.name}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    {comp.country && <span>{comp.country}</span>}
                    {comp.type && <span className="text-xs">• {comp.type}</span>}
                    {comp.isYouth && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                        Youth
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {competitionsData && competitionsData.competitions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No se encontraron competencias. Intenta con otro término de búsqueda.
          </p>
        )}
      </div>

      {/* Season Selection */}
      {selectedCompetition && (
        <div className="flex flex-col gap-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Selecciona la temporada</h3>
          </div>

          {loadingSeasons && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {availableSeasons.length > 0 && (
            <RadioGroup value={selectedSeason?.toString()} onValueChange={(val) => handleSeasonSelect(parseInt(val))}>
              <div className="grid gap-2">
                {availableSeasons.map((season) => (
                  <div
                    key={season.year}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedSeason === season.year
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value={season.year.toString()} id={`season-${season.year}`} />
                    <Label htmlFor={`season-${season.year}`} className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{season.label || season.year}</span>
                        {season.isCurrent && (
                          <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded">
                            Actual
                          </span>
                        )}
                        {season.year > currentYear && (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                            Próxima
                          </span>
                        )}
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}

          {seasonsData && availableSeasons.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay temporadas actuales o futuras disponibles para esta competencia.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
