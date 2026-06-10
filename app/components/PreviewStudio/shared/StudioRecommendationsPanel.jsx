"use client";

const SEVERITY_STYLES = {
  high: {
    card: "border-red-300/40 bg-red-950/80",
    title: "text-red-200",
    body: "text-red-50",
    badge: "bg-red-500 text-white",
  },
  medium: {
    card: "border-amber-300/40 bg-amber-950/75",
    title: "text-amber-100",
    body: "text-amber-50",
    badge: "bg-amber-500 text-slate-950",
  },
  low: {
    card: "border-sky-300/35 bg-slate-900/85",
    title: "text-sky-100",
    body: "text-slate-100",
    badge: "bg-sky-500 text-slate-950",
  },
};

function normalizeSeverity(severity) {
  if (severity === "high") return "high";
  if (severity === "low") return "low";
  return "medium";
}

export function StudioRecommendationsPanel({
  title = "Recommendations",
  items = [],
  emptyMessage = "No issues detected — creative elements look well positioned.",
  className = "",
}) {
  return (
    <div className={`rounded-xl border border-white/10 bg-slate-950/70 p-4 ${className}`}>
      <p className="text-sm font-semibold text-white mb-3">{title}</p>
      {items.length ? (
        <ul className="space-y-3">
          {items.map((item, index) => {
            const severity = normalizeSeverity(item?.severity);
            const styles = SEVERITY_STYLES[severity];
            const message = typeof item === "string" ? item : item?.message;
            const detail = typeof item === "object" ? item?.detail || item?.recommendation : null;
            return (
              <li
                key={item?.id || `${message}-${index}`}
                className={`rounded-lg border px-4 py-3 shadow-sm ${styles.card}`}
              >
                <div className="flex items-start gap-2">
                  <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${styles.badge}`}>
                    {severity}
                  </span>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium leading-relaxed ${styles.body}`}>{message}</p>
                    {detail ? (
                      <p className={`mt-1.5 text-xs leading-relaxed ${styles.title}`}>{detail}</p>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-emerald-200/90 leading-relaxed">{emptyMessage}</p>
      )}
    </div>
  );
}

export function StudioWarningList({ warnings = [], className = "" }) {
  if (!warnings.length) return null;
  return (
    <div className={`rounded-lg border border-amber-300/35 bg-amber-950/70 px-4 py-3 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-100 mb-2">Warnings</p>
      <ul className="space-y-2">
        {warnings.map((warning, index) => (
          <li key={`warning-${index}`} className="text-sm text-amber-50 leading-relaxed">
            {warning}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StudioElementBadge({ label, tone = "risk" }) {
  const tones = {
    risk: "bg-red-600 text-white border-red-300/50",
    safe: "bg-emerald-600 text-white border-emerald-300/50",
  };
  return (
    <span className={`absolute -top-5 left-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap shadow-md ${tones[tone] || tones.risk}`}>
      {tone === "risk" ? "⚠ " : "✓ "}{label}
    </span>
  );
}
