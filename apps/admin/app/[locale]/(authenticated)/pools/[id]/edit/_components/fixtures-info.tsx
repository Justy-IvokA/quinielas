"use client";

import { useTranslations } from "next-intl";
import { ExternalLink, Calendar } from "lucide-react";
import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton
} from "@qp/ui";
import { trpc } from "@admin/trpc";

interface FixturesInfoProps {
  poolId: string;
}

export function FixturesInfo({ poolId }: FixturesInfoProps) {
  const t = useTranslations("pools.edit.fixtures");

  const { data: pool, isLoading } = trpc.pools.getById.useQuery({ id: poolId });
  const { data: matches } = trpc.fixtures.listBySeason.useQuery(
    { seasonId: pool?.seasonId || "" },
    { enabled: !!pool?.seasonId }
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

  const nextMatch = matches?.find(
    (m) => m.status === "SCHEDULED" && new Date(m.kickoffTime) > new Date()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium text-muted-foreground mb-1">{t("season")}</p>
            <p className="text-lg font-semibold">
              {pool?.season.name} ({pool?.season.year})
            </p>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {t("totalMatches")}
            </p>
            <p className="text-lg font-semibold">{matches?.length || 0}</p>
          </div>

          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium text-muted-foreground mb-1">{t("nextKickoff")}</p>
            {nextMatch ? (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">
                  {new Date(nextMatch.kickoffTime).toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </div>
        </div>

        {nextMatch && (
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Próximo partido</p>
              <Badge variant="outline">Jornada {nextMatch.round}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="font-medium">{nextMatch.homeTeam.name}</p>
                <span className="text-muted-foreground">vs</span>
                <p className="font-medium">{nextMatch.awayTeam.name}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(nextMatch.kickoffTime).toLocaleString("es-MX", {
                  dateStyle: "medium",
                  timeStyle: "short"
                })}
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button asChild variant="secondary" className="flex-1">
            <Link href="/sync" className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              {t("viewFixtures")}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
