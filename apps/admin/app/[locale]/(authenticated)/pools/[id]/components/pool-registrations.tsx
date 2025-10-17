"use client";

import { useTranslations } from "next-intl";
import { Mail, UserCheck, UserX } from "lucide-react";

import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@qp/ui";

import { trpc } from "@admin/trpc";

interface PoolRegistrationsProps {
  poolId: string;
}

export function PoolRegistrations({ poolId }: PoolRegistrationsProps) {
  const t = useTranslations("pools.registrations");

  // Get pool registrations
  const { data: registrations, isLoading } = trpc.pools.getRegistrations.useQuery(
    { poolId },
    { enabled: !!poolId }
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-4 py-6">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!registrations || registrations.length === 0) {
    return (
      <EmptyState
        title={t("empty.title")}
        description={t("empty.description")}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>
            {t("description", { count: registrations.length })}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.user")}</TableHead>
                <TableHead>{t("table.email")}</TableHead>
                <TableHead>{t("table.status")}</TableHead>
                <TableHead>{t("table.registeredAt")}</TableHead>
                <TableHead>{t("table.predictions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registrations.map((registration) => (
                <TableRow key={registration.id}>
                  <TableCell className="font-medium">
                    {registration.user.name || t("table.noName")}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      {registration.user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={registration.isActive ? "success" : "gray"}>
                      {registration.isActive ? (
                        <>
                          <UserCheck className="mr-1 h-3 w-3" />
                          {t("status.active")}
                        </>
                      ) : (
                        <>
                          <UserX className="mr-1 h-3 w-3" />
                          {t("status.inactive")}
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(registration.joinedAt).toLocaleDateString("es-MX", {
                      year: "numeric",
                      month: "short",
                      day: "numeric"
                    })}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {registration._count?.predictions || 0}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
