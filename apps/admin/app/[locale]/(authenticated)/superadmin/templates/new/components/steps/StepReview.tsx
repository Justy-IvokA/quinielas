"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@qp/ui";
import { CheckCircle2, Trophy, Lock, Settings, FileText, Calendar } from "lucide-react";
import { trpc } from "@admin/trpc";
import { toast } from "sonner";

interface StepReviewProps {
  wizardData: {
    sportId: string;
    competitionExternalId: string;
    competitionName: string;
    seasonYear: number;
    stageLabel?: string;
    selectedRounds?: string[];
    roundsRange?: { start: number; end: number } | null;
    template: {
      title: string;
      slug: string;
      description?: string;
      status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    };
    rules: {
      exactScore: number;
      correctSign: number;
      goalDiffBonus: number;
    };
    accessDefaults: {
      accessType: "PUBLIC" | "CODE" | "EMAIL_INVITE";
      requireCaptcha: boolean;
      requireEmailVerification: boolean;
    };
  };
}

const STORAGE_KEY = "template-wizard-draft";

export function StepReview({ wizardData }: StepReviewProps) {
  const router = useRouter();
  const t = useTranslations("superadmin.templates.create.wizard.steps.review");
  const tCommon = useTranslations("superadmin.templates.create");
  const [isCreating, setIsCreating] = useState(false);

  const createMutation = trpc.superadmin.templates.create.useMutation({
    onSuccess: (data) => {
      toast.success(tCommon("success"));
      localStorage.removeItem(STORAGE_KEY);
      router.push(`/superadmin/templates/${data.id}/edit`);
    },
    onError: (error) => {
      toast.error(error.message || tCommon("error"));
      setIsCreating(false);
    }
  });

  const handleCreate = () => {
    const datos = {
      slug: wizardData.template.slug,
      title: wizardData.template.title,
      description: wizardData.template.description || undefined,
      status: wizardData.template.status,
      sportId: wizardData.sportId || undefined,
      competitionExternalId: wizardData.competitionExternalId,
      competitionName: wizardData.competitionName,
      seasonYear: wizardData.seasonYear,
      stageLabel: wizardData.stageLabel || undefined,
      roundLabel: undefined, // ✅ NO filtrar en import - importar toda la temporada
      rules: {
        exactScore: wizardData.rules.exactScore,
        correctSign: wizardData.rules.correctSign,
        goalDiffBonus: wizardData.rules.goalDiffBonus,
        tieBreakers: ["EXACT_SCORES", "CORRECT_SIGNS"],
        // ✅ Filtrar en frontend con rounds.start/end
        ...(wizardData.roundsRange ? {
          rounds: {
            start: wizardData.roundsRange.start,
            end: wizardData.roundsRange.end
          }
        } : {})
      },
      accessDefaults: {
        accessType: wizardData.accessDefaults.accessType,
        requireCaptcha: wizardData.accessDefaults.requireCaptcha,
        requireEmailVerification: wizardData.accessDefaults.requireEmailVerification
      }
    };

    console.log("🔥 DATOS TEMPLATE:", datos);
  
    setIsCreating(true);
    
    // ⚠️ IMPORTANTE: NO usar roundLabel para importar
    // Razón: Si usuario selecciona múltiples jornadas (J14, J15, J16),
    // roundLabel solo importaría UNA jornada de la API.
    // Solución: Importar toda la temporada y filtrar en frontend con rounds.start/end
    createMutation.mutate(datos);
  };

  const getAccessTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      PUBLIC: t("accessPublic"),
      CODE: t("accessCode"),
      EMAIL_INVITE: t("accessEmail")
    };
    return labels[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: t("statusDraft"),
      PUBLISHED: t("statusPublished"),
      ARCHIVED: t("statusArchived")
    };
    return labels[status] || status;
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-lg border bg-muted/50 p-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold">{t("title")}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <div className="grid gap-2">
        {/* Competition & Season */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              {t("competitionTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-0 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("competitionLabel")}:</span>
              <span className="font-medium">{wizardData.competitionName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("seasonLabel")}:</span>
              <span className="font-medium">{wizardData.seasonYear}</span>
            </div>
            {wizardData.stageLabel && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("stageLabel")}:</span>
                <span className="font-medium">{wizardData.stageLabel}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Jornadas:</span>
              <span className="font-medium">
                {wizardData.selectedRounds && wizardData.selectedRounds.length > 0 
                  ? `${wizardData.selectedRounds.join(', ')} (${wizardData.roundsRange?.start} - ${wizardData.roundsRange?.end})`
                  : 'Todas las jornadas'
                }
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Template Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              {t("templateTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-0 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("titleLabel")}:</span>
              <span className="font-medium">{wizardData.template.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("slugLabel")}:</span>
              <span className="font-mono text-xs">{wizardData.template.slug}</span>
            </div>
            {wizardData.template.description && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("descriptionLabel")}:</span>
                <span className="font-medium text-right max-w-xs md:max-w-md line-clamp-1">{wizardData.template.description}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("statusLabel")}:</span>
              <span className="font-medium">{getStatusLabel(wizardData.template.status)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Scoring Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4" />
              {t("rulesTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-0 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("exactScoreLabel")}:</span>
              <span className="font-semibold text-yellow-600 dark:text-yellow-500">
                {wizardData.rules.exactScore} {t("points")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("correctSignLabel")}:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-500">
                {wizardData.rules.correctSign} {t("points")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("goalDiffBonusLabel")}:</span>
              <span className="font-semibold text-green-600 dark:text-green-500">
                {wizardData.rules.goalDiffBonus} {t("points")}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Access Defaults */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="h-4 w-4" />
              {t("accessTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-0 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("accessTypeLabel")}:</span>
              <span className="font-medium">{getAccessTypeLabel(wizardData.accessDefaults.accessType)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("captchaLabel")}:</span>
              <span className="font-medium">
                {wizardData.accessDefaults.requireCaptcha ? t("yes") : t("no")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("emailVerificationLabel")}:</span>
              <span className="font-medium">
                {wizardData.accessDefaults.requireEmailVerification ? t("yes") : t("no")}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button
          onClick={handleCreate}
          disabled={isCreating}
          size="lg"
          className="min-w-[200px]"
        >
          {isCreating ? t("creating") : t("createButton")}
        </Button>
      </div>
    </div>
  );
}
