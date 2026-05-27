"use client";

import { useState } from "react";
import { GOOGLE } from "@/app/lib/platformDesignTokens";
import {
  EnvironmentPreviewCard,
  GoogleLogo,
  MediaFrame,
  ScaledEnvironment,
} from "../../shared/envShared";

function ProductCard({ creative, sponsored = false }) {
  const rating = Number(creative.rating) || 4.5;
  const reviews = creative.reviewCount || 1204;
  return (
    <div className="overflow-hidden rounded-lg border border-[#dadce0] bg-white transition-shadow hover:shadow-md">
      <MediaFrame creative={creative} aspectRatio="1 / 1" />
      <div className="p-3">
        {sponsored ? <p className="mb-1 text-[10px] text-gray-500">Sponsored</p> : null}
        <p className="line-clamp-2 text-sm text-[#202124]">{creative.headline}</p>
        <p className="mt-1 text-base font-bold">{creative.price || "$49.99"}</p>
        <p className="text-xs text-gray-500">{creative.storeName || "Official Store"}</p>
        <p className="mt-1 text-xs text-[#fbbc04]">{"★".repeat(Math.round(rating))}<span className="ml-1 text-gray-500">{rating.toFixed(1)} ({reviews.toLocaleString()})</span></p>
      </div>
    </div>
  );
}

export default function GoogleShoppingEnvironment({ creative, deviceMode, onCopy, onEdit }) {
  const [scaleLabel, setScaleLabel] = useState(null);

  return (
    <EnvironmentPreviewCard
      creative={creative}
      platformBadge="Google Shopping"
      badgeClassName="bg-green-500/20 text-green-100 border-green-400/30"
      scaleLabel={scaleLabel}
      onCopy={onCopy}
      onEdit={onEdit}
    >
      <ScaledEnvironment naturalWidth={1000} naturalHeight={620} onScaleChange={(s) => setScaleLabel(s < 0.995 ? `Scaled ${Math.round(s * 100)}%` : null)}>
        <div style={{ width: 1000, background: GOOGLE.bg, fontFamily: GOOGLE.font }}>
          <div className="flex items-center gap-4 px-6 pb-2 pt-4">
            <GoogleLogo />
            <div className="flex-1 rounded-full border px-4 py-2 text-sm text-gray-600" style={{ borderColor: GOOGLE.searchBorder }}>{creative.headline}</div>
          </div>
          <div className="flex gap-4 border-b px-6 pb-2 text-sm">
            {["All", "Images", "Videos", "News", "Shopping"].map((t, i) => (
              <span key={t} className={i === 4 ? "border-b-2 border-[#1a73e8] pb-2 text-[#1a73e8]" : "pb-2 text-gray-600"}>{t}</span>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 px-6 py-3 text-xs">
            {["All departments ▼", "Price ▼", "Brand ▼", "Rating ▼", "Deals"].map((f) => (
              <span key={f} className="rounded-full border px-3 py-1 text-gray-700">{f}</span>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-4 px-6 pb-6">
            <ProductCard creative={creative} sponsored />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="rounded-lg border bg-white p-3">
                <div className="mb-2 aspect-square rounded bg-gray-100" />
                <p className="line-clamp-2 text-sm">Organic product listing {i}</p>
                <p className="mt-1 font-bold">${(29 + i * 10).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      </ScaledEnvironment>
    </EnvironmentPreviewCard>
  );
}
