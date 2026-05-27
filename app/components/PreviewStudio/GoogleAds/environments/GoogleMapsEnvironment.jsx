"use client";

import { useState } from "react";
import { GOOGLE } from "@/app/lib/platformDesignTokens";
import {
  BrandAvatar,
  EnvironmentPreviewCard,
  MediaFrame,
  ScaledEnvironment,
} from "../../shared/envShared";

export default function GoogleMapsEnvironment({ creative, deviceMode, onCopy, onEdit }) {
  const [scaleLabel, setScaleLabel] = useState(null);
  const rating = Number(creative.rating) || 4.6;

  return (
    <EnvironmentPreviewCard
      creative={creative}
      platformBadge="Google Maps"
      badgeClassName="bg-teal-500/20 text-teal-100 border-teal-400/30"
      scaleLabel={scaleLabel}
      onCopy={onCopy}
      onEdit={onEdit}
    >
      <ScaledEnvironment naturalWidth={900} naturalHeight={620} onScaleChange={(s) => setScaleLabel(s < 0.995 ? `Scaled ${Math.round(s * 100)}%` : null)}>
        <div style={{ width: 900, height: 620, fontFamily: GOOGLE.font }} className="relative overflow-hidden bg-[#e5e3df]">
          <div className="absolute inset-0 opacity-80">
            <svg width="900" height="620" viewBox="0 0 900 620">
              <rect width="900" height="620" fill="#e8eaed" />
              {Array.from({ length: 96 }).map((_, index) => {
                const row = Math.floor(index / 12);
                const col = index % 12;
                return (
                  <rect
                    key={`${row}-${col}`}
                    x={col * 75}
                    y={row * 78}
                    width="62"
                    height="52"
                    fill={(row + col) % 3 ? "#f1f3f4" : "#dfe7dd"}
                    stroke="#d2d4d7"
                  />
                );
              })}
              <path d="M0 310 H900" stroke="#ffffff" strokeWidth="8" />
              <path d="M450 0 V620" stroke="#ffffff" strokeWidth="8" />
            </svg>
          </div>
          <div className="absolute inset-x-4 top-4 flex gap-2">
            <div className="flex-1 rounded-full bg-white px-4 py-2 text-sm shadow">Search Google Maps</div>
            <div className="rounded-full bg-white px-3 py-2 text-sm shadow">☰</div>
          </div>
          <div className="absolute left-[420px] top-32">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-purple-600 text-xs font-bold text-white shadow-lg">Ad</div>
              <div className="absolute -bottom-1 left-1/2 h-0 w-0 -translate-x-1/2 border-l-8 border-r-8 border-t-[12px] border-l-transparent border-r-transparent border-t-purple-600" />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white p-4 shadow-2xl">
            <MediaFrame creative={creative} aspectRatio="3 / 1" className="mb-3 rounded-xl" />
            <div className="flex items-start gap-3">
              <BrandAvatar creative={creative} />
              <div>
                <h3 className="text-lg font-semibold">{creative.headline}</h3>
                <p className="text-sm text-gray-600">{creative.vertical || "Local business"} · {"★".repeat(Math.round(rating))} {rating.toFixed(1)} · {creative.reviewCount || 842} reviews</p>
                <span className="mt-1 inline-block text-[10px] font-semibold uppercase tracking-wide text-purple-700">Sponsored</span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {["Directions", "Call", "Website"].map((action) => (
                <button key={action} type="button" className="rounded-full border py-2 text-sm font-medium text-[#1a73e8]">{action}</button>
              ))}
            </div>
          </div>
        </div>
      </ScaledEnvironment>
    </EnvironmentPreviewCard>
  );
}
