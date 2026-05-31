"use client";

import { useState } from "react";
import { GMAIL } from "@/app/lib/platformDesignTokens";
import {
  BrandAvatar,
  DeviceChrome,
  EnvironmentPreviewCard,
  MediaFrame,
  ScaledDeviceEnvironment,
} from "../../shared/envShared";

export default function GmailEnvironment({ creative, deviceMode = "desktop", onCopy, onEdit }) {
  const [scaleLabel, setScaleLabel] = useState(null);

  return (
    <EnvironmentPreviewCard
      creative={creative}
      platformBadge="Gmail Promotions"
      badgeClassName="bg-amber-500/20 text-amber-100 border-amber-400/30"
      scaleLabel={scaleLabel}
      deviceMode={deviceMode}
      hideSizeLabel
      onCopy={onCopy}
      onEdit={onEdit}
    >
      <ScaledDeviceEnvironment
        deviceMode={deviceMode}
        mobile={{ width: 390, height: 780 }}
        desktop={{ width: 980, height: 720 }}
        onScaleChange={(s) => setScaleLabel(s < 0.995 ? `Scaled ${Math.round(s * 100)}%` : null)}
      >
        {({ isMobile, width, height }) => (
          <DeviceChrome isMobile={isMobile} width={width} height={height}>
            {isMobile ? (
              <div className="flex h-full flex-col" style={{ background: GMAIL.bg, fontFamily: GMAIL.font }}>
                <div className="flex justify-between px-5 pt-3 text-xs font-semibold"><span>9:41</span><span>▮▮▮ 🔋</span></div>
                <div className="border-b px-4 py-3 text-sm font-semibold">Promotions</div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  <div className="flex items-center gap-3 rounded-lg border bg-[#fef7e0] px-3 py-3">
                    <BrandAvatar creative={creative} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{creative.headline}</p>
                      <p className="truncate text-xs text-gray-600">{creative.description}</p>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-lg border">
                    <MediaFrame creative={creative} aspectRatio="2.5 / 1" fit="contain" />
                    <div className="p-3">
                      <h2 className="text-base font-semibold">{creative.headline}</h2>
                      <button type="button" className="mt-3 rounded bg-[#1a73e8] px-4 py-2 text-xs font-medium text-white">{creative.cta || "Shop Now"}</button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ width: 980, height: 720, background: GMAIL.bg, fontFamily: GMAIL.font }} className="flex">
                <aside className="w-56 border-r p-4" style={{ background: GMAIL.sidebar }}>
                  <button type="button" className="mb-4 w-full rounded-2xl bg-[#c2e7ff] px-4 py-3 text-sm font-medium">Compose</button>
                  {["Inbox", "Starred", "Sent", "Promotions"].map((item) => (
                    <p key={item} className={`rounded-full px-3 py-2 text-sm ${item === "Promotions" ? "font-semibold" : ""}`} style={item === "Promotions" ? { background: GMAIL.active } : {}}>{item}</p>
                  ))}
                </aside>
                <main className="flex-1 overflow-y-auto">
                  <div className="m-4 overflow-hidden rounded-lg border">
                    <MediaFrame creative={creative} aspectRatio="2.5 / 1" fit="contain" />
                    <div className="p-4">
                      <h2 className="text-xl font-semibold">{creative.headline}</h2>
                      <p className="mt-2 text-sm text-gray-600">{creative.description}</p>
                      <button type="button" className="mt-4 rounded bg-[#1a73e8] px-5 py-2 text-sm font-medium text-white">{creative.cta || "Shop Now"}</button>
                    </div>
                  </div>
                </main>
              </div>
            )}
          </DeviceChrome>
        )}
      </ScaledDeviceEnvironment>
    </EnvironmentPreviewCard>
  );
}
