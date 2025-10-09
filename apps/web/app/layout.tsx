import "./globals.css";

import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { type ReactNode } from "react";

import { getDemoBranding } from "@qp/branding";
import { ThemeProvider, ToastProvider } from "@qp/ui";

import { webEnv } from "../src/env";
import { TrpcProvider } from "../src/trpc/provider";
import { SpeculationRules } from "./speculation-rules";
import { SiteHeader } from "./components/site-header";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  preload: true,
  display: "swap",
  weight: ["400", "500", "600", "700", "800"]
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
      color: "#ffffff"
    },
    {
      media: "(prefers-color-scheme: dark)",
      color: "#0a0a0a"
    }
  ]
};

export const metadata: Metadata = {
  title: {
    default: `${webEnv.NEXT_PUBLIC_APP_NAME} · ${branding.brand.name}`,
    template: `%s | ${webEnv.NEXT_PUBLIC_APP_NAME}`
  },
  description: branding.brand.tagline,
  keywords: ["quiniela", "predicciones", "deportes", "mundial", "futbol"],
  authors: [{ name: "Quinielas WL" }],
  creator: "Quinielas WL",
  publisher: "Quinielas WL",
  robots: {
    index: true,
    follow: true
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png"
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: webEnv.NEXT_PUBLIC_WEBAPP_URL || "https://quinielas.app",
    siteName: webEnv.NEXT_PUBLIC_APP_NAME,
    title: `${webEnv.NEXT_PUBLIC_APP_NAME} · ${branding.brand.name}`,
    description: branding.brand.tagline,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: branding.brand.name
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: `${webEnv.NEXT_PUBLIC_APP_NAME} · ${branding.brand.name}`,
    description: branding.brand.tagline,
    images: ["/og-image.png"]
  }
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es" suppressHydrationWarning className={manrope.variable}>
      <body className="min-h-screen bg-background text-foreground antialiased font-sans" suppressHydrationWarning>
        <SpeculationRules
          prerenderPathsOnHover={[
            "/register",
            "/pools",
            "/leaderboard",
            "/fixtures",
            "/rules"
          ]}
        />
        <ThemeProvider>
          <ToastProvider>
            <TrpcProvider>
              <SiteHeader />
              <main className="min-h-screen flex flex-col">
                {children}
              </main>
            </TrpcProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
