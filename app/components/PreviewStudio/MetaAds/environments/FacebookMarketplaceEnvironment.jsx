"use client";

import { useState } from "react";
import { FACEBOOK } from "@/app/lib/platformDesignTokens";
import {
  EnvironmentPreviewCard,
  FacebookLogo,
  MediaFrame,
  ScaledEnvironment,
} from "../../shared/envShared";

export default function FacebookMarketplaceEnvironment({ creative, onCopy, onEdit }) {
  const [scaleLabel, setScaleLabel] = useState(null);

  return (
    <EnvironmentPreviewCard
      creative={creative}
      platformBadge="Facebook Marketplace"
      badgeClassName="bg-[#1877F2]/20 text-blue-100 border-blue-400/30"
      scaleLabel={scaleLabel}
      onCopy={onCopy}
      onEdit={onEdit}
    >
      <ScaledEnvironment naturalWidth={980} naturalHeight={640} onScaleChange={(s) => setScaleLabel(s < 0.995 ? `Scaled ${Math.round(s * 100)}%` : null)}>
        <div style={{ width: 980, height: 640, background: FACEBOOK.bg, fontFamily: FACEBOOK.font }} className="flex">
          <aside className="w-52 border-r bg-white p-4">
            <FacebookLogo />
            <p className="mb-2 mt-4 font-bold">Marketplace</p>
            {["Browse", "Selling", "Inbox", "Your account"].map((l) => <p key={l} className="py-1 text-sm">{l}</p>)}
          </aside>
          <main className="flex-1 overflow-y-auto p-4">
            <div className="mb-4 flex flex-wrap gap-2">
              {["All", "Vehicles", "Electronics", "Garden", "Clothing"].map((c, i) => (
                <span key={c} className={`rounded-full px-3 py-1 text-xs ${i === 0 ? "bg-black text-white" : "border bg-white"}`}>{c}</span>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="relative overflow-hidden rounded-lg border bg-white" style={{ borderColor: FACEBOOK.border }}>
                <span className="absolute left-2 top-2 z-10 rounded bg-black/70 px-2 py-0.5 text-[10px] text-white">Sponsored</span>
                <MediaFrame creative={creative} aspectRatio="1 / 1" />
                <div className="p-2">
                  <p className="font-bold">{creative.price || "$129"}</p>
                  <p className="line-clamp-2 text-sm">{creative.headline}</p>
                  <p className="text-xs text-gray-500">San Francisco, CA</p>
                  <button type="button" className="mt-2 w-full rounded py-1.5 text-xs font-semibold text-white" style={{ background: FACEBOOK.primary }}>{creative.cta || "Shop Now"}</button>
                </div>
              </div>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="overflow-hidden rounded-lg border bg-white" style={{ borderColor: FACEBOOK.border }}>
                  <div className="aspect-square bg-gray-200" />
                  <div className="p-2"><p className="font-bold">${20 + i * 15}</p><p className="text-sm">Listing item {i}</p></div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </ScaledEnvironment>
    </EnvironmentPreviewCard>
  );
}
