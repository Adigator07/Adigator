"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, RefreshCw } from "lucide-react";

import type { CampaignRenewalReport } from "@/app/lib/campaignRenewalComparison";

type CampaignRenewalComparisonPanelProps = {
  report: CampaignRenewalReport;
  variant?: "overview" | "studio";
  exportMode?: boolean;
};

function truncateList(items: string[], max = 5) {
  if (!items.length) return "None";
  const shown = items.slice(0, max).join(", ");
  return items.length > max ? `${shown} +${items.length - max} more` : shown;
}

function formatList(items: string[], exportMode: boolean) {
  if (!items.length) return "None";
  return exportMode ? items.join(", ") : truncateList(items);
}

export default function CampaignRenewalComparisonPanel({
  report,
  variant = "overview",
  exportMode = false,
}: CampaignRenewalComparisonPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const isExpanded = exportMode || expanded;
  const isOverview = variant === "overview";

  const shell = isOverview
    ? "neon-card rounded-2xl border border-cyan-400/25 bg-cyan-500/5 p-5"
    : "space-y-4 rounded-3xl border border-studio-accent/25 bg-studio-accent/5 p-5 md:p-6";

  const statShell = isOverview
    ? "rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5"
    : "rounded-2xl border border-studio-border bg-black/20 p-4";

  const textPrimary = isOverview ? "text-[#f4f4f8]" : "text-studio-text";
  const textMuted = isOverview ? "text-[#c8c8d4]" : "text-studio-muted";
  const textDim = isOverview ? "text-[#9a9aad]" : "text-studio-tertiary";

  const bullets = [
    report.analysisSummary,
    report.validationImpact,
    report.launchReadinessImpact,
    `${report.configChanges.length} configuration change${report.configChanges.length === 1 ? "" : "s"} · creatives ${report.creativeSummary.previousCount} → ${report.creativeSummary.currentCount}.`,
    `Added ${report.creativeSummary.added.length} · removed ${report.creativeSummary.removed.length} · retained ${report.creativeSummary.retained.length}.`,
  ];

  return (
    <section className={shell}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <RefreshCw size={16} className={isOverview ? "mt-0.5 text-cyan-300" : "mt-0.5 text-studio-accent"} />
          <div>
            <p className={`text-[10px] font-semibold uppercase tracking-wider ${textDim}`}>Campaign Renewal</p>
            <h3 className={`text-sm font-semibold ${textPrimary}`}>Campaign Renewal Comparison</h3>
            <p className={`mt-1 text-sm ${textMuted}`}>How the renewed campaign differs from the previous saved version.</p>
          </div>
        </div>
        {(report.configChanges.length > 0 || report.creativeSummary.added.length + report.creativeSummary.removed.length > 0) && !exportMode ? (
          <button
            type="button"
            data-export-hide
            onClick={() => setExpanded((value) => !value)}
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition ${
              isOverview
                ? "border-white/15 bg-white/[0.04] text-[#c8c8d4] hover:border-white/25"
                : "border-studio-border bg-black/20 text-studio-muted"
            }`}
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? "Hide details" : "Show details"}
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3">
        <div className={statShell}>
          <p className={`text-xl font-black tabular-nums ${textPrimary}`}>{report.configChanges.length}</p>
          <p className={`mt-0.5 text-[10px] uppercase tracking-wider ${textDim}`}>Config changes</p>
        </div>
        <div className={statShell}>
          <p className={`text-sm font-black tabular-nums ${textPrimary}`}>
            {report.creativeSummary.previousCount} → {report.creativeSummary.currentCount}
          </p>
          <p className={`mt-0.5 text-[10px] uppercase tracking-wider ${textDim}`}>Creative count</p>
        </div>
        <div className={`col-span-2 md:col-span-1 ${statShell}`}>
          <p className={`text-xs font-semibold leading-snug ${textPrimary}`}>{report.launchReadinessImpact}</p>
          <p className={`mt-0.5 text-[10px] uppercase tracking-wider ${textDim}`}>Launch readiness</p>
        </div>
      </div>

      <ul className={`mt-4 space-y-2 text-sm leading-relaxed ${textMuted}`}>
        {bullets.map((bullet) => (
          <li key={bullet} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400/80" />
            {bullet}
          </li>
        ))}
      </ul>

      {isExpanded ? (
        <div className={`mt-4 space-y-3 border-t pt-4 ${isOverview ? "border-white/10" : "border-studio-border"}`}>
          {report.configChanges.length > 0 ? (
            <div className="space-y-2">
              <p className={`text-[10px] font-semibold uppercase tracking-wider ${textDim}`}>Configuration changes</p>
              {(exportMode ? report.configChanges : report.configChanges.slice(0, 8)).map((change) => (
                <div
                  key={change.field}
                  className={`rounded-lg border px-3 py-2 text-xs ${isOverview ? "border-white/10 bg-black/20" : "border-studio-border bg-black/20"}`}
                >
                  <p className={`font-semibold ${textPrimary}`}>{change.label}</p>
                  <p className={`mt-0.5 ${textDim}`}>Before: {change.before}</p>
                  <p className={`${textDim}`}>After: {change.after}</p>
                </div>
              ))}
            </div>
          ) : null}
          <div className="grid gap-2 text-xs md:grid-cols-3">
            <p className={textMuted}><span className={`font-semibold ${textPrimary}`}>Added: </span>{formatList(report.creativeSummary.added, exportMode)}</p>
            <p className={textMuted}><span className={`font-semibold ${textPrimary}`}>Removed: </span>{formatList(report.creativeSummary.removed, exportMode)}</p>
            <p className={textMuted}><span className={`font-semibold ${textPrimary}`}>Retained: </span>{formatList(report.creativeSummary.retained, exportMode)}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
