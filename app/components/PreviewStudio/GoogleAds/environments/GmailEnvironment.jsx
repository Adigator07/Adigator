"use client";

import { useState } from "react";
import { GMAIL } from "@/app/lib/platformDesignTokens";
import {
  BrandAvatar,
  EnvironmentPreviewCard,
  MediaFrame,
  ScaledEnvironment,
} from "../../shared/envShared";

export default function GmailEnvironment({ creative, deviceMode, onCopy, onEdit }) {
  const [scaleLabel, setScaleLabel] = useState(null);

  return (
    <EnvironmentPreviewCard
      creative={creative}
      platformBadge="Gmail Promotions"
      badgeClassName="bg-amber-500/20 text-amber-100 border-amber-400/30"
      scaleLabel={scaleLabel}
      onCopy={onCopy}
      onEdit={onEdit}
    >
      <ScaledEnvironment naturalWidth={980} naturalHeight={720} onScaleChange={(s) => setScaleLabel(s < 0.995 ? `Scaled ${Math.round(s * 100)}%` : null)}>
        <div style={{ width: 980, height: 720, background: GMAIL.bg, fontFamily: GMAIL.font }} className="flex">
          <aside className="w-56 border-r p-4" style={{ background: GMAIL.sidebar }}>
            <button type="button" className="mb-4 w-full rounded-2xl bg-[#c2e7ff] px-4 py-3 text-sm font-medium">Compose</button>
            {["Inbox", "Starred", "Sent", "Promotions"].map((item) => (
              <p key={item} className={`rounded-full px-3 py-2 text-sm ${item === "Promotions" ? "font-semibold" : ""}`} style={item === "Promotions" ? { background: GMAIL.active } : {}}>{item}</p>
            ))}
          </aside>
          <main className="flex-1 overflow-y-auto">
            <div className="flex gap-3 border-b px-4 py-3 text-sm">
              {["Primary", "Promotions", "Social"].map((tab) => (
                <span key={tab} className={tab === "Promotions" ? "border-b-2 border-red-500 pb-2 font-semibold" : "text-gray-500"}>{tab}</span>
              ))}
            </div>
            <div className="px-2">
              <div className="flex items-center gap-3 border-b bg-[#fef7e0] px-3 py-3">
                <BrandAvatar creative={creative} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{creative.pageName || creative.headline}</span>
                    <span className="rounded px-1.5 py-0.5 text-[10px] text-white" style={{ background: GMAIL.adBadge }}>Ad</span>
                  </div>
                  <p className="truncate text-sm font-semibold">{creative.headline}</p>
                  <p className="truncate text-xs text-gray-600">{creative.description}</p>
                </div>
                <span className="text-xs text-gray-500">10:24 AM</span>
              </div>
              {["Spring Sale — 20% off", "Your weekly digest", "Limited-time offer inside", "New arrivals curated for you"].map((subject) => (
                <div key={subject} className="flex items-center gap-3 border-b px-3 py-3 text-sm text-gray-600">
                  <BrandAvatar creative={{ headline: subject }} size={32} />
                  <div className="truncate"><span className="text-gray-800">{subject.split("—")[0]}</span> — preview text...</div>
                </div>
              ))}
            </div>
            <div className="m-4 overflow-hidden rounded-lg border">
              <MediaFrame creative={creative} aspectRatio="2.5 / 1" />
              <div className="p-4">
                <h2 className="text-xl font-semibold">{creative.headline}</h2>
                <p className="mt-2 text-sm text-gray-600">{creative.description}</p>
                <button type="button" className="mt-4 rounded bg-[#1a73e8] px-5 py-2 text-sm font-medium text-white">{creative.cta || "Shop Now"}</button>
                <p className="mt-4 text-[10px] text-gray-400">Unsubscribe · View in browser</p>
              </div>
            </div>
          </main>
        </div>
      </ScaledEnvironment>
    </EnvironmentPreviewCard>
  );
}
