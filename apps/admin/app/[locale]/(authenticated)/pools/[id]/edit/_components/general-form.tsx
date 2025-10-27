"use client";

import { useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  LegacyFormField as FormField,
  Input,
  Textarea,
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

const generalFormSchema = z.object({
  name: z.string().min(3, "Mínimo 3 caracteres").max(100),
  slug: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  description: z.string().max(500).optional(),
  brandId: z.string().cuid().optional(),
  prizeSummary: z.string().max(500).optional(),
  isActive: z.boolean(),
  isPublic: z.boolean()
});

type GeneralFormData = z.infer<typeof generalFormSchema>;

interface GeneralFormProps {
  poolId: string;
}

export function GeneralForm({ poolId }: GeneralFormProps) {
  const t = useTranslations("pools.edit.general");
  const utils = trpc.useUtils();

  const { data: pool, isLoading } = trpc.pools.getById.useQuery({ id: poolId });
  const { data: brands } = trpc.tenant.listBrands.useQuery();

  const form = useForm<GeneralFormData>({
    resolver: zodResolver(generalFormSchema)
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors, isDirty }
  } = form;

  const updateMutation = trpc.pools.update.useMutation({
    onSuccess: () => {
      toastSuccess(t("saveSuccess"));
      utils.pools.getById.invalidate({ id: poolId });
      reset(watch());
    },
    onError: (error) => {
      toastError(t("saveError", { message: error.message }));
    }
  });

  useEffect(() => {
    if (pool) {
      reset({
        name: pool.name,
        slug: pool.slug,
        description: pool.description || "",
        brandId: pool.brandId || undefined,
        prizeSummary: pool.prizeSummary || "",
        isActive: pool.isActive,
        isPublic: pool.isPublic
      });
    }
  }, [pool, reset]);

  const onSubmit = (data: GeneralFormData) => {
    updateMutation.mutate({
      id: poolId,
      ...data
    });
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
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <FormProvider {...form}>
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            label={t("form.name")}
            htmlFor="name"
            required
            error={errors.name?.message}
          >
            <Input
              id="name"
              placeholder={t("form.namePlaceholder")}
              {...register("name")}
            />
          </FormField>

          <FormField
            label={t("form.slug")}
            htmlFor="slug"
            required
            error={errors.slug?.message}
            description={t("form.slugHelp")}
          >
            <Input
              id="slug"
              placeholder={t("form.slugPlaceholder")}
              {...register("slug")}
              disabled={!pool?.isActive}
            />
          </FormField>

          <FormField
            label={t("form.description")}
            htmlFor="description"
            error={errors.description?.message}
          >
            <Textarea
              id="description"
              placeholder={t("form.descriptionPlaceholder")}
              rows={3}
              {...register("description")}
            />
          </FormField>

          <FormField
            label={t("form.brand")}
            htmlFor="brandId"
            error={errors.brandId?.message}
          >
            <Select
              value={watch("brandId") || ""}
              onValueChange={(value) => setValue("brandId", value, { shouldDirty: true })}
            >
              <SelectTrigger id="brandId">
                <SelectValue placeholder={t("form.brandPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {brands?.map((brand: { id: string; name: string; slug: string; logoUrl?: string | null; domains?: string[] | null; createdAt: Date; updatedAt: Date; }) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            label={t("form.prizeSummary")}
            htmlFor="prizeSummary"
            error={errors.prizeSummary?.message}
          >
            <Input
              id="prizeSummary"
              placeholder={t("form.prizeSummaryPlaceholder")}
              {...register("prizeSummary")}
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm font-medium mb-1">{t("form.season")}</p>
              <p className="text-sm text-muted-foreground">
                {pool?.season.name} ({pool?.season.year})
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">{t("form.sport")}</p>
              <p className="text-sm text-muted-foreground">
                {pool?.season.competition?.sport?.name || "—"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">{t("form.competition")}</p>
              <p className="text-sm text-muted-foreground">
                {pool?.season.competition?.name || "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">{t("form.isActive")}</p>
              <p className="text-sm text-muted-foreground">
                Permite nuevos registros y predicciones
              </p>
            </div>
            <Switch
              checked={watch("isActive")}
              onCheckedChange={(checked) => setValue("isActive", checked, { shouldDirty: true })}
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">{t("form.isPublic")}</p>
              <p className="text-sm text-muted-foreground">
                Visible en listados públicos
              </p>
            </div>
            <Switch
              checked={watch("isPublic")}
              onCheckedChange={(checked) => setValue("isPublic", checked, { shouldDirty: true })}
            />
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
            <Button
              type="submit"
              loading={updateMutation.isPending}
              disabled={!isDirty}
            >
              Guardar cambios
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
    </FormProvider>
  );
}
