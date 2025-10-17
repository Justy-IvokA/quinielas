"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Lock, Play, CheckCircle, Trophy } from "lucide-react";
import { Badge } from "@qp/ui";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { PredictionForm } from "./PredictionForm";

interface MatchCardProps {
  match: {
    id: string;
    kickoffTime: Date;
    locked: boolean;
    status: string;
    homeScore: number | null;
    awayScore: number | null;
    homeTeam: {
      id: string;
      name: string;
      shortName: string | null;
      logoUrl: string | null;
    };
    awayTeam: {
      id: string;
      name: string;
      shortName: string | null;
      logoUrl: string | null;
    };
  };
  prediction?: {
    id: string;
    homeScore: number;
    awayScore: number;
    awardedPoints: number;
    isExact: boolean;
  };
  poolId: string;
  userId: string;
  locale: string;
}

export function MatchCard({ match, prediction, poolId, userId, locale }: MatchCardProps) {
  const t = useTranslations("fixtures");
  const now = new Date();
  const isLocked = match.locked || match.kickoffTime <= now;
  const isFinished = match.status === "FINISHED";
  const isLive = match.status === "LIVE";

  // Status badge
  let statusBadge = null;
  if (isFinished) {
    statusBadge = (
      <Badge variant="default" className="bg-green-600">
        <CheckCircle className="w-3 h-3 mr-1" />
        {t("status.finished")}
      </Badge>
    );
  } else if (isLive) {
    statusBadge = (
      <Badge variant="destructive" className="animate-pulse">
        <Play className="w-3 h-3 mr-1" />
        {t("status.live")}
      </Badge>
    );
  } else if (isLocked) {
    statusBadge = (
      <Badge variant="secondary">
        <Lock className="w-3 h-3 mr-1" />
        {t("status.locked")}
      </Badge>
    );
  } else {
    statusBadge = (
      <Badge variant="outline" className="border-primary/40 text-primary">
        {t("status.scheduled")}
      </Badge>
    );
  }

  return (
    <div className="backdrop-blur-md bg-white/10 dark:bg-slate-900/20 border border-white/20 dark:border-white/10 shadow-xl rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/20 to-primary/10 p-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="text-white/80 text-sm">
            {format(match.kickoffTime, "d MMM, HH:mm", { locale: es })}
          </div>
          {statusBadge}
        </div>
      </div>

      {/* Teams */}
      <div className="p-4">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center mb-4">
          {/* Home Team */}
          <div className="flex flex-col items-center text-center">
            {match.homeTeam.logoUrl && (
              <img
                src={match.homeTeam.logoUrl}
                alt={match.homeTeam.name}
                className="w-12 h-12 object-contain mb-2"
              />
            )}
            <p className="text-white font-medium text-sm">
              {match.homeTeam.shortName || match.homeTeam.name}
            </p>
          </div>

          {/* Score or VS */}
          <div className="flex flex-col items-center">
            {isFinished && match.homeScore !== null && match.awayScore !== null ? (
              <div className="text-3xl font-bold text-white">
                {match.homeScore} - {match.awayScore}
              </div>
            ) : (
              <div className="text-white/50 text-lg font-medium">VS</div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center text-center">
            {match.awayTeam.logoUrl && (
              <img
                src={match.awayTeam.logoUrl}
                alt={match.awayTeam.name}
                className="w-12 h-12 object-contain mb-2"
              />
            )}
            <p className="text-white font-medium text-sm">
              {match.awayTeam.shortName || match.awayTeam.name}
            </p>
          </div>
        </div>

        {/* Prediction Section */}
        {!isLocked && !prediction && (
          <PredictionForm
            matchId={match.id}
            poolId={poolId}
            homeTeamName={match.homeTeam.shortName || match.homeTeam.name}
            awayTeamName={match.awayTeam.shortName || match.awayTeam.name}
          />
        )}

        {!isLocked && prediction && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/70">{t("yourPrediction")}</span>
              <span className="text-white font-bold">
                {prediction.homeScore} - {prediction.awayScore}
              </span>
            </div>
            <PredictionForm
              matchId={match.id}
              poolId={poolId}
              homeTeamName={match.homeTeam.shortName || match.homeTeam.name}
              awayTeamName={match.awayTeam.shortName || match.awayTeam.name}
              initialHomeScore={prediction.homeScore}
              initialAwayScore={prediction.awayScore}
            />
          </div>
        )}

        {isLocked && prediction && (
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70 text-sm">{t("yourPrediction")}</span>
              <span className="text-white font-bold">
                {prediction.homeScore} - {prediction.awayScore}
              </span>
            </div>
            {isFinished && prediction.awardedPoints > 0 && (
              <div className="flex items-center gap-2 text-primary">
                <Trophy className="w-4 h-4" />
                <span className="font-bold">
                  +{prediction.awardedPoints} {t("points")}
                </span>
                {prediction.isExact && (
                  <Badge variant="default" className="bg-primary text-xs">
                    {t("exactScore")}
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}

        {isLocked && !prediction && (
          <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-center">
            <p className="text-white/50 text-sm">{t("noPrediction")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
