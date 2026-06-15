"use client";

import PreviewFrame from "../../shared/PreviewFrame";
import { BrandAvatar, SponsoredBadge, UserImage } from "../../shared/previewUi";
import { dummyPosts, dummyStories } from "../../dummy/metaDummy";

export default function InstagramFeedPreview({ headline, cta, imageUrl, logoUrl, brandName }) {
  const below = dummyPosts[2];

  return (
    <PreviewFrame width={375}>
      <div style={{ fontFamily: "-apple-system, Helvetica, sans-serif" }} className="bg-white min-h-[700px]">
        <header className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <span>📷</span>
          <span className="font-bold tracking-widest text-sm">INSTAGRAM</span>
          <span>✈</span>
        </header>
        <div className="flex gap-3 px-3 py-3 overflow-x-auto border-b border-gray-100">
          {dummyStories.map((s) => (
            <div key={s.name} className="shrink-0 w-16 text-center">
              <div className="w-14 h-14 mx-auto rounded-full p-0.5 bg-gradient-to-tr from-yellow-400 to-purple-600">
                <div className="w-full h-full rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: s.color }}>{s.initials}</div>
              </div>
              <span className="text-[10px]">{s.name}</span>
            </div>
          ))}
        </div>
        <div className="border-b border-gray-200">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <BrandAvatar logoUrl={logoUrl} brandName={brandName} size={32} />
              <span className="text-sm font-semibold">{brandName}</span>
              <SponsoredBadge label="Sponsored" />
            </div>
            <span>•••</span>
          </div>
          <UserImage imageUrl={imageUrl} className="w-full aspect-square" />
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xl">❤ 🗨 ↗</span>
            <span>🔖</span>
          </div>
          <p className="px-3 text-sm font-semibold">1,204 likes</p>
          <p className="px-3 pb-1 text-sm"><strong>{brandName}</strong> {headline}</p>
          <p className="px-3 pb-2 text-[10px] text-gray-500 uppercase">Sponsored</p>
          <button type="button" className="mx-3 mb-3 w-[calc(100%-1.5rem)] rounded-lg border border-gray-300 py-1.5 text-sm font-semibold">{cta || "Learn More"}</button>
        </div>
        <div className="p-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: below.color }}>{below.initials}</div>
          <p className="text-sm"><strong>{below.name}</strong> {below.text.slice(0, 60)}...</p>
        </div>
      </div>
    </PreviewFrame>
  );
}
