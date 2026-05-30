"use client";

import { useState } from "react";
import { INSTAGRAM } from "@/app/lib/platformDesignTokens";
import { getCreativeAspectRatio } from "../../previewUtils";
import {
  BrandAvatar,
  DeviceChrome,
  EnvironmentPreviewCard,
  InstagramLogo,
  MediaFrame,
  ScaledDeviceEnvironment,
} from "../../shared/envShared";

function FeedCard({ creative, aspectRatio }) {
  return (
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
      <p className="px-3 text-sm"><span className="font-semibold">{creative.pageName || "brand"} </span>{creative.primaryText || creative.description}</p>
      <button type="button" className="mx-3 mt-2 w-[calc(100%-1.5rem)] rounded-lg bg-[#0095f6] py-2 text-sm font-semibold text-white">{creative.cta || "Shop Now"}</button>
    </div>
  );
}

export default function InstagramFeedEnvironment({ creative, deviceMode = "mobile", onCopy, onEdit }) {
  const [scaleLabel, setScaleLabel] = useState(null);
  const aspectRatio = getCreativeAspectRatio(creative);

  return (
    <EnvironmentPreviewCard
      creative={creative}
      platformBadge="Instagram Feed"
      badgeClassName="bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-100 border-pink-400/30"
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
          <DeviceChrome isMobile={isMobile} width={width} height={height} className={isMobile ? "border-8" : ""} style={{ fontFamily: INSTAGRAM.font }}>
            {isMobile ? (
              <div>
                <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: INSTAGRAM.border }}>
                  <InstagramLogo />
                  <div className="flex gap-3 text-lg"><span>＋</span><span>♥</span><span>✉</span></div>
                </div>
                <FeedCard creative={creative} aspectRatio={aspectRatio} />
              </div>
            ) : (
              <div className="flex h-full bg-[#fafafa]">
                <aside className="w-56 border-r p-4 text-sm">
                  {["Home", "Search", "Explore", "Reels", "Messages"].map((item) => (
                    <p key={item} className={`mb-3 ${item === "Home" ? "font-semibold" : "text-gray-500"}`}>{item}</p>
                  ))}
                </aside>
                <main className="mx-auto w-full max-w-[470px] border-x bg-white py-4">
                  <FeedCard creative={creative} aspectRatio={aspectRatio} />
                </main>
                <aside className="hidden w-72 p-4 lg:block">
                  <p className="text-sm font-semibold text-gray-600">Suggested for you</p>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="mt-3 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gray-200" />
                      <span className="text-xs">Suggested account {i}</span>
                    </div>
                  ))}
                </aside>
              </div>
            )}
          </DeviceChrome>
        )}
      </ScaledDeviceEnvironment>
    </EnvironmentPreviewCard>
  );
}
