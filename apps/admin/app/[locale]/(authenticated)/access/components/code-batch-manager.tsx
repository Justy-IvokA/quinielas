"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm, FormProvider } from "react-hook-form";
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
  LegacyFormField as FormField,
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

import { trpc } from "@admin/trpc";

interface CodeBatchManagerProps {
  accessPolicyId: string;
}

interface CreateBatchForm {
  quantity: number;
  usesPerCode: number;
}

export function CodeBatchManager({ accessPolicyId }: CodeBatchManagerProps) {
  const t = useTranslations("access.batches");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const utils = trpc.useUtils();
  const tenantId = "demo-tenant-id"; // Replace with actual tenant context

  const { data: batches, isLoading } = trpc.access.getCodeBatches.useQuery({ accessPolicyId });

  const form = useForm<CreateBatchForm>({
    defaultValues: {
      quantity: 10,
      usesPerCode: 1
    }
  });

  const { register, handleSubmit, reset, control } = form;

  const createBatchMutation = trpc.access.createCodeBatch.useMutation({
    onSuccess: () => {
      toastSuccess(t("success"));
      utils.access.getCodeBatches.invalidate({ accessPolicyId });
      setShowCreateDialog(false);
      reset();
    },
    onError: (error) => {
      toastError(t("error", { message: error.message }));
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
    toastSuccess(t("copySuccess"));
  };

  if (isLoading) {
    return <div className="text-muted-foreground">{t("loading")}</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t("title")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("count", { count: batches?.length || 0 })}
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button StartIcon={Plus}>{t("createButton")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("dialog.title")}</DialogTitle>
              <DialogDescription>{t("dialog.description")}</DialogDescription>
            </DialogHeader>
            <FormProvider {...form}>
              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <FormField label={t("form.quantity")} htmlFor="quantity" required>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  max={1000}
                  {...register("quantity", { valueAsNumber: true, required: true })}
                />
              </FormField>
              <FormField label={t("form.usesPerCode")} htmlFor="usesPerCode" required>
                <Input
                  id="usesPerCode"
                  type="number"
                  min={1}
                  {...register("usesPerCode", { valueAsNumber: true, required: true })}
                />
              </FormField>
              <Button type="submit" loading={createBatchMutation.isPending}>
                {t("form.submit")}
              </Button>
            </form>
            </FormProvider>
          </DialogContent>
        </Dialog>
      </div>

      {batches && batches.length > 0 ? (
        <div className="flex flex-col gap-4">
          {batches.map((batch) => (
            <Card key={batch.id}>
              <CardHeader>
                <CardTitle className="text-base">{t("batchTitle", { id: batch.id.slice(0, 8) })}</CardTitle>
                <CardDescription>{t("batchSummary", { total: batch.totalCodes, used: batch.usedCodes })}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("table.code")}</TableHead>
                      <TableHead>{t("table.status")}</TableHead>
                      <TableHead>{t("table.uses")}</TableHead>
                      <TableHead className="w-[100px]">{t("table.actions")}</TableHead>
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
                            {t(`codeStatus.${code.status}`)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {t("uses", { used: code.usedCount, total: code.usesPerCode })}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="minimal"
                            StartIcon={Copy}
                            onClick={() => copyCode(code.code)}
                          >
                            {t("actions.copy")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {batch.codes.length > 5 && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t("more", { count: batch.codes.length - 5 })}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <p className="text-muted-foreground">{t("empty")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
