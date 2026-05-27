"use client";

import { useState } from "react";
import { MESSENGER } from "@/app/lib/platformDesignTokens";
import {
  BrandAvatar,
  EnvironmentPreviewCard,
  MediaFrame,
  PhoneFrame,
  ScaledEnvironment,
} from "../../shared/envShared";

export default function MessengerEnvironment({ creative, onCopy, onEdit }) {
  const [scaleLabel, setScaleLabel] = useState(null);

  return (
    <EnvironmentPreviewCard
      creative={creative}
      platformBadge="Messenger"
      badgeClassName="bg-[#0084FF]/20 text-sky-100 border-sky-400/30"
      scaleLabel={scaleLabel}
      onCopy={onCopy}
      onEdit={onEdit}
    >
      <ScaledEnvironment naturalWidth={390} naturalHeight={760} onScaleChange={(s) => setScaleLabel(s < 0.995 ? `Scaled ${Math.round(s * 100)}%` : null)}>
        <PhoneFrame width={390} height={760} className="border-8" style={{ fontFamily: MESSENGER.font }}>
          <div className="flex h-full flex-col bg-white">
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <span>‹</span>
              <BrandAvatar creative={creative} size={36} />
              <div className="flex-1">
                <p className="text-sm font-semibold">{creative.pageName || creative.headline}</p>
                <p className="text-xs text-[#31a24c]">Active now</p>
              </div>
              <span>📹 📞</span>
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#f0f2f5] p-4">
              <div className="flex justify-end">
                <div className="max-w-[75%] rounded-2xl rounded-br-md px-3 py-2 text-sm text-white" style={{ background: MESSENGER.outgoing }}>
                  Hi, tell me more!
                </div>
              </div>
              <div className="flex max-w-[88%] items-end gap-2">
                <BrandAvatar creative={creative} size={28} />
                <div className="flex-1 rounded-2xl rounded-bl-md border bg-white p-3 shadow-sm">
                  <p className="text-sm font-semibold" style={{ color: MESSENGER.primary }}>{creative.pageName || creative.headline}</p>
                  <p className="text-[10px] text-gray-500">Sponsored</p>
                  <MediaFrame creative={creative} aspectRatio="16 / 9" className="mt-2 rounded-lg" />
                  <p className="mt-2 text-sm">{creative.primaryText || creative.description}</p>
                  <button type="button" className="mt-3 w-full rounded-full py-2 text-sm font-semibold text-white" style={{ background: MESSENGER.primary }}>{creative.cta || "Shop Now"}</button>
                </div>
                <span className="text-xs text-gray-400">i</span>
              </div>
            </div>
            <div className="flex items-center gap-2 border-t px-3 py-2 text-gray-500">
              <div className="flex-1 rounded-full border px-3 py-2 text-sm">Aa</div>
              <span>🎤</span><span>📷</span><span>😊</span>
            </div>
          </div>
        </PhoneFrame>
      </ScaledEnvironment>
    </EnvironmentPreviewCard>
  );
}
