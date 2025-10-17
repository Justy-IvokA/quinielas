"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Search, Trophy, Target, TrendingUp, Award } from "lucide-react";
import { 
  GlassCard, 
  Input, 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell,
  Badge
} from "@qp/ui";
import { trpc } from "@web/trpc";

import { ParticipantsTable } from "./participants-table";
import { StatCard } from "./stat-card";

interface ParticipantsViewProps {
  poolId: string;
  poolSlug: string;
  poolName: string;
  seasonName: string;
  competitionName: string;
  isFinalized: boolean;
}

export function ParticipantsView({
  poolId,
  poolSlug,
  poolName,
  seasonName,
  competitionName,
  isFinalized
}: ParticipantsViewProps) {
  const t = useTranslations("participants");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"points" | "exactCount" | "signCount" | "predictionsCount" | "name">("points");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.participants.metrics.useQuery({
    poolId,
    search: search || undefined,
    sortBy,
    sortOrder,
    page,
    pageSize: 20
  });

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <GlassCard variant="compact">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{poolName}</h1>
              <p className="text-muted-foreground">
                {competitionName} {seasonName}
              </p>
            </div>
            {isFinalized && (
              <Badge variant="default" className="w-fit">
                <Trophy className="w-4 h-4 mr-2" />
                {t("status.finalized")}
              </Badge>
            )}
          </div>
        </GlassCard>

        {/* Summary Stats */}
        {data?.summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              icon={<Trophy className="w-6 h-6" />}
              label={t("stats.totalParticipants")}
              value={data.summary.totalParticipants}
            />
            <StatCard
              icon={<Target className="w-6 h-6" />}
              label={t("stats.averagePoints")}
              value={data.summary.averagePoints}
            />
            <StatCard
              icon={<Award className="w-6 h-6" />}
              label={t("stats.averageExacts")}
              value={data.summary.averageExacts}
            />
            <StatCard
              icon={<TrendingUp className="w-6 h-6" />}
              label={t("stats.totalPredictions")}
              value={data.summary.totalPredictions}
            />
          </div>
        )}

        {/* Search */}
        <GlassCard variant="compact">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0"
            />
          </div>
        </GlassCard>

        {/* Participants Table */}
        <GlassCard variant="default">
          {isLoading ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">{t("loading")}</p>
            </div>
          ) : data?.participants && data.participants.length > 0 ? (
            <ParticipantsTable
              participants={data.participants}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
              page={page}
              totalPages={data.totalPages}
              onPageChange={setPage}
            />
          ) : (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">{t("noParticipants")}</p>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
