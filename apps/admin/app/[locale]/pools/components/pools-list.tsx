"use client";

import { useTranslations } from "next-intl";
import { Calendar, Edit, Eye, Trash2, Users } from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Skeleton,
  toastError,
  toastSuccess
} from "@qp/ui";

import { trpc } from "@admin/trpc";
import { Link } from "@admin/navigation";

export function PoolsList() {
  const t = useTranslations("pools");
  const utils = trpc.useUtils();
  const tenantId = "demo-tenant-id"; // Replace with actual tenant context

  const { data: pools, isLoading } = trpc.pools.listByTenant.useQuery({
    tenantId,
    includeInactive: true
  });

  const deleteMutation = trpc.pools.delete.useMutation({
    onSuccess: () => {
      toastSuccess(t("actions.deleteSuccess"));
      utils.pools.listByTenant.invalidate({ tenantId });
    },
    onError: (error) => {
      toastError(t("actions.deleteError", { message: error.message }));
    }
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(t("actions.deleteConfirm", { name }))) {
      deleteMutation.mutate({ id });
    }
  };
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!pools || pools.length === 0) {
    return (
      <EmptyState
        title={t("empty.title")}
        description={t("empty.description")}
        action={{
          label: t("empty.cta"),
          onClick: () => (window.location.href = "/pools/new")
        }}
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {pools.map((pool) => (
        <Card key={pool.id} className="group relative">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="line-clamp-1">{pool.name}</CardTitle>
                <CardDescription className="mt-1 flex items-center gap-2">
                  <span>{pool.brand?.name ?? t("status.noBrand")}</span>
                  <span>·</span>
                  <span>{pool.season.name}</span>
                </CardDescription>
              </div>
              <Badge variant={pool.isActive ? "default" : "gray"}>
                {pool.isActive ? t("status.active") : t("status.inactive")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {pool.description && (
              <p className="line-clamp-2 text-sm text-muted-foreground">{pool.description}</p>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{t("stats.registrations", { count: pool._count.registrations })}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{t("stats.prizes", { count: pool._count.prizes })}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              <Button asChild size="sm" variant="secondary">
                <Link href={`/pools/${pool.id}`}>
                  <Eye className="h-4 w-4" />
                  {t("actions.view")}
                </Link>
              </Button>
              <Button asChild size="sm" variant="minimal">
                <Link href={`/pools/${pool.id}/edit`}>
                  <Edit className="h-4 w-4" />
                  {t("actions.edit")}
                </Link>
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDelete(pool.id, pool.name)}
                loading={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
                {t("actions.delete")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
