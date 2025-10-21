"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { WizardForm, type WizardStep } from "@qp/ui";
import { StepSport } from "./steps/StepSport";
import { StepCompetitionSeason } from "./steps/StepCompetitionSeason";
import { StepStageRound } from "./steps/StepStageRound";
import { StepTemplateDetails } from "./steps/StepTemplateDetails";
import { StepScoringRules } from "./steps/StepScoringRules";
import { StepAccessDefaults } from "./steps/StepAccessDefaults";
import { StepReview } from "./steps/StepReview";

interface WizardData {
  sportId?: string;
  competitionExternalId?: string;
  competitionName?: string;
  seasonYear?: number;
  stageLabel?: string;
  roundLabel?: string;
  template?: {
    title: string;
    slug: string;
    description?: string;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  };
  rules?: {
    exactScore: number;
    correctSign: number;
    goalDiffBonus: number;
  };
  accessDefaults?: {
    accessType: "PUBLIC" | "CODE" | "EMAIL_INVITE";
    requireCaptcha: boolean;
    requireEmailVerification: boolean;
  };
}

const STORAGE_KEY = "template-wizard-draft";

export function CreateTemplateWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("superadmin.templates.create");
  const [wizardData, setWizardData] = useState<WizardData>({});
  const [currentStep, setCurrentStep] = useState(1);

  // Clear URL step parameter on mount to always start at step 1
  useEffect(() => {
    if (searchParams.get('step')) {
      router.replace('/superadmin/templates/new');
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
      title: t("wizard.steps.sport.title"),
      description: t("wizard.steps.sport.description"),
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
      title: t("wizard.steps.competition.title"),
      description: t("wizard.steps.competition.description"),
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
      title: t("wizard.steps.scope.title"),
      description: t("wizard.steps.scope.description"),
      content: (setIsPending, nav) => {
        if (!wizardData.competitionExternalId || !wizardData.seasonYear) {
          return <div>{t("wizard.errors.missingCompetition")}</div>;
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
              roundLabel: wizardData.roundLabel
            }}
          />
        );
      },
      isEnabled: true
    },
    {
      title: t("wizard.steps.details.title"),
      description: t("wizard.steps.details.description"),
      content: (setIsPending, nav) => {
        if (!wizardData.competitionName || !wizardData.seasonYear) {
          return <div>{t("wizard.errors.missingCompetition")}</div>;
        }
        return (
          <StepTemplateDetails
            competitionName={wizardData.competitionName}
            seasonYear={wizardData.seasonYear}
            stageLabel={wizardData.stageLabel}
            roundLabel={wizardData.roundLabel}
            onSubmit={(data) => {
              updateWizardData({ template: data });
            }}
            initialData={wizardData.template}
          />
        );
      },
      isEnabled: !!wizardData.template?.title && !!wizardData.template?.slug && 
                 /^[a-z0-9-]+$/.test(wizardData.template?.slug || "")
    },
    {
      title: t("wizard.steps.rules.title"),
      description: t("wizard.steps.rules.description"),
      content: (setIsPending, nav) => (
        <StepScoringRules
          onSubmit={(data) => {
            updateWizardData({ rules: data });
          }}
          initialData={wizardData.rules}
        />
      ),
      isEnabled: !!wizardData.rules
    },
    {
      title: t("wizard.steps.access.title"),
      description: t("wizard.steps.access.description"),
      content: (setIsPending, nav) => (
        <StepAccessDefaults
          onSubmit={(data) => {
            updateWizardData({ accessDefaults: data });
          }}
          initialData={wizardData.accessDefaults}
        />
      ),
      isEnabled: !!wizardData.accessDefaults?.accessType
    },
    {
      title: t("wizard.steps.review.title"),
      description: t("wizard.steps.review.description"),
      content: (setIsPending, nav) => {
        if (
          !wizardData.sportId ||
          !wizardData.competitionExternalId ||
          !wizardData.competitionName ||
          !wizardData.seasonYear ||
          !wizardData.template ||
          !wizardData.rules ||
          !wizardData.accessDefaults
        ) {
          return <div>{t("wizard.errors.missingData")}</div>;
        }

        return (
          <StepReview
            wizardData={{
              sportId: wizardData.sportId,
              competitionExternalId: wizardData.competitionExternalId,
              competitionName: wizardData.competitionName,
              seasonYear: wizardData.seasonYear,
              stageLabel: wizardData.stageLabel,
              roundLabel: wizardData.roundLabel,
              template: wizardData.template,
              rules: wizardData.rules,
              accessDefaults: wizardData.accessDefaults
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
        prevLabel={t("wizard.navigation.prev")}
        nextLabel={t("wizard.navigation.next")}
        finishLabel={t("wizard.navigation.finish")}
        stepLabel={(step, maxSteps) => t("wizard.navigation.stepLabel", { step, maxSteps })}
      />
    </div>
  );
}
