"use client";

import { useTranslations } from "next-intl";
import { AlertCircle, TrendingUp, Trophy, Calendar, BarChart3 } from "lucide-react";
import { Alert, AlertDescription } from "@qp/ui";

interface StatsWidgetFallbackProps {
  seasonId: string;
  competitionName: string;
  locale: string;
}

/**
 * StatsWidgetFallback - Fallback component with curated statistics resources
 * 
 * This component provides links to external statistics resources
 * when API-Sports widgets are not available.
 * 
 * @see https://www.api-football.com
 */
export function StatsWidgetFallback({ seasonId, competitionName, locale }: StatsWidgetFallbackProps) {
  const t = useTranslations("fixtures.stats");

  // Useful statistics resources
  const resources = [
    {
      icon: TrendingUp,
      title: locale === "es-MX" ? "Estadísticas en Vivo" : "Live Statistics",
      description: locale === "es-MX" 
        ? "Consulta marcadores y estadísticas en tiempo real"
        : "Check live scores and real-time statistics",
      links: [
        { name: "FlashScore", url: "https://www.flashscore.com" },
        { name: "SofaScore", url: "https://www.sofascore.com" },
        { name: "LiveScore", url: "https://www.livescore.com" },
      ]
    },
    {
      icon: Trophy,
      title: locale === "es-MX" ? "Tablas de Posiciones" : "Standings",
      description: locale === "es-MX"
        ? "Revisa las posiciones actuales de los equipos"
        : "Check current team standings",
      links: [
        { name: "FIFA", url: "https://www.fifa.com/standings" },
        { name: "ESPN", url: "https://www.espn.com/soccer/standings" },
        { name: "Transfermarkt", url: "https://www.transfermarkt.com" },
      ]
    },
    {
      icon: Calendar,
      title: locale === "es-MX" ? "Calendario de Partidos" : "Match Schedule",
      description: locale === "es-MX"
        ? "Consulta próximos partidos y resultados"
        : "View upcoming matches and results",
      links: [
        { name: "Google Sports", url: "https://www.google.com/search?q=football+fixtures" },
        { name: "BBC Sport", url: "https://www.bbc.com/sport/football/fixtures" },
        { name: "Sky Sports", url: "https://www.skysports.com/football/fixtures" },
      ]
    },
    {
      icon: BarChart3,
      title: locale === "es-MX" ? "Análisis y Pronósticos" : "Analysis & Predictions",
      description: locale === "es-MX"
        ? "Encuentra análisis detallados y pronósticos expertos"
        : "Find detailed analysis and expert predictions",
      links: [
        { name: "WhoScored", url: "https://www.whoscored.com" },
        { name: "FiveThirtyEight", url: "https://projects.fivethirtyeight.com/soccer-predictions/" },
        { name: "Opta", url: "https://www.optasports.com" },
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Info Message */}
      <Alert className="bg-blue-500/10 border-blue-500/20">
        <AlertCircle className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-blue-200">
          {locale === "es-MX" 
            ? "Consulta estos recursos para tomar mejores decisiones en tus pronósticos. Los datos se actualizan en tiempo real."
            : "Check these resources to make better predictions. Data updates in real-time."}
        </AlertDescription>
      </Alert>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {resources.map((resource, index) => {
          const Icon = resource.icon;
          return (
            <div 
              key={index}
              className="bg-white/5 rounded-lg border border-white/10 p-6 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/20 rounded-lg">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">{resource.title}</h3>
                  <p className="text-white/70 text-sm mb-4">{resource.description}</p>
                  <div className="space-y-2">
                    {resource.links.map((link, linkIndex) => (
                      <a
                        key={linkIndex}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-primary hover:text-primary/80 text-sm font-medium hover:underline"
                      >
                        → {link.name}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Competition Info */}
      <div className="bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg border border-primary/20 p-6">
        <h3 className="text-xl font-bold text-white mb-3">
          {competitionName}
        </h3>
        <p className="text-white/70 mb-4">
          {locale === "es-MX"
            ? "Usa estos recursos para investigar estadísticas, forma de equipos, y tendencias antes de hacer tus pronósticos."
            : "Use these resources to research statistics, team form, and trends before making your predictions."}
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/80">
            {locale === "es-MX" ? "Datos en tiempo real" : "Real-time data"}
          </span>
          <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/80">
            {locale === "es-MX" ? "Análisis experto" : "Expert analysis"}
          </span>
          <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/80">
            {locale === "es-MX" ? "Estadísticas detalladas" : "Detailed statistics"}
          </span>
        </div>
      </div>

      {/* Help Text */}
      <div className="text-center text-white/50 text-sm">
        <p>
          {locale === "es-MX"
            ? "💡 Tip: Combina múltiples fuentes para obtener la mejor perspectiva"
            : "💡 Tip: Combine multiple sources for the best perspective"}
        </p>
      </div>
    </div>
  );
}
