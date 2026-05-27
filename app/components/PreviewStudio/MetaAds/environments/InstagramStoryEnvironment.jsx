"use client";

import { useState } from "react";
import {
  AdImage,
  BrandAvatar,
  EnvironmentPreviewCard,
  PhoneFrame,
  ScaledEnvironment,
} from "../../shared/envShared";

export default function InstagramStoryEnvironment({ creative, onCopy, onEdit }) {
  const [scaleLabel, setScaleLabel] = useState(null);

  return (
    <EnvironmentPreviewCard
      creative={creative}
      platformBadge="Instagram Stories"
      badgeClassName="bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-100 border-pink-400/30"
      scaleLabel={scaleLabel}
      onCopy={onCopy}
      onEdit={onEdit}
    >
      <ScaledEnvironment naturalWidth={375} naturalHeight={812} onScaleChange={(s) => setScaleLabel(s < 0.995 ? `Scaled ${Math.round(s * 100)}%` : null)}>
        <PhoneFrame width={375} height={812} className="border-[8px] bg-black">
          <div className="relative h-full w-full overflow-hidden text-white">
            <AdImage creative={creative} className="absolute inset-0" />
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/75 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/85 to-transparent" />
            <div className="absolute inset-x-3 top-3 flex gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-0.5 flex-1 overflow-hidden rounded bg-white/30">
                  <div className={`h-full bg-white ${i === 0 ? "w-full" : i === 1 ? "w-1/2" : "w-0"}`} />
                </div>
              ))}
            </div>
            <div className="absolute inset-x-3 top-8 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BrandAvatar creative={creative} size={32} />
                <div>
                  <p className="text-sm font-semibold">{creative.pageName || creative.headline}</p>
                  <p className="text-[10px] text-white/80">Sponsored · 2h</p>
                </div>
              </div>
              <span className="text-xl">×</span>
            </div>
            <div className="absolute inset-x-4 bottom-24">
              <p className="inline-block rounded-full bg-black/45 px-3 py-1 text-sm font-semibold">{creative.headline}</p>
            </div>
            <div className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-1">
              <button type="button" className="rounded-full bg-white/95 px-5 py-2 text-sm font-semibold text-black">{creative.cta || "See More"}</button>
              <span className="text-lg text-white/80">⌃</span>
            </div>
          </div>
        </PhoneFrame>
      </ScaledEnvironment>
    </EnvironmentPreviewCard>
  );
}
