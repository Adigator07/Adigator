"use client";

import { useState } from "react";
import { parseSize } from "../../previewUtils";
import {
  AdChoicesMark,
  AdImage,
  EnvironmentPreviewCard,
  PhoneFrame,
  ScaledEnvironment,
} from "../../shared/envShared";

export default function MobileAppEnvironment({ creative, deviceMode, onCopy, onEdit }) {
  const [scaleLabel, setScaleLabel] = useState(null);
  const isInterstitial = creative.type === "interstitial_ad" || creative.size === "320x480";
  const dims = parseSize(creative.size);
  const bannerHeight = dims?.height && dims.height <= 100 ? dims.height : 50;

  return (
    <EnvironmentPreviewCard
      creative={creative}
      platformBadge="Mobile App / AdMob"
      badgeClassName="bg-emerald-500/20 text-emerald-100 border-emerald-400/30"
      scaleLabel={scaleLabel}
      onCopy={onCopy}
      onEdit={onEdit}
    >
      <ScaledEnvironment naturalWidth={390} naturalHeight={844} onScaleChange={(s) => setScaleLabel(s < 0.995 ? `Scaled ${Math.round(s * 100)}%` : null)}>
        <PhoneFrame width={390} height={844} className="border-8 bg-gray-900">
          <div className="relative flex h-full flex-col bg-white">
            <div className="flex justify-between px-6 pt-3 text-xs font-semibold"><span>9:41</span><span>▮▮▮ 🔋</span></div>
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span>‹</span>
              <span className="font-semibold">Level Runner</span>
              <span>⚙</span>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-indigo-100 to-white p-6 text-center">
              <p className="text-2xl font-bold text-indigo-900">Level Complete!</p>
              <p className="mt-2 text-sm text-gray-600">Score: 12,450</p>
              {!isInterstitial ? (
                <button type="button" className="mt-6 rounded-full bg-indigo-600 px-6 py-2 text-sm text-white">Watch ad for bonus coins</button>
              ) : null}
            </div>
            {isInterstitial ? (
              <div className="absolute inset-0 z-10 flex flex-col bg-black/90">
                <div className="flex items-center justify-between px-4 py-3 text-xs text-white">
                  <span>Ad · 3 of 5 seconds</span>
                  <span className="rounded bg-white/20 px-2 py-1">✕ Close Ad</span>
                </div>
                <div className="flex flex-1 items-center justify-center p-4">
                  <div className="relative h-[480px] w-[320px] overflow-hidden rounded-lg bg-white">
                    <AdImage creative={creative} className="absolute inset-0" />
                    <AdChoicesMark className="absolute top-2 right-2" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-t bg-gray-100">
                <div className="relative mx-auto my-1 overflow-hidden border border-gray-300 bg-white" style={{ width: 320, height: bannerHeight }}>
                  <AdImage creative={creative} className="absolute inset-0" />
                  <span className="absolute left-1 top-0.5 rounded bg-black/50 px-1 text-[8px] text-white">Ad</span>
                  <span className="absolute right-1 top-0.5 text-[10px] text-gray-500">✕</span>
                </div>
                <div className="flex justify-around border-t py-2 text-[10px] text-gray-600">
                  <span>Home</span><span>Play</span><span>Store</span><span>Profile</span>
                </div>
              </div>
            )}
          </div>
        </PhoneFrame>
      </ScaledEnvironment>
    </EnvironmentPreviewCard>
  );
}
