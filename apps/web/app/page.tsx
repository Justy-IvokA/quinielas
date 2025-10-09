import { getDemoBranding } from "@qp/branding";
import { Trophy, Users, BarChart3, Shield, Zap, Globe, Code, Terminal } from "lucide-react";

import { webEnv } from "../src/env";
import { HomeHero } from "./components/home-hero";
import { StatsSection } from "./components/stats-section";

const branding = getDemoBranding();

const featureHighlights = [
  {
    title: "Pools multi-tenant",
    description: "Lanza quinielas para tus marcas con reglas, premios y acceso personalizados.",
    icon: Trophy,
    gradient: "from-purple-500 to-pink-500"
  },
  {
    title: "Resultados en tiempo real",
    description: "Ingesta automática de fixtures y marcadores para mantener a tu comunidad informada.",
    icon: Zap,
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    title: "Leaderboard auditable",
    description: "Puntos exactos, diferenciales y auditorías completas para cada jornada.",
    icon: BarChart3,
    gradient: "from-emerald-500 to-teal-500"
  }
];

const techFeatures = [
  { icon: Shield, label: "Seguro & Auditable" },
  { icon: Users, label: "Multi-tenant" },
  { icon: Globe, label: "White-label" },
  { icon: Code, label: "API-first" }
];

export default function HomePage() {
  const appName = webEnv.NEXT_PUBLIC_APP_NAME;

  return (
    <div className="relative isolate overflow-hidden min-h-screen">
      {/* Animated background gradients */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(ellipse_at_top,_hsl(var(--gradient-from))/20%,_transparent_50%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[600px] bg-[radial-gradient(ellipse_at_bottom,_hsl(var(--gradient-via))/15%,_transparent_50%)]" />
        <div className="absolute right-0 top-1/4 h-96 w-96 bg-[radial-gradient(circle,_hsl(var(--gradient-to))/15%,_transparent_70%)] blur-3xl" />
        <div className="absolute left-0 bottom-1/4 h-96 w-96 bg-[radial-gradient(circle,_hsl(var(--gradient-from))/15%,_transparent_70%)] blur-3xl" />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-20 px-6 py-16 md:px-10 md:py-24">
        {/* Hero Section */}
        <HomeHero
          brandName={`${appName} · ${branding.brand.name}`}
          tagline={branding.brand.tagline}
          ctaLabel="Únete a la quiniela demo"
          ctaHref="/register"
        />

        {/* Stats Section */}
        <StatsSection />

        {/* Features Grid */}
        <section className="grid gap-6 md:grid-cols-3">
          {featureHighlights.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="group relative flex h-full flex-col gap-4 rounded-2xl backdrop-blur-2xl bg-white/60 dark:bg-white/5 border border-white/10 p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
              >
                {/* Icon with gradient background */}
                <div className={`inline-flex w-fit rounded-xl bg-gradient-to-br ${feature.gradient} p-3 shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                
                <div className="flex flex-col gap-2">
                  <h2 className="text-xl font-bold text-foreground transition-all">
                    {feature.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Hover effect border */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/0 via-pink-500/0 to-blue-500/0 group-hover:from-purple-500/10 group-hover:via-pink-500/10 group-hover:to-blue-500/10 transition-all duration-500" />
              </article>
            );
          })}
        </section>

        {/* Tech Stack Pills */}
        <section className="flex flex-wrap items-center justify-center gap-4">
          {techFeatures.map((tech) => {
            const Icon = tech.icon;
            return (
              <div
                key={tech.label}
                className="flex items-center gap-2 px-5 py-3 rounded-full backdrop-blur-xl bg-white/70 dark:bg-black/40 border border-primary/20 hover:border-primary/40 transition-all hover:scale-105 cursor-default"
              >
                <Icon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{tech.label}</span>
              </div>
            );
          })}
        </section>

        {/* Dev Info Card */}
        <section className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
          <div className="relative rounded-2xl backdrop-blur-2xl bg-white/60 dark:bg-white/5 border border-white/10 p-8 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Terminal className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">Listo para desarrollo</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Todo configurado para iniciar. Ejecuta los comandos y explora la experiencia demo.
                </p>
                <div className="flex flex-col gap-2">
                  <code className="inline-flex items-center gap-2 text-xs bg-muted/50 px-4 py-2 rounded-lg font-mono border border-border/50">
                    <span className="text-primary">$</span>
                    <span>pnpm dev</span>
                  </code>
                  <code className="inline-flex items-center gap-2 text-xs bg-muted/50 px-4 py-2 rounded-lg font-mono border border-border/50">
                    <span className="text-primary">→</span>
                    <span>http://localhost:3000</span>
                  </code>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer spacer */}
        <div className="h-8" />
      </div>
    </div>
  );
}
