"use client";

import { useMemo, useState } from "react";
import {
  GOOGLE_CROP_SPECS,
  simulateAllGoogleCrops,
} from "@/app/lib/googleCreativePlacementAnalysis";
import { StudioTabBar } from "../PreviewShared";
import {
  AnalysisPanelShell,
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
  const previewW = 168;
  const targetH = Math.round(previewW / simulation.aspectRatio);
  const scale = imageW && imageH ? previewW / simulation.cropRect.width : 1;
  const imgW = imageW * scale;
  const imgH = imageH * scale;
  const offsetX = -simulation.cropRect.x * scale;
  const offsetY = -simulation.cropRect.y * scale;

  return (
    <article className="flex-shrink-0 w-[180px] rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">{simulation.label}</p>
            <p className="text-[10px] text-slate-500">{simulation.sizeLabel}</p>
          </div>
          <CropStatusBadge tone={verdict.tone} label={verdict.short} />
        </div>
      </div>

      <div className="px-3 pb-3">
        <div
          className="relative overflow-hidden rounded-lg bg-slate-100 border border-slate-200"
          style={{ width: previewW, height: targetH }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={`${simulation.label} crop`}
            className="absolute max-w-none"
            style={{ width: imgW, height: imgH, left: offsetX, top: offsetY }}
            draggable={false}
          />
        </div>
        <p className="mt-2 text-[11px] text-slate-600 leading-snug line-clamp-2">{verdict.message}</p>
      </div>
    </article>
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
      ? "Mostly good — review a few formats"
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

      <StudioTabBar tabs={FILTER_TABS} activeTab={filter} onChange={setFilter} variant="light" />

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
        <p className="text-xs text-slate-500">
          Showing 6 common formats. Switch to <strong>All formats</strong> for the full {allSimulations.length}-format check
          ({Object.keys(GOOGLE_CROP_SPECS).length} total).
        </p>
      ) : null}
    </AnalysisPanelShell>
  );
}
