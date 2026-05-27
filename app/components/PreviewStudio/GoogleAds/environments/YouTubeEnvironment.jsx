"use client";

import { useState } from "react";
import { YOUTUBE } from "@/app/lib/platformDesignTokens";
import { pickBestAdSlot } from "../../previewUtils";
import {
  AdChoicesMark,
  DisplayAdSlot,
  EnvironmentPreviewCard,
  MediaFrame,
  ScaledEnvironment,
  YouTubeLogo,
} from "../../shared/envShared";

const SIDEBAR_SLOTS = [
  { id: "medium", width: 300, height: 250, size: "300x250" },
  { id: "large", width: 300, height: 600, size: "300x600" },
];

export default function YouTubeEnvironment({ creative, deviceMode, onCopy, onEdit }) {
  const [scaleLabel, setScaleLabel] = useState(null);
  const isSkippable = creative.type !== "youtube_bumper";
  const sidebarSlot = pickBestAdSlot(creative.size, SIDEBAR_SLOTS) || SIDEBAR_SLOTS[0];

  return (
    <EnvironmentPreviewCard
      creative={creative}
      platformBadge="YouTube"
      badgeClassName="bg-red-500/20 text-red-100 border-red-400/30"
      scaleLabel={scaleLabel}
      onCopy={onCopy}
      onEdit={onEdit}
    >
      <ScaledEnvironment naturalWidth={1100} naturalHeight={680} onScaleChange={(s) => setScaleLabel(s < 0.995 ? `Scaled ${Math.round(s * 100)}%` : null)}>
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
                <MediaFrame creative={creative} aspectRatio="16 / 9" />
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
                <div className="absolute bottom-12 left-3 rounded bg-black/50 px-2 py-1 text-[10px]">{creative.displayUrl || "Visit advertiser"}</div>
              </div>
              <h1 className="mt-3 text-lg font-semibold">{creative.headline || "Sponsored Video"}</h1>
              <div className="mt-2 flex items-center gap-3 text-sm text-gray-300">
                <span className="inline-block h-8 w-8 rounded-full bg-gray-600" />
                <span>{creative.pageName || creative.storeName || "Brand Channel"}</span>
                <button type="button" className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-black">Subscribe</button>
                <span className="text-gray-500">1.2M views · Sponsored</span>
              </div>
            </div>
            <div className="w-[320px] space-y-3 border-l border-[#272727] p-3">
              <p className="text-xs uppercase text-gray-400">Up next</p>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-2">
                  <div className="h-16 w-28 rounded bg-[#272727]" />
                  <div className="text-xs text-gray-300"><p className="line-clamp-2">Suggested video title {i}</p><p className="mt-1 text-gray-500">Channel · 120K views</p></div>
                </div>
              ))}
              <DisplayAdSlot
                creative={creative}
                width={sidebarSlot.width}
                height={sidebarSlot.height}
                label="Display companion ad"
                className="mt-4"
              />
            </div>
          </div>
        </div>
      </ScaledEnvironment>
    </EnvironmentPreviewCard>
  );
}
