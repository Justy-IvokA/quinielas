"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Sparkles, Zap, TrendingUp, Trophy, ArrowRight, LayoutDashboard, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@qp/ui";
import { useTheme } from "next-themes";
import { getOptimizedMediaUrl } from "@qp/utils/client";
import { Link } from "@web/i18n/navigation";
import { trpc } from "@web/trpc/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@qp/ui/components/dialog";

interface HomeHeroProps {
  brandName: string;
  tagline: string;
  ctaLabel: string;
  host: string;
  logo?: any;
  mainCard?: any;
  brandTheme?: any;
}

export function HomeHero({ 
  brandName, 
  tagline, 
  ctaLabel,
  host,
  logo,
  mainCard,
  brandTheme 
}: HomeHeroProps) {
  const t = useTranslations("home.hero");
  const { data, isLoading } = trpc.health.useQuery();
  const { data: session } = trpc.auth.getSession.useQuery();
  const { theme } = useTheme();
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const healthStatus = isLoading 
    ? t("healthChecking") 
    : data?.ok 
      ? t("healthOnline") 
      : t("healthIssue");

  // Determinar el estado del botón CTA según la sesión
  const isAuthenticated = !!session?.user;
  const ctaButtonLabel = isAuthenticated ? t("viewMyPools") || "Ver mis quinielas" : ctaLabel;
  const ctaButtonHref = isAuthenticated ? "/dashboard" : "/auth/signin";
  const ctaButtonIcon = isAuthenticated ? LayoutDashboard : ArrowRight;

  const cardObject = mainCard || logo;
  // Get mainCard assets from brand theme with URL optimization
  const mainCardURL = cardObject && typeof cardObject === 'object' 
    ? (cardObject as any).url 
    : null;
  const optimizedAssetUrl = getOptimizedMediaUrl(mainCardURL);

  return (
    <>
      {/* Hero Card */}
      <div className="relative w-full">
        <div className="grid md:grid-cols-[45%,55%] rounded-2xl overflow-hidden shadow-2xl h-auto md:h-[600px] [text-shadow:_2px_2px_4px_rgb(0_0_0_/_40%)]">

            {/* Health Check Badge - Absolute position top-right */}
            <div className="absolute top-2 right-2 md:top-1 md:right-1 z-50 flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full backdrop-blur-xl bg-card/90 border border-primary/20 shadow-lg">
              <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${data?.ok ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className={`text-[10px] md:text-xs font-medium uppercase tracking-wider ${data?.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {healthStatus}
              </span>
            </div>

            {/* Floating badges - Hidden on mobile */}
            <div className="hidden md:block absolute -top-10 -left-10 px-4 py-2 rounded-full bg-gradient-to-r from-secondary to-accent shadow-lg backdrop-blur-xl animate-bounce">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="hidden md:block absolute -bottom-12 -right-12 px-4 py-2 rounded-full bg-gradient-to-r from-accent to-primary shadow-lg backdrop-blur-xl animate-bounce">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            {/* LEFT SIDE - Hero Image/Video */}
            <div className="relative h-80 md:h-auto bg-gradient-to-br from-primary to-accent group overflow-hidden">
              {cardObject && optimizedAssetUrl ? (
                cardObject.kind === "video" ? (
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  >
                    <source src={optimizedAssetUrl} type="video/mp4" />
                  </video>
                ) : (
                  <Image
                    src={optimizedAssetUrl}
                    alt={brandName}
                    className="object-cover"
                    fill
                    priority
                  />
                )
              ) : (
                <div className="absolute inset-0 flex items-center justify-center p-8">
                  <Trophy className="w-32 h-32 text-primary-foreground/80" strokeWidth={1.5} />
                </div>
              )}
              
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent" />
              
              {/* Hover Overlay with Tech Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-accent/95 to-secondary/95 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center p-6">
                {/* Animated grid background */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:20px_20px] animate-[grid_20s_linear_infinite]" />
                </div>
                
                {/* Animated corner accents */}
                <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-white/40 animate-pulse" />
                <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-white/40 animate-pulse" style={{ animationDelay: '0.5s' }} />
                <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-white/40 animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-white/40 animate-pulse" style={{ animationDelay: '1.5s' }} />
                
                {/* Scanning line effect */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-white to-transparent animate-[scan_3s_ease-in-out_infinite]" />
                </div>
                
                {/* Content */}
                <div className="relative z-10 text-center text-white max-w-md px-4 animate-[fadeIn_0.5s_ease-out]">
                  <p className="text-sm md:text-2xl leading-relaxed font-medium drop-shadow-lg line-clamp-7 md:line-clamp-none">
                    {brandTheme?.text.paragraph || tagline}
                  </p>
                </div>
              </div>
              
              {/* Content overlay */}
              <div className="absolute bottom-0 left-0 right-0 px-4 pb-2 text-white">
                <h2 className="text-lg md:text-3xl font-bold mb-0 text-primary line-clamp-1">
                  {brandName}
                </h2>
                <p className="text-xs md:text-base text-white/90 line-clamp-2">
                  {t("subtitle") || "Plataforma de quinielas deportivas"}
                </p>
              </div>
            </div>

            {/* RIGHT SIDE - Brand Info */}
            <div className="p-2 md:p-4 flex flex-col justify-center items-center backdrop-blur-xl bg-white/20 dark:bg-gray-900/20 border-l border-white/20 dark:border-gray-700/50">
              {logo && (
              <div className="flex items-center justify-center mb-3 md:mb-6">
                <img 
                  src={logo} 
                  alt="Logo" 
                  className={`h-16 md:h-16 w-auto object-contain ${theme === 'dark' ? 'invert brightness-0 dark:invert dark:brightness-100' : ''}`}
                />
              </div>
              )}
              {brandTheme?.text.slogan && (
                <p className="text-xs md:text-sm font-medium text-secondary -mt-6 mb-6">
                  {brandTheme?.text.slogan}
                </p>
              )}
              
              <div className="mb-3 md:mb-6">
                {/* Brand name - impactful typography */}
                <h1 className="text-2xl text-center md:text-4xl lg:text-5xl font-black leading-[1.1] tracking-tight mb-2">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-gradient">
                    {t("title")}
                  </span>
                </h1>
                
                {/* Tagline */}
                <p className="text-sm md:text-lg lg:text-xl text-center text-foreground leading-relaxed font-medium">
                  {tagline}
                </p>
              </div>

              {/* Feature badges */}
              <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4 md:mb-6">
                <div className="flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-secondary/90 dark:bg-secondary border border-primary/20">
                  <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-white dark:text-secondary-foreground" />
                  <span className="text-xs md:text-sm font-semibold text-white dark:text-secondary-foreground">{t("multiUserBadge")}</span>
                </div>
                <div className="flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-accent/90 dark:bg-accent border border-accent/20">
                  <Zap className="w-3 h-3 md:w-4 md:h-4 text-white dark:text-accent-foreground" />
                  <span className="text-xs md:text-sm font-semibold text-white dark:text-accent-foreground">{t("realTimeBadge")}</span>
                </div>
              </div>

              {/* CTA Button - Dinámico según sesión */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-3 md:gap-4">
                <Button 
                  asChild 
                  size="lg" 
                  className="group text-sm md:text-base px-6 py-5 md:px-8 md:py-6 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                >
                  <Link href={ctaButtonHref} className="flex items-center justify-center gap-2 md:gap-3">
                    {ctaButtonLabel}
                    {ctaButtonIcon === LayoutDashboard ? (
                      <LayoutDashboard className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                    ) : (
                      <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
                    )}
                  </Link>
                </Button>
                
                <Dialog open={showHowItWorks} onOpenChange={setShowHowItWorks}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="text-sm md:text-base px-6 py-5 md:px-8 md:py-6 border-2 border-primary/30 hover:border-primary hover:bg-primary/5"
                    >
                      {t("learnMore") || "¿Cómo funciona?"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                        {t("howItWorks.title")}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-bold">1</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-foreground">{t("howItWorks.step1")}</p>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-bold">2</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-foreground">{t("howItWorks.step2")}</p>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-bold">3</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-foreground">{t("howItWorks.step3")}</p>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-primary font-bold">4</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-foreground">{t("howItWorks.step4")}</p>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      </div>
                      
                      <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                        <p className="text-center text-sm font-semibold text-foreground">
                          {t("howItWorks.footer")}
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes grid {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(20px);
          }
        }
        
        @keyframes scan {
          0% {
            top: -10%;
          }
          50% {
            top: 110%;
          }
          100% {
            top: -10%;
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        :global(.animate-gradient) {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </>
  );
}
