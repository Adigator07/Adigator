"use client";

import { useState } from "react";
import { INSTAGRAM } from "@/app/lib/platformDesignTokens";
import { getCreativeAspectRatio } from "../../previewUtils";
import {
  BrandAvatar,
  EnvironmentPreviewCard,
  InstagramLogo,
  MediaFrame,
  PhoneFrame,
  ScaledEnvironment,
} from "../../shared/envShared";

export default function InstagramFeedEnvironment({ creative, deviceMode, onCopy, onEdit }) {
  const [scaleLabel, setScaleLabel] = useState(null);
  const aspectRatio = getCreativeAspectRatio(creative);

  return (
    <EnvironmentPreviewCard
      creative={creative}
      platformBadge="Instagram Feed"
      badgeClassName="bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-100 border-pink-400/30"
      scaleLabel={scaleLabel}
      onCopy={onCopy}
      onEdit={onEdit}
    >
      <ScaledEnvironment naturalWidth={390} naturalHeight={820} onScaleChange={(s) => setScaleLabel(s < 0.995 ? `Scaled ${Math.round(s * 100)}%` : null)}>
        <PhoneFrame width={390} height={820} className="border-8" style={{ fontFamily: INSTAGRAM.font }}>
          <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: INSTAGRAM.border }}>
            <InstagramLogo />
            <div className="flex gap-3 text-lg"><span>＋</span><span>♥</span><span>✉</span></div>
          </div>
          <div className="flex gap-3 overflow-x-auto px-3 py-3">
            {["Your story", "maya", "noah", "ella", "liam"].map((name, i) => (
              <div key={name} className="shrink-0 text-center">
                <div className="rounded-full p-[2px]" style={{ background: i === 0 ? "#dbdbdb" : INSTAGRAM.storyGradient }}>
                  <div className="h-12 w-12 rounded-full border-2 border-white bg-gray-200" />
                </div>
                <p className="mt-1 w-12 truncate text-[10px]">{name}</p>
              </div>
            ))}
          </div>
          <div className="border-b pb-3" style={{ borderColor: INSTAGRAM.border }}>
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2">
                <BrandAvatar creative={creative} size={32} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: INSTAGRAM.text }}>{creative.pageName || creative.headline}</p>
                  <p className="text-[10px]" style={{ color: INSTAGRAM.secondary }}>Sponsored</p>
                </div>
              </div>
              <span>···</span>
            </div>
            <MediaFrame creative={creative} aspectRatio={aspectRatio} />
            <div className="flex justify-between px-3 pt-2 text-xl"><span>♡ 💬 ↗</span><span>⌁</span></div>
            <p className="px-3 pt-1 text-sm font-semibold">Liked by username and 2,847 others</p>
            <p className="px-3 text-sm"><span className="font-semibold">{creative.pageName || "brand"} </span>{creative.primaryText || creative.description} <span style={{ color: INSTAGRAM.secondary }}>more</span></p>
            <button type="button" className="mx-3 mt-2 w-[calc(100%-1.5rem)] rounded-lg bg-[#0095f6] py-2 text-sm font-semibold text-white">{creative.cta || "Shop Now"}</button>
            <p className="px-3 pt-2 text-[10px] uppercase tracking-wide" style={{ color: INSTAGRAM.secondary }}>2 hours ago</p>
          </div>
        </PhoneFrame>
      </ScaledEnvironment>
    </EnvironmentPreviewCard>
  );
}
