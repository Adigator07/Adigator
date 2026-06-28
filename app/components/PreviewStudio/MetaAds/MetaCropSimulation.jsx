"use client";

import { useMemo } from "react";
import { simulateAllPlacements } from "@/app/lib/metaCreativePlacementAnalysis";
import {
  AnalysisPanelShell,
  CropPreviewCardShell,
  CropStatusBadge,
  getCropVerdict,
  VerdictBanner,
} from "../shared/studioAnalysisUi";

function CropPreviewCard({ simulation, imageUrl, imageW, imageH }) {
  const verdict = getCropVerdict(simulation);

  return (
    <CropPreviewCardShell
      title={simulation.label}
      badge={<CropStatusBadge tone={verdict.tone} label={verdict.short} />}
      imageUrl={imageUrl}
      imageW={imageW}
      imageH={imageH}
      cropRect={simulation.cropRect}
      aspectRatio={simulation.aspectRatio}
      message={verdict.message}
      label={`${simulation.label} crop`}
    />
  );
}

export default function MetaCropSimulation({ imageUrl, imageSize, elements }) {
  const simulations = useMemo(
    () => simulateAllPlacements(elements, imageSize.width, imageSize.height),
    [elements, imageSize.width, imageSize.height],
  );

  const poorCount = simulations.filter((sim) => getCropVerdict(sim).tone === "bad").length;
  const reviewCount = simulations.filter((sim) => getCropVerdict(sim).tone === "warn").length;

  const summaryTone = poorCount > 0 ? "bad" : reviewCount > 0 ? "warn" : "good";
  const summaryTitle = poorCount > 0
    ? `${poorCount} placement${poorCount > 1 ? "s" : ""} may crop badly`
    : reviewCount > 0
      ? "Mostly good. Review flagged placements"
      : "Crops look good across Meta placements";
  const summaryMessage = poorCount > 0
    ? "Keep logos and CTAs in the center 70%. Stories and Reels trim top and bottom heavily."
    : reviewCount > 0
      ? "Check previews with amber badges and move edge content inward."
      : "Your creative should read well in Feed, Stories, and Reels crops.";

  return (
    <AnalysisPanelShell
      title="Crop Preview"
      description="See how center-cropping affects your creative across Meta Feed, Stories, and Reels."
    >
      <VerdictBanner tone={summaryTone} title={summaryTitle} message={summaryMessage} />

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {simulations.map((simulation) => (
          <CropPreviewCard
            key={simulation.placementId}
            simulation={simulation}
            imageUrl={imageUrl}
            imageW={imageSize.width}
            imageH={imageSize.height}
          />
        ))}
      </div>
    </AnalysisPanelShell>
  );
}
