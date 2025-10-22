"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { WizardForm, type WizardStep } from "@qp/ui";
import { StepSport } from "./steps/StepSport";
import { StepCompetitionSeason } from "./steps/StepCompetitionSeason";
import { StepStageRound } from "./steps/StepStageRound";
import { StepDetails } from "./steps/StepDetails";
import { StepAccess } from "./steps/StepAccess";
import { StepPrizes } from "./steps/StepPrizes";
import { StepReview } from "./steps/StepReview";

interface WizardData {
  sportId?: string;
  competitionExternalId?: string;
  competitionName?: string;
  seasonYear?: number;
  stageLabel?: string;
  selectedRounds?: string[]; // Array de rounds seleccionados
  roundsRange?: { start: number; end: number } | null; // Calculado automáticamente
  pool?: {
    title: string;
    slug: string;
    description?: string;
  };
  access?: {
    accessType: "PUBLIC" | "CODE" | "EMAIL_INVITE";
    requireCaptcha?: boolean;
    requireEmailVerification?: boolean;
    emailDomains?: string; // Comma-separated
    maxUsers?: number;
    startAt?: string; // datetime-local format
    endAt?: string; // datetime-local format
  };
  prizes?: Array<{
    title: string;
    rankFrom: number;
    rankTo: number;
    description?: string;
    value?: string;
    type?: "CASH" | "DISCOUNT" | "SERVICE" | "DAY_OFF" | "EXPERIENCE" | "OTHER";
    imageUrl?: string;
  }>;
}

const STORAGE_KEY = "pool-wizard-draft";

export function CreatePoolWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [wizardData, setWizardData] = useState<WizardData>({});
  const [currentStep, setCurrentStep] = useState(1);

  // Clear URL step parameter on mount to always start at step 1
  useEffect(() => {
    if (searchParams.get('step')) {
      router.replace('/pools/new');
    }
  }, []);

  // Load draft from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setWizardData(parsed);
      } catch (error) {
        console.error("Failed to parse wizard draft:", error);
      }
    }
  }, []);

  // Save draft to localStorage whenever data changes
  useEffect(() => {
    if (Object.keys(wizardData).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wizardData));
    }
  }, [wizardData]);

  const updateWizardData = useCallback((data: Partial<WizardData>) => {
    setWizardData((prev) => {
      // Avoid unnecessary updates if data is the same
      const hasChanges = Object.keys(data).some(key => {
        const k = key as keyof WizardData;
        return JSON.stringify(prev[k]) !== JSON.stringify(data[k]);
      });
      
      if (!hasChanges) return prev;
      return { ...prev, ...data };
    });
  }, []);

  const steps: WizardStep[] = [
    {
      title: "Deporte",
      description: "Selecciona el deporte para tu quiniela",
      content: (setIsPending, nav) => (
        <StepSport
          onSelect={(sportId) => {
            updateWizardData({ sportId });
          }}
        />
      ),
      isEnabled: !!wizardData.sportId
    },
    {
      title: "Competencia y Temporada",
      description: "Busca y selecciona la competencia y temporada",
      content: (setIsPending, nav) => (
        <StepCompetitionSeason
          onSelect={(data) => {
            updateWizardData(data);
          }}
          initialData={{
            competitionExternalId: wizardData.competitionExternalId,
            competitionName: wizardData.competitionName,
            seasonYear: wizardData.seasonYear
          }}
        />
      ),
      isEnabled: !!wizardData.competitionExternalId && !!wizardData.seasonYear
    },
    {
      title: "Etapa y Ronda",
      description: "Define el alcance de los partidos a importar",
      content: (setIsPending, nav) => {
        if (!wizardData.competitionExternalId || !wizardData.seasonYear) {
          return <div>Error: Datos de competencia no disponibles</div>;
        }
        return (
          <StepStageRound
            competitionExternalId={wizardData.competitionExternalId}
            seasonYear={wizardData.seasonYear}
            onSelect={(data) => {
              updateWizardData(data);
            }}
            initialData={{
              stageLabel: wizardData.stageLabel,
              selectedRounds: wizardData.selectedRounds
            }}
          />
        );
      },
      isEnabled: true
    },
    {
      title: "Detalles de la Quiniela",
      description: "Configura el nombre, slug y descripción",
      content: (setIsPending, nav) => {
        if (!wizardData.competitionName || !wizardData.seasonYear) {
          return <div>Error: Datos de competencia no disponibles</div>;
        }
        return (
          <StepDetails
            competitionName={wizardData.competitionName}
            seasonYear={wizardData.seasonYear}
            stageLabel={wizardData.stageLabel}
            selectedRounds={wizardData.selectedRounds}
            roundsRange={wizardData.roundsRange}
            onSubmit={(data) => {
              updateWizardData({ pool: data });
            }}
            initialData={wizardData.pool}
          />
        );
      },
      isEnabled: !!wizardData.pool?.title && !!wizardData.pool?.slug && 
                 /^[a-z0-9-]+$/.test(wizardData.pool?.slug || "")
    },
    {
      title: "Política de Acceso",
      description: "Define quién puede registrarse en la quiniela",
      content: (setIsPending, nav) => (
        <StepAccess
          onSubmit={(data) => {
            updateWizardData({ access: data });
          }}
          initialData={wizardData.access}
        />
      ),
      isEnabled: !!wizardData.access?.accessType
    },
    {
      title: "Premios",
      description: "Configura los premios para los ganadores",
      content: (setIsPending, nav) => (
        <StepPrizes
          onSubmit={(data) => {
            updateWizardData({ prizes: data });
          }}
          initialData={wizardData.prizes}
        />
      ),
      isEnabled: !!(
        wizardData.prizes && 
        wizardData.prizes.length > 0 && 
        wizardData.prizes[0]?.title && 
        wizardData.prizes[0]?.rankFrom === 1
      )
    },
    {
      title: "Revisar y Crear",
      description: "Revisa la información y crea la quiniela",
      content: (setIsPending, nav) => {
        if (
          !wizardData.competitionExternalId ||
          !wizardData.competitionName ||
          !wizardData.seasonYear ||
          !wizardData.pool ||
          !wizardData.access
        ) {
          return <div>Error: Faltan datos requeridos</div>;
        }

        return (
          <StepReview
            wizardData={{
              competitionExternalId: wizardData.competitionExternalId,
              competitionName: wizardData.competitionName,
              seasonYear: wizardData.seasonYear,
              stageLabel: wizardData.stageLabel,
              selectedRounds: wizardData.selectedRounds,
              roundsRange: wizardData.roundsRange,
              pool: wizardData.pool,
              access: wizardData.access,
              prizes: wizardData.prizes
            }}
          />
        );
      },
      customActions: true
    }
  ];

  return (
    <div className="w-full">
      <WizardForm
        steps={steps}
        prevLabel="Atrás"
        nextLabel="Siguiente"
        finishLabel="Finalizar"
        stepLabel={(step, maxSteps) => `Paso ${step} de ${maxSteps}`}
      />
    </div>
  );
}
