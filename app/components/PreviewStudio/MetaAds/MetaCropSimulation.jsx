"use client";

import { useMemo } from "react";
import {
  META_PLACEMENT_SPECS,
  simulateAllPlacements,
} from "@/app/lib/metaCreativePlacementAnalysis";
import { ScaledAdFrame } from "../PreviewShared";
import { StudioRecommendationsPanel, StudioWarningList } from "../shared/StudioRecommendationsPanel";

function SuitabilityBadge({ score }) {
  const tone = score >= 80
    ? "text-emerald-300 border-emerald-400/30 bg-emerald-500/10"
    : score >= 60
      ? "text-amber-200 border-amber-400/30 bg-amber-500/10"
      : "text-red-200 border-red-400/30 bg-red-500/10";

  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold tabular-nums ${tone}`}>
      {score}/100
    </span>
  );
}

function CropPreviewCard({ simulation, imageUrl, imageW, imageH }) {
  const previewW = 220;
  const targetH = Math.round(previewW / simulation.aspectRatio);

  const scale = imageW && imageH ? previewW / simulation.cropRect.width : 1;
  const imgW = imageW * scale;
  const imgH = imageH * scale;
  const offsetX = -simulation.cropRect.x * scale;
  const offsetY = -simulation.cropRect.y * scale;

  return (
    <article className="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        <p className="text-xs font-semibold text-white truncate">{simulation.label}</p>
        <SuitabilityBadge score={simulation.suitabilityScore} />
      </div>

      <div className="p-3">
        <ScaledAdFrame width={previewW} height={targetH}>
          <div
            className="relative overflow-hidden bg-zinc-900"
            style={{ width: previewW, height: targetH }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={`${simulation.label} crop preview`}
              className="absolute max-w-none object-cover"
              style={{
                width: imgW,
                height: imgH,
                left: offsetX,
                top: offsetY,
              }}
              draggable={false}
            />

            {simulation.elementResults
              .filter((el) => el.status !== "fully_visible")
              .map((element) => (
                <div
                  key={`${simulation.placementId}-${element.id}`}
                  className="absolute border border-red-400/70 bg-red-500/20 pointer-events-none"
                  style={{
                    left: (element.x - simulation.cropRect.x) * scale,
                    top: (element.y - simulation.cropRect.y) * scale,
                    width: element.width * scale,
                    height: element.height * scale,
                  }}
                />
              ))}
          </div>
        </ScaledAdFrame>

        <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
          <div className="rounded-md bg-white/5 px-2 py-1.5">
            <span className="text-gray-500">Visibility</span>
            <p className="font-semibold text-white tabular-nums">{simulation.visibilityPercent}%</p>
          </div>
          <div className="rounded-md bg-white/5 px-2 py-1.5">
            <span className="text-gray-500">Cropped</span>
            <p className="font-semibold text-white tabular-nums">{simulation.croppedAreaPercent}%</p>
          </div>
        </div>

        {simulation.warnings.length ? (
          <StudioWarningList warnings={simulation.warnings.slice(0, 2)} className="mt-3" />
        ) : (
          <p className="mt-3 text-sm text-emerald-200/90">All elements fully visible.</p>
        )}
      </div>
    </article>
  );
}

export default function MetaCropSimulation({ imageUrl, imageSize, elements }) {
  const simulations = useMemo(
    () => simulateAllPlacements(elements, imageSize.width, imageSize.height),
    [elements, imageSize.width, imageSize.height],
  );

  const avgSuitability = simulations.length
    ? Math.round(simulations.reduce((sum, sim) => sum + sim.suitabilityScore, 0) / simulations.length)
    : 0;

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Crop Simulation</h3>
          <p className="mt-1 text-xs text-gray-400 max-w-2xl">
            Center-crop simulation across Meta Feed, Story, and Reels aspect ratios with element visibility scoring.
          </p>
        </div>
        <div className="rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-4 py-2 text-center">
          <p className="text-[10px] uppercase tracking-wide text-cyan-200/80">Avg suitability</p>
          <p className="text-xl font-bold text-cyan-100 tabular-nums">{avgSuitability}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {simulations.map((simulation) => (
          <div key={`detail-${simulation.placementId}`} className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-xs font-semibold text-white">{simulation.label}</p>
              <span className="text-[10px] text-gray-500 font-mono">
                {META_PLACEMENT_SPECS[simulation.placementId]?.aspectRatio === 1
                  ? "1:1"
                  : META_PLACEMENT_SPECS[simulation.placementId]?.aspectRatio === 4 / 5
                    ? "4:5"
                    : "9:16"}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 text-[10px] mb-3">
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-200">
                {simulation.visibleCount} fully visible
              </span>
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-200">
                {simulation.partialCount} partial
              </span>
              <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-red-200">
                {simulation.hiddenCount} hidden
              </span>
            </div>

            <StudioRecommendationsPanel
              title="Optimization tips"
              items={simulation.suggestions}
              emptyMessage="This crop preserves all detected elements."
              className="border-0 bg-transparent p-0"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
