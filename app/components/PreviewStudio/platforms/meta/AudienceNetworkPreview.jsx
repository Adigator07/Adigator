"use client";

import PreviewFrame from "../../shared/PreviewFrame";
import { BrandAvatar, SponsoredBadge, UserImage } from "../../shared/previewUi";
import { dummyAudienceAppContent } from "../../dummy/metaDummy";

export default function AudienceNetworkPreview({ headline, description, cta, imageUrl, logoUrl, brandName }) {
  return (
    <PreviewFrame width={375}>
      <div style={{ fontFamily: "-apple-system, Helvetica, sans-serif" }} className="bg-gradient-to-b from-indigo-500 to-purple-700 min-h-[667px] text-white">
        <header className="px-4 py-3 flex items-center justify-between">
          <span className="font-bold">{dummyAudienceAppContent.appName}</span>
          <span className="text-sm">⚙</span>
        </header>
        <div className="px-4 py-6 text-center">
          <p className="text-3xl font-bold">{dummyAudienceAppContent.score}</p>
          <p className="text-sm opacity-80">{dummyAudienceAppContent.level}</p>
        </div>
        <div className="mx-4 mt-4 bg-white rounded-xl overflow-hidden text-gray-900 shadow-lg relative">
          <span className="absolute top-2 right-2 text-[8px] text-gray-400 border border-gray-300 rounded px-1">AdChoices ⓘ</span>
          <div className="p-3 flex items-center gap-2 border-b border-gray-100">
            <BrandAvatar logoUrl={logoUrl} brandName={brandName} size={28} />
            <span className="text-sm font-semibold">{brandName}</span>
            <SponsoredBadge />
          </div>
          <UserImage imageUrl={imageUrl} className="w-full h-36" />
          <div className="p-3">
            <p className="font-semibold text-sm">{headline}</p>
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{description}</p>
            <button type="button" className="mt-2 rounded-lg bg-[#1877f2] px-4 py-2 text-xs font-semibold text-white">{cta}</button>
          </div>
        </div>
        <div className="px-4 mt-6 grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="aspect-square rounded-xl bg-white/20" />
          ))}
        </div>
      </div>
    </PreviewFrame>
  );
}
