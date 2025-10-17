"use client";

import { useTranslations } from "next-intl";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton
} from "@qp/ui";
import { trpc } from "@admin/trpc";

interface SettingsFormProps {
  poolId: string;
}

export function SettingsForm({ poolId }: SettingsFormProps) {
  const t = useTranslations("pools.edit.settings");

  const { data: pool } = trpc.pools.getById.useQuery({ id: poolId });
  const { data: settings, isLoading } = trpc.settings.list.useQuery(
    {
      scope: "POOL",
      poolId,
      tenantId: pool?.tenantId
    },
    { enabled: !!pool?.tenantId }
  );

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
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {settings && settings.length > 0 ? (
          <div className="space-y-4">
            {settings.map((setting) => (
              <div
                key={setting.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{setting.key}</p>
                  <p className="text-sm text-muted-foreground">
                    {JSON.stringify(setting.value)}
                  </p>
                </div>
                <Badge variant="outline">{t("overridden")}</Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-muted-foreground">
              No hay configuraciones personalizadas para esta quiniela.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Se están usando las configuraciones heredadas del tenant.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
