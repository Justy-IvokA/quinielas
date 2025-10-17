import "../../app/globals.css";

import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { type ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { applyBrandTheme, resolveTheme } from "@qp/branding";
import { resolveTenantAndBrandFromHost } from "@qp/api/lib/host-tenant";
import { ThemeProvider, ToastProvider } from "@qp/ui";
import { getOptimizedMediaUrl } from "@qp/utils/client";

import { webEnv } from "@web/env";
import { locales, type Locale } from "@web/i18n/config";
import { TrpcProvider } from "@web/trpc/provider";
import { SiteHeader } from "../components/site-header";
import { BrandThemeInjector } from "../components/brand-theme-injector";
import { SpeculationRules } from "../speculation-rules";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  preload: true,
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

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

  // Resolve brand from host for metadata
  const { headers } = await import("next/headers");
  const headersList = await headers();
  const host = headersList.get("host") || "localhost";
  const { brand } = await resolveTenantAndBrandFromHost(host);
  
  const brandName = brand?.name || webEnv.NEXT_PUBLIC_APP_NAME;

  // Base URL for absolute URLs in metadata (OG images, etc.)
  const baseUrl = webEnv.NEXT_PUBLIC_WEBAPP_URL || "http://localhost:3000";

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: t("title.default", {
        appName: webEnv.NEXT_PUBLIC_APP_NAME,
        brandName,
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
        brandName,
      }),
      description: t("description"),
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: brandName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title.default", {
        appName: webEnv.NEXT_PUBLIC_APP_NAME,
        brandName,
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

  // Resolve brand from host for logo
  const { headers } = await import("next/headers");
  const headersList = await headers();
  let host = headersList.get("host") || "localhost";
  if (host.includes(":")) {
    host = host.split(":")[0];
  }
  const { brand } = await resolveTenantAndBrandFromHost(host);

  // Note: Brand theme is now injected client-side via BrandThemeInjector component
  // This ensures the theme is available when the page renders
  // The layout only provides default theme as fallback
  const brandThemeStyle = applyBrandTheme(null);

  // Get hero assets from brand theme with URL optimization
  const heroAssets = brand?.theme && typeof brand.theme === 'object' 
    ? (brand.theme as any).heroAssets 
    : null;
  
  // Convert Google Drive URLs to direct download links
  const optimizedAssetUrl = getOptimizedMediaUrl(heroAssets?.url);
  const optimizedFallbackUrl = getOptimizedMediaUrl(heroAssets?.fallbackImageUrl);
  const hasHeroMedia = optimizedAssetUrl;

  // Load messages for the current locale
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning className={manrope.variable}>
      <head>
        <style id="brand-theme">{brandThemeStyle}</style>
      </head>
      <body
        className="min-h-screen bg-background text-foreground antialiased font-sans"
        suppressHydrationWarning
      >
        <SpeculationRules
          prerenderPathsOnHover={[
            "/auth/signin",
            "/pools",
            "/leaderboard",
            "/fixtures",
            "/rules",
          ]}
        />
        <SessionProvider>
          <NextIntlClientProvider messages={messages}>
            <ThemeProvider>
              <ToastProvider>
                <TrpcProvider>
                  <NuqsAdapter>
                    {/* Inject brand theme dynamically on client */}
                    {brand?.theme && <BrandThemeInjector brandTheme={brand.theme} />}
                    
                    {/* Hero background media (video or image) - Global background */}
                    {hasHeroMedia && (
                      <div className="pointer-events-none fixed inset-0 -z-10">
                        {heroAssets.kind === "video" ? (
                          // Video background
                          <video
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover"
                            poster={optimizedFallbackUrl || undefined}
                          >
                            <source src={optimizedAssetUrl} type="video/mp4" />
                          </video>
                        ) : (
                          // Image background
                          <img
                            src={optimizedAssetUrl}
                            alt="Hero background"
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        )}
                        {/* Gradient overlay for readability */}
                        {heroAssets.overlay ?? (
                          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
                        )}
                      </div>
                    )}

                    <SiteHeader 
                      brandName={brand?.name || webEnv.NEXT_PUBLIC_APP_NAME}
                      logoUrl={brand?.theme && typeof brand.theme === 'object' && 'logo' in brand.theme ? (brand.theme as any).logo.url : null}
                    />
                    <main className="min-h-screen flex flex-col">{children}</main>
                  </NuqsAdapter>
                </TrpcProvider>
              </ToastProvider>
            </ThemeProvider>
          </NextIntlClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
