"use client";

import { useState } from "react";
import {
  AdChoicesMark,
  AdImage,
  EnvironmentPreviewCard,
  MediaFrame,
  PhoneFrame,
  ScaledEnvironment,
} from "../../shared/envShared";

export default function AudienceNetworkEnvironment({ creative, onCopy, onEdit }) {
  const [scaleLabel, setScaleLabel] = useState(null);

  return (
    <EnvironmentPreviewCard
      creative={creative}
      platformBadge="Audience Network"
      badgeClassName="bg-indigo-500/20 text-indigo-100 border-indigo-400/30"
      scaleLabel={scaleLabel}
      onCopy={onCopy}
      onEdit={onEdit}
    >
      <ScaledEnvironment naturalWidth={390} naturalHeight={820} onScaleChange={(s) => setScaleLabel(s < 0.995 ? `Scaled ${Math.round(s * 100)}%` : null)}>
        <PhoneFrame width={390} height={820} className="border-8">
          <div className="relative flex h-full flex-col bg-white">
            <div className="flex justify-between px-5 pt-3 text-xs font-semibold">
              <span>9:41</span>
              <span>▮▮▮ 🔋</span>
            </div>
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span className="font-bold text-indigo-700">TechReader</span>
              <span className="text-xs text-gray-500">☰</span>
            </div>
            <div className="flex gap-4 overflow-x-auto border-b px-4 py-2 text-xs text-gray-600">
              {["Home", "Trending", "Bookmarks", "Profile"].map((t, i) => (
                <span key={t} className={i === 0 ? "shrink-0 border-b-2 border-indigo-600 pb-1 font-semibold text-indigo-600" : "shrink-0"}>{t}</span>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-20">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-xl border p-3">
                  <div className="mb-2 h-20 rounded-lg bg-gray-100" />
                  <p className="text-sm font-semibold">Article headline {i}</p>
                  <p className="text-xs text-gray-500">TechReader · 4 min read</p>
                </div>
              ))}
              <div className="relative overflow-hidden rounded-xl border">
                <MediaFrame creative={creative} aspectRatio="16 / 9" />
                <span className="absolute top-2 left-2 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white">Sponsored</span>
                <div className="p-3">
                  <p className="text-sm font-semibold">{creative.headline}</p>
                  <p className="text-xs text-gray-500">{creative.storeName || creative.pageName || "Brand"} · Sponsored</p>
                  <p className="mt-2 text-[10px] text-gray-400">Sponsored by {creative.pageName || creative.headline}</p>
                </div>
                <span className="absolute bottom-2 right-2 text-[8px] text-gray-400">Audience Network</span>
              </div>
            </div>
            <div className="absolute inset-x-3 bottom-12 z-10">
              <div className="relative overflow-hidden rounded border bg-white" style={{ height: 50 }}>
                <AdImage creative={creative} className="absolute inset-0" />
                <span className="absolute top-1 left-1 rounded bg-black/50 px-1 text-[8px] text-white">Ad</span>
                <span className="absolute top-1 right-1 text-[10px] text-gray-500">✕</span>
                <AdChoicesMark className="absolute bottom-0.5 right-6 scale-75" />
              </div>
            </div>
          </div>
        </PhoneFrame>
      </ScaledEnvironment>
    </EnvironmentPreviewCard>
  );
}
