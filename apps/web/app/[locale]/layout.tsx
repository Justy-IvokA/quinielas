import "../../app/globals.css";

import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { type ReactNode } from "react";

import { getDemoBranding } from "@qp/branding";
import { ThemeProvider, ToastProvider } from "@qp/ui";

import { webEnv } from "@web/env";
import { locales, type Locale } from "@web/i18n/config";
import { TrpcProvider } from "@web/trpc/provider";
import { SiteHeader } from "../components/site-header";
import { SpeculationRules } from "../speculation-rules";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  preload: true,
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const branding = getDemoBranding();

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    {
      media: "(prefers-color-scheme: light)",
      color: "#ffffff",
    },
    {
      media: "(prefers-color-scheme: dark)",
      color: "#0a0a0a",
    },
  ],
};

/**
 * Generate metadata for each locale
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: {
      default: t("title.default", {
        appName: webEnv.NEXT_PUBLIC_APP_NAME,
        brandName: branding.brand.name,
      }),
      template: t("title.template", { appName: webEnv.NEXT_PUBLIC_APP_NAME }),
    },
    description: t("description"),
    keywords: t("keywords"),
    authors: [{ name: "Quinielas WL" }],
    creator: "Quinielas WL",
    publisher: "Quinielas WL",
    robots: {
      index: true,
      follow: true,
    },
    icons: {
      icon: "/favicon.ico",
      apple: "/apple-touch-icon.png",
    },
    manifest: "/site.webmanifest",
    openGraph: {
      type: "website",
      locale: locale === "es-MX" ? "es_MX" : "en_US",
      url: webEnv.NEXT_PUBLIC_WEBAPP_URL || "https://quinielas.app",
      siteName: webEnv.NEXT_PUBLIC_APP_NAME,
      title: t("title.default", {
        appName: webEnv.NEXT_PUBLIC_APP_NAME,
        brandName: branding.brand.name,
      }),
      description: t("description"),
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: branding.brand.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title.default", {
        appName: webEnv.NEXT_PUBLIC_APP_NAME,
        brandName: branding.brand.name,
      }),
      description: t("description"),
      images: ["/og-image.png"],
    },
  };
}

/**
 * Generate static params for all supported locales
 */
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Load messages for the current locale
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning className={manrope.variable}>
      <body
        className="min-h-screen bg-background text-foreground antialiased font-sans"
        suppressHydrationWarning
      >
        <SpeculationRules
          prerenderPathsOnHover={[
            "/register",
            "/pools",
            "/leaderboard",
            "/fixtures",
            "/rules",
          ]}
        />
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <ToastProvider>
              <TrpcProvider>
                <SiteHeader />
                <main className="min-h-screen flex flex-col">{children}</main>
              </TrpcProvider>
            </ToastProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
