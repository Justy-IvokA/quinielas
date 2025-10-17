"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Award, Edit, Plus, Trash2 } from "lucide-react";
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
  FormField,
  Input,
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

interface PrizesManagerProps {
  poolId: string;
}

interface PrizeFormData {
  position: number;
  rankFrom: number;
  rankTo: number;
  title: string;
  description?: string;
  value?: string;
  imageUrl?: string;
}

export function PrizesManager({ poolId }: PrizesManagerProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPrize, setEditingPrize] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const tenantId = "demo-tenant-id"; // Replace with actual tenant context
  const t = useTranslations("pools");
  const { data: prizes, isLoading } = trpc.pools.prizes.list.useQuery({ poolId });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PrizeFormData>();

  const createMutation = trpc.pools.prizes.create.useMutation({
    onSuccess: () => {
      toastSuccess("Premio creado exitosamente");
      utils.pools.prizes.list.invalidate({ poolId });
      setShowCreateDialog(false);
      reset();
    },
    onError: (error) => {
      toastError(`Error al crear premio: ${error.message}`);
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
    createMutation.mutate({
      poolId,
      tenantId,
      ...data
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
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                {/* <FormField label="Posición" htmlFor="position" required error={errors.position?.message}>
                  <Input
                    id="position"
                    type="number"
                    min={1}
                    placeholder="1"
                    {...register("position", { required: "La posición es requerida", valueAsNumber: true })}
                  />
                </FormField> */}

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
