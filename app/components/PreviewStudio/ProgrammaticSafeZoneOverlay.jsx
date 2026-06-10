"use client";

import { useMemo, useState } from "react";
import {
  PROGRAMMATIC_IAB_FORMATS,
  PROGRAMMATIC_IAB_GROUPS,
  evaluateProgrammaticSafeZone,
} from "@/app/lib/programmaticCreativePlacementAnalysis";
import { ScaledAdFrame, StudioTabBar } from "./PreviewShared";
import { StudioElementBadge, StudioRecommendationsPanel } from "./shared/StudioRecommendationsPanel";

const ELEMENT_COLORS = {
  text: "#38bdf8",
  logo: "#a78bfa",
  brand: "#c084fc",
  face: "#fbbf24",
  product: "#f472b6",
  cta: "#34d399",
};

const RISK_STYLES = {
  safe: "text-emerald-300 bg-emerald-500/15 border-emerald-400/30",
  moderate: "text-amber-200 bg-amber-500/15 border-amber-400/30",
  high: "text-red-200 bg-red-500/15 border-red-400/30",
};

function ScorePanel({ score, riskLevel, compatibilityScore }) {
  const tone = RISK_STYLES[riskLevel.id] || RISK_STYLES.moderate;
  return (
    <div className="flex flex-wrap gap-2">
      <div className={`rounded-xl border px-4 py-3 min-w-[130px] ${tone}`}>
        <p className="text-[10px] uppercase tracking-wider opacity-80">Safe Zone Score</p>
        <p className="text-3xl font-bold tabular-nums">{score}</p>
        <p className="text-xs font-semibold mt-1">{riskLevel.label}</p>
      </div>
      <div className="rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-3 min-w-[130px]">
        <p className="text-[10px] uppercase tracking-wider text-violet-200/80">Compatibility</p>
        <p className="text-3xl font-bold tabular-nums text-violet-100">{compatibilityScore}</p>
        <p className="text-xs text-violet-200/70 mt-1">Format fit</p>
      </div>
    </div>
  );
}

function FormatCanvas({ imageUrl, sourceW, sourceH, analysis }) {
  const spec = analysis.formatSpec;
  const displayW = Math.min(640, spec?.width || 640);
  const displayH = spec ? Math.round(displayW / spec.aspectRatio) : displayW;

  const cropRect = analysis.cropRect;
  const scale = cropRect?.width ? displayW / spec.width : 1;
  const imgScale = cropRect?.width ? displayW / cropRect.width : displayW / (sourceW || 1);
  const imgW = (sourceW || displayW) * imgScale;
  const imgH = (sourceH || displayH) * imgScale;
  const offsetX = cropRect ? -cropRect.x * imgScale : 0;
  const offsetY = cropRect ? -cropRect.y * imgScale : 0;

  const safeStyle = spec
    ? {
      left: `${spec.safeZone.left * 100}%`,
      top: `${spec.safeZone.top * 100}%`,
      width: `${(spec.safeZone.right - spec.safeZone.left) * 100}%`,
      height: `${(spec.safeZone.bottom - spec.safeZone.top) * 100}%`,
    }
    : null;

  return (
    <ScaledAdFrame width={displayW} height={displayH}>
      <div className="relative overflow-hidden bg-zinc-900" style={{ width: displayW, height: displayH }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Programmatic IAB safe zone"
          className="absolute max-w-none"
          style={{ width: imgW, height: imgH, left: offsetX, top: offsetY }}
          draggable={false}
        />

        {safeStyle ? (
          <div
            className="absolute border-2 border-dashed border-cyan-400/80 bg-cyan-400/5 pointer-events-none z-10"
            style={safeStyle}
          >
            <span className="absolute -top-5 left-0 text-[9px] font-semibold uppercase tracking-wide text-cyan-300">
              Safe zone
            </span>
          </div>
        ) : null}

        {(spec?.uiOverlays || []).map((overlay) => (
          <div
            key={overlay.id}
            className="absolute bg-orange-500/15 border border-orange-400/40 pointer-events-none z-10"
            style={{
              left: `${overlay.left * 100}%`,
              top: `${overlay.top * 100}%`,
              width: `${(overlay.right - overlay.left) * 100}%`,
              height: `${(overlay.bottom - overlay.top) * 100}%`,
            }}
          />
        ))}

        {analysis.elementsAtRisk.map((element) => (
          <div
            key={`risk-${element.id}`}
            className="absolute border-2 border-red-400 bg-red-500/25 pointer-events-none z-20"
            style={{
              left: element.x * scale,
              top: element.y * scale,
              width: element.width * scale,
              height: element.height * scale,
            }}
          >
            <StudioElementBadge label={element.label} tone="risk" />
          </div>
        ))}

        {analysis.safeElements.map((element) => (
          <div
            key={`safe-${element.id}`}
            className="absolute border pointer-events-none z-10"
            style={{
              left: element.x * scale,
              top: element.y * scale,
              width: element.width * scale,
              height: element.height * scale,
              borderColor: ELEMENT_COLORS[element.type] || "#94a3b8",
              backgroundColor: `${ELEMENT_COLORS[element.type] || "#94a3b8"}22`,
            }}
          />
        ))}
      </div>
    </ScaledAdFrame>
  );
}

export default function ProgrammaticSafeZoneOverlay({
  imageUrl,
  imageSize,
  elements,
  detectionSource,
}) {
  const [activeGroup, setActiveGroup] = useState("standard_display");
  const [activeFormat, setActiveFormat] = useState("300x250");

  const groupFormats = useMemo(() => {
    const group = PROGRAMMATIC_IAB_GROUPS.find((entry) => entry.id === activeGroup);
    return group?.formats || ["300x250"];
  }, [activeGroup]);

  const formatTabs = useMemo(
    () => groupFormats.map((id) => ({
      id,
      label: PROGRAMMATIC_IAB_FORMATS[id]?.sizeLabel || PROGRAMMATIC_IAB_FORMATS[id]?.label || id,
    })),
    [groupFormats],
  );

  const effectiveFormat = groupFormats.includes(activeFormat) ? activeFormat : groupFormats[0];

  const analysis = useMemo(
    () => evaluateProgrammaticSafeZone(elements, effectiveFormat, imageSize.width, imageSize.height),
    [elements, effectiveFormat, imageSize.width, imageSize.height],
  );

  const spec = PROGRAMMATIC_IAB_FORMATS[effectiveFormat];

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Programmatic Safe Zone Overlay</h3>
          <p className="mt-1 text-xs text-gray-400 max-w-xl">
            IAB format safe zones for logos, headlines, CTAs, products, faces, and brand elements.
            {detectionSource !== "none" ? (
              <span className="text-gray-500"> Detection: {detectionSource.replace(/\+/g, " + ")}.</span>
            ) : null}
          </p>
          {spec ? (
            <p className="mt-1 text-[11px] text-gray-500">{spec.label} · {spec.sizeLabel}</p>
          ) : null}
        </div>
        <ScorePanel
          score={analysis.score}
          riskLevel={analysis.riskLevel}
          compatibilityScore={analysis.compatibilityScore}
        />
      </div>

      <StudioTabBar
        tabs={PROGRAMMATIC_IAB_GROUPS.map((group) => ({ id: group.id, label: group.label }))}
        activeTab={activeGroup}
        onChange={(groupId) => {
          setActiveGroup(groupId);
          const next = PROGRAMMATIC_IAB_GROUPS.find((entry) => entry.id === groupId);
          if (next?.formats?.[0]) setActiveFormat(next.formats[0]);
        }}
      />

      <StudioTabBar tabs={formatTabs} activeTab={effectiveFormat} onChange={setActiveFormat} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
        <FormatCanvas
          imageUrl={imageUrl}
          sourceW={imageSize.width}
          sourceH={imageSize.height}
          analysis={analysis}
        />

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Detected" value={analysis.totalElements} tone="neutral" />
            <Stat label="At risk" value={analysis.elementsAtRisk.length} tone="red" />
            <Stat label="Cropped" value={analysis.croppedElements.length} tone="amber" />
            <Stat label="Overlaps" value={analysis.overlaps.length} tone="amber" />
          </div>

          {analysis.edgeViolations.length ? (
            <p className="text-[11px] text-amber-200/90 rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-2">
              {analysis.edgeViolations.length} element(s) too close to format edges.
            </p>
          ) : null}

          <StudioRecommendationsPanel
            title="Recommendations"
            items={analysis.recommendations}
            emptyMessage="All elements sit inside the IAB safe zone."
          />

          <div className="flex flex-wrap gap-2 text-[10px] text-gray-400">
            {Object.entries(ELEMENT_COLORS).map(([type, color]) => (
              <span key={type} className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm border" style={{ borderColor: color, backgroundColor: `${color}33` }} />
                {type}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }) {
  const tones = {
    neutral: "border-white/10 bg-black/20 text-white",
    red: "border-red-400/20 bg-red-500/5 text-red-200",
    amber: "border-amber-400/20 bg-amber-500/5 text-amber-200",
  };
  return (
    <div className={`rounded-lg border px-3 py-2 text-center ${tones[tone] || tones.neutral}`}>
      <p className="text-[10px] uppercase opacity-70">{label}</p>
      <p className="text-lg font-bold tabular-nums">{value}</p>
    </div>
  );
}
