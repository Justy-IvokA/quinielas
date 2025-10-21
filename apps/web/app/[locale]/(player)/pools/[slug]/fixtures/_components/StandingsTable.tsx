"use client";

import { useState } from "react";
import { AlertCircle, TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, Button } from "@qp/ui";
import { trpc } from "@web/trpc";
import { useParams } from "next/navigation";

interface Team {
  rank: number;
  team: {
    id: number;
    name: string;
    logo: string;
  };
  points: number;
  goalsDiff: number;
  form: string;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
      for: number;
      against: number;
    };
  };
  home: {
    played: number;
    win: number;
    draw: number;
    lose: number;
  };
  away: {
    played: number;
    win: number;
    draw: number;
    lose: number;
  };
}

interface StandingsGroup {
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    season: number;
    standings: Team[][];
  };
}

interface StandingsTableProps {
  locale: string;
  tenantSlug: string;
}

export function StandingsTable({ locale, tenantSlug }: StandingsTableProps) {
  const params = useParams();
  const poolSlug = params.slug as string;
  
  const [selectedView, setSelectedView] = useState<"all" | "home" | "away">("all");
  const [shouldForceRefresh, setShouldForceRefresh] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  // Fetch standings using tRPC (cached)
  const { data, isLoading, error, refetch } = trpc.standings.getByPoolSlug.useQuery(
    {
      poolSlug,
      tenantSlug,
      forceRefresh: shouldForceRefresh,
    },
    {
      enabled: !!poolSlug && !!tenantSlug,
      retry: false,
    }
  );

  const standings = data?.data as StandingsGroup | null | undefined;
  const lastFetchedAt = data?.lastFetchedAt;
  const isCached = data?.isCached;

  // Handle force refresh with cooldown
  const handleRefresh = async () => {
    setRefreshError(null);
    setShouldForceRefresh(true);

    try {
      await refetch();
    } catch (err: any) {
      const errorMessage = err?.message || 
        (locale === "es-MX" 
          ? "Error al actualizar estadísticas" 
          : "Error refreshing standings");
      setRefreshError(errorMessage);
      console.error("Refresh error:", err);
    } finally {
      setShouldForceRefresh(false);
    }
  };

  // Render form indicator
  const renderFormIndicator = (result: string) => {
    if (result === "W") {
      return <div className="w-5 h-5 rounded-sm bg-green-500 flex items-center justify-center text-white text-xs font-bold">V</div>;
    }
    if (result === "D") {
      return <div className="w-5 h-5 rounded-sm bg-yellow-500 flex items-center justify-center text-white text-xs font-bold">E</div>;
    }
    if (result === "L") {
      return <div className="w-5 h-5 rounded-sm bg-red-500 flex items-center justify-center text-white text-xs font-bold">D</div>;
    }
    return null;
  };

  // Render rank change indicator
  const renderRankIndicator = (rank: number) => {
    // This is simplified - in a real app you'd compare with previous standings
    if (rank <= 4) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    }
    if (rank >= 15) {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-white/10 rounded w-1/3 mb-4"></div>
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-12 bg-white/5 rounded mb-2"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="default" className="bg-red-500/10 border-red-500/20">
        <AlertCircle className="h-4 w-4 text-red-500" />
        <AlertDescription className="text-red-200">
          {error.message || (locale === "es-MX" ? "Error al cargar estadísticas" : "Error loading standings")}
        </AlertDescription>
      </Alert>
    );
  }

  if (!standings || !standings.league.standings || standings.league.standings.length === 0) {
    return (
      <Alert className="bg-blue-500/10 border-blue-500/20">
        <AlertCircle className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-blue-200">
          {locale === "es-MX"
            ? "No hay estadísticas disponibles para esta liga y temporada."
            : "No statistics available for this league and season."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Refresh Error Alert */}
      {refreshError && (
        <Alert variant="default" className="bg-red-500/10 border-red-500/20">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-200">
            {refreshError}
          </AlertDescription>
        </Alert>
      )}

      {/* League Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-3">
          {standings.league.logo && (
            <img
              src={standings.league.logo}
              alt={standings.league.name}
              className="w-12 h-12 object-contain"
            />
          )}
          <div>
            <h3 className="text-xl font-bold text-white">{standings.league.name}</h3>
            <p className="text-sm text-white/60">
              {standings.league.country} • {locale === "es-MX" ? "Temporada" : "Season"} {standings.league.season}
            </p>
            {lastFetchedAt && (
              <p className="text-xs text-white/40 mt-1">
                {locale === "es-MX" ? "Actualizado" : "Updated"}: {new Date(lastFetchedAt).toLocaleString(locale)}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={shouldForceRefresh || isLoading}
          className="gap-2"
          StartIcon={RefreshCw}
        >
          {shouldForceRefresh || isLoading
            ? (locale === "es-MX" ? "Actualizando..." : "Refreshing...") 
            : (locale === "es-MX" ? "Actualizar" : "Refresh")}
        </Button>
      </div>

      {/* View Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setSelectedView("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedView === "all"
              ? "bg-primary text-white"
              : "bg-white/5 text-white/70 hover:bg-white/10"
          }`}
        >
          {locale === "es-MX" ? "TODOS" : "ALL"}
        </button>
        <button
          onClick={() => setSelectedView("home")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedView === "home"
              ? "bg-primary text-white"
              : "bg-white/5 text-white/70 hover:bg-white/10"
          }`}
        >
          {locale === "es-MX" ? "LOCAL" : "HOME"}
        </button>
        <button
          onClick={() => setSelectedView("away")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedView === "away"
              ? "bg-primary text-white"
              : "bg-white/5 text-white/70 hover:bg-white/10"
          }`}
        >
          {locale === "es-MX" ? "VISITANTE" : "AWAY"}
        </button>
      </div>

      {/* Standings Groups */}
      {standings.league.standings.map((group, groupIndex) => (
        <div key={groupIndex} className="bg-white/5 rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="bg-white/10 px-2 py-2 grid grid-cols-12 gap-2 text-xs font-semibold text-white/70 uppercase">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-3">{locale === "es-MX" ? "Equipo" : "Team"}</div>
            <div className="col-span-1 text-center">{locale === "es-MX" ? "PJ" : "MP"}</div>
            <div className="col-span-1 text-center">{locale === "es-MX" ? "G" : "W"}</div>
            <div className="col-span-1 text-center">{locale === "es-MX" ? "E" : "D"}</div>
            <div className="col-span-1 text-center">{locale === "es-MX" ? "P" : "L"}</div>
            <div className="col-span-1 text-center">{locale === "es-MX" ? "+/-" : "GD"}</div>
            <div className="col-span-1 text-center">{locale === "es-MX" ? "PTS" : "P"}</div>
            <div className="col-span-1">{locale === "es-MX" ? "FORMA" : "FORM"}</div>
          </div>

          {/* Table Body */}
          {group.map((team, index) => {
            const stats = selectedView === "all" ? team.all : selectedView === "home" ? team.home : team.away;
            const formResults = team.form ? team.form.split("").slice(-5) : [];

            return (
              <div
                key={team.team.id}
                className={`px-2 py-2 grid grid-cols-12 gap-2 items-center border-b border-white/5 hover:bg-white/5 transition-colors ${
                  index === group.length - 1 ? "border-b-0" : ""
                }`}
              >
                {/* Rank */}
                <div className="col-span-1 flex items-center justify-center gap-1">
                  <span className="text-white font-semibold">{team.rank}</span>
                  {renderRankIndicator(team.rank)}
                </div>

                {/* Team */}
                <div className="col-span-3 flex items-center gap-2">
                  <img
                    src={team.team.logo}
                    alt={team.team.name}
                    className="w-6 h-6 object-contain"
                  />
                  <span className="text-white text-sm font-medium truncate">{team.team.name}</span>
                </div>

                {/* Matches Played */}
                <div className="col-span-1 text-center text-white/80 text-sm">{stats.played}</div>

                {/* Wins */}
                <div className="col-span-1 text-center text-white/80 text-sm">{stats.win}</div>

                {/* Draws */}
                <div className="col-span-1 text-center text-white/80 text-sm">{stats.draw}</div>

                {/* Losses */}
                <div className="col-span-1 text-center text-white/80 text-sm">{stats.lose}</div>

                {/* Goal Difference */}
                <div className={`col-span-1 text-center text-sm font-semibold ${
                  team.goalsDiff > 0 ? "text-green-400" : team.goalsDiff < 0 ? "text-red-400" : "text-white/60"
                }`}>
                  {team.goalsDiff > 0 ? "+" : ""}{team.goalsDiff}
                </div>

                {/* Points */}
                <div className="col-span-1 text-center text-white font-bold text-sm">{team.points}</div>

                {/* Form */}
                <div className="col-span-2 flex gap-0.5">
                  {formResults.map((result, i) => (
                    <div key={i}>{renderFormIndicator(result)}</div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-white/60 pt-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-green-500"></div>
          <span>{locale === "es-MX" ? "Victoria" : "Win"}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-yellow-500"></div>
          <span>{locale === "es-MX" ? "Empate" : "Draw"}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-red-500"></div>
          <span>{locale === "es-MX" ? "Derrota" : "Loss"}</span>
        </div>
      </div>
    </div>
  );
}
