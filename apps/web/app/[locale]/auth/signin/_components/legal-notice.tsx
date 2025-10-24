"use client";

import { useTranslations } from "next-intl";

export function LegalNotice() {
  const t = useTranslations("auth.registration");

  return (
    <p className="text-center text-xs text-accent">
      {t.rich("legal", {
        terms: (chunks) => (
          <a
            href="/legal/terms"
            className="underline underline-offset-4 hover:text-primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            {chunks}
          </a>
        ),
        privacy: (chunks) => (
          <a
            href="/legal/privacy"
            className="underline underline-offset-4 hover:text-primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            {chunks}
          </a>
        ),
      })}
    </p>
  );
}
