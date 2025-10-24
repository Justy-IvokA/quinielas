"use client";

import { ReactNode } from "react";
import Image from "next/image";
import { BackButton } from "../../../components/back-button";

interface LegalLayoutProps {
  title: string;
  children: ReactNode;
  brandLogo?: any;
  brandName?: string;
  heroAssets?: any;
}

export function LegalLayout({
  title,
  children,
  brandLogo,
  brandName,
  heroAssets,
}: LegalLayoutProps) {
  const logoUrl =
    brandLogo && typeof brandLogo === "object" ? brandLogo.url : null;

  return (
    <div className="relative isolate overflow-hidden min-h-screen bg-gradient-to-br from-background via-background to-background/95">
      {/* Animated background gradients */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary))/10%,_transparent_50%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[600px] bg-[radial-gradient(ellipse_at_bottom,_hsl(var(--accent))/8%,_transparent_50%)]" />
      </div>

      {/* Header with logo and back button */}
      <header className="sticky top-0 z-40 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-6 py-0 md:px-10 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <div className="relative w-14 h-14 md:w-48 md:h-24">
                <Image
                  src={logoUrl}
                  alt={brandName || "Brand logo"}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            ) : (
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-xs md:text-sm font-bold text-primary-foreground">
                  {brandName?.charAt(0) || "Q"}
                </span>
              </div>
            )}
          </div>

          {/* Back button */}
          <BackButton className="text-primary"/>
        </div>
      </header>

      {/* Hero background media (video or image) - Global background */}
      {heroAssets && heroAssets.kind && (
        <div className="pointer-events-none fixed inset-0 -z-10">
          {heroAssets.kind === "video" ? (
            // Video background
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              poster={heroAssets.fallbackImageUrl || undefined}
            >
              <source src={heroAssets.url} type="video/mp4" />
            </video>
          ) : (
            // Image background
            <img
              src={heroAssets.url}
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

      {/* Main content */}
      <main className="relative z-10 flex items-center justify-center px-4 py-12 md:py-16 custom-scrollbar">
        <div className="w-full max-w-2xl">
          {/* Dialog container */}
          <div className="">
            {/* Content area */}
            <div className="px-6 py-8 md:px-10 md:py-2">
              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
                {title}
              </h1>

              {/* Body content */}
              <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
                {children}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer spacer */}
      <div className="h-8" />
      {/* Custom animations and scrollbar styles */}
      <style jsx global>{`
        /* Custom elegant scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--primary) / 0.3);
          border-radius: 3px;
          transition: background 0.2s ease;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: hsl(var(--primary) / 0.5);
        }

        /* Firefox scrollbar */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: hsl(var(--primary) / 0.3) transparent;
        }
      `}</style>
    </div>
  );
}
