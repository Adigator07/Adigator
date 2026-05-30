"use client";

import { useState } from "react";
import { FACEBOOK } from "@/app/lib/platformDesignTokens";
import {
  EnvironmentPreviewCard,
  MediaFrame,
  ScaledEnvironment,
} from "../../shared/envShared";
import { FeedPost } from "./FacebookFeedEnvironment";

export default function FacebookFeedDesktopEnvironment({ creative, deviceMode, onCopy, onEdit }) {
  const [scaleLabel, setScaleLabel] = useState(null);

  return (
    <EnvironmentPreviewCard
      creative={creative}
      platformBadge="Facebook Feed · Desktop"
      badgeClassName="bg-[#1877F2]/20 text-blue-100 border-blue-400/30"
      scaleLabel={scaleLabel}
      deviceMode={deviceMode}
      onCopy={onCopy}
      onEdit={onEdit}
    >
      <ScaledEnvironment naturalWidth={1100} naturalHeight={680} onScaleChange={(s) => setScaleLabel(s < 0.995 ? `Scaled ${Math.round(s * 100)}%` : null)}>
        <div style={{ width: 1100, height: 680, background: FACEBOOK.bg, fontFamily: FACEBOOK.font }} className="flex">
          <aside className="w-56 space-y-3 p-4 text-sm">
            <div className="flex items-center gap-2"><div className="h-7 w-7 rounded-full bg-gray-300" /><span>You</span></div>
            {["Friends", "Groups", "Marketplace", "Watch"].map((l) => <p key={l}>{l}</p>)}
          </aside>
          <main className="mx-auto max-w-[520px] flex-1 space-y-4 overflow-y-auto py-4">
            <FeedPost creative={creative} isAd />
          </main>
          <aside className="w-72 p-4">
            <p className="mb-3 text-sm font-semibold" style={{ color: FACEBOOK.secondary }}>Sponsored</p>
            <div className="overflow-hidden rounded-lg border bg-white" style={{ borderColor: FACEBOOK.border, width: 254 }}>
              <MediaFrame creative={creative} aspectRatio="1.91 / 1" />
              <div className="p-2">
                <p className="line-clamp-2 text-xs font-semibold">{creative.headline}</p>
                <p className="mt-1 text-[10px] text-gray-500">{creative.displayUrl || "example.com"}</p>
                <button type="button" className="mt-2 text-xs font-semibold" style={{ color: FACEBOOK.primary }}>{creative.cta || "Learn More"}</button>
              </div>
            </div>
            <p className="mb-2 mt-6 text-sm font-semibold" style={{ color: FACEBOOK.secondary }}>People you may know</p>
            {[1, 2].map((i) => <div key={i} className="mb-2 flex items-center gap-2"><div className="h-8 w-8 rounded-full bg-gray-300" /><span className="text-xs">Suggested friend {i}</span></div>)}
          </aside>
        </div>
      </ScaledEnvironment>
    </EnvironmentPreviewCard>
  );
}
