"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Key, Search, Download, Pause, Play } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Skeleton,
  toastSuccess,
  toastError
} from "@qp/ui";
import { trpc } from "@admin/trpc";
import { downloadCsv, generateCodesCsv } from "@admin/lib/csv-utils";

interface CodeBatchDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string;
  tenantId: string;
}

export function CodeBatchDetailsModal({
  open,
  onOpenChange,
  batchId,
  tenantId
}: CodeBatchDetailsModalProps) {
  const t = useTranslations("codes.modal");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: batchData, isLoading } = trpc.access.downloadCodes.useQuery(
    { batchId, tenantId },
    { enabled: open && !!batchId }
  );

  const filteredCodes = useMemo(() => {
    if (!batchData?.codes) return [];
    
    return batchData.codes.filter((code) =>
      code.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [batchData?.codes, searchQuery]);

  const handleDownloadCsv = () => {
    if (!batchData) return;
    
    const csv = generateCodesCsv(batchData.codes);
    const filename = `codes-${batchData.batchName}-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCsv(filename, csv);
    toastSuccess(t("downloadSuccess"));
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "warning" | "success" | "error"> = {
      UNUSED: "default",
      PARTIALLY_USED: "warning",
      USED: "success",
      EXPIRED: "error",
      PAUSED: "warning"
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {t("detailsTitle")}
          </DialogTitle>
          <DialogDescription>
            {batchData
              ? t("detailsDescription", { name: batchData.batchName })
              : "Cargando detalles del lote..."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Actions */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={handleDownloadCsv}
              disabled={!batchData}
            >
              <Download className="h-4 w-4 mr-2" />
              {t("exportCsv")}
            </Button>
          </div>

          {/* Codes Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <Skeleton className="h-8 w-full mb-2" />
                  <Skeleton className="h-8 w-full mb-2" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : filteredCodes.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  {searchQuery
                    ? "No se encontraron códigos que coincidan"
                    : "No hay códigos en este lote"}
                </div>
              ) : (
                <Table>
                  <TableHeader className="sticky top-0 bg-background">
                    <TableRow>
                      <TableHead>{t("codeColumn")}</TableHead>
                      <TableHead>{t("statusColumn")}</TableHead>
                      <TableHead className="text-center">{t("usedCountColumn")}</TableHead>
                      <TableHead className="text-center">{t("maxUsesColumn")}</TableHead>
                      <TableHead>{t("expiresColumn")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCodes.map((code) => (
                      <TableRow key={code.code}>
                        <TableCell className="font-mono font-medium">
                          {code.code}
                        </TableCell>
                        <TableCell>{getStatusBadge(code.status)}</TableCell>
                        <TableCell className="text-center">
                          {code.usedCount}
                        </TableCell>
                        <TableCell className="text-center">
                          {code.usesPerCode}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {code.expiresAt
                            ? new Date(code.expiresAt).toLocaleDateString()
                            : t("never")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          {/* Summary */}
          {batchData && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                Mostrando {filteredCodes.length} de {batchData.codes.length} códigos
              </span>
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                >
                  Limpiar búsqueda
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
