"use client";

import { useTranslations } from "next-intl";
import { Calendar, Trophy, Users, Target } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, SportsLoader } from "@qp/ui";
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
      <div className="flex items-center justify-center py-8">
        <SportsLoader size="sm" text={t("loading")} />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="border-border/70 bg-card/60 backdrop-blur">
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
