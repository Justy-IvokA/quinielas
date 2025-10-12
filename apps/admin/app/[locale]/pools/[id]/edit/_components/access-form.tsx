"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Skeleton,
  toastSuccess,
  toastError
} from "@qp/ui";
import { trpc } from "@admin/trpc";

const accessFormSchema = z.object({
  accessType: z.enum(["PUBLIC", "CODE", "EMAIL_INVITE"]),
  requireCaptcha: z.boolean(),
  requireEmailVerification: z.boolean(),
  domainAllowList: z.array(z.string()).optional(),
  maxRegistrations: z.number().int().positive().optional(),
  windowStart: z.date().optional(),
  windowEnd: z.date().optional()
});

type AccessFormData = z.infer<typeof accessFormSchema>;

interface AccessFormProps {
  poolId: string;
}

export function AccessForm({ poolId }: AccessFormProps) {
  const t = useTranslations("pools.edit.access");
  const utils = trpc.useUtils();
  const [domainInput, setDomainInput] = useState("");

  const { data: pool } = trpc.pools.getById.useQuery({ id: poolId });
  const { data: policy, isLoading } = trpc.access.getByPoolId.useQuery(
    { poolId },
    { retry: false }
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty }
  } = useForm<AccessFormData>({
    resolver: zodResolver(accessFormSchema),
    defaultValues: {
      accessType: "PUBLIC",
      requireCaptcha: false,
      requireEmailVerification: false,
      domainAllowList: []
    }
  });

  const upsertMutation = trpc.access.upsert.useMutation({
    onSuccess: () => {
      toastSuccess(t("saveSuccess"));
      utils.access.getByPoolId.invalidate({ poolId });
      reset(watch());
    },
    onError: (error) => {
      toastError(t("saveError", { message: error.message }));
    }
  });

  useEffect(() => {
    if (policy) {
      reset({
        accessType: policy.accessType,
        requireCaptcha: policy.requireCaptcha,
        requireEmailVerification: policy.requireEmailVerification,
        domainAllowList: policy.domainAllowList || [],
        maxRegistrations: policy.maxRegistrations || undefined,
        windowStart: policy.windowStart || undefined,
        windowEnd: policy.windowEnd || undefined
      });
    }
  }, [policy, reset]);

  const onSubmit = (data: AccessFormData) => {
    if (!pool?.tenantId) {
      toastError("Tenant ID no disponible");
      return;
    }

    upsertMutation.mutate({
      poolId,
      tenantId: pool.tenantId,
      ...data
    });
  };

  const addDomain = () => {
    if (!domainInput.trim()) return;
    const current = watch("domainAllowList") || [];
    if (!current.includes(domainInput.trim())) {
      setValue("domainAllowList", [...current, domainInput.trim()], { shouldDirty: true });
      setDomainInput("");
    }
  };

  const removeDomain = (domain: string) => {
    const current = watch("domainAllowList") || [];
    setValue(
      "domainAllowList",
      current.filter((d) => d !== domain),
      { shouldDirty: true }
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            label={t("form.accessType")}
            htmlFor="accessType"
            required
            error={errors.accessType?.message}
          >
            <Select
              value={watch("accessType")}
              onValueChange={(value: "PUBLIC" | "CODE" | "EMAIL_INVITE") =>
                setValue("accessType", value, { shouldDirty: true })
              }
            >
              <SelectTrigger id="accessType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">{t("form.accessTypeOptions.PUBLIC")}</SelectItem>
                <SelectItem value="CODE">{t("form.accessTypeOptions.CODE")}</SelectItem>
                <SelectItem value="EMAIL_INVITE">
                  {t("form.accessTypeOptions.EMAIL_INVITE")}
                </SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">{t("form.requireCaptcha")}</p>
              <p className="text-sm text-muted-foreground">{t("form.requireCaptchaHelp")}</p>
            </div>
            <Switch
              checked={watch("requireCaptcha")}
              onCheckedChange={(checked) =>
                setValue("requireCaptcha", checked, { shouldDirty: true })
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">{t("form.requireEmailVerification")}</p>
              <p className="text-sm text-muted-foreground">
                {t("form.requireEmailVerificationHelp")}
              </p>
            </div>
            <Switch
              checked={watch("requireEmailVerification")}
              onCheckedChange={(checked) =>
                setValue("requireEmailVerification", checked, { shouldDirty: true })
              }
            />
          </div>

          <FormField
            label={t("form.domainAllowList")}
            htmlFor="domainInput"
            description={t("form.domainAllowListHelp")}
          >
            <div className="flex gap-2">
              <Input
                id="domainInput"
                placeholder={t("form.domainAllowListPlaceholder")}
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addDomain();
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={addDomain}>
                Agregar
              </Button>
            </div>
            {watch("domainAllowList")?.length ? (
              <div className="flex flex-wrap gap-2 mt-2">
                {watch("domainAllowList")?.map((domain) => (
                  <div
                    key={domain}
                    className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-sm"
                  >
                    {domain}
                    <button
                      type="button"
                      onClick={() => removeDomain(domain)}
                      className="ml-1 text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </FormField>

          <FormField
            label={t("form.maxRegistrations")}
            htmlFor="maxRegistrations"
            error={errors.maxRegistrations?.message}
          >
            <Input
              id="maxRegistrations"
              type="number"
              min={1}
              placeholder={t("form.maxRegistrationsPlaceholder")}
              {...register("maxRegistrations", { valueAsNumber: true })}
            />
          </FormField>

          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-3">{t("quickLinks.title")}</h4>
            <div className="flex flex-col gap-2">
              <Link
                href={`/pools/${poolId}/invitations`}
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                {t("quickLinks.invitations")}
              </Link>
              <Link
                href={`/pools/${poolId}/codes`}
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                {t("quickLinks.codes")}
              </Link>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => reset()}
              disabled={!isDirty}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={upsertMutation.isPending} disabled={!isDirty}>
              Guardar cambios
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
