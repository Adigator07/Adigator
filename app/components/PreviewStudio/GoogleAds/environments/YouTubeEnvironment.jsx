"use client";

import { useState } from "react";
import { YOUTUBE } from "@/app/lib/platformDesignTokens";
import { pickBestAdSlot } from "../../previewUtils";
import {
  AdChoicesMark,
  DeviceChrome,
  DisplayAdSlot,
  EnvironmentPreviewCard,
  MediaFrame,
  ScaledDeviceEnvironment,
  YouTubeLogo,
} from "../../shared/envShared";

const SIDEBAR_SLOTS = [
  { id: "medium", width: 300, height: 250, size: "300x250" },
  { id: "large", width: 300, height: 600, size: "300x600" },
];

function MobileYouTubeLayout({ creative, isSkippable }) {
  return (
    <DeviceChrome isMobile width={390} height={780}>
      <div className="flex h-full flex-col" style={{ background: YOUTUBE.bgDark, fontFamily: YOUTUBE.font, color: YOUTUBE.text }}>
        <div className="flex justify-between px-5 pt-3 text-xs font-semibold text-white"><span>9:41</span><span>▮▮▮ 🔋</span></div>
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#272727]">
          <YouTubeLogo />
          <span className="text-lg text-white">🔔</span>
        </div>
        <div className="relative flex-1 bg-black">
          <MediaFrame creative={creative} aspectRatio="16 / 9" fit="contain" />
          {isSkippable ? (
            <div className="absolute bottom-16 right-3 rounded border border-white/20 bg-black/60 px-3 py-1 text-xs text-white">Skip Ad ›</div>
          ) : null}
          <AdChoicesMark className="absolute top-2 right-2 text-white/70" />
        </div>
        <div className="p-3">
          <h1 className="text-base font-semibold">{creative.headline || "Sponsored Video"}</h1>
          <p className="mt-1 text-xs text-gray-400">{creative.pageName || "Brand Channel"} · Sponsored</p>
        </div>
      </div>
    </DeviceChrome>
  );
}

function DesktopYouTubeLayout({ creative, isSkippable, sidebarSlot }) {
  return (
    <DeviceChrome isMobile={false} width={1100} height={680}>
      <div style={{ width: 1100, height: 680, background: YOUTUBE.bgDark, fontFamily: YOUTUBE.font, color: YOUTUBE.text }}>
        <div className="flex items-center justify-between border-b border-[#272727] px-4 py-2">
          <YouTubeLogo />
          <div className="mx-8 flex-1 rounded-full border border-[#303030] bg-[#121212] px-4 py-2 text-sm text-gray-300">Search</div>
          <button type="button" className="rounded-full border border-[#3ea6ff] px-4 py-1.5 text-sm text-[#3ea6ff]">Sign in</button>
        </div>
        <div className="flex h-[620px]">
          <div className="flex w-16 flex-col items-center gap-4 border-r border-[#272727] py-4 text-[10px] text-gray-400">
            {["Home", "Shorts", "Subs"].map((l) => <span key={l}>{l}</span>)}
          </div>
          <div className="flex-1 p-4">
            <div className="relative overflow-hidden rounded-xl bg-black">
              <MediaFrame creative={creative} aspectRatio="16 / 9" fit="contain" />
              <div className="absolute inset-x-0 bottom-0 flex h-10 items-end bg-gradient-to-t from-black/80 to-transparent px-3 pb-1">
                <div className="h-1 flex-1 rounded bg-gray-600"><div className="h-full w-[18%] rounded bg-[#ff0000]" /></div>
                <span className="ml-2 text-[10px] text-white">0:05 / 0:30</span>
              </div>
              {isSkippable ? (
                <div className="absolute bottom-12 right-3 rounded border border-white/20 bg-black/60 px-3 py-1 text-xs text-white">Skip Ad ›</div>
              ) : (
                <div className="absolute bottom-12 right-3 text-xs text-white/80">Ad plays in 5s</div>
              )}
              <AdChoicesMark className="absolute top-2 right-2 text-white/70" />
            </div>
            <h1 className="mt-3 text-lg font-semibold">{creative.headline || "Sponsored Video"}</h1>
          </div>
          <div className="w-[320px] space-y-3 border-l border-[#272727] p-3">
            <DisplayAdSlot
              creative={creative}
              width={sidebarSlot.width}
              height={sidebarSlot.height}
              showLabel={false}
              fitMode="contain"
              className="mt-4"
            />
          </div>
        </div>
      </div>
    </DeviceChrome>
  );
}

export default function YouTubeEnvironment({ creative, deviceMode = "desktop", onCopy, onEdit }) {
  const [scaleLabel, setScaleLabel] = useState(null);
  const isSkippable = creative.type !== "youtube_bumper";
  const sidebarSlot = pickBestAdSlot(creative.sourceCreativeSize || creative.size, SIDEBAR_SLOTS) || SIDEBAR_SLOTS[0];

  return (
    <EnvironmentPreviewCard
      creative={creative}
      platformBadge="YouTube"
      badgeClassName="bg-red-500/20 text-red-100 border-red-400/30"
      scaleLabel={scaleLabel}
      deviceMode={deviceMode}
      hideSizeLabel
      onCopy={onCopy}
      onEdit={onEdit}
    >
      <ScaledDeviceEnvironment
        deviceMode={deviceMode}
        mobile={{ width: 390, height: 780 }}
        desktop={{ width: 1100, height: 680 }}
        onScaleChange={(s) => setScaleLabel(s < 0.995 ? `Scaled ${Math.round(s * 100)}%` : null)}
      >
        {({ isMobile }) => (
          isMobile
            ? <MobileYouTubeLayout creative={creative} isSkippable={isSkippable} />
            : <DesktopYouTubeLayout creative={creative} isSkippable={isSkippable} sidebarSlot={sidebarSlot} />
        )}
      </ScaledDeviceEnvironment>
    </EnvironmentPreviewCard>
  );
}
