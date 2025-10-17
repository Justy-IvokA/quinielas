"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@qp/ui";
import { StatsWidgetFallback } from "./StatsWidgetFallback";

interface StatsWidgetProps {
  seasonId: string;
  competitionName: string;
  locale: string;
}

/**
 * StatsWidget - Embeds API-Sports widgets using web components
 * 
 * This component uses the official API-Sports web components to display:
 * - Live scores
 * - Match fixtures  
 * - Standings
 * 
 * Falls back to StatsWidgetFallback if widgets fail to load.
 * 
 * @see https://api-sports.io/documentation/widgets/v3
 */
export function StatsWidget({ seasonId, competitionName, locale }: StatsWidgetProps) {
  const t = useTranslations("fixtures.stats");
  const apiKey = process.env.NEXT_PUBLIC_SPORTS_API_KEY;
  const [widgetsLoaded, setWidgetsLoaded] = useState(false);
  const [widgetsFailed, setWidgetsFailed] = useState(false);
  const scriptLoadedRef = useRef(false);

  // Load API-Sports widget script
  useEffect(() => {
    if (scriptLoadedRef.current || !apiKey) return;

    const script = document.createElement("script");
    script.src = "https://widgets.api-sports.io/2.0.3/widgets.js";
    script.async = true;
    
    script.onload = () => {
      scriptLoadedRef.current = true;
      setWidgetsLoaded(true);
      console.log("✅ API-Sports widgets script loaded successfully");
    };

    script.onerror = () => {
      console.error("❌ Failed to load API-Sports widgets script");
      setWidgetsFailed(true);
    };

    document.head.appendChild(script);

    // Cleanup
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [apiKey]);

  // Get language code
  const lang = locale === "es-MX" ? "es" : "en";

  // If API key is not configured, show warning
  if (!apiKey) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="default" className="bg-yellow-500/10 border-yellow-500/20">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-200">
            {t("apiKeyRequired")}
          </AlertDescription>
        </Alert>
        
        <div className="mt-6 p-6 bg-white/5 rounded-lg border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-2">{t("setupTitle")}</h3>
          <p className="text-white/70 mb-4">{t("setupDescription")}</p>
          <ol className="list-decimal list-inside space-y-2 text-white/60 text-sm">
            <li>{t("setupStep1")}</li>
            <li>{t("setupStep2")}</li>
            <li>{t("setupStep3")}</li>
          </ol>
        </div>
      </div>
    );
  }

  // If widgets failed to load, show fallback
  if (widgetsFailed) {
    return <StatsWidgetFallback seasonId={seasonId} competitionName={competitionName} locale={locale} />;
  }

  // Show loading state while script loads
  if (!widgetsLoaded) {
    return (
      <div className="space-y-6">
        <Alert className="bg-blue-500/10 border-blue-500/20">
          <AlertCircle className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-200">
            {locale === "es-MX" 
              ? "Cargando widgets de estadísticas..."
              : "Loading statistics widgets..."}
          </AlertDescription>
        </Alert>
        <div className="grid grid-cols-1 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/5 rounded-lg border border-white/10 p-6 animate-pulse">
              <div className="h-8 bg-white/10 rounded w-1/3 mb-4"></div>
              <div className="h-64 bg-white/5 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Message */}
      <Alert className="bg-blue-500/10 border-blue-500/20">
        <AlertCircle className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-blue-200">
          {locale === "es-MX" 
            ? "Estadísticas en tiempo real proporcionadas por API-Sports. Los datos se actualizan automáticamente."
            : "Real-time statistics powered by API-Sports. Data updates automatically."}
        </AlertDescription>
      </Alert>

      {/* Configuration Widget */}
      <api-sports-widget
        data-type="config"
        data-key={apiKey}
        data-sport="football"
        data-lang={lang}
      />

      {/* Livescore Widget */}
      <div className="bg-white/5 rounded-lg border border-white/10 p-4">
        <h3 className="text-xl font-bold text-white mb-4">{t("livescoreTitle")}</h3>
        <api-sports-widget
          data-type="livescore"
          data-sport="football"
          data-theme="dark"
          data-lang={lang}
        />
      </div>

      {/* Fixtures Widget */}
      <div className="bg-white/5 rounded-lg border border-white/10 p-4">
        <h3 className="text-xl font-bold text-white mb-4">{t("fixturesTitle")}</h3>
        <api-sports-widget
          data-type="fixtures"
          data-sport="football"
          data-theme="dark"
          data-lang={lang}
        />
      </div>

      {/* Standings Widget */}
      <div className="bg-white/5 rounded-lg border border-white/10 p-4">
        <h3 className="text-xl font-bold text-white mb-4">{t("standingsTitle")}</h3>
        <api-sports-widget
          data-type="standings"
          data-sport="football"
          data-theme="dark"
          data-lang={lang}
        />
      </div>

      {/* Help Text */}
      <div className="text-center text-white/50 text-sm">
        <p>{t("poweredBy")} <a href="https://www.api-sports.io" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">API-Sports</a></p>
      </div>
    </div>
  );
}

// Declare custom element for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'api-sports-widget': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'data-type'?: string;
        'data-key'?: string;
        'data-sport'?: string;
        'data-theme'?: string;
        'data-lang'?: string;
        'data-league'?: string;
        'data-season'?: string;
      };
    }
  }
}
