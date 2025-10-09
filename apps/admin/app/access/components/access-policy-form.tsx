"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button, FormField, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, toastSuccess, toastError } from "@qp/ui";

import { trpc } from "../../../src/trpc/react";

interface AccessPolicyFormProps {
  poolId: string;
  tenantId: string;
  onSuccess?: () => void;
}

interface FormData {
  accessType: "PUBLIC" | "CODE" | "EMAIL_INVITE";
  requireCaptcha: boolean;
  requireEmailVerification: boolean;
  maxRegistrations?: number;
}

export function AccessPolicyForm({ poolId, tenantId, onSuccess }: AccessPolicyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const utils = trpc.useUtils();

  const { register, handleSubmit, watch, setValue } = useForm<FormData>({
    defaultValues: {
      accessType: "PUBLIC",
      requireCaptcha: false,
      requireEmailVerification: false
    }
  });

  const createMutation = trpc.access.create.useMutation({
    onSuccess: () => {
      toastSuccess("Política de acceso creada exitosamente");
      utils.access.getByPoolId.invalidate({ poolId });
      onSuccess?.();
    },
    onError: (error) => {
      toastError(`Error al crear política: ${error.message}`);
    }
  });

  const accessType = watch("accessType");

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync({
        poolId,
        tenantId,
        ...data
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <FormField label="Tipo de acceso" htmlFor="accessType" required>
        <Select
          value={accessType}
          onValueChange={(value) => setValue("accessType", value as FormData["accessType"])}
        >
          <SelectTrigger id="accessType">
            <SelectValue placeholder="Selecciona el tipo de acceso" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PUBLIC">Público (sin restricciones)</SelectItem>
            <SelectItem value="CODE">Por código de invitación</SelectItem>
            <SelectItem value="EMAIL_INVITE">Por invitación de email</SelectItem>
          </SelectContent>
        </Select>
      </FormField>

      <div className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="requireCaptcha">Requerir CAPTCHA</Label>
          <p className="text-sm text-muted-foreground">Protege contra registros automatizados</p>
        </div>
        <Switch id="requireCaptcha" {...register("requireCaptcha")} />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="requireEmailVerification">Verificación de email</Label>
          <p className="text-sm text-muted-foreground">Requiere confirmación por correo electrónico</p>
        </div>
        <Switch id="requireEmailVerification" {...register("requireEmailVerification")} />
      </div>

      <FormField label="Máximo de registros (opcional)" htmlFor="maxRegistrations">
        <Input
          id="maxRegistrations"
          type="number"
          min={1}
          placeholder="Sin límite"
          {...register("maxRegistrations", { valueAsNumber: true })}
        />
      </FormField>

      <div className="flex gap-3">
        <Button type="submit" loading={isSubmitting}>
          Crear política
        </Button>
        <Button type="button" variant="secondary" onClick={onSuccess}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
