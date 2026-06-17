"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import type { DashboardMetrics } from "@/app/lib/admin-platform/types";

const DashboardCharts = dynamic(
  () => import("./DashboardCharts").then((m) => m.DashboardCharts),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-72 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
        ))}
      </div>
    ),
  },
);

export function DashboardChartsLazy({ metrics }: { metrics: DashboardMetrics }) {
  const stableMetrics = useMemo(() => metrics, [
    metrics.totalUsers,
    metrics.dau,
    metrics.mau,
    metrics.userGrowth.length,
    metrics.topFeatures.length,
  ]);

  return <DashboardCharts metrics={stableMetrics} />;
}
