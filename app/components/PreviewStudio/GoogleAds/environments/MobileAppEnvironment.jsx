"use client";

import { useState } from "react";
import { parseSize } from "../../previewUtils";
import {
  AdChoicesMark,
  AdImage,
  DeviceChrome,
  EnvironmentPreviewCard,
  ScaledDeviceEnvironment,
  TemplateFitNotice,
} from "../../shared/envShared";
import { analyzeCreativeSlotFit, getCreativeSourceSize, getFitNoticeMessage } from "@/app/lib/creativeFitAnalysis";

export default function MobileAppEnvironment({ creative, deviceMode = "mobile", onCopy, onEdit }) {
  const [scaleLabel, setScaleLabel] = useState(null);
  const isInterstitial = creative.type === "interstitial_ad" || creative.size === "320x480";
  const dims = parseSize(getCreativeSourceSize(creative) || creative.size);
  const bannerHeight = dims?.height && dims.height <= 100 ? dims.height : 50;
  const interstitialFit = analyzeCreativeSlotFit(getCreativeSourceSize(creative), 320, isInterstitial ? 480 : bannerHeight, "cover");
  const interstitialNotice = getFitNoticeMessage(interstitialFit);

  return (
    <EnvironmentPreviewCard
      creative={creative}
      platformBadge="Mobile App / AdMob"
      badgeClassName="bg-emerald-500/20 text-emerald-100 border-emerald-400/30"
      scaleLabel={scaleLabel}
      deviceMode={deviceMode}
      onCopy={onCopy}
      onEdit={onEdit}
    >
      <ScaledDeviceEnvironment
        deviceMode={deviceMode}
        mobile={{ width: 390, height: 844 }}
        desktop={{ width: 1280, height: 820 }}
        forceMobile
        onScaleChange={(s) => setScaleLabel(s < 0.995 ? `Scaled ${Math.round(s * 100)}%` : null)}
      >
        {({ width, height }) => (
          <DeviceChrome isMobile width={width} height={height} className="border-8 bg-gray-900">
            <div className="relative flex h-full flex-col bg-white">
              <div className="flex justify-between px-6 pt-3 text-xs font-semibold"><span>9:41</span><span>▮▮▮ 🔋</span></div>
              <div className="flex items-center justify-between border-b px-4 py-3">
                <span>‹</span>
                <span className="font-semibold">Level Runner</span>
                <span>⚙</span>
              </div>
              <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-indigo-100 to-white p-6 text-center">
                <p className="text-2xl font-bold text-indigo-900">Level Complete!</p>
                {!isInterstitial ? (
                  <button type="button" className="mt-6 rounded-full bg-indigo-600 px-6 py-2 text-sm text-white">Watch ad for bonus coins</button>
                ) : null}
              </div>
              {isInterstitial ? (
                <div className="absolute inset-0 z-10 flex flex-col bg-black/90">
                  <div className="flex flex-1 items-center justify-center p-4">
                    <div className="relative h-[480px] w-[320px] overflow-hidden rounded-lg bg-white">
                      <AdImage creative={creative} className="absolute inset-0" fit={interstitialFit.fitMode || "cover"} />
                      <AdChoicesMark className="absolute top-2 right-2" />
                    </div>
                  </div>
                  <TemplateFitNotice message={interstitialNotice} className="mx-4 mb-4" />
                </div>
              ) : (
                <div className="border-t bg-gray-100">
                  <div className="relative mx-auto my-1 overflow-hidden border border-gray-300 bg-white" style={{ width: 320, height: bannerHeight }}>
                    <AdImage creative={creative} className="absolute inset-0" fit={interstitialFit.fitMode || "cover"} />
                    <span className="absolute left-1 top-0.5 rounded bg-black/50 px-1 text-[8px] text-white">Ad</span>
                  </div>
                  <TemplateFitNotice message={interstitialNotice} className="mx-3 mb-2" />
                </div>
              )}
            </div>
          </DeviceChrome>
        )}
      </ScaledDeviceEnvironment>
    </EnvironmentPreviewCard>
  );
}
