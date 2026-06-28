"use client";

import { useMemo, useState } from "react";
import {
  META_PLACEMENT_SPECS,
  evaluateSafeZone,
} from "@/app/lib/metaCreativePlacementAnalysis";
import {
  AnalysisImageCanvas,
  AnalysisPanelShell,
  ElementChecklist,
  elementBoxStyle,
  getSafeZoneVerdict,
  normalizedZoneStyle,
  PlacementSelect,
  SimpleTips,
  VerdictBanner,
} from "../shared/studioAnalysisUi";

const PLACEMENT_OPTIONS = Object.values(META_PLACEMENT_SPECS).map((spec) => ({
  id: spec.id,
  label: spec.label,
}));

function SafeZoneCanvas({ imageUrl, imageW, imageH, analysis, placementId }) {
  const spec = META_PLACEMENT_SPECS[placementId];

  return (
    <AnalysisImageCanvas imageUrl={imageUrl} imageW={imageW} imageH={imageH}>
      {spec?.safeZone ? (
        <div
          className="absolute border-2 border-dashed border-emerald-400/90"
          style={normalizedZoneStyle(spec.safeZone)}
        />
      ) : null}

      {(spec?.uiOverlays || []).map((overlay) => (
        <div
          key={overlay.id}
          className="absolute bg-amber-400/15 border border-amber-400/35"
          style={normalizedZoneStyle(overlay)}
        />
      ))}

      {analysis.elementsAtRisk.map((element) => (
        <div
          key={`risk-${element.id}`}
          className="absolute border-2 border-red-500 bg-red-500/15"
          style={elementBoxStyle(element, imageW, imageH)}
        />
      ))}
    </AnalysisImageCanvas>
  );
}

export default function MetaSafeZoneOverlay({
  imageUrl,
  imageSize,
  elements,
  detectionSource,
}) {
  const [placementId, setPlacementId] = useState("facebook_feed");

  const analysis = useMemo(
    () => evaluateSafeZone(elements, placementId, imageSize.width, imageSize.height),
    [elements, placementId, imageSize.width, imageSize.height],
  );

  const verdict = getSafeZoneVerdict(analysis);
  const tipMessages = analysis.recommendations.map((item) =>
    typeof item === "string" ? item : item?.message,
  ).filter(Boolean);

  return (
    <AnalysisPanelShell
      title="Safe Zone Check"
      description="Check whether logos, text, faces, and CTAs stay inside Meta's safe area for Feed, Stories, and Reels."
    >
      <VerdictBanner tone={verdict.tone} title={verdict.title} message={verdict.message} />

      <PlacementSelect
        label="Placement"
        options={PLACEMENT_OPTIONS}
        value={placementId}
        onChange={setPlacementId}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        <SafeZoneCanvas
          imageUrl={imageUrl}
          imageW={imageSize.width}
          imageH={imageSize.height}
          analysis={analysis}
          placementId={placementId}
        />

        <div className="space-y-4">
          <ElementChecklist
            atRisk={analysis.elementsAtRisk}
            safe={analysis.safeElements}
          />

          {tipMessages.length ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9a9aad] mb-2">
                Quick fixes
              </p>
              <SimpleTips tips={tipMessages} />
            </div>
          ) : null}

          {detectionSource !== "none" ? (
            <p className="text-[11px] text-[#9a9aad]">
              Element detection: {detectionSource.replace(/\+/g, " + ")}
            </p>
          ) : null}
        </div>
      </div>
    </AnalysisPanelShell>
  );
}
