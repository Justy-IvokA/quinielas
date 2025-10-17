"use client";

import { useTranslations } from "next-intl";

export function LegalNotice() {
  const t = useTranslations("auth.signin");

  return (
    <p className="text-center text-xs text-muted-foreground">
      {t.rich("legal", {
        terms: (chunks) => (
          <a
            href="/terms"
            className="underline underline-offset-4 hover:text-primary"
          >
            {chunks}
          </a>
        ),
        privacy: (chunks) => (
          <a
            href="/privacy"
            className="underline underline-offset-4 hover:text-primary"
          >
            {chunks}
          </a>
        ),
      })}
    </p>
  );
}
