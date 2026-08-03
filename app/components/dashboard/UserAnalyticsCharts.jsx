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
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="rounded-2xl border border-sky-200/80 bg-linear-to-br from-white via-sky-50/70 to-emerald-50/70 p-4 shadow-[0_16px_34px_-24px_rgba(14,116,144,0.34)]"
            >
              <div className="mb-3 inline-flex rounded-xl border border-emerald-200 bg-emerald-50/80 p-2 text-emerald-700">
                <Icon size={16} />
              </div>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{m.value}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{m.label}</p>
            </div>
          );
        })}
      </div>
      <Charts analytics={analytics} />
    </div>
  );
}
