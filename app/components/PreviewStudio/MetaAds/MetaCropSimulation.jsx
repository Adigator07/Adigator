"use client";

import { useMemo } from "react";
import { simulateAllPlacements } from "@/app/lib/metaCreativePlacementAnalysis";
import {
  AnalysisPanelShell,
  CropStatusBadge,
  getCropVerdict,
  VerdictBanner,
} from "../shared/studioAnalysisUi";

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
