"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Trophy } from "lucide-react";
import { Input, Label, Button, FormField, Alert, AlertDescription } from "@qp/ui";

const prizeSchema = z.object({
  rankFrom: z.number().int().min(1),
  rankTo: z.number().int().min(1),
  type: z.enum(["CASH", "DISCOUNT", "SERVICE", "DAY_OFF", "EXPERIENCE", "OTHER"]).optional(),
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  value: z.string().max(100).optional(),
  imageUrl: z.string().url().optional().or(z.literal(""))
}).refine(data => data.rankTo >= data.rankFrom, {
  message: "El rango final debe ser mayor o igual al inicial"
});

const prizesSchema = z.object({
  prizes: z.array(prizeSchema)
});

type PrizesFormData = z.infer<typeof prizesSchema>;
type PrizeData = z.infer<typeof prizeSchema>;

interface StepPrizesProps {
  onSubmit: (data: PrizeData[]) => void;
  initialData?: PrizeData[];
}

export function StepPrizes({ onSubmit, initialData }: StepPrizesProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors }
  } = useForm<PrizesFormData>({
    resolver: zodResolver(prizesSchema),
    defaultValues: {
      prizes: initialData && initialData.length > 0
        ? initialData
        : [{ rankFrom: 1, rankTo: 1, title: "1er Lugar", type: "CASH" }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "prizes"
  });

  const handleFormSubmit = (data: PrizesFormData) => {
    onSubmit(data.prizes);
  };

  const addPrize = () => {
    const lastPrize = fields[fields.length - 1];
    const nextRank = lastPrize ? (lastPrize.rankTo || 1) + 1 : 1;
    
    append({
      rankFrom: nextRank,
      rankTo: nextRank,
      title: `${nextRank}° Lugar`,
      type: "CASH"
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} id="wizard-step-6" className="flex flex-col gap-6">
      <Alert>
        <Trophy className="h-4 w-4" />
        <AlertDescription>
          Define los premios para los mejores participantes. Puedes agregar múltiples premios o dejarlo vacío.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col gap-4">
        {fields.map((field, index) => (
          <div key={field.id} className="rounded-lg border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Premio #{index + 1}</h4>
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                label="Posición desde"
                htmlFor={`prizes.${index}.rankFrom`}
                required
                error={errors.prizes?.[index]?.rankFrom?.message}
              >
                <Input
                  id={`prizes.${index}.rankFrom`}
                  type="number"
                  min={1}
                  {...register(`prizes.${index}.rankFrom`, { valueAsNumber: true })}
                />
              </FormField>

              <FormField
                label="Posición hasta"
                htmlFor={`prizes.${index}.rankTo`}
                required
                error={errors.prizes?.[index]?.rankTo?.message}
              >
                <Input
                  id={`prizes.${index}.rankTo`}
                  type="number"
                  min={1}
                  {...register(`prizes.${index}.rankTo`, { valueAsNumber: true })}
                />
              </FormField>
            </div>

            <FormField
              label="Tipo de premio"
              htmlFor={`prizes.${index}.type`}
            >
              <select
                id={`prizes.${index}.type`}
                {...register(`prizes.${index}.type`)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="CASH">Efectivo</option>
                <option value="DISCOUNT">Descuento</option>
                <option value="SERVICE">Servicio</option>
                <option value="DAY_OFF">Día libre</option>
                <option value="EXPERIENCE">Experiencia</option>
                <option value="OTHER">Otro</option>
              </select>
            </FormField>

            <FormField
              label="Título del premio"
              htmlFor={`prizes.${index}.title`}
              required
              error={errors.prizes?.[index]?.title?.message}
            >
              <Input
                id={`prizes.${index}.title`}
                placeholder="$1,000 MXN"
                {...register(`prizes.${index}.title`)}
              />
            </FormField>

            <FormField
              label="Descripción (opcional)"
              htmlFor={`prizes.${index}.description`}
              error={errors.prizes?.[index]?.description?.message}
            >
              <Input
                id={`prizes.${index}.description`}
                placeholder="Premio en efectivo para el ganador"
                {...register(`prizes.${index}.description`)}
              />
            </FormField>

            <FormField
              label="Valor (opcional)"
              htmlFor={`prizes.${index}.value`}
              description="Valor monetario o equivalente"
            >
              <Input
                id={`prizes.${index}.value`}
                placeholder="$1,000"
                {...register(`prizes.${index}.value`)}
              />
            </FormField>

            <FormField
              label="URL de imagen (opcional)"
              htmlFor={`prizes.${index}.imageUrl`}
              error={errors.prizes?.[index]?.imageUrl?.message}
            >
              <Input
                id={`prizes.${index}.imageUrl`}
                type="url"
                placeholder="https://..."
                {...register(`prizes.${index}.imageUrl`)}
              />
            </FormField>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" onClick={addPrize} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Agregar premio
      </Button>
    </form>
  );
}
