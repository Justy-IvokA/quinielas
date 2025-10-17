"use client";

import { useTranslations } from "next-intl";
import { Calendar, Trophy, Users, Target } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "@qp/ui";
import { trpc } from "@admin/trpc";

export function DashboardAnalytics() {
  const t = useTranslations("dashboard.analytics");

  // Get pools stats
  const { data: pools, isLoading: isLoadingPools } = trpc.pools.listByTenant.useQuery({
    includeInactive: false
  });

  // Calculate stats
  const totalPools = pools?.length || 0;
  const totalRegistrations = pools?.reduce((acc, pool) => acc + pool._count.registrations, 0) || 0;
  const totalPrizes = pools?.reduce((acc, pool) => acc + pool._count.prizes, 0) || 0;

  const stats = [
    {
      title: t("activePools"),
      value: totalPools,
      icon: Target,
      description: t("activePoolsDesc")
    },
    {
      title: t("totalPlayers"),
      value: totalRegistrations,
      icon: Users,
      description: t("totalPlayersDesc")
    },
    {
      title: t("totalPrizes"),
      value: totalPrizes,
      icon: Trophy,
      description: t("totalPrizesDesc")
    }
  ];

  if (isLoadingPools) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
