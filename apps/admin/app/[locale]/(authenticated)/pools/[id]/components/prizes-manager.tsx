"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Award, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  LegacyFormField as FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
  toastError,
  toastSuccess
} from "@qp/ui";

import { trpc } from "@admin/trpc";

const prizeFormSchema = z.object({
  rankFrom: z.number().int().min(1, "Mínimo 1"),
  rankTo: z.number().int().min(1, "Mínimo 1"),
  type: z.enum(["CASH", "DISCOUNT", "SERVICE", "DAY_OFF", "EXPERIENCE", "OTHER"]),
  title: z.string().min(1, "Requerido").max(200),
  description: z.string().max(1000).optional(),
  value: z.string().max(100).optional(),
  imageUrl: z.string().url("URL inválida").optional().or(z.literal(""))
});

type PrizeFormData = z.infer<typeof prizeFormSchema>;

interface PrizesManagerProps {
  poolId: string;
}

export function PrizesManager({ poolId }: PrizesManagerProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPrize, setEditingPrize] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const t = useTranslations("pools");
  
  const { data: pool } = trpc.pools.getById.useQuery({ id: poolId });
  const { data: prizes, isLoading } = trpc.pools.prizes.list.useQuery({ poolId });

  const form = useForm<PrizeFormData>({
    resolver: zodResolver(prizeFormSchema),
    defaultValues: {
      type: "OTHER"
    }
  });

  const { register, handleSubmit, reset, setValue, watch, control, formState: { errors } } = form;

  const createMutation = trpc.pools.prizes.create.useMutation({
    onSuccess: () => {
      toastSuccess("Premio creado exitosamente");
      utils.pools.prizes.list.invalidate({ poolId });
      setShowCreateDialog(false);
      reset();
    },
    onError: (error) => {
      toastError(`Error al crear premio: ${error.message}`);
      console.error(error);
    }
  });

  const deleteMutation = trpc.pools.prizes.delete.useMutation({
    onSuccess: () => {
      toastSuccess("Premio eliminado");
      utils.pools.prizes.list.invalidate({ poolId });
    },
    onError: (error) => {
      toastError(`Error al eliminar: ${error.message}`);
    }
  });

  const onSubmit = (data: PrizeFormData) => {
    if (!pool?.tenantId) {
      toastError("Tenant ID no disponible");
      return;
    }

    // Validate rank range
    if (data.rankTo < data.rankFrom) {
      toastError("La posición 'hasta' debe ser mayor o igual a 'desde'");
      return;
    }

    // Check for overlaps
    const hasOverlap = prizes?.some((prize) => {
      const overlapStart = Math.max(data.rankFrom, prize.rankFrom);
      const overlapEnd = Math.min(data.rankTo, prize.rankTo);
      return overlapStart <= overlapEnd;
    });

    if (hasOverlap) {
      toastError("Los rangos de posiciones se superponen con un premio existente");
      return;
    }

    createMutation.mutate({
      poolId,
      tenantId: pool.tenantId,
      position: (prizes?.length || 0) + 1,
      rankFrom: data.rankFrom,
      rankTo: data.rankTo,
      type: data.type,
      title: data.title,
      description: data.description,
      value: data.value,
      imageUrl: data.imageUrl && data.imageUrl !== "" ? data.imageUrl : undefined
    });
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`¿Eliminar el premio "${title}"?`)) {
      deleteMutation.mutate({ id });
    }
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Cargando premios...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t("details.prizes")}</CardTitle>
            <CardDescription>
              {t("prizes.description", { count: prizes?.length || 0 })}
            </CardDescription>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button StartIcon={Plus}>{t("actions.add")}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo premio</DialogTitle>
                <DialogDescription>
                  Define el premio para una posición del leaderboard.
                </DialogDescription>
              </DialogHeader>
              <FormProvider {...form}>
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <div className="flex justify-between gap-2">
                  <FormField label="Del" htmlFor="rankFrom" required error={errors.rankFrom?.message}>
                    <Input
                      id="rankFrom"
                      type="number"
                      min={1}
                      placeholder="1"
                      {...register("rankFrom", { required: "La posición es requerida", valueAsNumber: true })}
                    />
                  </FormField>

                  <FormField label="Al" htmlFor="rankTo" required error={errors.rankTo?.message}>
                    <Input
                      id="rankTo"
                      type="number"
                      min={1}
                      placeholder="1"
                      {...register("rankTo", { required: "La posición es requerida", valueAsNumber: true })}
                    />
                  </FormField>
                </div>

                <FormField label="Tipo" htmlFor="type" required error={errors.type?.message}>
                  <Select
                    value={watch("type")}
                    onValueChange={(value) => setValue("type", value as any)}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Efectivo</SelectItem>
                      <SelectItem value="DISCOUNT">Descuento</SelectItem>
                      <SelectItem value="SERVICE">Servicio</SelectItem>
                      <SelectItem value="DAY_OFF">Día libre</SelectItem>
                      <SelectItem value="EXPERIENCE">Experiencia</SelectItem>
                      <SelectItem value="OTHER">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Título" htmlFor="title" required error={errors.title?.message}>
                  <Input
                    id="title"
                    placeholder="Primer lugar"
                    {...register("title", { required: "El título es requerido" })}
                  />
                </FormField>

                <FormField label="Descripción (opcional)" htmlFor="description">
                  <Textarea
                    id="description"
                    placeholder="Descripción del premio..."
                    rows={3}
                    {...register("description")}
                  />
                </FormField>

                <FormField label="Valor (opcional)" htmlFor="value">
                  <Input
                    id="value"
                    placeholder="$10,000 MXN"
                    {...register("value")}
                  />
                </FormField>

                <FormField label="URL de imagen (opcional)" htmlFor="imageUrl">
                  <Input
                    id="imageUrl"
                    type="url"
                    placeholder="https://..."
                    {...register("imageUrl")}
                  />
                </FormField>

                <Button type="submit" loading={createMutation.isPending}>
                  Crear premio
                </Button>
              </form>
              </FormProvider>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {prizes && prizes.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Del</TableHead>
                <TableHead className="w-[80px]">Al</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead className="w-[120px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prizes.map((prize) => (
                <TableRow key={prize.id}>
                  <TableCell>
                    <Badge variant="outline">#{prize.rankFrom}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">#{prize.rankTo}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{prize.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {prize.value || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="minimal"
                        StartIcon={Trash2}
                        onClick={() => handleDelete(prize.id, prize.title)}
                        loading={deleteMutation.isPending}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Award className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">No hay premios configurados</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => setShowCreateDialog(true)}
            >
              Agregar primer premio
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
