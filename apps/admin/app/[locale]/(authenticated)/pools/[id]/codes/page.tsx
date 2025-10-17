"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Key, Plus, Download, Eye } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Progress,
  Skeleton,
  toastSuccess,
  toastError
} from "@qp/ui";
import { trpc } from "@admin/trpc";
import { CreateCodeBatchModal } from "./_components/CreateCodeBatchModal";
import { CodeBatchDetailsModal } from "./_components/CodeBatchDetailsModal";
import { downloadCsv, generateCodesCsv } from "@admin/lib/csv-utils";

export default function PoolCodesPage() {
  const params = useParams();
  const poolId = params.id as string;
  const t = useTranslations("codes");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  // Fetch pool and access policy
  const { data: pool } = trpc.pools.getById.useQuery({ id: poolId });
  const { data: accessPolicy } = trpc.access.getByPoolId.useQuery(
    { poolId },
    { enabled: !!poolId }
  );

  // Fetch batches and stats
  const { data: batches, isLoading, refetch } = trpc.access.getCodeBatches.useQuery(
    { accessPolicyId: accessPolicy?.id || "" },
    { enabled: !!accessPolicy?.id }
  );

  const { data: stats } = trpc.access.codeStats.useQuery(
    { poolId, tenantId: pool?.tenantId || "" },
    { enabled: !!pool?.tenantId }
  );

  const handleBatchCreated = (batchId: string) => {
    refetch();
    setShowCreateModal(false);
  };

  const handleDownloadCsv = async (batchId: string, batchName: string) => {
    if (!pool?.tenantId) return;

    try {
      const data = await trpc.access.downloadCodes.useQuery({
        batchId,
        tenantId: pool.tenantId
      });

      if (data) {
        const csv = generateCodesCsv(data.codes);
        const filename = `codes-${batchName}-${new Date().toISOString().split('T')[0]}.csv`;
        downloadCsv(filename, csv);
        toastSuccess(t("messages.downloadSuccess"));
      }
    } catch (error: any) {
      toastError(error.message || "Failed to download CSV");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "warning" | "success" | "error"> = {
      UNUSED: "default",
      PARTIALLY_USED: "warning",
      USED: "success",
      EXPIRED: "error",
      PAUSED: "warning"
    };
    return <Badge variant={variants[status] || "default"}>{t(`batch.status.${status}`)}</Badge>;
  };

  if (!pool || !accessPolicy) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (accessPolicy.accessType !== "CODE") {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              {t("wrongAccessType", { type: accessPolicy.accessType })}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Key className="h-8 w-8" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("subtitle")} - {pool.name}
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("createBatch")}
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("stats.totalCodes")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCodes}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("stats.unused")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">
                {stats.unused}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("stats.used")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.used}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("stats.redemptions")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRedemptions}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("stats.redemptionRate")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.redemptionRate}%</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Batches List */}
      <Card>
        <CardHeader>
          <CardTitle>Lotes de Códigos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
              <p className="mt-2 text-muted-foreground">{t("loading")}</p>
            </div>
          ) : !batches || batches.length === 0 ? (
            <div className="text-center py-12">
              <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">{t("noBatches")}</p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t("createFirst")}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {batches.map((batch) => (
                <div
                  key={batch.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">
                          {batch.name || t("batch.unnamed")}
                        </h3>
                        {getStatusBadge(batch.status)}
                      </div>
                      {batch.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {batch.description}
                        </p>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">{t("batch.totalCodes")}</p>
                          <p className="font-semibold">{batch.totalCodes}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t("batch.usedCodes")}</p>
                          <p className="font-semibold">{batch.usedCodes}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t("batch.usesPerCode")}</p>
                          <p className="font-semibold">{batch.maxUsesPerCode}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t("batch.created")}</p>
                          <p className="font-semibold">
                            {new Date(batch.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {batch.prefix && (
                        <p className="text-sm mt-2">
                          <span className="font-medium">{t("batch.prefix")}:</span>{" "}
                          <span className="font-mono">{batch.prefix}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedBatchId(batch.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        {t("actions.viewCodes")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadCsv(batch.id, batch.name || batch.id)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {t("actions.downloadCsv")}
                      </Button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span>{t("batch.usage")}</span>
                      <span>
                        {Math.round((batch.usedCodes / batch.totalCodes) * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={(batch.usedCodes / batch.totalCodes) * 100}
                      className="h-2"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {accessPolicy && pool && (
        <>
          <CreateCodeBatchModal
            open={showCreateModal}
            onOpenChange={setShowCreateModal}
            accessPolicyId={accessPolicy.id}
            tenantId={pool.tenantId}
            onSuccess={handleBatchCreated}
          />

          {selectedBatchId && (
            <CodeBatchDetailsModal
              open={!!selectedBatchId}
              onOpenChange={(open) => !open && setSelectedBatchId(null)}
              batchId={selectedBatchId}
              tenantId={pool.tenantId}
            />
          )}
        </>
      )}
    </div>
  );
}
