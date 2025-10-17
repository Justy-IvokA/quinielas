"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Lock, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { GlassCard, Input, Badge } from "@qp/ui";
import { cn } from "@qp/ui";

import { useCountdown } from "../_lib/use-countdown";

interface MatchRowProps {
  match: {
    id: string;
    homeTeam: {
      name: string;
      shortName: string | null;
      logoUrl: string | null;
    };
    awayTeam: {
      name: string;
      shortName: string | null;
      logoUrl: string | null;
    };
    kickoffTime: Date;
    locked: boolean;
    status: string;
    homeScore: number | null;
    awayScore: number | null;
  };
  prediction?: {
    homeScore: number;
    awayScore: number;
  };
  onChange: (homeScore: number, awayScore: number) => void;
  isDirty: boolean;
}

export function MatchRow({ match, prediction, onChange, isDirty }: MatchRowProps) {
  const t = useTranslations("predictions");
  const [homeScore, setHomeScore] = useState(prediction?.homeScore ?? 0);
  const [awayScore, setAwayScore] = useState(prediction?.awayScore ?? 0);

  const kickoffDate = new Date(match.kickoffTime);
  const isLocked = match.locked || kickoffDate <= new Date();
  const isFinished = match.status === "FINISHED";

  const countdown = useCountdown(kickoffDate);

  // Sync with parent prediction
  useEffect(() => {
    if (prediction) {
      setHomeScore(prediction.homeScore);
      setAwayScore(prediction.awayScore);
    }
  }, [prediction]);

  const handleHomeChange = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0) {
      setHomeScore(num);
      onChange(num, awayScore);
    }
  };

  const handleAwayChange = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0) {
      setAwayScore(num);
      onChange(homeScore, num);
    }
  };

  const getStatusBadge = () => {
    if (isFinished) {
      return (
        <Badge variant="default" className="gap-1">
          <CheckCircle2 className="w-3 h-3" />
          {t("status.finished")}
        </Badge>
      );
    }
    if (isLocked) {
      return (
        <Badge variant="warning" className="gap-1">
          <Lock className="w-3 h-3" />
          {t("status.locked")}
        </Badge>
      );
    }
    if (countdown) {
      return (
        <Badge variant="info" className="gap-1">
          <Clock className="w-3 h-3" />
          {countdown}
        </Badge>
      );
    }
    return null;
  };

  return (
    <GlassCard
      variant="compact"
      className={cn(
        "transition-all",
        isDirty && "ring-2 ring-primary",
        isLocked && "opacity-60"
      )}
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Match Info */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {match.homeTeam.logoUrl && (
                <img
                  src={match.homeTeam.logoUrl}
                  alt={match.homeTeam.name}
                  className="w-8 h-8 object-contain"
                />
              )}
              <span className="font-semibold">
                {match.homeTeam.shortName || match.homeTeam.name}
              </span>
            </div>
            {isFinished && match.homeScore !== null && (
              <span className="text-lg font-bold">{match.homeScore}</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {match.awayTeam.logoUrl && (
                <img
                  src={match.awayTeam.logoUrl}
                  alt={match.awayTeam.name}
                  className="w-8 h-8 object-contain"
                />
              )}
              <span className="font-semibold">
                {match.awayTeam.shortName || match.awayTeam.name}
              </span>
            </div>
            {isFinished && match.awayScore !== null && (
              <span className="text-lg font-bold">{match.awayScore}</span>
            )}
          </div>
        </div>

        {/* Prediction Inputs */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-2">
            <Input
              type="number"
              min="0"
              value={homeScore}
              onChange={(e) => handleHomeChange(e.target.value)}
              disabled={isLocked}
              className="w-20 text-center text-lg font-semibold"
              aria-label={`${t("homeScore")} ${match.homeTeam.name}`}
            />
            <Input
              type="number"
              min="0"
              value={awayScore}
              onChange={(e) => handleAwayChange(e.target.value)}
              disabled={isLocked}
              className="w-20 text-center text-lg font-semibold"
              aria-label={`${t("awayScore")} ${match.awayTeam.name}`}
            />
          </div>

          {/* Status */}
          <div className="flex flex-col items-end gap-2 min-w-[120px]">
            {getStatusBadge()}
            <p className="text-xs text-muted-foreground">
              {kickoffDate.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
