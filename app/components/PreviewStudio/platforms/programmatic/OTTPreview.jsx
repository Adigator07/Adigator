"use client";

import PreviewFrame from "../../shared/PreviewFrame";
import { DummyBannerAd, SponsoredBadge, UserImage } from "../../shared/previewUi";
import { ottContent, ottDummyAds } from "../../dummy/programmaticDummy";

export default function OTTPreview({ headline, description, cta, imageUrl, brandName }) {
  const content = ottContent;

  return (
    <PreviewFrame width={1024}>
      <div style={{ fontFamily: "Georgia, serif" }} className="bg-[#141414] text-white min-h-[720px]">
        <header className="px-8 py-4 flex items-center gap-6">
          <h1 className="text-2xl font-bold text-red-600">{content.siteName}</h1>
          <nav className="flex gap-4 text-sm text-gray-300">
            {content.nav.map((n) => <span key={n}>{n}</span>)}
          </nav>
        </header>
        <div className="relative mx-8 h-64 rounded-lg overflow-hidden bg-gradient-to-r from-gray-800 to-gray-900">
          <div className="absolute inset-0 flex items-end p-6">
            <div>
              <p className="text-2xl font-bold">{content.heroTitle}</p>
              <p className="text-sm text-gray-300 mt-1">{content.heroSubtitle}</p>
            </div>
          </div>
          <div className="absolute bottom-4 left-4 right-4 max-w-md bg-black/90 rounded-lg p-3 flex gap-3 border border-gray-700">
            <UserImage imageUrl={imageUrl} className="w-24 h-14 rounded shrink-0" />
            <div className="flex-1 min-w-0">
              <SponsoredBadge className="text-red-400" />
              <p className="text-sm font-semibold mt-0.5 line-clamp-1">{headline}</p>
              <p className="text-xs text-gray-400 line-clamp-1">{description}</p>
              <div className="flex gap-2 mt-1">
                <button type="button" className="rounded bg-white text-black px-2 py-0.5 text-[10px] font-semibold">{cta}</button>
                <span className="text-[10px] text-gray-400 self-center">Skip in 5s</span>
              </div>
            </div>
          </div>
        </div>
        {content.rows.map((row) => (
          <div key={row.title} className="px-8 mt-6">
            <h3 className="text-lg font-semibold mb-3">{row.title}</h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {Array.from({ length: row.count }).map((_, i) => (
                <div key={i} className="shrink-0 w-36">
                  {i === 2 ? (
                    <div className="relative">
                      <UserImage imageUrl={imageUrl} className="w-36 h-20 rounded" />
                      <span className="absolute top-1 left-1 rounded bg-red-600 px-1 text-[8px] font-bold">Ad</span>
                      <p className="text-xs mt-1 truncate">{headline}</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-36 h-20 rounded bg-gray-700" />
                      <p className="text-xs mt-1 text-gray-400">Show Title {i + 1}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="px-8 mt-6 pb-6">
          <DummyBannerAd ad={ottDummyAds[0]} width={300} height={60} />
        </div>
      </div>
    </PreviewFrame>
  );
}
