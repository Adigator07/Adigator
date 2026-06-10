"use client";

import { useMemo, useState } from "react";
import {
  GOOGLE_SAFE_ZONE_GROUPS,
  GOOGLE_SAFE_ZONE_SPECS,
  evaluateGoogleSafeZone,
} from "@/app/lib/googleCreativePlacementAnalysis";
import { ScaledAdFrame, StudioTabBar } from "../PreviewShared";
import { StudioElementBadge, StudioRecommendationsPanel } from "../shared/StudioRecommendationsPanel";

const ELEMENT_COLORS = {
  text: "#38bdf8",
  logo: "#a78bfa",
  face: "#fbbf24",
  product: "#f472b6",
  cta: "#34d399",
};

const RISK_STYLES = {
  safe: "text-emerald-300 bg-emerald-500/15 border-emerald-400/30",
  moderate: "text-amber-200 bg-amber-500/15 border-amber-400/30",
  high: "text-red-200 bg-red-500/15 border-red-400/30",
};

function ScorePanel({ score, riskLevel }) {
  const tone = RISK_STYLES[riskLevel.id] || RISK_STYLES.moderate;
  return (
    <div className={`rounded-xl border px-4 py-3 min-w-[140px] ${tone}`}>
      <p className="text-[10px] uppercase tracking-wider opacity-80">Safe Zone Score</p>
      <p className="text-3xl font-bold tabular-nums">{score}</p>
      <p className="text-xs font-semibold mt-1">{riskLevel.label}</p>
    </div>
  );
}

function SafeZoneCanvas({ imageUrl, imageW, imageH, analysis, placementId }) {
  const spec = GOOGLE_SAFE_ZONE_SPECS[placementId];
  const displayW = Math.min(640, imageW || 640);
  const displayH = imageW && imageH ? Math.round(displayW * (imageH / imageW)) : displayW;

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
      <div className="relative bg-black" style={{ width: displayW, height: displayH }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Google Ads safe zone analysis"
          className="absolute inset-0 h-full w-full object-contain"
          draggable={false}
        />

        {safeStyle ? (
          <div
            className="absolute border-2 border-dashed border-blue-400/80 bg-blue-400/5 pointer-events-none"
            style={safeStyle}
          >
            <span className="absolute -top-5 left-0 text-[9px] font-semibold uppercase tracking-wide text-blue-300">
              Safe zone
            </span>
          </div>
        ) : null}

        {(spec?.uiOverlays || []).map((overlay) => (
          <div
            key={overlay.id}
            className="absolute bg-orange-500/15 border border-orange-400/40 pointer-events-none"
            style={{
              left: `${overlay.left * 100}%`,
              top: `${overlay.top * 100}%`,
              width: `${(overlay.right - overlay.left) * 100}%`,
              height: `${(overlay.bottom - overlay.top) * 100}%`,
            }}
          >
            <span className="absolute bottom-1 left-1 text-[8px] text-orange-200/90">{overlay.label}</span>
          </div>
        ))}

        {analysis.elementsAtRisk.map((element) => (
          <div
            key={`risk-${element.id}`}
            className="absolute border-2 border-red-400 bg-red-500/20 pointer-events-none"
            style={{
              left: `${(element.x / imageW) * 100}%`,
              top: `${(element.y / imageH) * 100}%`,
              width: `${(element.width / imageW) * 100}%`,
              height: `${(element.height / imageH) * 100}%`,
            }}
          >
            <StudioElementBadge label={element.label} tone="risk" />
          </div>
        ))}

        {analysis.safeElements.map((element) => (
          <div
            key={`safe-${element.id}`}
            className="absolute border pointer-events-none"
            style={{
              left: `${(element.x / imageW) * 100}%`,
              top: `${(element.y / imageH) * 100}%`,
              width: `${(element.width / imageW) * 100}%`,
              height: `${(element.height / imageH) * 100}%`,
              borderColor: ELEMENT_COLORS[element.type] || "#94a3b8",
              backgroundColor: `${ELEMENT_COLORS[element.type] || "#94a3b8"}22`,
            }}
          />
        ))}
      </div>
    </ScaledAdFrame>
  );
}

export default function GoogleSafeZoneOverlay({
  imageUrl,
  imageSize,
  elements,
  detectionSource,
}) {
  const [activeGroup, setActiveGroup] = useState("display");
  const [activePlacement, setActivePlacement] = useState("responsive_display");

  const groupPlacements = useMemo(() => {
    const group = GOOGLE_SAFE_ZONE_GROUPS.find((entry) => entry.id === activeGroup);
    return group?.placements || ["responsive_display"];
  }, [activeGroup]);

  const placementTabs = useMemo(
    () => groupPlacements.map((id) => ({
      id,
      label: GOOGLE_SAFE_ZONE_SPECS[id]?.label || id,
    })),
    [groupPlacements],
  );

  const effectivePlacement = groupPlacements.includes(activePlacement)
    ? activePlacement
    : groupPlacements[0];

  const analysis = useMemo(
    () => evaluateGoogleSafeZone(elements, effectivePlacement, imageSize.width, imageSize.height),
    [elements, effectivePlacement, imageSize.width, imageSize.height],
  );

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Google Ads Safe Zone Overlay</h3>
          <p className="mt-1 text-xs text-gray-400 max-w-xl">
            Checks headlines, logos, faces, products, and CTAs against safe areas for Responsive Display,
            GDN, Demand Gen, Gmail, and YouTube placements.
            {detectionSource !== "none" ? (
              <span className="text-gray-500"> Detection: {detectionSource.replace(/\+/g, " + ")}.</span>
            ) : null}
          </p>
        </div>
        <ScorePanel score={analysis.score} riskLevel={analysis.riskLevel} />
      </div>

      <StudioTabBar
        tabs={GOOGLE_SAFE_ZONE_GROUPS.map((group) => ({ id: group.id, label: group.label }))}
        activeTab={activeGroup}
        onChange={(groupId) => {
          setActiveGroup(groupId);
          const nextGroup = GOOGLE_SAFE_ZONE_GROUPS.find((entry) => entry.id === groupId);
          if (nextGroup?.placements?.[0]) setActivePlacement(nextGroup.placements[0]);
        }}
      />

      {placementTabs.length > 1 ? (
        <StudioTabBar tabs={placementTabs} activeTab={effectivePlacement} onChange={setActivePlacement} />
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
        <SafeZoneCanvas
          imageUrl={imageUrl}
          imageW={imageSize.width}
          imageH={imageSize.height}
          analysis={analysis}
          placementId={effectivePlacement}
        />

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-center">
              <p className="text-[10px] uppercase text-gray-500">Detected</p>
              <p className="text-lg font-bold text-white tabular-nums">{analysis.totalElements}</p>
            </div>
            <div className="rounded-lg border border-red-400/20 bg-red-500/5 px-3 py-2 text-center">
              <p className="text-[10px] uppercase text-red-300/80">At risk</p>
              <p className="text-lg font-bold text-red-200 tabular-nums">{analysis.elementsAtRisk.length}</p>
            </div>
            <div className="rounded-lg border border-emerald-400/20 bg-emerald-500/5 px-3 py-2 text-center">
              <p className="text-[10px] uppercase text-emerald-300/80">Safe</p>
              <p className="text-lg font-bold text-emerald-200 tabular-nums">{analysis.safeElements.length}</p>
            </div>
          </div>

          <StudioRecommendationsPanel
            title="Recommendations"
            items={analysis.recommendations}
            emptyMessage="All detected elements sit inside the safe zone."
          />

          <div className="flex flex-wrap gap-3 text-[10px] text-gray-400">
            {Object.entries(ELEMENT_COLORS).map(([type, color]) => (
              <span key={type} className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm border" style={{ borderColor: color, backgroundColor: `${color}33` }} />
                {type}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm border border-red-400 bg-red-500/30" />
              at risk
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
