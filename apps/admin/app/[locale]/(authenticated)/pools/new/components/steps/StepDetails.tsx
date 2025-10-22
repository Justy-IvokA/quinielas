"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Wand2 } from "lucide-react";
import { Input, Label, Textarea, Button } from "@qp/ui";
import { generatePoolTitle, generatePoolSlug } from "@qp/utils";

const detailsSchema = z.object({
  title: z.string().min(3, "Mínimo 3 caracteres").max(100, "Máximo 100 caracteres"),
  slug: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  description: z.string().max(500).optional()
});

type DetailsFormData = z.infer<typeof detailsSchema>;

interface StepDetailsProps {
  competitionName: string;
  seasonYear: number;
  stageLabel?: string;
  selectedRounds?: string[];
  roundsRange?: { start: number; end: number } | null;
  onSubmit: (data: DetailsFormData) => void;
  initialData?: Partial<DetailsFormData>;
}

export function StepDetails({
  competitionName,
  seasonYear,
  stageLabel,
  selectedRounds,
  roundsRange,
  onSubmit,
  initialData
}: StepDetailsProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid }
  } = useForm<DetailsFormData>({
    resolver: zodResolver(detailsSchema),
    mode: "onChange", // Validate on change
    defaultValues: initialData || {
      title: generatePoolTitle({ 
        competitionName, 
        seasonYear, 
        stageLabel, 
        roundLabel: selectedRounds && selectedRounds.length > 0 ? selectedRounds.join('-') : undefined 
      }),
      slug: generatePoolSlug({ 
        competitionName, 
        seasonYear, 
        stageLabel, 
        roundLabel: selectedRounds && selectedRounds.length > 0 ? selectedRounds.join('-') : undefined 
      })
    }
  });

  // Watch all form values and update wizard data in real-time
  const title = watch("title");
  const slug = watch("slug");
  const description = watch("description");
  
  useEffect(() => {
    // Only update if form is valid and has required fields
    if (isValid && title && slug) {
      onSubmit({ title, slug, description });
    }
  }, [title, slug, description, isValid, onSubmit]);

  const handleAutoFill = () => {
    const title = generatePoolTitle({ 
      competitionName, 
      seasonYear, 
      stageLabel, 
      roundLabel: selectedRounds && selectedRounds.length > 0 ? selectedRounds.join('-') : undefined 
    });
    const slug = generatePoolSlug({ 
      competitionName, 
      seasonYear, 
      stageLabel, 
      roundLabel: selectedRounds && selectedRounds.length > 0 ? selectedRounds.join('-') : undefined 
    });
    setValue("title", title);
    setValue("slug", slug);
  };

  const handleTitleBlur = () => {
    const title = watch("title");
    if (title && !watch("slug")) {
      setValue("slug", generatePoolSlug({ competitionName: title }));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} id="wizard-step-4" className="flex flex-col gap-6">
      <div className="space-y-2">
        <Label htmlFor="title">
          Título de la quiniela
          <span className="text-destructive ml-1">*</span>
        </Label>
        <div className="flex gap-2">
          <Input
            id="title"
            placeholder="Mundial U20 — Semifinales 2026"
            {...register("title")}
            onBlur={handleTitleBlur}
            className="flex-1"
          />
          <Button type="button" variant="outline" size="icon" onClick={handleAutoFill} title="Auto-rellenar">
            <Wand2 className="h-4 w-4" />
          </Button>
        </div>
        {errors.title?.message && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">
          Slug (URL)
          <span className="text-destructive ml-1">*</span>
        </Label>
        <Input id="slug" placeholder="mundial-u20-semifinales-2026" {...register("slug")} />
        {!errors.slug?.message && (
          <p className="text-sm text-muted-foreground">OjO: Se usará en la URL de la quiniela. Solo minúsculas, números y guiones.</p>
        )}
        {errors.slug?.message && (
          <p className="text-sm text-destructive">{errors.slug.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción (opcional)</Label>
        <Textarea
          id="description"
          placeholder="Participa en la quiniela de las semifinales del Mundial Sub-20..."
          rows={4}
          {...register("description")}
        />
        {errors.description?.message && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="rounded-lg border bg-muted/50 p-4">
        <h4 className="font-medium mb-2">Información del torneo</h4>
        <dl className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Competencia:</dt>
            <dd className="font-medium">{competitionName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Temporada:</dt>
            <dd className="font-medium">{seasonYear}</dd>
          </div>
          {stageLabel && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Etapa:</dt>
              <dd className="font-medium">{stageLabel}</dd>
            </div>
          )}
          {selectedRounds && selectedRounds.length > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Jornadas:</dt>
              <dd className="font-medium">{selectedRounds.join(', ')}</dd>
            </div>
          )}
          {roundsRange && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Rango:</dt>
              <dd className="font-medium">{roundsRange.start} - {roundsRange.end}</dd>
            </div>
          )}
        </dl>
      </div>
    </form>
  );
}
