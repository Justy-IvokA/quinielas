"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Wand2 } from "lucide-react";
import { Input, Label, Textarea, Button, FormField } from "@qp/ui";
import { generatePoolTitle, generatePoolSlug } from "@qp/utils";
import { trpc } from "@admin/trpc";

const detailsSchema = z.object({
  title: z.string().min(3, "Mínimo 3 caracteres").max(100, "Máximo 100 caracteres"),
  slug: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  brandId: z.string().cuid().optional(),
  description: z.string().max(500).optional()
});

type DetailsFormData = z.infer<typeof detailsSchema>;

interface StepDetailsProps {
  competitionName: string;
  seasonYear: number;
  stageLabel?: string;
  roundLabel?: string;
  onSubmit: (data: DetailsFormData) => void;
  initialData?: Partial<DetailsFormData>;
}

export function StepDetails({
  competitionName,
  seasonYear,
  stageLabel,
  roundLabel,
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
      title: generatePoolTitle({ competitionName, seasonYear, stageLabel, roundLabel }),
      slug: generatePoolSlug({ competitionName, seasonYear, stageLabel, roundLabel })
    }
  });

  // Query brands for dropdown
  const { data: brandsData } = trpc.tenant.listBrands.useQuery();

  // Watch all form values and update wizard data in real-time
  const title = watch("title");
  const slug = watch("slug");
  const brandId = watch("brandId");
  const description = watch("description");
  
  useEffect(() => {
    // Only update if form is valid and has required fields
    if (isValid && title && slug) {
      onSubmit({ title, slug, brandId, description });
    }
  }, [title, slug, brandId, description, isValid, onSubmit]);

  const handleAutoFill = () => {
    const title = generatePoolTitle({ competitionName, seasonYear, stageLabel, roundLabel });
    const slug = generatePoolSlug({ competitionName, seasonYear, stageLabel, roundLabel });
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
      <FormField label="Título de la quiniela" htmlFor="title" required error={errors.title?.message}>
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
      </FormField>

      <FormField
        label="Slug (URL)"
        htmlFor="slug"
        required
        error={errors.slug?.message}
        description="Se usará en la URL de la quiniela. Solo minúsculas, números y guiones."
      >
        <Input id="slug" placeholder="mundial-u20-semifinales-2026" {...register("slug")} />
      </FormField>

      {brandsData && brandsData.length > 0 && (
        <FormField label="Marca (opcional)" htmlFor="brandId" description="Asocia esta quiniela a una marca específica.">
          <select
            id="brandId"
            {...register("brandId")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Sin marca específica</option>
            {brandsData.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </FormField>
      )}

      <FormField label="Descripción (opcional)" htmlFor="description" error={errors.description?.message}>
        <Textarea
          id="description"
          placeholder="Participa en la quiniela de las semifinales del Mundial Sub-20..."
          rows={4}
          {...register("description")}
        />
      </FormField>

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
          {roundLabel && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Ronda:</dt>
              <dd className="font-medium">{roundLabel}</dd>
            </div>
          )}
        </dl>
      </div>
    </form>
  );
}
