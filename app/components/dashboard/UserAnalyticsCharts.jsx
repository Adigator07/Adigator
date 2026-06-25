"use client";

import dynamic from "next/dynamic";
import { BarChart3, Download, Eye, Layers, TrendingUp } from "lucide-react";

const Charts = dynamic(() => import("./UserAnalyticsChartsInner"), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-48 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
      ))}
    </div>
  ),
});

export default function UserAnalyticsCharts({ analytics }) {
  if (!analytics) return null;

  const metrics = [
    { label: "Analyzer Runs", value: analytics.analyzerRuns, icon: TrendingUp },
    { label: "Preview Studio Opens", value: analytics.previewStudioOpens, icon: Eye },
    { label: "Reports Downloaded", value: analytics.reportsDownloaded, icon: Download },
    { label: "Platforms Used", value: analytics.platformUsage.filter((p) => p.count > 0).length, icon: Layers },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <Icon size={16} className="text-purple-400 mb-2" />
              <p className="text-2xl font-bold text-white tabular-nums">{m.value}</p>
              <p className="text-xs text-white/40 mt-1">{m.label}</p>
            </div>
          );
        })}
      </div>
      <Charts analytics={analytics} />
    </div>
  );
}
