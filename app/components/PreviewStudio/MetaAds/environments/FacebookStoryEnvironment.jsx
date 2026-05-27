"use client";

import { useState } from "react";
import {
  AdImage,
  BrandAvatar,
  EnvironmentPreviewCard,
  PhoneFrame,
  ScaledEnvironment,
} from "../../shared/envShared";

export default function FacebookStoryEnvironment({ creative, onCopy, onEdit }) {
  const [scaleLabel, setScaleLabel] = useState(null);

  return (
    <EnvironmentPreviewCard
      creative={creative}
      platformBadge="Facebook Stories"
      badgeClassName="bg-[#1877F2]/20 text-blue-100 border-blue-400/30"
      scaleLabel={scaleLabel}
      onCopy={onCopy}
      onEdit={onEdit}
    >
      <ScaledEnvironment naturalWidth={375} naturalHeight={812} onScaleChange={(s) => setScaleLabel(s < 0.995 ? `Scaled ${Math.round(s * 100)}%` : null)}>
        <PhoneFrame width={375} height={812} className="border-[8px] bg-black">
          <div className="relative h-full w-full overflow-hidden text-white">
            <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-3 py-3" style={{ background: "#1877F2" }}>
              <span className="font-bold">f</span>
              <span>×</span>
            </div>
            <AdImage creative={creative} className="absolute inset-0" />
            <div className="absolute inset-x-3 top-16 flex gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-0.5 flex-1 bg-white/30">
                  <div className={`h-full bg-white ${i === 1 ? "w-1/2" : "w-0"}`} />
                </div>
              ))}
            </div>
            <div className="absolute left-3 top-24 flex items-center gap-2">
              <BrandAvatar creative={creative} size={28} />
              <span className="text-sm font-semibold">{creative.pageName || creative.headline}</span>
              <span className="text-xs text-white/80">Sponsored</span>
            </div>
            <div className="absolute inset-x-4 bottom-8">
              <button type="button" className="w-full rounded-lg py-3 font-semibold text-white" style={{ background: "#1877F2" }}>{creative.cta || "Learn More"}</button>
              <p className="mt-2 text-center text-xs text-white/80">Swipe up</p>
            </div>
          </div>
        </PhoneFrame>
      </ScaledEnvironment>
    </EnvironmentPreviewCard>
  );
}
