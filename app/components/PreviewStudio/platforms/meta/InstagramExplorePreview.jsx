"use client";

import { useState } from "react";
import PreviewFrame from "../../shared/PreviewFrame";
import { SponsoredBadge, UserImage } from "../../shared/previewUi";
import { dummyExploreTiles } from "../../dummy/metaDummy";

export default function InstagramExplorePreview({ headline, description, cta, imageUrl }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <PreviewFrame width={375}>
      <div style={{ fontFamily: "-apple-system, Helvetica, sans-serif" }} className="bg-white min-h-[667px] relative">
        <div className="border-b border-gray-200 px-4 py-3">
          <div className="rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-500">Search</div>
        </div>
        <div className="grid grid-cols-3 gap-0.5 p-0.5">
          {dummyExploreTiles.map((color, i) => {
            const isAd = i === 1;
            return (
              <button
                key={i}
                type="button"
                className="relative aspect-square overflow-hidden"
                onClick={() => isAd && setExpanded(true)}
              >
                {isAd ? (
                  <UserImage imageUrl={imageUrl} className="w-full h-full" />
                ) : (
                  <div className="w-full h-full" style={{ background: color }} />
                )}
                {isAd ? (
                  <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-white font-semibold">Sponsored</span>
                ) : null}
              </button>
            );
          })}
        </div>
        {expanded ? (
          <div className="absolute inset-0 bg-black/70 flex items-end z-10" onClick={() => setExpanded(false)} role="presentation">
            <div className="bg-white w-full rounded-t-2xl p-4" onClick={(e) => e.stopPropagation()} role="presentation">
              <UserImage imageUrl={imageUrl} className="w-full aspect-square rounded-lg mb-3" />
              <SponsoredBadge />
              <h3 className="text-lg font-bold mt-2">{headline}</h3>
              <p className="text-sm text-gray-600 mt-1">{description}</p>
              <button type="button" className="mt-3 w-full rounded-lg bg-[#0095f6] py-2.5 text-sm font-semibold text-white">{cta}</button>
            </div>
          </div>
        ) : null}
      </div>
    </PreviewFrame>
  );
}
