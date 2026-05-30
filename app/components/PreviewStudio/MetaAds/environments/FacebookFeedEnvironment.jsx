"use client";

import { useState } from "react";
import { FACEBOOK } from "@/app/lib/platformDesignTokens";
import { getCreativeAspectRatio } from "../../previewUtils";
import {
  BrandAvatar,
  EnvironmentPreviewCard,
  FacebookLogo,
  MediaFrame,
  PhoneFrame,
  ScaledEnvironment,
} from "../../shared/envShared";

function FeedPost({ creative, isAd = false }) {
  const aspectRatio = isAd ? getCreativeAspectRatio(creative) : "16 / 9";

  return (
    <div className="overflow-hidden rounded-lg border bg-white shadow-sm" style={{ borderColor: FACEBOOK.border }}>
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <BrandAvatar creative={creative} size={36} />
          <div>
            <p className="text-sm font-semibold" style={{ color: FACEBOOK.text }}>{creative.pageName || creative.headline}</p>
            <p className="text-xs" style={{ color: FACEBOOK.secondary }}>{isAd ? "Sponsored · 🌐" : "2h · 🌐"}</p>
          </div>
        </div>
        <span style={{ color: FACEBOOK.secondary }}>···</span>
      </div>
      {isAd ? (
        <p className="px-3 pb-2 text-sm" style={{ color: FACEBOOK.text }}>{creative.primaryText || creative.description}</p>
      ) : null}
      {isAd ? (
        <MediaFrame creative={creative} aspectRatio={aspectRatio} />
      ) : (
        <div className="aspect-video bg-gray-200" />
      )}
      {isAd ? (
        <div className="flex items-center justify-between gap-3 border-t px-3 py-2" style={{ borderColor: FACEBOOK.border, background: "#f7f8fa" }}>
          <div className="min-w-0">
            <p className="truncate text-xs uppercase text-gray-500">{creative.displayUrl || "example.com"}</p>
            <p className="truncate text-sm font-semibold" style={{ color: FACEBOOK.text }}>{creative.headline}</p>
            <p className="truncate text-xs" style={{ color: FACEBOOK.secondary }}>{creative.description2 || creative.description}</p>
          </div>
          <button type="button" className="shrink-0 rounded-md px-4 py-2 text-sm font-semibold text-white" style={{ background: FACEBOOK.primary }}>{creative.cta || "Shop Now"}</button>
        </div>
      ) : null}
      <div className="flex gap-4 px-3 py-2 text-sm font-semibold" style={{ color: FACEBOOK.secondary }}>
        <span>👍 Like</span><span>💬 Comment</span><span>↗ Share</span>
      </div>
      {isAd ? <p className="px-3 pb-3 text-xs" style={{ color: FACEBOOK.secondary }}>👍❤️ 1.2K · 43 comments · 12 shares</p> : null}
    </div>
  );
}

export default function FacebookFeedEnvironment({ creative, deviceMode, onCopy, onEdit }) {
  const [scaleLabel, setScaleLabel] = useState(null);

  return (
    <EnvironmentPreviewCard
      creative={creative}
      platformBadge="Facebook Feed"
      badgeClassName="bg-[#1877F2]/20 text-blue-100 border-blue-400/30"
      scaleLabel={scaleLabel}
      deviceMode={deviceMode}
      onCopy={onCopy}
      onEdit={onEdit}
    >
      <ScaledEnvironment naturalWidth={390} naturalHeight={820} onScaleChange={(s) => setScaleLabel(s < 0.995 ? `Scaled ${Math.round(s * 100)}%` : null)}>
        <PhoneFrame width={390} height={820} className="border-8" style={{ background: FACEBOOK.bg, fontFamily: FACEBOOK.font }}>
          <div className="relative flex h-full flex-col">
            <div className="flex items-center justify-between px-3 py-2 text-white" style={{ background: FACEBOOK.primary }}>
              <FacebookLogo />
              <div className="flex gap-3 text-lg"><span>🔍</span><span>💬</span><span>🔔</span></div>
            </div>
            <div className="flex gap-3 overflow-x-auto px-3 py-3">
              {["Your Story", "Alex", "Jamie", "Taylor", "Chris"].map((name, i) => (
                <div key={name} className="shrink-0 text-center">
                  <div className={`mx-auto rounded-full ${i === 0 ? "border-2 border-dashed border-gray-400" : "bg-gradient-to-tr from-blue-500 to-purple-500 p-[2px]"}`}>
                    <div className="h-12 w-12 rounded-full bg-gray-200" />
                  </div>
                  <p className="mt-1 text-[10px]">{name}</p>
                </div>
              ))}
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto px-3 pb-16">
              <FeedPost creative={{ ...creative, description: "Organic post preview for context." }} />
              <FeedPost creative={creative} isAd />
              <FeedPost creative={{ ...creative, headline: "Community Group", description: "Weekend plans?" }} />
            </div>
            <div className="absolute inset-x-0 bottom-0 flex justify-around border-t bg-white py-2 text-[10px]" style={{ borderColor: FACEBOOK.border }}>
              {["Home", "Friends", "Watch", "Marketplace", "Notifications"].map((l) => <span key={l}>{l}</span>)}
            </div>
          </div>
        </PhoneFrame>
      </ScaledEnvironment>
    </EnvironmentPreviewCard>
  );
}

export { FeedPost };
