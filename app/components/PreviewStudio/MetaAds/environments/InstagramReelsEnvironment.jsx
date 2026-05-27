"use client";

import { useState } from "react";
import { INSTAGRAM } from "@/app/lib/platformDesignTokens";
import {
  AdImage,
  BrandAvatar,
  EnvironmentPreviewCard,
  PhoneFrame,
  ScaledEnvironment,
} from "../../shared/envShared";

export default function InstagramReelsEnvironment({ creative, onCopy, onEdit }) {
  const [scaleLabel, setScaleLabel] = useState(null);

  return (
    <EnvironmentPreviewCard
      creative={creative}
      platformBadge="Instagram Reels"
      badgeClassName="bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-100 border-pink-400/30"
      scaleLabel={scaleLabel}
      onCopy={onCopy}
      onEdit={onEdit}
    >
      <ScaledEnvironment naturalWidth={375} naturalHeight={812} onScaleChange={(s) => setScaleLabel(s < 0.995 ? `Scaled ${Math.round(s * 100)}%` : null)}>
        <PhoneFrame width={375} height={812} className="border-[8px] bg-black" style={{ fontFamily: INSTAGRAM.font }}>
          <div className="relative h-full w-full overflow-hidden text-white">
            <AdImage creative={creative} className="absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30" />
            <p className="absolute inset-x-0 top-4 text-center font-bold">Reels</p>
            <div className="absolute right-3 top-28 flex flex-col items-center gap-5 text-sm">
              <div className="relative">
                <BrandAvatar creative={creative} size={40} />
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-[#0095f6] px-1 text-[10px]">+</span>
              </div>
              <div className="text-center"><div>♡</div><div className="text-xs">12.4K</div></div>
              <div className="text-center"><div>💬</div><div className="text-xs">318</div></div>
              <div className="text-center"><div>↗</div><div className="text-xs">Share</div></div>
              <div>···</div>
              <div className="h-8 w-8 rounded-full border-2 border-white/70 bg-gray-700" />
            </div>
            <div className="absolute bottom-24 left-3 right-16">
              <p className="font-semibold">@{creative.pageName || "brandname"}</p>
              <span className="mt-1 inline-block rounded bg-white/20 px-2 py-0.5 text-[10px]">Sponsored</span>
              <p className="mt-2 line-clamp-2 text-sm">{creative.primaryText || creative.description}</p>
              <p className="mt-2 text-xs text-white/80">🎵 Original Audio · {creative.pageName || "brand"}</p>
            </div>
            <button type="button" className="absolute inset-x-3 bottom-14 rounded-lg bg-white py-3 text-sm font-semibold text-black">{creative.cta || "Shop Now"} ↗</button>
            <div className="absolute inset-x-0 bottom-0 flex justify-around bg-black/80 py-2 text-[10px]">
              {["Home", "Search", "Reels", "Shop", "Profile"].map((l) => <span key={l}>{l}</span>)}
            </div>
          </div>
        </PhoneFrame>
      </ScaledEnvironment>
    </EnvironmentPreviewCard>
  );
}
