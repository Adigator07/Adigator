"use client";

import type { UrlUtmValidationReport } from "@/app/lib/urlUtmValidation";

const SEVERITY_STYLES = {
  pass: "border-studio-success/30 bg-studio-success/10 text-studio-success",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-100",
  error: "border-red-500/30 bg-red-500/10 text-red-100",
};

type UrlUtmValidationReportPanelProps = {
  report: UrlUtmValidationReport;
};

export default function UrlUtmValidationReportPanel({ report }: UrlUtmValidationReportPanelProps) {
  const issueFlags = report.flags.filter((flag) => flag.severity !== "pass");

  return (
    <div className="space-y-6 rounded-3xl border border-studio-accent/25 bg-studio-accent/5 p-5 md:p-6">
      <div>
        <h3 className="studio-heading text-xl font-bold text-studio-text">URL & UTM Validation Report</h3>
        <p className="mt-2 text-sm text-studio-muted">{report.summary}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-studio-border bg-black/20 p-4">
          <p className="text-2xl font-bold text-studio-text">{report.urlChanges.length}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-studio-tertiary">URL updates</p>
        </div>
        <div className="rounded-2xl border border-studio-border bg-black/20 p-4">
          <p className="text-2xl font-bold text-studio-text">{report.utmChanges.length}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-studio-tertiary">UTM updates</p>
        </div>
        <div className="rounded-2xl border border-studio-border bg-black/20 p-4">
          <p className="text-sm font-semibold leading-snug text-studio-text">{report.launchReadinessImpact}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-studio-tertiary">Launch readiness</p>
        </div>
      </div>

      {report.urlChanges.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-studio-text">Updated URLs</p>
          {report.urlChanges.map((change) => (
            <div key={change.field} className="rounded-xl border border-studio-border bg-black/20 p-3 text-sm">
              <p className="font-semibold text-studio-text">{change.label}</p>
              <p className="mt-2 text-xs text-studio-muted"><span className="font-semibold">Before:</span> {change.before}</p>
              <p className="mt-1 text-xs text-studio-muted"><span className="font-semibold">After:</span> {change.after}</p>
            </div>
          ))}
        </div>
      ) : null}

      {report.utmChanges.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-studio-text">Updated UTM Parameters</p>
          {report.utmChanges.map((change) => (
            <div key={change.field} className="rounded-xl border border-studio-border bg-black/20 p-3 text-sm">
              <p className="font-semibold text-studio-text">{change.label}</p>
              <p className="mt-2 text-xs text-studio-muted"><span className="font-semibold">Before:</span> {change.before}</p>
              <p className="mt-1 text-xs text-studio-muted"><span className="font-semibold">After:</span> {change.after}</p>
            </div>
          ))}
        </div>
      ) : null}

      {report.missingTracking.length > 0 ? (
        <div className="rounded-2xl border border-studio-error/30 bg-studio-error/10 p-4 text-sm text-studio-error">
          Missing required UTM parameters: {report.missingTracking.join(", ")}
        </div>
      ) : null}

      {report.alignmentIssues.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-studio-text">Alignment notes</p>
          {report.alignmentIssues.map((issue) => (
            <p key={issue} className="text-sm text-studio-muted">{issue}</p>
          ))}
        </div>
      ) : null}

      {issueFlags.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-studio-text">Validation findings</p>
          {issueFlags.map((flag) => (
            <div
              key={flag.id}
              className={`rounded-xl border p-3 text-sm ${SEVERITY_STYLES[flag.severity]}`}
            >
              <p>{flag.message}</p>
              {flag.recommendation ? (
                <p className="mt-2 text-xs opacity-90">{flag.recommendation}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
