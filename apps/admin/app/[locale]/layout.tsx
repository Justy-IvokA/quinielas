import "../../app/globals.css";

import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { type ReactNode } from "react";

import { applyBrandTheme } from "@qp/branding";
import { resolveTenantAndBrandFromHost } from "@qp/api/lib/host-tenant";
import { ThemeProvider, ToastProvider } from "@qp/ui";

import { BrandThemeInjector } from "../components/brand-theme-injector";

import { adminEnv } from "@admin/env";
import { locales, type Locale } from "@admin/i18n/config";
import { TrpcProvider } from "@admin/trpc/provider";
import { SpeculationRules } from "../speculation-rules";
import { AdminHeader } from "../components/admin-header";

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

type LocaleParams = { locale: string };
type MaybeAsyncLocaleParams = LocaleParams | Promise<LocaleParams>;

export async function generateMetadata({
  params,
}: {
  params: MaybeAsyncLocaleParams;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  // Resolve brand from host for metadata
  const { headers } = await import("next/headers");
  const headersList = await headers();
  const host = headersList.get("host") || "localhost";
  const { brand } = await resolveTenantAndBrandFromHost(host);
  
  const brandName = brand?.name || adminEnv.NEXT_PUBLIC_APP_NAME;

  return {
    title: {
      default: t("title.default", { appName: adminEnv.NEXT_PUBLIC_APP_NAME, brandName }),
      template: t("title.template", { appName: adminEnv.NEXT_PUBLIC_APP_NAME }),
    },
    description: t("description", { brand: brandName }),
    keywords: t("keywords"),
    robots: {
      index: false,
      follow: false,
    },
    icons: {
      icon: "/favicon.ico",
      apple: "/apple-touch-icon.png",
    },
    openGraph: {
      type: "website",
      locale: locale === "es-MX" ? "es_MX" : "en_US",
      url: adminEnv.NEXT_PUBLIC_ADMIN_URL || "https://admin.quinielas.app",
      siteName: adminEnv.NEXT_PUBLIC_APP_NAME,
      title: t("title.default", { appName: adminEnv.NEXT_PUBLIC_APP_NAME, brandName }),
      description: t("description", { brand: brandName }),
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
      title: t("title.default", { appName: adminEnv.NEXT_PUBLIC_APP_NAME, brandName }),
      description: t("description", { brand: brandName }),
      images: ["/og-image.png"],
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
  children: ReactNode;
  params: MaybeAsyncLocaleParams;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Resolve brand from host for logo and theme
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

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning className={manrope.variable}>
      <head>
        <style id="brand-theme">{brandThemeStyle}</style>
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased font-sans" suppressHydrationWarning>
        <SpeculationRules
          prerenderPathsOnHover={[
            "/pools",
            "/pools/new",
            "/brands",
            "/access",
            "/fixtures",
            "/analytics",
          ]}
        />
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <ToastProvider>
              <TrpcProvider>
                {/* Inject brand theme dynamically on client */}
                {brand?.theme && <BrandThemeInjector brandTheme={brand.theme} />}
                
                <AdminHeader 
                  brandName={brand?.name || adminEnv.NEXT_PUBLIC_APP_NAME}
                  logoUrl={brand?.theme && typeof brand.theme === 'object' && 'logo' in brand.theme ? (brand.theme as any).logo : null}
                />
                <main className="min-h-screen bg-background/95 py-10">
                  <div className="mx-auto w-full max-w-5xl px-6 md:px-10">{children}</div>
                </main>
              </TrpcProvider>
            </ToastProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
