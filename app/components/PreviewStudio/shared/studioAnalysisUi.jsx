"use client";

export function getDisplayDimensions(imageW, imageH, maxW = 460) {
  const width = Math.min(maxW, imageW || maxW);
  const height = imageW && imageH ? Math.round(width * (imageH / imageW)) : width;
  return { width, height };
}

export function elementBoxStyle(element, imageW, imageH) {
  if (!imageW || !imageH) return {};
  return {
    left: `${(element.x / imageW) * 100}%`,
    top: `${(element.y / imageH) * 100}%`,
    width: `${(element.width / imageW) * 100}%`,
    height: `${(element.height / imageH) * 100}%`,
  };
}

export function normalizedZoneStyle(zone) {
  return {
    left: `${zone.left * 100}%`,
    top: `${zone.top * 100}%`,
    width: `${(zone.right - zone.left) * 100}%`,
    height: `${(zone.bottom - zone.top) * 100}%`,
  };
}

/** Image canvas with pixel-accurate overlay alignment (no letterboxing). */
export function AnalysisImageCanvas({ imageUrl, imageW, imageH, children, maxWidth = 460 }) {
  const { width, height } = getDisplayDimensions(imageW, imageH, maxWidth);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm">
      <div className="relative mx-auto overflow-hidden rounded-lg bg-slate-900" style={{ width, height }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Creative analysis preview"
          width={width}
          height={height}
          className="block h-full w-full"
          style={{ objectFit: "fill" }}
          draggable={false}
        />
        <div className="absolute inset-0 pointer-events-none">{children}</div>
      </div>
      <p className="mt-2 text-center text-[11px] text-slate-500">
        Green = safe area · Amber = platform UI · Red = element to move
      </p>
    </div>
  );
}

const VERDICT_STYLES = {
  good: {
    wrap: "border-emerald-200 bg-emerald-50",
    title: "text-emerald-900",
    body: "text-emerald-800",
    icon: "✓",
  },
  warn: {
    wrap: "border-amber-200 bg-amber-50",
    title: "text-amber-900",
    body: "text-amber-800",
    icon: "⚠",
  },
  bad: {
    wrap: "border-red-200 bg-red-50",
    title: "text-red-900",
    body: "text-red-800",
    icon: "✗",
  },
};

export function VerdictBanner({ tone = "good", title, message }) {
  const styles = VERDICT_STYLES[tone] || VERDICT_STYLES.good;
  return (
    <div className={`rounded-xl border px-4 py-3 ${styles.wrap}`}>
      <p className={`text-sm font-semibold ${styles.title}`}>
        {styles.icon} {title}
      </p>
      {message ? <p className={`mt-1 text-sm leading-relaxed ${styles.body}`}>{message}</p> : null}
    </div>
  );
}

export function SimpleTips({ tips = [], emptyMessage }) {
  if (!tips.length) {
    return emptyMessage ? (
      <p className="text-sm text-slate-600 leading-relaxed">{emptyMessage}</p>
    ) : null;
  }

  return (
    <ul className="space-y-2 text-sm text-slate-700 leading-relaxed list-disc pl-5">
      {tips.slice(0, 3).map((tip, index) => {
        const text = typeof tip === "string" ? tip : tip?.message || tip?.detail;
        if (!text) return null;
        return <li key={`tip-${index}`}>{text}</li>;
      })}
    </ul>
  );
}

export function ElementChecklist({ atRisk = [], safe = [] }) {
  return (
    <div className="space-y-3 text-sm">
      {atRisk.length ? (
        <div>
          <p className="font-semibold text-red-800 mb-1">Move these</p>
          <ul className="space-y-1 text-red-700">
            {atRisk.map((el) => (
              <li key={el.id} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                {el.label}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {safe.length ? (
        <div>
          <p className="font-semibold text-emerald-800 mb-1">Already safe</p>
          <ul className="space-y-1 text-emerald-700">
            {safe.slice(0, 5).map((el) => (
              <li key={el.id} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                {el.label}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function PlacementSelect({ label, options, value, onChange }) {
  return (
    <label className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
      {label ? <span className="text-xs font-semibold text-slate-600 shrink-0">{label}</span> : null}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function getSafeZoneVerdict(analysis) {
  const atRisk = analysis?.elementsAtRisk?.length || 0;
  const score = analysis?.score ?? 0;

  if (atRisk === 0 && score >= 70) {
    return {
      tone: "good",
      title: "Safe zone looks good",
      message: "Detected text, logos, and CTAs sit inside the recommended area for this placement.",
    };
  }
  if (atRisk === 1) {
    const label = analysis.elementsAtRisk[0]?.label || "One element";
    return {
      tone: "warn",
      title: "One small adjustment",
      message: `Move ${label} toward the center so it is not covered by platform UI.`,
    };
  }
  if (atRisk > 1) {
    return {
      tone: "bad",
      title: `${atRisk} elements overlap UI zones`,
      message: "Shift highlighted items inward. Keep logos and CTAs in the green safe area.",
    };
  }
  return {
    tone: "warn",
    title: "Review recommended",
    message: "Some elements are close to placement edges — double-check before launch.",
  };
}

export function getCropVerdict(simulation) {
  if (simulation.hiddenCount > 0) {
    return {
      tone: "bad",
      short: "Poor fit",
      message: simulation.warnings?.[0] || "Important content may be cut off in this format.",
    };
  }
  if (simulation.partialCount > 0 || simulation.suitabilityScore < 75) {
    return {
      tone: "warn",
      short: "Review",
      message: simulation.warnings?.[0] || "Some elements may clip at the edges.",
    };
  }
  return {
    tone: "good",
    short: "Good fit",
    message: "This crop keeps your key content visible.",
  };
}

const CROP_BADGE = {
  good: "text-emerald-700 bg-emerald-100 border-emerald-200",
  warn: "text-amber-800 bg-amber-100 border-amber-200",
  bad: "text-red-700 bg-red-100 border-red-200",
};

export function CropStatusBadge({ tone, label }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${CROP_BADGE[tone] || CROP_BADGE.good}`}>
      {label}
    </span>
  );
}

export function AnalysisPanelShell({ title, description, children }) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        {description ? <p className="mt-1 text-sm text-slate-600 max-w-2xl">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}
