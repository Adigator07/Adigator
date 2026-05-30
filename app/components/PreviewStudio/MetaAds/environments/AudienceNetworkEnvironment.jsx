"use client";

import { useState } from "react";
import {
  AdChoicesMark,
  AdImage,
  DeviceChrome,
  DisplayAdSlot,
  EnvironmentPreviewCard,
  MediaFrame,
  ScaledDeviceEnvironment,
} from "../../shared/envShared";

export default function AudienceNetworkEnvironment({ creative, deviceMode = "mobile", onCopy, onEdit }) {
  const [scaleLabel, setScaleLabel] = useState(null);

  return (
    <EnvironmentPreviewCard
      creative={creative}
      platformBadge="Audience Network"
      badgeClassName="bg-indigo-500/20 text-indigo-100 border-indigo-400/30"
      scaleLabel={scaleLabel}
      deviceMode={deviceMode}
      onCopy={onCopy}
      onEdit={onEdit}
    >
      <ScaledDeviceEnvironment
        deviceMode={deviceMode}
        mobile={{ width: 390, height: 820 }}
        desktop={{ width: 1200, height: 760 }}
        onScaleChange={(s) => setScaleLabel(s < 0.995 ? `Scaled ${Math.round(s * 100)}%` : null)}
      >
        {({ isMobile, width, height }) => (
          <DeviceChrome isMobile={isMobile} width={width} height={height} className={isMobile ? "border-8" : ""}>
            {isMobile ? (
              <div className="relative flex h-full flex-col bg-white">
                <div className="flex justify-between px-5 pt-3 text-xs font-semibold"><span>9:41</span><span>▮▮▮ 🔋</span></div>
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <span className="font-bold text-indigo-700">TechReader</span>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-20">
                  <div className="relative overflow-hidden rounded-xl border">
                    <MediaFrame creative={creative} aspectRatio="16 / 9" />
                    <div className="p-3">
                      <p className="text-sm font-semibold">{creative.headline}</p>
                      <p className="text-xs text-gray-500">Sponsored</p>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-x-3 bottom-12 z-10">
                  <div className="relative overflow-hidden rounded border bg-white" style={{ height: 50 }}>
                    <AdImage creative={creative} className="absolute inset-0" />
                    <AdChoicesMark className="absolute bottom-0.5 right-6 scale-75" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full bg-white">
                <main className="flex-1 p-6">
                  <p className="text-2xl font-serif font-bold">TechReader Daily</p>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-700">
                    Publisher article content with in-feed and sidebar Audience Network inventory.
                  </p>
                  <div className="mt-6 max-w-md overflow-hidden rounded-xl border">
                    <MediaFrame creative={creative} aspectRatio="16 / 9" />
                    <div className="p-3">
                      <p className="text-sm font-semibold">{creative.headline}</p>
                      <p className="text-xs text-gray-500">Audience Network · Sponsored</p>
                    </div>
                  </div>
                </main>
                <aside className="w-80 border-l p-4">
                  <DisplayAdSlot creative={creative} width={300} height={250} label="Sidebar · 300×250" />
                  <DisplayAdSlot creative={creative} width={300} height={600} label="Half Page · 300×600" className="mt-4" />
                </aside>
              </div>
            )}
          </DeviceChrome>
        )}
      </ScaledDeviceEnvironment>
    </EnvironmentPreviewCard>
  );
}
