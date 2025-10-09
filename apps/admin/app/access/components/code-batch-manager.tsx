"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Copy, Plus } from "lucide-react";

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
  toastSuccess,
  toastError
} from "@qp/ui";

import { trpc } from "../../../src/trpc/react";

interface CodeBatchManagerProps {
  accessPolicyId: string;
}

interface CreateBatchForm {
  quantity: number;
  usesPerCode: number;
}

export function CodeBatchManager({ accessPolicyId }: CodeBatchManagerProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const utils = trpc.useUtils();
  const tenantId = "demo-tenant-id"; // Replace with actual tenant context

  const { data: batches, isLoading } = trpc.access.getCodeBatches.useQuery({ accessPolicyId });

  const { register, handleSubmit, reset } = useForm<CreateBatchForm>({
    defaultValues: {
      quantity: 10,
      usesPerCode: 1
    }
  });

  const createBatchMutation = trpc.access.createCodeBatch.useMutation({
    onSuccess: () => {
      toastSuccess("Lote de códigos creado exitosamente");
      utils.access.getCodeBatches.invalidate({ accessPolicyId });
      setShowCreateDialog(false);
      reset();
    },
    onError: (error) => {
      toastError(`Error al crear lote: ${error.message}`);
    }
  });

  const onSubmit = (data: CreateBatchForm) => {
    createBatchMutation.mutate({
      accessPolicyId,
      tenantId,
      ...data
    });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toastSuccess("Código copiado al portapapeles");
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Cargando lotes de códigos...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Lotes de códigos</h3>
          <p className="text-sm text-muted-foreground">
            {batches?.length || 0} lote(s) creado(s)
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button StartIcon={Plus}>Crear lote</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear lote de códigos</DialogTitle>
              <DialogDescription>
                Genera múltiples códigos de invitación de una sola vez.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <FormField label="Cantidad de códigos" htmlFor="quantity" required>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  max={1000}
                  {...register("quantity", { valueAsNumber: true, required: true })}
                />
              </FormField>
              <FormField label="Usos por código" htmlFor="usesPerCode" required>
                <Input
                  id="usesPerCode"
                  type="number"
                  min={1}
                  {...register("usesPerCode", { valueAsNumber: true, required: true })}
                />
              </FormField>
              <Button type="submit" loading={createBatchMutation.isPending}>
                Generar códigos
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {batches && batches.length > 0 ? (
        <div className="flex flex-col gap-4">
          {batches.map((batch) => (
            <Card key={batch.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  Lote #{batch.id.slice(0, 8)}
                </CardTitle>
                <CardDescription>
                  {batch.totalCodes} códigos · {batch.usedCodes} usados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Usos</TableHead>
                      <TableHead className="w-[100px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batch.codes.slice(0, 5).map((code) => (
                      <TableRow key={code.id}>
                        <TableCell className="font-mono">{code.code}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              code.status === "UNUSED"
                                ? "default"
                                : code.status === "USED"
                                  ? "success"
                                  : "outline"
                            }
                          >
                            {code.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {code.usedCount} / {code.usesPerCode}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="minimal"
                            StartIcon={Copy}
                            onClick={() => copyCode(code.code)}
                          >
                            Copiar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {batch.codes.length > 5 && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Y {batch.codes.length - 5} código(s) más...
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-muted-foreground">No hay lotes de códigos creados</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
