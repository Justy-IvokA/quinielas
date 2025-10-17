"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Loader2, AlertCircle, Trophy, Calendar, TrendingUp } from "lucide-react";
import type { Tenant, Brand } from "@qp/db";
import { Button, Alert, AlertDescription } from "@qp/ui";
import { trpc } from "@web/trpc";
import { BackButton } from "../../../../components/back-button";
import { UserPoolsToolbar } from "../../../pools/_components/UserPoolsToolbar";

import { PoolDashboardCard } from "./PoolDashboardCard";

interface DashboardViewProps {
  locale: string;
  tenant: Tenant;
  brand: Brand | null;
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
}

export function DashboardView({ locale, tenant, brand, user }: DashboardViewProps) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");

  // Filter, search, and sort state
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "FINALIZED" | "PENDING">("ACTIVE");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<"RECENT" | "NEXT_KICKOFF" | "FINALIZED_RECENT">("NEXT_KICKOFF");
  const [page, setPage] = useState(1);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filter or sort changes
  useEffect(() => {
    setPage(1);
  }, [filter, sort]);

  // Fetch user's pools
  const { data, isLoading, error, refetch } = trpc.userPools.list.useQuery({
    filter,
    search: debouncedSearch,
    page,
    pageSize: 50,
    sort
  });

  const handleRetry = () => {
    void refetch();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{t("title")}</h1>
          <p className="text-white/70">{t("subtitle")}</p>
        </div>

        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-white/70">{tCommon("loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{t("title")}</h1>
          <p className="text-white/70">{t("subtitle")}</p>
        </div>

        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t("errors.loadFailed")}
            <Button variant="outline" size="sm" onClick={handleRetry} className="ml-4">
              {t("errors.retry")}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const pools = data?.items || [];
  const activePools = pools.filter((p) => p.myRegistration !== null);

  // Empty state - no pools at all
  const hasNoPools = activePools.length === 0 && !debouncedSearch && filter === "ACTIVE";

  // No results with filters
  const hasNoResults = activePools.length === 0 && (debouncedSearch || filter !== "ACTIVE");

  if (hasNoPools) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 [text-shadow:_2px_2px_4px_rgb(0_0_0_/_80%)]">
          <h1 className="text-primary/80 text-4xl font-bold mb-2">{t("title")}</h1>
          <p className="text-primary/70">{t("subtitle")}</p>
        </div>

        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="backdrop-blur-md bg-white/10 dark:bg-slate-900/20 border border-white/20 dark:border-white/10 shadow-xl rounded-2xl p-12 max-w-md">
            <Trophy className="w-16 h-16 text-white/50 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">{t("empty.title")}</h2>
            <p className="text-white/70 mb-6">{t("empty.description")}</p>
            <Button
              onClick={() => window.location.href = `/${locale}/pools`}
              className="bg-primary hover:bg-primary/90"
            >
              {t("empty.browseButton")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header aqui */}
      <header className="mb-8 [text-shadow:_2px_2px_4px_rgb(0_0_0_/_40%)]">
        <div className="flex items-center gap-1">
          <BackButton />
          <div className="flex flex-col gap-0">
            <h1 className="text-primary text-4xl font-bold">{t("title")}</h1>
            <p className="text-secondary -mt-1">{t("subtitle")}</p>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <UserPoolsToolbar
        filter={filter}
        onFilterChange={setFilter}
        sort={sort}
        onSortChange={setSort}
        search={search}
        onSearchChange={setSearch}
      />

      {/* No results with filters */}
      {hasNoResults && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="backdrop-blur-md bg-white/10 dark:bg-slate-900/20 border border-white/20 dark:border-white/10 shadow-xl rounded-2xl p-12 max-w-md">
            <Trophy className="w-16 h-16 text-white/50 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">{t("empty.noResults")}</h2>
            <p className="text-white/70 mb-6">{t("empty.tryDifferentFilters")}</p>
            <Button
              variant="outline"
              onClick={() => {
                setFilter("ACTIVE");
                setSearch("");
                setPage(1);
              }}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              {t("empty.clearFilters")}
            </Button>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      {!hasNoResults && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="backdrop-blur-md bg-white/10 dark:bg-slate-900/20 border border-white/20 dark:border-white/10 shadow-xl rounded-xl p-6">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-primary" />
            <div>
              <p className="text-white/70 text-sm">{t("stats.activePools")}</p>
              <p className="text-2xl font-bold text-white">{activePools.length}</p>
            </div>
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/10 dark:bg-slate-900/20 border border-white/20 dark:border-white/10 shadow-xl rounded-xl p-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-primary" />
            <div>
              <p className="text-white/70 text-sm">{t("stats.upcomingMatches")}</p>
              <p className="text-2xl font-bold text-white">
                {activePools.filter((p) => p.nextKickoff).length}
              </p>
            </div>
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/10 dark:bg-slate-900/20 border border-white/20 dark:border-white/10 shadow-xl rounded-xl p-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-primary" />
            <div>
              <p className="text-white/70 text-sm">{t("stats.totalParticipants")}</p>
              <p className="text-2xl font-bold text-white">
                {activePools.reduce((sum, p) => sum + p.participantCount, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Active Pools */}
      {!hasNoResults && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">{t("sections.myPools")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activePools.map((pool) => (
              <PoolDashboardCard key={pool.poolId} pool={pool} locale={locale} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
