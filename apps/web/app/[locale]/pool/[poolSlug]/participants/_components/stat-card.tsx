"use client";

import { GlassCard } from "@qp/ui";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}

export function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <GlassCard variant="compact">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </GlassCard>
  );
}
