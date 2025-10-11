"use client";

import { useEffect, useState } from "react";
import { trpc } from "@web/trpc";

interface CookieBannerProps {
  tenantId: string;
  poolId?: string;
}

export function CookieBanner({ tenantId, poolId }: CookieBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if cookie banner is enabled
  const { data: settings } = trpc.settings.effective.useQuery({
    tenantId,
    poolId,
  });

  useEffect(() => {
    // Check localStorage for dismissal
    const dismissed = localStorage.getItem("cookie-banner-dismissed");
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Show banner if enabled
    if (settings?.["privacy.cookieBanner"]) {
      setIsVisible(true);
    }
  }, [settings]);

  const handleDismiss = () => {
    localStorage.setItem("cookie-banner-dismissed", "true");
    setIsDismissed(true);
    setIsVisible(false);
  };

  if (!isVisible || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 shadow-lg z-50">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm">
            Utilizamos cookies para mejorar tu experiencia. Al continuar navegando,
            aceptas nuestra{" "}
            <a
              href={`/policies/privacy?tenantId=${tenantId}${poolId ? `&poolId=${poolId}` : ""}`}
              className="underline hover:text-gray-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              Política de Privacidad
            </a>
            .
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="bg-white text-gray-900 px-6 py-2 rounded hover:bg-gray-100 font-medium whitespace-nowrap"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}
