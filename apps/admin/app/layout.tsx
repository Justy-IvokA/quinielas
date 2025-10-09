import "./globals.css";

import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { type ReactNode } from "react";

import { getDemoBranding, applyBrandTheme } from "@qp/branding";
import { ThemeProvider, ToastProvider } from "@qp/ui";

import { adminEnv } from "../src/env";
import { TrpcProvider } from "../src/trpc/provider";
import { SpeculationRules } from "./speculation-rules";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  preload: true,
  display: "swap",
  weight: ["400", "500", "600", "700", "800"]
});

const branding = getDemoBranding();
const brandThemeStyle = applyBrandTheme(branding.theme);

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
    default: `${adminEnv.NEXT_PUBLIC_APP_NAME} · Admin`,
    template: `%s | ${adminEnv.NEXT_PUBLIC_APP_NAME} Admin`
  },
  description: `${branding.brand.name} · Panel administrativo`,
  robots: {
    index: false,
    follow: false
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png"
  }
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es" suppressHydrationWarning className={manrope.variable}>
      <head>
        <div dangerouslySetInnerHTML={{ __html: brandThemeStyle }} />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        <SpeculationRules
          prerenderPathsOnHover={[
            "/pools",
            "/pools/new",
            "/brands",
            "/access",
            "/fixtures",
            "/analytics"
          ]}
        />
        <ThemeProvider>
          <ToastProvider>
            <TrpcProvider>
              <main className="min-h-screen bg-background/95 py-10">
                <div className="mx-auto w-full max-w-5xl px-6 md:px-10">{children}</div>
              </main>
            </TrpcProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
