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
    <div className="rounded-xl border border-white/12 bg-white/[0.04] p-3 shadow-[0_0_24px_-8px_rgba(129,140,248,0.25)]">
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
      <p className="mt-2 text-center text-[11px] text-[#9a9aad]">
        Green = safe area · Amber = platform UI · Red = element to move
      </p>
    </div>
  );
}

const VERDICT_STYLES = {
  good: {
    wrap: "border-emerald-400/35 bg-emerald-500/12",
    title: "text-emerald-100",
    body: "text-emerald-200/90",
    icon: "✓",
  },
  warn: {
    wrap: "border-amber-400/35 bg-amber-500/12",
    title: "text-amber-100",
    body: "text-amber-200/90",
    icon: "⚠",
  },
  bad: {
    wrap: "border-rose-400/35 bg-rose-500/12",
    title: "text-rose-100",
    body: "text-rose-200/90",
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
      <p className="text-sm text-[#c8c8d4] leading-relaxed">{emptyMessage}</p>
    ) : null;
  }

  return (
    <ul className="space-y-2 text-sm text-[#d4d4de] leading-relaxed list-disc pl-5 marker:text-cyan-400/70">
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
          <p className="font-semibold text-rose-200 mb-1">Move these</p>
          <ul className="space-y-1 text-rose-100/90">
            {atRisk.map((el) => (
              <li key={el.id} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-400 shrink-0" />
                {el.label}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {safe.length ? (
        <div>
          <p className="font-semibold text-emerald-200 mb-1">Already safe</p>
          <ul className="space-y-1 text-emerald-100/90">
            {safe.slice(0, 5).map((el) => (
              <li key={el.id} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
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
      {label ? <span className="text-xs font-semibold text-[#9a9aad] shrink-0">{label}</span> : null}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2 text-sm text-[#f4f4f8] shadow-sm focus:border-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id} className="bg-[#1a1a28] text-[#f4f4f8]">
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
    message: "Some elements are close to placement edges. Double-check before launch.",
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
  good: "text-emerald-200 bg-emerald-500/15 border-emerald-400/35",
  warn: "text-amber-200 bg-amber-500/15 border-amber-400/35",
  bad: "text-rose-200 bg-rose-500/15 border-rose-400/35",
};

export function CropStatusBadge({ tone, label }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${CROP_BADGE[tone] || CROP_BADGE.good}`}>
      {label}
    </span>
  );
}

export function CropPreviewCardShell({ title, subtitle, badge, imageUrl, imageW, imageH, cropRect, aspectRatio, message, label }) {
  const previewW = 168;
  const targetH = Math.round(previewW / aspectRatio);
  const scale = imageW && imageH ? previewW / cropRect.width : 1;
  const imgW = imageW * scale;
  const imgH = imageH * scale;
  const offsetX = -cropRect.x * scale;
  const offsetY = -cropRect.y * scale;

  return (
    <article className="flex-shrink-0 w-[180px] rounded-xl border border-white/12 bg-white/[0.04] overflow-hidden shadow-[0_0_20px_-8px_rgba(129,140,248,0.2)]">
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#f4f4f8] truncate">{title}</p>
            {subtitle ? <p className="text-[10px] text-[#9a9aad]">{subtitle}</p> : null}
          </div>
          {badge}
        </div>
      </div>

      <div className="px-3 pb-3">
        <div
          className="relative overflow-hidden rounded-lg bg-black/40 border border-white/10"
          style={{ width: previewW, height: targetH }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={label || title}
            className="absolute max-w-none"
            style={{ width: imgW, height: imgH, left: offsetX, top: offsetY }}
            draggable={false}
          />
        </div>
        {message ? (
          <p className="mt-2 text-[11px] text-[#c8c8d4] leading-snug line-clamp-2">{message}</p>
        ) : null}
      </div>
    </article>
  );
}

export function AnalysisPanelShell({ title, description, children }) {
  return (
    <div className="space-y-4 rounded-2xl border border-white/12 bg-white/[0.04] p-5 shadow-[0_0_32px_-12px_rgba(129,140,248,0.3)]">
      <div>
        <h3 className="text-base font-semibold text-[#f4f4f8]">{title}</h3>
        {description ? <p className="mt-1 text-sm text-[#c8c8d4] max-w-2xl">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}
