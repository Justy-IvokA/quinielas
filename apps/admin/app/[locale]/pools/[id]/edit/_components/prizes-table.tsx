"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
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
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
  toastSuccess,
  toastError
} from "@qp/ui";
import { trpc } from "@admin/trpc";

const prizeFormSchema = z.object({
  rankFrom: z.number().int().min(1, "Mínimo 1"),
  rankTo: z.number().int().min(1, "Mínimo 1"),
  type: z.enum(["CASH", "DISCOUNT", "SERVICE", "DAY_OFF", "EXPERIENCE", "OTHER"]),
  title: z.string().min(1, "Requerido").max(100),
  description: z.string().max(500).optional(),
  value: z.string().max(100).optional(),
  imageUrl: z.string().url("URL inválida").optional().or(z.literal(""))
});

type PrizeFormData = z.infer<typeof prizeFormSchema>;

interface PrizesTableProps {
  poolId: string;
}

export function PrizesTable({ poolId }: PrizesTableProps) {
  const t = useTranslations("pools.edit.prizes");
  const [showDialog, setShowDialog] = useState(false);
  const utils = trpc.useUtils();

  const { data: pool } = trpc.pools.getById.useQuery({ id: poolId });
  const { data: prizes, isLoading } = trpc.pools.prizes.list.useQuery({ poolId });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<PrizeFormData>({
    resolver: zodResolver(prizeFormSchema),
    defaultValues: {
      type: "OTHER"
    }
  });

  const createMutation = trpc.pools.prizes.create.useMutation({
    onSuccess: () => {
      toastSuccess(t("createSuccess"));
      utils.pools.prizes.list.invalidate({ poolId });
      setShowDialog(false);
      reset();
    },
    onError: (error) => {
      toastError(t("error", { message: error.message }));
    }
  });

  const deleteMutation = trpc.pools.prizes.delete.useMutation({
    onSuccess: () => {
      toastSuccess(t("deleteSuccess"));
      utils.pools.prizes.list.invalidate({ poolId });
    },
    onError: (error) => {
      toastError(t("error", { message: error.message }));
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
      toastError(t("overlapError"));
      return;
    }

    createMutation.mutate({
      poolId,
      tenantId: pool.tenantId,
      position: (prizes?.length || 0) + 1,
      ...data
    });
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`¿Eliminar el premio "${title}"?`)) {
      deleteMutation.mutate({ id });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button StartIcon={Plus}>Agregar premio</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo premio</DialogTitle>
                <DialogDescription>
                  Define el premio para una o más posiciones del leaderboard.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label={t("form.rankFrom")}
                    htmlFor="rankFrom"
                    required
                    error={errors.rankFrom?.message}
                  >
                    <Input
                      id="rankFrom"
                      type="number"
                      min={1}
                      placeholder="1"
                      {...register("rankFrom", { valueAsNumber: true })}
                    />
                  </FormField>

                  <FormField
                    label={t("form.rankTo")}
                    htmlFor="rankTo"
                    required
                    error={errors.rankTo?.message}
                  >
                    <Input
                      id="rankTo"
                      type="number"
                      min={1}
                      placeholder="1"
                      {...register("rankTo", { valueAsNumber: true })}
                    />
                  </FormField>
                </div>

                <FormField
                  label={t("form.title")}
                  htmlFor="title"
                  required
                  error={errors.title?.message}
                >
                  <Input
                    id="title"
                    placeholder="Primer lugar"
                    {...register("title")}
                  />
                </FormField>

                <FormField
                  label={t("form.type")}
                  htmlFor="type"
                  required
                  error={errors.type?.message}
                >
                  <Select
                    value={watch("type")}
                    onValueChange={(value: any) => setValue("type", value)}
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">{t("form.typeOptions.CASH")}</SelectItem>
                      <SelectItem value="DISCOUNT">{t("form.typeOptions.DISCOUNT")}</SelectItem>
                      <SelectItem value="SERVICE">{t("form.typeOptions.SERVICE")}</SelectItem>
                      <SelectItem value="DAY_OFF">{t("form.typeOptions.DAY_OFF")}</SelectItem>
                      <SelectItem value="EXPERIENCE">{t("form.typeOptions.EXPERIENCE")}</SelectItem>
                      <SelectItem value="OTHER">{t("form.typeOptions.OTHER")}</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField
                  label={t("form.value")}
                  htmlFor="value"
                  error={errors.value?.message}
                >
                  <Input
                    id="value"
                    placeholder="$10,000 MXN"
                    {...register("value")}
                  />
                </FormField>

                <FormField
                  label={t("form.description")}
                  htmlFor="description"
                  error={errors.description?.message}
                >
                  <Textarea
                    id="description"
                    placeholder="Descripción del premio..."
                    rows={3}
                    {...register("description")}
                  />
                </FormField>

                <FormField
                  label={t("form.imageUrl")}
                  htmlFor="imageUrl"
                  error={errors.imageUrl?.message}
                >
                  <Input
                    id="imageUrl"
                    type="url"
                    placeholder="https://..."
                    {...register("imageUrl")}
                  />
                </FormField>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" loading={createMutation.isPending}>
                    Crear premio
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {prizes && prizes.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">{t("table.rankFrom")}</TableHead>
                <TableHead className="w-[80px]">{t("table.rankTo")}</TableHead>
                <TableHead>{t("table.title")}</TableHead>
                <TableHead>{t("table.type")}</TableHead>
                <TableHead>{t("table.value")}</TableHead>
                <TableHead className="w-[100px]">{t("table.actions")}</TableHead>
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
                  <TableCell>
                    <Badge variant="outline">{prize.type}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {prize.value || "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="minimal"
                      StartIcon={Trash2}
                      onClick={() => handleDelete(prize.id, prize.title)}
                      loading={deleteMutation.isPending}
                    >
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-muted-foreground">No hay premios configurados</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => setShowDialog(true)}
            >
              Agregar primer premio
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
