"use client";

import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@qp/ui";
import { StandingsTable } from "./StandingsTable";

interface StatsWidgetProps {
  seasonId: string;
  competitionName: string;
  locale: string;
  leagueId?: string; // External league ID from API-Sports
  season?: string; // Year of the season
}

/**
 * StatsWidget - Displays league statistics using API-Sports REST API
 * 
 * This component fetches and displays standings data directly from the API-Sports REST API,
 * providing a more reliable and customizable solution than web components.
 * 
 * Features:
 * - League standings table with team rankings
 * - Home/Away/All statistics toggle
 * - Team form indicators (W/D/L)
 * - Goal difference and points
 * - Responsive design
 * 
 * @see https://api-sports.io/documentation/football/v3
 */
export function StatsWidget({ seasonId, competitionName, locale, leagueId, season }: StatsWidgetProps) {
  const t = useTranslations("fixtures.stats");
  const apiKey = process.env.NEXT_PUBLIC_SPORTS_API_KEY;

  // If no league ID or season provided, show info message
  if (!leagueId || !season) {
    return (
      <Alert className="bg-blue-500/10 border-blue-500/20">
        <AlertCircle className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-blue-200">
          {locale === "es-MX"
            ? "Para mostrar estadísticas, esta quiniela debe estar vinculada a una liga de API-Sports."
            : "To display statistics, this pool must be linked to an API-Sports league."}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Message */}
      <Alert className="bg-blue-500/10 border-blue-500/20">
        <AlertCircle className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-blue-200">
          {locale === "es-MX" 
            ? "Estadísticas en tiempo real proporcionadas por API-Sports."
            : "Real-time statistics powered by API-Sports."}
        </AlertDescription>
      </Alert>

      {/* Standings Table */}
      <div className="bg-black/65 rounded-lg border border-white/10 p-6">
        <StandingsTable
          leagueId={leagueId}
          season={season}
          locale={locale}
        />
      </div>

      {/* Help Text */}
      <div className="text-center text-white/50 text-sm">
        <p>
          {locale === "es-MX" ? "Desarrollado por" : "Powered by"}{" "}
          <a 
            href="https://www.api-sports.io" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-primary hover:underline"
          >
            API-Sports
          </a>
        </p>
      </div>
    </div>
  );
}
