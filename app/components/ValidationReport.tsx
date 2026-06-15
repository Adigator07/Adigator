"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Copy, XCircle } from "lucide-react";
import type { CampaignReadinessReport, ValidationFlag, ValidationSeverity } from "@/app/types/validation";
import ReadinessScore from "./ReadinessScore";

const SEVERITY_ORDER: ValidationSeverity[] = ["error", "warning", "pass"];

const SEVERITY_ICON = {
  error: XCircle,
  warning: AlertCircle,
  pass: CheckCircle2,
};

const SEVERITY_STYLE = {
  error: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  pass: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

function FlagRow({ flag }: { flag: ValidationFlag }) {
  const Icon = SEVERITY_ICON[flag.severity];
  return (
    <div className={`rounded-lg border px-3 py-2.5 ${SEVERITY_STYLE[flag.severity]}`}>
      <div className="flex items-start gap-2">
        <Icon size={16} className="shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">
              {flag.module.replace("_", " ")}
            </span>
            <span className="text-[10px] rounded bg-white/60 px-1.5 py-0.5 font-semibold uppercase">
              {flag.platform}
            </span>
          </div>
          <p className="text-sm font-medium leading-snug">{flag.message}</p>
          {flag.detail ? (
            <p className="text-xs mt-1 opacity-80">{flag.detail}</p>
          ) : null}
          {flag.recommendation ? (
            <p className="text-xs mt-1 font-semibold opacity-90">→ {flag.recommendation}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function ValidationReport({
  report,
  onCopy,
}: {
  report: CampaignReadinessReport;
  onCopy?: () => void;
}) {
  const [filter, setFilter] = useState<ValidationSeverity | "all">("all");
  const [collapsedPasses, setCollapsedPasses] = useState(true);

  const grouped = useMemo(() => {
    const flags = report.flags.filter((f) => filter === "all" || f.severity === filter);
    if (collapsedPasses && filter === "all") {
      return flags.filter((f) => f.severity !== "pass");
    }
    return flags;
  }, [report.flags, filter, collapsedPasses]);

  const counts = useMemo(() => ({
    error: report.flags.filter((f) => f.severity === "error").length,
    warning: report.flags.filter((f) => f.severity === "warning").length,
    pass: report.flags.filter((f) => f.severity === "pass").length,
  }), [report.flags]);

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
      onCopy?.();
    } catch {
      // ignore
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50 px-6 py-5 flex flex-col md:flex-row md:items-center gap-6">
        <ReadinessScore score={report.overall_score} level={report.readiness_level} />
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-900">Campaign Readiness Report</h3>
          <p className="text-sm text-slate-600 mt-1">{report.summary}</p>
          <div className="flex flex-wrap gap-3 mt-3 text-xs font-semibold">
            <span className="text-red-600">❌ {counts.error} errors</span>
            <span className="text-amber-600">⚠ {counts.warning} warnings</span>
            <span className="text-emerald-600">✅ {counts.pass} passed</span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleCopyJson}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
        >
          <Copy size={14} /> Copy JSON
        </button>
      </div>

      {report.top_recommendations.length > 0 ? (
        <div className="px-6 py-4 border-b border-slate-100 bg-amber-50/50">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-800 mb-2">Top Recommendations</p>
          <ul className="space-y-1">
            {report.top_recommendations.map((rec, i) => (
              <li key={i} className="text-sm text-amber-900">• {rec}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap items-center gap-2">
        {(["all", "error", "warning", "pass"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition ${
              filter === key
                ? "bg-sky-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {key === "all" ? "All" : key}
          </button>
        ))}
        {filter === "all" ? (
          <button
            type="button"
            onClick={() => setCollapsedPasses((v) => !v)}
            className="ml-auto text-xs text-slate-500 hover:text-slate-700 underline"
          >
            {collapsedPasses ? "Show passes" : "Hide passes"}
          </button>
        ) : null}
      </div>

      <div className="px-6 py-4 space-y-2 max-h-[480px] overflow-y-auto">
        {grouped.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">No flags match this filter.</p>
        ) : (
          grouped.map((flag) => <FlagRow key={flag.id} flag={flag} />)
        )}
      </div>

      <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {Object.entries(report.modules).map(([key, mod]) => (
          <div key={key} className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-center">
            <p className="text-[9px] uppercase tracking-wide text-slate-500 truncate">{mod.label}</p>
            <p className={`text-xs font-bold mt-0.5 capitalize ${
              mod.status === "error"
                ? "text-red-600"
                : mod.status === "warning"
                  ? "text-amber-600"
                  : mod.status === "skipped"
                    ? "text-slate-400"
                    : "text-emerald-600"
            }`}>
              {mod.status.replace("_", " ")}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
