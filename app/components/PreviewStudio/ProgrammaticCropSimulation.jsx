"use client";

import { useMemo, useState } from "react";
import {
  PROGRAMMATIC_CROP_GROUPS,
  simulateAllProgrammaticCrops,
} from "@/app/lib/programmaticCreativePlacementAnalysis";
import { ScaledAdFrame, StudioTabBar } from "./PreviewShared";
import { StudioRecommendationsPanel, StudioWarningList } from "./shared/StudioRecommendationsPanel";

function SuitabilityBadge({ score }) {
  const tone = score >= 80
    ? "text-emerald-300 border-emerald-400/30 bg-emerald-500/10"
    : score >= 60
      ? "text-amber-200 border-amber-400/30 bg-amber-500/10"
      : "text-red-200 border-red-400/30 bg-red-500/10";
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold tabular-nums ${tone}`}>
      {score}
    </span>
  );
}

function CropPreviewCard({ simulation, imageUrl, imageW, imageH }) {
  const previewW = 200;
  const targetH = Math.round(previewW / simulation.aspectRatio);
  const scale = imageW && imageH ? previewW / simulation.cropRect.width : 1;
  const imgW = imageW * scale;
  const imgH = imageH * scale;
  const offsetX = -simulation.cropRect.x * scale;
  const offsetY = -simulation.cropRect.y * scale;

  return (
    <article className="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white truncate">{simulation.label}</p>
          <p className="text-[10px] text-gray-500 font-mono">{simulation.sizeLabel}</p>
        </div>
        <SuitabilityBadge score={simulation.suitabilityScore} />
      </div>

      <div className="p-3">
        <ScaledAdFrame width={previewW} height={targetH}>
          <div className="relative overflow-hidden bg-zinc-900" style={{ width: previewW, height: targetH }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={`${simulation.label} crop`}
              className="absolute max-w-none object-cover"
              style={{ width: imgW, height: imgH, left: offsetX, top: offsetY }}
              draggable={false}
            />
            {simulation.elementResults
              .filter((el) => el.status !== "fully_visible")
              .map((element) => {
                const formatScale = previewW / simulation.formatWidth;
                return (
                  <div
                    key={`${simulation.cropId}-${element.id}`}
                    className="absolute border border-red-400/70 bg-red-500/20 pointer-events-none"
                    style={{
                      left: element.x * formatScale,
                      top: element.y * formatScale,
                      width: element.width * formatScale,
                      height: element.height * formatScale,
                    }}
                  />
                );
              })}
          </div>
        </ScaledAdFrame>

        <div className="mt-3 grid grid-cols-2 gap-1.5 text-[10px]">
          <Metric label="Visibility" value={`${simulation.visibilityPercent}%`} />
          <Metric label="Cropped" value={`${simulation.croppedAreaPercent}%`} />
          <Metric label="Readability" value={simulation.readabilityScore} />
          <Metric label="CTA vis." value={simulation.ctaVisibility != null ? `${simulation.ctaVisibility}%` : "—"} />
          <Metric label="Logo vis." value={simulation.logoVisibility != null ? `${simulation.logoVisibility}%` : "—"} />
        </div>

        {simulation.warnings.length ? (
          <StudioWarningList warnings={simulation.warnings.slice(0, 2)} className="mt-2" />
        ) : (
          <p className="mt-2 text-sm text-emerald-200/90">All elements fully visible.</p>
        )}
      </div>
    </article>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-md bg-white/5 px-2 py-1.5">
      <span className="text-gray-500">{label}</span>
      <p className="font-semibold text-white tabular-nums">{value}</p>
    </div>
  );
}

export default function ProgrammaticCropSimulation({ imageUrl, imageSize, elements }) {
  const [activeCategory, setActiveCategory] = useState("all");

  const allSimulations = useMemo(
    () => simulateAllProgrammaticCrops(elements, imageSize.width, imageSize.height),
    [elements, imageSize.width, imageSize.height],
  );

  const filtered = useMemo(() => {
    if (activeCategory === "all") return allSimulations;
    return allSimulations.filter((sim) => sim.category === activeCategory);
  }, [allSimulations, activeCategory]);

  const avgSuitability = allSimulations.length
    ? Math.round(allSimulations.reduce((s, sim) => s + sim.suitabilityScore, 0) / allSimulations.length)
    : 0;

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Programmatic Crop Simulation</h3>
          <p className="mt-1 text-xs text-gray-400 max-w-2xl">
            Live previews across horizontal, square, vertical, mobile, and native programmatic inventory.
          </p>
        </div>
        <div className="rounded-xl border border-teal-400/25 bg-teal-500/10 px-4 py-2 text-center">
          <p className="text-[10px] uppercase tracking-wide text-teal-200/80">Avg suitability</p>
          <p className="text-xl font-bold text-teal-100 tabular-nums">{avgSuitability}</p>
        </div>
      </div>

      <StudioTabBar
        tabs={PROGRAMMATIC_CROP_GROUPS.map((g) => ({ id: g.id, label: g.label }))}
        activeTab={activeCategory}
        onChange={setActiveCategory}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((simulation) => (
          <CropPreviewCard
            key={simulation.cropId}
            simulation={simulation}
            imageUrl={imageUrl}
            imageW={imageSize.width}
            imageH={imageSize.height}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filtered.map((simulation) => (
          <div key={`detail-${simulation.cropId}`} className="rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-xs font-semibold text-white">{simulation.label}</p>
              <span className="text-[10px] text-gray-500 font-mono">{simulation.sizeLabel}</span>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] mb-3">
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-200">{simulation.visibleCount} visible</span>
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-200">{simulation.partialCount} partial</span>
              <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-red-200">{simulation.hiddenCount} hidden</span>
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
