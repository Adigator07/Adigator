"use client";

import { Wand2 } from "lucide-react";

export default function ValidationIssueRow({
  issue,
  creativeId,
  onApplyFix,
  isFixing = false,
  variant = "warning",
}) {
  const actions = issue.fixActions?.length
    ? issue.fixActions
    : issue.fixAction
      ? [issue.fixAction]
      : [];

  const borderClass =
    variant === "critical"
      ? "border-red-500/30 bg-red-500/10"
      : "border-amber-500/25 bg-amber-500/10";

  const titleClass =
    variant === "critical"
      ? "text-red-200"
      : "text-amber-100";

  const bodyClass =
    variant === "critical"
      ? "text-red-100"
      : "text-amber-100/90";

  return (
    <div className={`rounded-md border p-2 ${borderClass}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-wide ${titleClass}`}>
        {issue.severity} • {issue.type}
      </p>
      <p className={`text-[10px] mt-0.5 leading-snug ${bodyClass}`}>{issue.message}</p>
      {issue.recommendation ? (
        <p className={`text-[10px] mt-0.5 leading-snug opacity-80 ${bodyClass}`}>
          Fix: {issue.recommendation}
        </p>
      ) : null}
      {actions.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={isFixing}
              onClick={() => onApplyFix?.(creativeId, action)}
              className="inline-flex items-center gap-1 rounded-md border border-sky-400/40 bg-sky-500/20 px-2 py-1 text-[10px] font-semibold text-sky-100 hover:bg-sky-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              title={action.description || action.label}
            >
              <Wand2 size={11} />
              {isFixing ? "Applying…" : action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
