"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { TrendingUp, Users, Trophy, Activity } from "lucide-react";

interface StatItemProps {
  icon: React.ElementType;
  value: number;
  label: string;
  suffix?: string;
  gradient: string;
}

function StatItem({ icon: Icon, value, label, suffix = "", gradient }: StatItemProps) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div
      className={`group relative flex flex-col items-center gap-3 p-6 rounded-2xl backdrop-blur-2xl bg-white/60 dark:bg-white/5 border border-white/10 shadow-lg transition-all duration-500 hover:scale-105 hover:shadow-xl ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {/* Icon with gradient */}
      <div className={`p-4 rounded-xl bg-gradient-to-br ${gradient} shadow-lg group-hover:shadow-xl transition-shadow`}>
        <Icon className="w-8 h-8 text-white" />
      </div>

      {/* Animated counter */}
      <div className="flex flex-col items-center gap-1">
        <div className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600">
          {count.toLocaleString()}
          {suffix}
        </div>
        <div className="text-sm text-muted-foreground font-medium">{label}</div>
      </div>

      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/5 group-hover:to-pink-500/5 transition-all duration-500" />
    </div>
  );
}

export function StatsSection() {
  const t = useTranslations("stats");

  const stats = [
    {
      icon: Users,
      value: 10000,
      suffix: "+",
      label: t("activeUsers"),
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: Trophy,
      value: 250,
      suffix: "+",
      label: t("poolsCreated"),
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Activity,
      value: 50000,
      suffix: "+",
      label: t("predictions"),
      gradient: "from-emerald-500 to-teal-500"
    },
    {
      icon: TrendingUp,
      value: 99,
      suffix: "%",
      label: t("uptime"),
      gradient: "from-orange-500 to-red-500"
    }
  ];

  return (
    <section className="relative">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-blue-500/5 rounded-3xl blur-3xl" />
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, index) => (
          <StatItem
            key={stat.label}
            icon={stat.icon}
            value={stat.value}
            suffix={stat.suffix}
            label={stat.label}
            gradient={stat.gradient}
          />
        ))}
      </div>
    </section>
  );
}
