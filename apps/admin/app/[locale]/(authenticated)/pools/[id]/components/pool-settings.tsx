"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, Lock, Settings as SettingsIcon, Unlock } from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  toastError,
  toastSuccess
} from "@qp/ui";

import { trpc } from "@admin/trpc";

interface PoolSettingsProps {
  poolId: string;
}

export function PoolSettings({ poolId }: PoolSettingsProps) {
  const t = useTranslations("pools.settings");
  const utils = trpc.useUtils();

  // Get pool data
  const { data: pool, isLoading } = trpc.pools.getById.useQuery({ id: poolId });

  // Toggle active status mutation
  const toggleActiveMutation = trpc.pools.toggleActive.useMutation({
    onSuccess: (data) => {
      toastSuccess(
        data.isActive 
          ? t("actions.activateSuccess") 
          : t("actions.deactivateSuccess")
      );
      utils.pools.getById.invalidate({ id: poolId });
      utils.pools.listByTenant.invalidate();
    },
    onError: (error) => {
      toastError(t("actions.error", { message: error.message }));
    }
  });

  const handleToggleActive = () => {
    if (!pool) return;
    
    const action = pool.isActive ? "deactivate" : "activate";
    const confirmMessage = pool.isActive 
      ? t("actions.deactivateConfirm", { name: pool.name })
      : t("actions.activateConfirm", { name: pool.name });
    
    if (confirm(confirmMessage)) {
      toggleActiveMutation.mutate({ id: poolId, isActive: !pool.isActive });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-4 py-6">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!pool) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t("status.title")}</CardTitle>
              <CardDescription>{t("status.description")}</CardDescription>
            </div>
            <Badge variant={pool.isActive ? "success" : "gray"} className="text-sm">
              {pool.isActive ? (
                <>
                  <Unlock className="mr-1 h-3 w-3" />
                  {t("status.active")}
                </>
              ) : (
                <>
                  <Lock className="mr-1 h-3 w-3" />
                  {t("status.inactive")}
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              {pool.isActive 
                ? t("status.activeDescription")
                : t("status.inactiveDescription")
              }
            </p>
            <Button
              variant={pool.isActive ? "destructive" : "default"}
              onClick={handleToggleActive}
              loading={toggleActiveMutation.isPending}
              StartIcon={pool.isActive ? Lock : Unlock}
            >
              {pool.isActive ? t("actions.deactivate") : t("actions.activate")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">{t("danger.title")}</CardTitle>
          </div>
          <CardDescription>{t("danger.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <h4 className="font-semibold text-sm mb-2">{t("danger.deleteTitle")}</h4>
              <p className="text-sm text-muted-foreground mb-4">
                {t("danger.deleteDescription")}
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-4">
                <li>{t("danger.deleteWarning1")}</li>
                <li>{t("danger.deleteWarning2")}</li>
                <li>{t("danger.deleteWarning3")}</li>
              </ul>
              <Button
                variant="destructive"
                disabled
                className="opacity-50 cursor-not-allowed"
              >
                {t("danger.deleteButton")}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                {t("danger.deleteNote")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pool Info */}
      <Card>
        <CardHeader>
          <CardTitle>{t("info.title")}</CardTitle>
          <CardDescription>{t("info.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="font-medium text-muted-foreground">{t("info.id")}</dt>
              <dd className="mt-1 font-mono text-xs">{pool.id}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">{t("info.slug")}</dt>
              <dd className="mt-1">{pool.slug}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">{t("info.createdAt")}</dt>
              <dd className="mt-1">
                {new Date(pool.createdAt).toLocaleDateString("es-MX", {
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">{t("info.updatedAt")}</dt>
              <dd className="mt-1">
                {new Date(pool.updatedAt).toLocaleDateString("es-MX", {
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
