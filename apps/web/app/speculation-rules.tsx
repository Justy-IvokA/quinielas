"use client";

import { useEffect } from "react";

interface SpeculationRulesProps {
  /**
   * Paths to prerender when user hovers over links
   * Improves perceived performance by prefetching pages
   */
  prerenderPathsOnHover?: string[];
}

/**
 * SpeculationRules component for Next.js 15+
 * Implements the Speculation Rules API for prefetching and prerendering
 * @see https://developer.chrome.com/docs/web-platform/prerender-pages
 */
export function SpeculationRules({ prerenderPathsOnHover = [] }: SpeculationRulesProps) {
  useEffect(() => {
    // Check if browser supports Speculation Rules API
    if (!HTMLScriptElement.supports || !HTMLScriptElement.supports("speculationrules")) {
      return;
    }

    // Remove any existing speculation rules
    const existingScript = document.querySelector('script[type="speculationrules"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Only add rules if we have paths to prerender
    if (prerenderPathsOnHover.length === 0) {
      return;
    }

    // Create speculation rules
    const speculationRules = {
      prerender: [
        {
          source: "list",
          urls: prerenderPathsOnHover,
          // Eagerness: moderate means prerender on hover
          eagerness: "moderate"
        }
      ],
      prefetch: [
        {
          source: "list",
          urls: prerenderPathsOnHover,
          // Prefetch immediately for faster subsequent navigation
          eagerness: "immediate"
        }
      ]
    };

    // Inject speculation rules into document
    const script = document.createElement("script");
    script.type = "speculationrules";
    script.textContent = JSON.stringify(speculationRules);
    document.head.appendChild(script);

    // Cleanup on unmount
    return () => {
      const scriptToRemove = document.querySelector('script[type="speculationrules"]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [prerenderPathsOnHover]);

  return null;
}
