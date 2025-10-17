"use client";

import { useEffect } from "react";
import { InfoIcon } from "lucide-react";
import { Alert, AlertDescription } from "@qp/ui";

interface StepSportProps {
  onSelect: (sportId: string) => void;
  selectedSportId?: string;
}

export function StepSport({ onSelect, selectedSportId }: StepSportProps) {
  // For MVP, we only support Football
  const sportId = "football";

  // Auto-select on mount
  useEffect(() => {
    if (!selectedSportId) {
      onSelect(sportId);
    }
  }, [selectedSportId, onSelect]);

  return (
    <div className="flex flex-col gap-6">
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          <strong>Fútbol</strong> está preseleccionado. Haz clic en "Siguiente" para continuar.
        </AlertDescription>
      </Alert>

      <div className="rounded-lg border-2 border-primary bg-primary/5 p-6 text-center">
        <div className="text-6xl mb-4">⚽</div>
        <h3 className="text-xl font-semibold">Fútbol</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Crea quinielas para ligas, copas y torneos de fútbol
        </p>
      </div>
    </div>
  );
}
