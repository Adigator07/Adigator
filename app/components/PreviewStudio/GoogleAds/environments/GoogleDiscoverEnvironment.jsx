"use client";

import { useState } from "react";
import { GOOGLE } from "@/app/lib/platformDesignTokens";
import {
  EnvironmentPreviewCard,
  GoogleLogo,
  MediaFrame,
  PhoneFrame,
  ScaledEnvironment,
} from "../../shared/envShared";

export default function GoogleDiscoverEnvironment({ creative, deviceMode, onCopy, onEdit }) {
  const [scaleLabel, setScaleLabel] = useState(null);

  return (
    <EnvironmentPreviewCard
      creative={creative}
      platformBadge="Google Discover"
      badgeClassName="bg-orange-500/20 text-orange-100 border-orange-400/30"
      scaleLabel={scaleLabel}
      onCopy={onCopy}
      onEdit={onEdit}
    >
      <ScaledEnvironment naturalWidth={390} naturalHeight={780} onScaleChange={(s) => setScaleLabel(s < 0.995 ? `Scaled ${Math.round(s * 100)}%` : null)}>
        <PhoneFrame width={390} height={780} className="border-8" style={{ fontFamily: GOOGLE.font }}>
          <div className="flex h-full flex-col bg-white">
            <div className="flex justify-between px-5 pt-3 text-xs font-semibold"><span>9:41</span><span>▮▮▮ 🔋</span></div>
            <div className="flex items-center gap-2 px-4 py-3">
              <GoogleLogo />
              <span className="text-sm font-medium">Discover</span>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto px-3 pb-4">
              <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                <MediaFrame creative={creative} aspectRatio="16 / 9" />
                <div className="p-3">
                  <p className="text-[10px] text-gray-500">Sponsored · {creative.storeName || creative.pageName || "Brand"}</p>
                  <p className="mt-1 text-sm font-semibold text-[#202124]">{creative.headline}</p>
                  <p className="mt-1 text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              {[1, 2].map((i) => (
                <div key={i} className="rounded-2xl border p-3">
                  <div className="mb-2 h-24 rounded-xl bg-gray-100" />
                  <p className="text-xs text-gray-500">Publisher {i}</p>
                  <p className="text-sm font-medium">Organic discover card headline</p>
                </div>
              ))}
            </div>
          </div>
        </PhoneFrame>
      </ScaledEnvironment>
    </EnvironmentPreviewCard>
  );
}
