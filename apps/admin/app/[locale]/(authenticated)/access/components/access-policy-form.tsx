"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import { Button, FormField, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, toastSuccess, toastError } from "@qp/ui";

import { trpc } from "@admin/trpc";

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
  const t = useTranslations("access.form");
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
      toastSuccess(t("success"));
      utils.access.getByPoolId.invalidate({ poolId });
      onSuccess?.();
    },
    onError: (error) => {
      toastError(t("error", { message: error.message }));
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
      <FormField label={t("accessType.label")} htmlFor="accessType" required>
        <Select
          value={accessType}
          onValueChange={(value) => setValue("accessType", value as FormData["accessType"])}
        >
          <SelectTrigger id="accessType">
            <SelectValue placeholder={t("accessType.placeholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PUBLIC">{t("accessType.options.PUBLIC")}</SelectItem>
            <SelectItem value="CODE">{t("accessType.options.CODE")}</SelectItem>
            <SelectItem value="EMAIL_INVITE">{t("accessType.options.EMAIL_INVITE")}</SelectItem>
          </SelectContent>
        </Select>
      </FormField>

      <div className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="requireCaptcha">{t("requireCaptcha.label")}</Label>
          <p className="text-sm text-muted-foreground">{t("requireCaptcha.description")}</p>
        </div>
        <Switch id="requireCaptcha" {...register("requireCaptcha")} />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-4">
        <div className="flex flex-col gap-1">
          <Label htmlFor="requireEmailVerification">{t("requireEmailVerification.label")}</Label>
          <p className="text-sm text-muted-foreground">{t("requireEmailVerification.description")}</p>
        </div>
        <Switch id="requireEmailVerification" {...register("requireEmailVerification")} />
      </div>

      <FormField label={t("maxRegistrations.label")} htmlFor="maxRegistrations">
        <Input
          id="maxRegistrations"
          type="number"
          min={1}
          placeholder={t("maxRegistrations.placeholder") ?? undefined}
          {...register("maxRegistrations", { valueAsNumber: true })}
        />
      </FormField>

      <div className="flex gap-3">
        <Button type="submit" loading={isSubmitting}>
          {t("submit")}
        </Button>
        <Button type="button" variant="secondary" onClick={onSuccess}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
