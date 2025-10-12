"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  FormField,
  Input,
  Label,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  toastError,
  toastSuccess
} from "@qp/ui";

import { trpc } from "@admin/trpc";

interface PoolFormData {
  name: string;
  slug: string;
  description?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isPublic: boolean;
  rules: {
    exactScore: number;
    correctSign: number;
    goalDiffBonus: number;
  };
}

export function CreatePoolForm() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("basic");

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PoolFormData>({
    defaultValues: {
      isActive: true,
      isPublic: false,
      rules: {
        exactScore: 5,
        correctSign: 3,
        goalDiffBonus: 1
      }
    }
  });

  const createMutation = trpc.pools.create.useMutation({
    onSuccess: (data) => {
      toastSuccess(`Quiniela "${data.name}" creada exitosamente`);
      router.push(`/pools/${data.id}`);
    },
    onError: (error) => {
      toastError(`Error al crear quiniela: ${error.message}`);
    }
  });

  const onSubmit = async (data: PoolFormData) => {
    // Mock brand/season IDs - replace with actual selectors
    const brandId = "demo-brand-id";
    const seasonId = "demo-season-id";

    await createMutation.mutateAsync({
      brandId,
      seasonId,
      name: data.name,
      slug: data.slug,
      description: data.description,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      isActive: data.isActive,
      isPublic: data.isPublic,
      rules: data.rules
    });
  };

  const generateSlug = () => {
    const name = watch("name");
    if (name) {
      const slug = name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setValue("slug", slug);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="basic">Información básica</TabsTrigger>
          <TabsTrigger value="rules">Reglas de puntuación</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Información básica</CardTitle>
              <CardDescription>Define el nombre, slug y descripción del pool.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <FormField label="Nombre del pool" htmlFor="name" required error={errors.name?.message}>
                <Input
                  id="name"
                  placeholder="Mundial FIFA 2026"
                  {...register("name", { required: "El nombre es requerido", minLength: 3 })}
                  onBlur={generateSlug}
                />
              </FormField>

              <FormField
                label="Slug (URL amigable)"
                htmlFor="slug"
                required
                error={errors.slug?.message}
                description="Se usa en la URL del pool. Solo letras minúsculas, números y guiones."
              >
                <Input
                  id="slug"
                  placeholder="mundial-fifa-2026"
                  {...register("slug", {
                    required: "El slug es requerido",
                    pattern: {
                      value: /^[a-z0-9-]+$/,
                      message: "Solo letras minúsculas, números y guiones"
                    }
                  })}
                />
              </FormField>

              <FormField label="Descripción (opcional)" htmlFor="description">
                <Textarea
                  id="description"
                  placeholder="Participa en la quiniela oficial del Mundial FIFA 2026..."
                  rows={4}
                  {...register("description")}
                />
              </FormField>

              <div className="grid gap-6 md:grid-cols-2">
                <FormField label="Fecha de inicio" htmlFor="startDate" required error={errors.startDate?.message}>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    {...register("startDate", { required: "La fecha de inicio es requerida" })}
                  />
                </FormField>

                <FormField label="Fecha de fin" htmlFor="endDate" required error={errors.endDate?.message}>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    {...register("endDate", { required: "La fecha de fin es requerida" })}
                  />
                </FormField>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Reglas de puntuación</CardTitle>
              <CardDescription>
                Define cuántos puntos se otorgan por cada tipo de acierto.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <FormField
                label="Puntos por marcador exacto"
                htmlFor="exactScore"
                description="Ejemplo: predijo 2-1 y el resultado fue 2-1"
              >
                <Input
                  id="exactScore"
                  type="number"
                  min={0}
                  {...register("rules.exactScore", { valueAsNumber: true })}
                />
              </FormField>

              <FormField
                label="Puntos por signo correcto (1X2)"
                htmlFor="correctSign"
                description="Ejemplo: predijo victoria local y acertó, aunque el marcador no fue exacto"
              >
                <Input
                  id="correctSign"
                  type="number"
                  min={0}
                  {...register("rules.correctSign", { valueAsNumber: true })}
                />
              </FormField>

              <FormField
                label="Bonus por diferencia de goles"
                htmlFor="goalDiffBonus"
                description="Punto adicional si acierta la diferencia de goles (ej: predijo 2-0, resultado 3-1)"
              >
                <Input
                  id="goalDiffBonus"
                  type="number"
                  min={0}
                  {...register("rules.goalDiffBonus", { valueAsNumber: true })}
                />
              </FormField>

              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <p className="text-sm font-medium">Vista previa de puntuación</p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>• Marcador exacto: {watch("rules.exactScore")} puntos</li>
                  <li>• Signo correcto: {watch("rules.correctSign")} puntos</li>
                  <li>• Bonus diferencia: +{watch("rules.goalDiffBonus")} punto</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración</CardTitle>
              <CardDescription>Opciones de visibilidad y estado del pool.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-4">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="isActive">Pool activo</Label>
                  <p className="text-sm text-muted-foreground">
                    Los usuarios podrán registrarse y hacer predicciones
                  </p>
                </div>
                <Switch id="isActive" {...register("isActive")} />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-4">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="isPublic">Pool público</Label>
                  <p className="text-sm text-muted-foreground">
                    Visible en listados públicos y buscadores
                  </p>
                </div>
                <Switch id="isPublic" {...register("isPublic")} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex gap-3 border-t border-border pt-6">
        <Button type="submit" loading={createMutation.isPending}>
          Crear pool
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
