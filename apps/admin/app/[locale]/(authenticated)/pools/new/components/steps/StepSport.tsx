"use client";

import { useEffect } from "react";
import { InfoIcon } from "lucide-react";
import { Alert, AlertDescription, SportsLoader } from "@qp/ui";
import { trpc } from "@admin/trpc";

interface StepSportProps {
  onSelect: (sportId: string) => void;
  selectedSportId?: string;
}

export function StepSport({ onSelect, selectedSportId }: StepSportProps) {
  // Query sports from database
  const { data: sports, isLoading } = trpc.sports.list.useQuery();
  
  // Get Football sport ID
  const footballSport = sports?.find(sport => sport.slug === "football");

  // Auto-select Football on mount
  useEffect(() => {
    if (!selectedSportId && footballSport) {
      onSelect(footballSport.id);
    }
  }, [selectedSportId, footballSport, onSelect]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <SportsLoader size="sm" text="Cargando deportes" />
      </div>
    );
  }

  if (!footballSport) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          No se encontró el deporte Football en la base de datos. Por favor, ejecuta el seed: <code>pnpm db:seed</code>
        </AlertDescription>
      </Alert>
    );
  }

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
