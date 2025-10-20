"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle, ExternalLink, Settings } from "lucide-react";
import { SportsLoader } from "@qp/ui";
import { Button, Alert, AlertDescription, toastSuccess, toastError } from "@qp/ui";
import { trpc } from "@admin/trpc";
import type { CreateAndImportInput } from "@qp/api";

interface StepReviewProps {
  wizardData: {
    competitionExternalId: string;
    competitionName: string;
    seasonYear: number;
    stageLabel?: string;
    roundLabel?: string;
    pool: {
      title: string;
      slug: string;
      description?: string;
    };
    access: {
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
  };
}

export function StepReview({ wizardData }: StepReviewProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState<string>("");
  const [result, setResult] = useState<{
    poolId: string;
    poolSlug: string;
    imported: { teams: number; matches: number };
  } | null>(null);

  const createMutation = trpc.poolWizard.createAndImport.useMutation();

  const handleCreate = async () => {
    setIsCreating(true);
    setProgress("Creando quiniela...");

    try {
      const input: CreateAndImportInput = {
        competitionExternalId: wizardData.competitionExternalId,
        competitionName: wizardData.competitionName,
        seasonYear: wizardData.seasonYear,
        stageLabel: wizardData.stageLabel,
        roundLabel: wizardData.roundLabel,
        pool: wizardData.pool,
        access: {
          accessType: wizardData.access.accessType,
          requireCaptcha: wizardData.access.requireCaptcha,
          requireEmailVerification: wizardData.access.requireEmailVerification,
          emailDomains: wizardData.access.emailDomains 
            ? wizardData.access.emailDomains.split(",").map((d) => d.trim())
            : undefined,
          maxUsers: wizardData.access.maxUsers,
          startAt: wizardData.access.startAt ? new Date(wizardData.access.startAt) : undefined,
          endAt: wizardData.access.endAt ? new Date(wizardData.access.endAt) : undefined
        },
        prizes: wizardData.prizes
      };
      
      setProgress("Importando equipos...");
      
      const response = await createMutation.mutateAsync(input);

      setProgress("Importando partidos...");
      
      setResult(response);
      setProgress("¡Completado!");
      
      toastSuccess("Quiniela creada exitosamente");
    } catch (error: any) {
      console.error("Error creating pool:", error);
      
      // Extract error message from tRPC error
      let errorMessage = "Error al crear la quiniela";
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toastError(errorMessage);
      setIsCreating(false);
      setProgress("");
    }
  };

  if (result) {
    // Determine the configuration URL based on access type
    const getConfigUrl = () => {
      if (wizardData.access.accessType === "CODE") {
        return `/pools/${result.poolId}/codes`;
      } else if (wizardData.access.accessType === "EMAIL_INVITE") {
        return `/pools/${result.poolId}/invitations`;
      }
      return null; // PUBLIC doesn't need configuration
    };

    const configUrl = getConfigUrl();

    return (
      <div className="flex flex-col gap-6">
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <AlertDescription className="text-green-900 dark:text-green-100">
            <strong>¡Quiniela creada exitosamente!</strong>
            <div className="mt-2 space-y-1 text-sm">
              <div>• {result.imported.teams} equipos importados</div>
              <div>• {result.imported.matches} partidos importados</div>
            </div>
          </AlertDescription>
        </Alert>

        <div className="flex flex-col gap-3">
          <Button onClick={() => router.push(`/pools/${result.poolId}`)} className="w-full" StartIcon={ExternalLink}>
            Ver quiniela
          </Button>
          {configUrl && (
            <Button
              variant="outline"
              onClick={() => router.push(configUrl)}
              className="w-full"
              StartIcon={Settings}
            >
              {wizardData.access.accessType === "CODE" 
                ? "Configurar códigos de invitación"
                : "Configurar invitaciones por email"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Revisa la información antes de crear la quiniela. Este proceso importará los equipos y partidos desde la API.
        </AlertDescription>
      </Alert>

      {/* Competition & Season */}
      <div className="rounded-lg border p-4">
        <h3 className="font-semibold mb-3">Competencia y temporada</h3>
        <dl className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Competencia:</dt>
            <dd className="font-medium">{wizardData.competitionName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Temporada:</dt>
            <dd className="font-medium">{wizardData.seasonYear}</dd>
          </div>
          {wizardData.stageLabel && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Etapa:</dt>
              <dd className="font-medium">{wizardData.stageLabel}</dd>
            </div>
          )}
          {wizardData.roundLabel && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Ronda:</dt>
              <dd className="font-medium">{wizardData.roundLabel}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Pool Details */}
      <div className="rounded-lg border p-4">
        <h3 className="font-semibold mb-3">Detalles de la quiniela</h3>
        <dl className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Título:</dt>
            <dd className="font-medium">{wizardData.pool.title}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Slug:</dt>
            <dd className="font-mono text-xs">{wizardData.pool.slug}</dd>
          </div>
          {wizardData.pool.description && (
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground">Descripción:</dt>
              <dd className="text-sm">{wizardData.pool.description}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Access Policy */}
      <div className="rounded-lg border p-4">
        <h3 className="font-semibold mb-3">Política de acceso</h3>
        <dl className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Tipo:</dt>
            <dd className="font-medium">
              {wizardData.access.accessType === "PUBLIC" && "Público"}
              {wizardData.access.accessType === "CODE" && "Código de invitación"}
              {wizardData.access.accessType === "EMAIL_INVITE" && "Invitación por email"}
            </dd>
          </div>
          {wizardData.access.requireCaptcha && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">CAPTCHA:</dt>
              <dd>Activado</dd>
            </div>
          )}
          {wizardData.access.requireEmailVerification && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Verificación de email:</dt>
              <dd>Activado</dd>
            </div>
          )}
          {wizardData.access.maxUsers && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Límite de usuarios:</dt>
              <dd>{wizardData.access.maxUsers}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Prizes */}
      {wizardData.prizes && wizardData.prizes.length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold mb-3">Premios ({wizardData.prizes.length})</h3>
          <div className="space-y-2">
            {wizardData.prizes.map((prize, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {prize.rankFrom === prize.rankTo
                    ? `${prize.rankFrom}° lugar`
                    : `${prize.rankFrom}° - ${prize.rankTo}° lugar`}
                </span>
                <span className="font-medium">{prize.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Button */}
      <div className="pt-4 border-t">
        {isCreating ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <SportsLoader size="md" text="Creando pool" />
            <p className="text-sm text-muted-foreground">{progress}</p>
          </div>
        ) : (
          <Button onClick={handleCreate} className="w-full" size="lg">
            Crear quiniela e importar eventos
          </Button>
        )}
      </div>
    </div>
  );
}
