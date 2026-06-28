"use client";

import { useMemo, useState } from "react";
import {
  GOOGLE_CROP_SPECS,
  simulateAllGoogleCrops,
} from "@/app/lib/googleCreativePlacementAnalysis";
import { StudioTabBar } from "../PreviewShared";
import {
  AnalysisPanelShell,
  CropPreviewCardShell,
  CropStatusBadge,
  getCropVerdict,
  VerdictBanner,
} from "../shared/studioAnalysisUi";

const KEY_CROP_IDS = [
  "landscape_1200x628",
  "square_1200x1200",
  "portrait_1200x1500",
  "youtube_thumbnail",
  "gmail_promo",
  "demand_gen_mobile",
];

const FILTER_TABS = [
  { id: "key", label: "Key formats" },
  { id: "all", label: "All formats" },
];

function CropPreviewCard({ simulation, imageUrl, imageW, imageH }) {
  const verdict = getCropVerdict(simulation);

  return (
    <CropPreviewCardShell
      title={simulation.label}
      subtitle={simulation.sizeLabel}
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

export default function GoogleCropSimulation({ imageUrl, imageSize, elements }) {
  const [filter, setFilter] = useState("key");

  const allSimulations = useMemo(
    () => simulateAllGoogleCrops(elements, imageSize.width, imageSize.height),
    [elements, imageSize.width, imageSize.height],
  );

  const visibleSimulations = useMemo(() => {
    if (filter === "all") return allSimulations;
    const keySet = new Set(KEY_CROP_IDS);
    return allSimulations.filter((sim) => keySet.has(sim.cropId));
  }, [allSimulations, filter]);

  const poorCount = allSimulations.filter((sim) => getCropVerdict(sim).tone === "bad").length;
  const reviewCount = allSimulations.filter((sim) => getCropVerdict(sim).tone === "warn").length;

  const summaryTone = poorCount > 0 ? "bad" : reviewCount > 0 ? "warn" : "good";
  const summaryTitle = poorCount > 0
    ? `${poorCount} format${poorCount > 1 ? "s" : ""} may crop badly`
    : reviewCount > 0
      ? "Mostly good. Review a few formats"
      : "Crops look good across formats";
  const summaryMessage = poorCount > 0
    ? "Center your logo, product, and CTA so they survive landscape, square, and portrait crops."
    : reviewCount > 0
      ? "Check flagged previews and add padding around edge elements if needed."
      : "Your layout should hold up when Google resizes this creative.";

  return (
    <AnalysisPanelShell
      title="Crop Preview"
      description="Quick look at how your creative may be center-cropped across common Google ad sizes."
    >
      <VerdictBanner tone={summaryTone} title={summaryTitle} message={summaryMessage} />

      <StudioTabBar tabs={FILTER_TABS} activeTab={filter} onChange={setFilter} />

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {visibleSimulations.map((simulation) => (
          <CropPreviewCard
            key={simulation.cropId}
            simulation={simulation}
            imageUrl={imageUrl}
            imageW={imageSize.width}
            imageH={imageSize.height}
          />
        ))}
      </div>

      {filter === "key" ? (
        <p className="text-xs text-[#9a9aad]">
          Showing 6 common formats. Switch to <strong className="text-[#f4f4f8]">All formats</strong> for the full {allSimulations.length}-format check
          ({Object.keys(GOOGLE_CROP_SPECS).length} total).
        </p>
      ) : null}
    </AnalysisPanelShell>
  );
}
