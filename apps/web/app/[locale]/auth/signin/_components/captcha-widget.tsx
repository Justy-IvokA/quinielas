"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

export type CaptchaProvider = "hcaptcha" | "turnstile";

interface CaptchaWidgetProps {
  provider: CaptchaProvider;
  siteKey: string;
  onVerify: (token: string) => void;
  onError?: (error: Error) => void;
  onExpire?: () => void;
  theme?: "light" | "dark";
  size?: "normal" | "compact";
}

declare global {
  interface Window {
    hcaptcha?: {
      render: (container: string | HTMLElement, params: any) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      execute: (widgetId: string) => void;
    };
    turnstile?: {
      render: (container: string | HTMLElement, params: any) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onHCaptchaLoad?: () => void;
    onTurnstileLoad?: () => void;
  }
}

export function CaptchaWidget({
  provider,
  siteKey,
  onVerify,
  onError,
  onExpire,
  theme = "light",
  size = "normal"
}: CaptchaWidgetProps) {
  const t = useTranslations("auth.captcha");
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let scriptElement: HTMLScriptElement | null = null;

    const loadScript = () => {
      // Check if script already exists
      const existingScript = document.querySelector(
        `script[src*="${provider === "hcaptcha" ? "hcaptcha.com" : "challenges.cloudflare.com"}"]`
      );

      if (existingScript) {
        // Script already loaded, initialize widget
        initializeWidget();
        return;
      }

      // Create and load script
      scriptElement = document.createElement("script");
      
      if (provider === "hcaptcha") {
        scriptElement.src = "https://js.hcaptcha.com/1/api.js?render=explicit";
        scriptElement.async = true;
        scriptElement.defer = true;
        
        window.onHCaptchaLoad = () => {
          setIsLoading(false);
          initializeWidget();
        };
      } else {
        scriptElement.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        scriptElement.async = true;
        scriptElement.defer = true;
        
        window.onTurnstileLoad = () => {
          setIsLoading(false);
          initializeWidget();
        };
      }

      scriptElement.onerror = () => {
        setLoadError(t("loadError"));
        setIsLoading(false);
        onError?.(new Error(`Failed to load ${provider} script`));
      };

      document.head.appendChild(scriptElement);
    };

    const initializeWidget = () => {
      if (!containerRef.current) return;

      try {
        if (provider === "hcaptcha" && window.hcaptcha) {
          widgetIdRef.current = window.hcaptcha.render(containerRef.current, {
            sitekey: siteKey,
            theme,
            size,
            callback: onVerify,
            "error-callback": (error: any) => {
              onError?.(new Error(error));
            },
            "expired-callback": () => {
              onExpire?.();
            }
          });
        } else if (provider === "turnstile" && window.turnstile) {
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            theme,
            size,
            callback: onVerify,
            "error-callback": (error: any) => {
              onError?.(new Error(error));
            },
            "expired-callback": () => {
              onExpire?.();
            }
          });
        }
        setIsLoading(false);
      } catch (error) {
        setLoadError(t("initError"));
        setIsLoading(false);
        onError?.(error as Error);
      }
    };

    loadScript();

    // Cleanup
    return () => {
      if (widgetIdRef.current) {
        try {
          if (provider === "hcaptcha" && window.hcaptcha) {
            window.hcaptcha.remove(widgetIdRef.current);
          } else if (provider === "turnstile" && window.turnstile) {
            window.turnstile.remove(widgetIdRef.current);
          }
        } catch (error) {
          console.error("Error removing captcha widget:", error);
        }
      }
    };
  }, [provider, siteKey, theme, size, onVerify, onError, onExpire, t]);

  if (loadError) {
    return (
      <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
        {loadError}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {t("loading")}
        </div>
      )}
      <div ref={containerRef} className={isLoading ? "hidden" : ""} />
    </div>
  );
}
