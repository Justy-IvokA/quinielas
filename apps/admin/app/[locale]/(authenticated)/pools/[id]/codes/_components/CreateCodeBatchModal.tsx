"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Key, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Label,
  Input,
  Textarea,
  FormField,
  toastSuccess,
  toastError
} from "@qp/ui";
import { trpc } from "@admin/trpc";
import { downloadCsv, generateCodesCsv } from "@admin/lib/csv-utils";

const createBatchSchema = z.object({
  name: z.string().optional(),
  prefix: z.string().max(10, "Máximo 10 caracteres").optional(),
  quantity: z.number().int().min(1, "Mínimo 1").max(1000, "Máximo 1,000"),
  usesPerCode: z.number().int().min(1, "Mínimo 1").default(1),
  description: z.string().optional(),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
  expiresAt: z.string().optional()
});

type CreateBatchFormData = z.infer<typeof createBatchSchema>;

interface CreateCodeBatchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accessPolicyId: string;
  tenantId: string;
  onSuccess: (batchId: string) => void;
}

export function CreateCodeBatchModal({
  open,
  onOpenChange,
  accessPolicyId,
  tenantId,
  onSuccess
}: CreateCodeBatchModalProps) {
  const t = useTranslations("codes.modal");
  const [createdBatch, setCreatedBatch] = useState<any>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm<CreateBatchFormData>({
    resolver: zodResolver(createBatchSchema),
    defaultValues: {
      usesPerCode: 1,
      quantity: 100
    }
  });

  const createBatchMutation = trpc.access.createCodeBatch.useMutation({
    onSuccess: (data) => {
      toastSuccess(t("createSuccess", { count: data.totalCodes }));
      setCreatedBatch(data);
    },
    onError: (error) => {
      toastError(error.message);
    }
  });

  const handleClose = () => {
    reset();
    setCreatedBatch(null);
    onOpenChange(false);
  };

  const handleDownloadAndClose = () => {
    if (createdBatch) {
      const csv = generateCodesCsv(createdBatch.codes);
      const filename = `codes-${createdBatch.name || createdBatch.id}-${new Date().toISOString().split('T')[0]}.csv`;
      downloadCsv(filename, csv);
      onSuccess(createdBatch.id);
      handleClose();
    }
  };

  const onSubmit = async (data: CreateBatchFormData) => {
    const payload = {
      accessPolicyId,
      tenantId,
      name: data.name,
      prefix: data.prefix,
      quantity: data.quantity,
      usesPerCode: data.usesPerCode,
      description: data.description,
      validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
      validTo: data.validTo ? new Date(data.validTo) : undefined,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined
    };

    await createBatchMutation.mutateAsync(payload);
  };

  const prefix = watch("prefix");
  const quantity = watch("quantity");

  return (
    <Dialog open={open} onOpenChange={createdBatch ? undefined : onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {createdBatch ? "Lote Creado Exitosamente" : t("createTitle")}
          </DialogTitle>
          <DialogDescription>
            {createdBatch
              ? `Se generaron ${createdBatch.totalCodes} códigos únicos`
              : t("createDescription")}
          </DialogDescription>
        </DialogHeader>

        {createdBatch ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-green-800 dark:text-green-200 mb-2">
                <Sparkles className="h-5 w-5" />
                <p className="font-semibold">
                  ¡{createdBatch.totalCodes} códigos generados!
                </p>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300">
                Descarga el archivo CSV para obtener todos los códigos.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Detalles del lote:</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Nombre:</span>
                  <span className="ml-2 font-medium">
                    {createdBatch.name || "Sin nombre"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Prefijo:</span>
                  <span className="ml-2 font-mono font-medium">
                    {createdBatch.prefix || "Ninguno"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Total:</span>
                  <span className="ml-2 font-medium">
                    {createdBatch.totalCodes} códigos
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Usos por código:</span>
                  <span className="ml-2 font-medium">
                    {createdBatch.maxUsesPerCode}
                  </span>
                </div>
              </div>
            </div>

            {createdBatch.codes.slice(0, 5).length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">
                  Primeros códigos (vista previa):
                </p>
                <div className="rounded-md bg-muted p-3 font-mono text-sm space-y-1">
                  {createdBatch.codes.slice(0, 5).map((code: any, i: number) => (
                    <div key={i}>{code.code}</div>
                  ))}
                  {createdBatch.codes.length > 5 && (
                    <div className="text-muted-foreground">
                      ... y {createdBatch.codes.length - 5} más
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label={t("batchNameLabel")}
                htmlFor="name"
                description={t("batchNameHelp")}
              >
                <Input
                  id="name"
                  placeholder={t("batchNamePlaceholder")}
                  {...register("name")}
                />
              </FormField>

              <FormField
                label={t("prefixLabel")}
                htmlFor="prefix"
                description={t("prefixHelp")}
                error={errors.prefix?.message}
              >
                <Input
                  id="prefix"
                  placeholder={t("prefixPlaceholder")}
                  maxLength={10}
                  {...register("prefix")}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                label={t("quantityLabel")}
                htmlFor="quantity"
                description={t("quantityHelp")}
                error={errors.quantity?.message}
                required
              >
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  max={1000}
                  placeholder={t("quantityPlaceholder")}
                  {...register("quantity", { valueAsNumber: true })}
                />
              </FormField>

              <FormField
                label={t("usesPerCodeLabel")}
                htmlFor="usesPerCode"
                description={t("usesPerCodeHelp")}
                required
              >
                <Input
                  id="usesPerCode"
                  type="number"
                  min={1}
                  defaultValue={1}
                  {...register("usesPerCode", { valueAsNumber: true })}
                />
              </FormField>
            </div>

            <FormField
              label={t("descriptionLabel")}
              htmlFor="description"
            >
              <Textarea
                id="description"
                placeholder={t("descriptionPlaceholder")}
                rows={2}
                {...register("description")}
              />
            </FormField>

            <div className="grid grid-cols-3 gap-4">
              <FormField label={t("validFromLabel")} htmlFor="validFrom">
                <Input
                  id="validFrom"
                  type="datetime-local"
                  {...register("validFrom")}
                />
              </FormField>

              <FormField label={t("validToLabel")} htmlFor="validTo">
                <Input
                  id="validTo"
                  type="datetime-local"
                  {...register("validTo")}
                />
              </FormField>

              <FormField label={t("expiresAtLabel")} htmlFor="expiresAt">
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  {...register("expiresAt")}
                />
              </FormField>
            </div>

            {prefix && (
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm font-medium mb-1">{t("preview")}</p>
                <p className="font-mono text-lg">
                  {t("previewFormat", { prefix: prefix || "CODE" })}
                </p>
              </div>
            )}
          </form>
        )}

        <DialogFooter>
          {createdBatch ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cerrar sin Descargar
              </Button>
              <Button onClick={handleDownloadAndClose}>
                Descargar CSV y Cerrar
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit(onSubmit)}
                disabled={createBatchMutation.isPending}
              >
                {createBatchMutation.isPending
                  ? t("generating")
                  : `Generar ${quantity || 0} Códigos`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
