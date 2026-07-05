"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";

import {
  buildReplacementComparisonKeyPoints,
  type ReplacementComparisonReport,
} from "@/app/lib/creativeReplacementComparison";

type CreativeReplacementComparisonPanelProps = {
  report: ReplacementComparisonReport;
  /** Dark neon styling for Step 3 Overview tab */
  variant?: "overview" | "studio";
  exportMode?: boolean;
};

export default function CreativeReplacementComparisonPanel({
  report,
  variant = "overview",
  exportMode = false,
}: CreativeReplacementComparisonPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const isExpanded = exportMode || expanded;
  const keyPoints = useMemo(() => buildReplacementComparisonKeyPoints(report), [report]);
  const isOverview = variant === "overview";

  const shell = isOverview
    ? "neon-card rounded-2xl border border-amber-400/25 bg-amber-500/5 p-5"
    : "space-y-4 rounded-3xl border border-studio-accent/25 bg-studio-accent/5 p-5 md:p-6";

  const statShell = isOverview
    ? "rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5"
    : "rounded-2xl border border-studio-border bg-black/20 p-4";

  const textPrimary = isOverview ? "text-[#f4f4f8]" : "text-studio-text";
  const textMuted = isOverview ? "text-[#c8c8d4]" : "text-studio-muted";
  const textDim = isOverview ? "text-[#9a9aad]" : "text-studio-tertiary";

  return (
    <section className={shell}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <RefreshCw size={16} className={isOverview ? "mt-0.5 text-amber-300" : "mt-0.5 text-studio-accent"} />
          <div>
            <p className={`text-[10px] font-semibold uppercase tracking-wider ${textDim}`}>
              Creative Swap
            </p>
            <h3 className={`text-sm font-semibold ${textPrimary}`}>Creative Replacement Comparison</h3>
            <p className={`mt-1 text-sm font-semibold ${keyPoints.criticalCount ? "text-rose-200" : "text-emerald-200"}`}>
              {keyPoints.headline}
            </p>
          </div>
        </div>
        {!exportMode ? (
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

      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        <div className={statShell}>
          <p className={`text-xl font-black tabular-nums ${textPrimary}`}>{report.summary.totalChanges}</p>
          <p className={`mt-0.5 text-[10px] uppercase tracking-wider ${textDim}`}>Changes</p>
        </div>
        <div className={statShell}>
          <p className="text-xl font-black tabular-nums text-emerald-300">{report.summary.resolvedIssueCount}</p>
          <p className={`mt-0.5 text-[10px] uppercase tracking-wider ${textDim}`}>Resolved</p>
        </div>
        <div className={statShell}>
          <p className="text-xl font-black tabular-nums text-rose-300">{report.summary.newIssueCount}</p>
          <p className={`mt-0.5 text-[10px] uppercase tracking-wider ${textDim}`}>New issues</p>
        </div>
        <div className={statShell}>
          <p className={`text-xs font-semibold leading-snug ${textPrimary}`}>{keyPoints.pairedCount}</p>
          <p className={`mt-0.5 text-[10px] uppercase tracking-wider ${textDim}`}>Pairs compared</p>
        </div>
      </div>

      <ul className={`mt-4 space-y-2 text-sm leading-relaxed ${textMuted}`}>
        {keyPoints.bullets.map((bullet) => (
          <li key={bullet} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/80" />
            {bullet}
          </li>
        ))}
      </ul>

      {keyPoints.categoryHighlights.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {keyPoints.categoryHighlights.map((item) => (
            <span
              key={item.label}
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
                isOverview
                  ? "border-white/15 bg-white/[0.04] text-[#d4d4de]"
                  : "border-studio-border bg-black/20 text-studio-muted"
              }`}
            >
              {item.label}: {item.count}
            </span>
          ))}
          {keyPoints.criticalCount ? (
            <span className="rounded-full border border-rose-400/35 bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-rose-200">
              {keyPoints.criticalCount} critical
            </span>
          ) : null}
        </div>
      ) : null}

      {keyPoints.attentionPairs.length ? (
        <div className={`mt-4 rounded-xl border p-3 ${isOverview ? "border-white/10 bg-white/[0.03]" : "border-studio-border bg-black/20"}`}>
          <p className={`text-[10px] font-semibold uppercase tracking-wider ${textDim}`}>
            Pairs needing attention
          </p>
          <ul className={`mt-2 space-y-1.5 text-xs ${textMuted}`}>
            {keyPoints.attentionPairs.map((pair) => (
              <li key={pair.label} className="flex items-start gap-2">
                <AlertTriangle size={12} className="mt-0.5 shrink-0 text-amber-400" />
                <span>
                  {pair.label}
                  {" · "}
                  {pair.changes} change{pair.changes === 1 ? "" : "s"}
                  {pair.newIssues ? ` · ${pair.newIssues} new issue${pair.newIssues === 1 ? "" : "s"}` : ""}
                </span>
              </li>
            ))}
          </ul>
          {report.pairs.length > keyPoints.attentionPairs.length ? (
            <p className={`mt-2 text-[10px] ${textDim}`}>
              +{report.pairs.length - keyPoints.attentionPairs.length} additional pair
              {report.pairs.length - keyPoints.attentionPairs.length === 1 ? "" : "s"} with minor or no changes
            </p>
          ) : null}
        </div>
      ) : null}

      {isExpanded ? (
        <div className={`mt-4 space-y-2 border-t pt-4 ${isOverview ? "border-white/10" : "border-studio-border"}`}>
          {(report.unpairedBaselines.length > 0 || report.unpairedReplacements.length > 0) ? (
            <div className="grid gap-2 md:grid-cols-2">
              {report.unpairedBaselines.length > 0 ? (
                <p className={`text-xs ${textMuted}`}>
                  <span className={`font-semibold ${textPrimary}`}>Removed baselines: </span>
                  {exportMode ? report.unpairedBaselines.join(", ") : (
                    <>
                      {report.unpairedBaselines.slice(0, 6).join(", ")}
                      {report.unpairedBaselines.length > 6 ? ` +${report.unpairedBaselines.length - 6} more` : ""}
                    </>
                  )}
                </p>
              ) : null}
              {report.unpairedReplacements.length > 0 ? (
                <p className={`text-xs ${textMuted}`}>
                  <span className={`font-semibold ${textPrimary}`}>New replacements: </span>
                  {exportMode ? report.unpairedReplacements.join(", ") : (
                    <>
                      {report.unpairedReplacements.slice(0, 6).join(", ")}
                      {report.unpairedReplacements.length > 6 ? ` +${report.unpairedReplacements.length - 6} more` : ""}
                    </>
                  )}
                </p>
              ) : null}
            </div>
          ) : null}
          {(exportMode ? report.pairs : report.pairs.slice(0, 8)).map((pair) => (
            <div
              key={pair.id}
              className={`rounded-lg border px-3 py-2 text-xs ${isOverview ? "border-white/10 bg-black/20" : "border-studio-border bg-black/20"}`}
            >
              <p className={`font-semibold ${textPrimary}`}>{pair.baselineName} → {pair.replacementName}</p>
              <p className={`mt-0.5 ${textDim}`}>{pair.readinessImpact}</p>
            </div>
          ))}
          {!exportMode && report.pairs.length > 8 ? (
            <p className={`text-[10px] ${textDim}`}>Showing 8 of {report.pairs.length} pairs.</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
