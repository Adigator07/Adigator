"use client";

import PreviewFrame from "../../shared/PreviewFrame";
import { BrandAvatar, UserImage } from "../../shared/previewUi";

export default function InstagramStoriesPreview({ headline, cta, imageUrl, logoUrl, brandName }) {
  return (
    <PreviewFrame width={375} style={{ height: 667 }}>
      <div style={{ fontFamily: "-apple-system, Helvetica, sans-serif" }} className="relative w-full h-[667px] bg-black overflow-hidden">
        <UserImage imageUrl={imageUrl} className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70" />
        <div className="absolute top-3 left-3 right-3 flex gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`flex-1 h-0.5 rounded-full ${i === 1 ? "bg-white" : "bg-white/40"}`} />
          ))}
        </div>
        <div className="absolute top-8 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrandAvatar logoUrl={logoUrl} brandName={brandName} size={32} />
            <div className="text-white">
              <p className="text-sm font-semibold">{brandName}</p>
              <p className="text-[10px] opacity-80">Sponsored</p>
            </div>
          </div>
          <span className="text-white">✈</span>
        </div>
        <div className="absolute bottom-24 left-4 right-4 text-white">
          <h2 className="text-lg font-bold">{headline}</h2>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="rounded-full border border-white/40 bg-white/10 py-3 text-center text-white text-sm font-semibold">
            Swipe Up · {cta}
          </div>
        </div>
      </div>
    </PreviewFrame>
  );
}
