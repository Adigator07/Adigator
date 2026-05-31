"use client";

import { useState } from "react";
import { GOOGLE } from "@/app/lib/platformDesignTokens";
import {
  DeviceChrome,
  EnvironmentPreviewCard,
  GoogleLogo,
  MediaFrame,
  ScaledDeviceEnvironment,
} from "../../shared/envShared";

export default function GoogleDiscoverEnvironment({ creative, deviceMode = "mobile", onCopy, onEdit }) {
  const [scaleLabel, setScaleLabel] = useState(null);

  return (
    <EnvironmentPreviewCard
      creative={creative}
      platformBadge="Google Discover"
      badgeClassName="bg-orange-500/20 text-orange-100 border-orange-400/30"
      scaleLabel={scaleLabel}
      deviceMode={deviceMode}
      hideSizeLabel
      onCopy={onCopy}
      onEdit={onEdit}
    >
      <ScaledDeviceEnvironment
        deviceMode={deviceMode}
        mobile={{ width: 390, height: 780 }}
        desktop={{ width: 1200, height: 760 }}
        onScaleChange={(s) => setScaleLabel(s < 0.995 ? `Scaled ${Math.round(s * 100)}%` : null)}
      >
        {({ isMobile, width, height }) => (
          <DeviceChrome isMobile={isMobile} width={width} height={height} className={isMobile ? "border-8" : ""}>
            {isMobile ? (
              <div className="flex h-full flex-col bg-white" style={{ fontFamily: GOOGLE.font }}>
                <div className="flex justify-between px-5 pt-3 text-xs font-semibold"><span>9:41</span><span>▮▮▮ 🔋</span></div>
                <div className="flex items-center gap-2 px-4 py-3">
                  <GoogleLogo />
                  <span className="text-sm font-medium">Discover</span>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto px-3 pb-4">
                  <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                    <MediaFrame creative={creative} aspectRatio="16 / 9" fit="contain" />
                    <div className="p-3">
                      <p className="text-[10px] text-gray-500">Sponsored · {creative.storeName || creative.pageName || "Brand"}</p>
                      <p className="mt-1 text-sm font-semibold text-[#202124]">{creative.headline}</p>
                    </div>
                  </div>
                  {[1, 2].map((i) => (
                    <div key={i} className="rounded-2xl border p-3">
                      <div className="mb-2 h-24 rounded-xl bg-gray-100" />
                      <p className="text-sm font-medium">Organic discover card headline {i}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full bg-[#f8f9fa] p-6" style={{ fontFamily: GOOGLE.font }}>
                <div className="mb-6 flex items-center gap-3">
                  <GoogleLogo />
                  <span className="text-lg font-medium text-[#202124]">Discover</span>
                </div>
                <div className="grid max-w-5xl grid-cols-3 gap-4">
                  <div className="col-span-2 overflow-hidden rounded-2xl border bg-white shadow-sm">
                    <MediaFrame creative={creative} aspectRatio="16 / 9" fit="contain" />
                    <div className="p-4">
                      <p className="text-xs text-gray-500">Sponsored · {creative.storeName || creative.pageName || "Brand"}</p>
                      <p className="mt-2 text-xl font-semibold text-[#202124]">{creative.headline}</p>
                      <p className="mt-2 text-sm text-gray-600">{creative.description}</p>
                    </div>
                  </div>
                  {[1, 2].map((i) => (
                    <div key={i} className="rounded-2xl border bg-white p-4">
                      <div className="mb-3 h-28 rounded-xl bg-gray-100" />
                      <p className="text-sm font-medium">Discover card {i}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DeviceChrome>
        )}
      </ScaledDeviceEnvironment>
    </EnvironmentPreviewCard>
  );
}
