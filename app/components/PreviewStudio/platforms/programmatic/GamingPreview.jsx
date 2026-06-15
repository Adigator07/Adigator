"use client";

import PreviewFrame from "../../shared/PreviewFrame";
import { DummyBannerAd, SponsoredBadge, UserImage } from "../../shared/previewUi";
import { gamingArticle, gamingDummyAds } from "../../dummy/programmaticDummy";

export default function GamingPreview({ headline, description, cta, imageUrl }) {
  const article = gamingArticle;

  return (
    <PreviewFrame width={1024}>
      <div style={{ fontFamily: "Georgia, serif" }} className="bg-[#0f0f0f] text-gray-100 min-h-[720px]">
        <header className="bg-[#1a1a1a] border-b border-gray-800 px-8 py-4">
          <h1 className="text-2xl font-bold text-green-400">{article.siteName}</h1>
          <nav className="flex gap-4 mt-2 text-sm text-gray-400">
            {article.nav.map((n) => <span key={n}>{n}</span>)}
          </nav>
        </header>
        <div className="mx-8 mt-4 border border-gray-700 overflow-hidden rounded" style={{ height: 90 }}>
          <div className="relative h-full flex items-center px-6 bg-gradient-to-r from-purple-900 to-indigo-900">
            <UserImage imageUrl={imageUrl} className="h-16 w-28 rounded mr-4 shrink-0" fit="contain" />
            <div>
              <p className="font-bold">{headline}</p>
              <button type="button" className="mt-1 rounded bg-green-500 px-3 py-0.5 text-xs font-semibold text-black">{cta}</button>
            </div>
            <span className="absolute top-2 right-2 text-[10px] text-gray-400">728×90</span>
          </div>
        </div>
        <div className="flex px-8 py-6 gap-8">
          <article className="flex-1">
            <h2 className="text-3xl font-bold mb-2">{article.headline}</h2>
            <p className="text-sm text-gray-500 mb-4">{article.author} · {article.date}</p>
            <p className="text-base leading-relaxed text-gray-300 mb-4">{article.paragraphs[0]}</p>
            <div className="border border-gray-700 rounded-lg p-4 my-6 bg-[#1a1a1a]">
              <SponsoredBadge className="text-green-400" />
              <div className="flex gap-4 mt-2">
                <UserImage imageUrl={imageUrl} className="w-40 h-28 rounded shrink-0" />
                <div>
                  <h3 className="font-bold">{headline}</h3>
                  <p className="text-sm text-gray-400 mt-1">{description}</p>
                  <button type="button" className="mt-2 rounded bg-green-500 px-4 py-1.5 text-sm text-black font-semibold">{cta}</button>
                </div>
              </div>
            </div>
            <p className="text-base leading-relaxed text-gray-300">{article.paragraphs[1]}</p>
          </article>
          <aside className="w-[300px] shrink-0 space-y-4">
            <div className="relative border border-gray-700 overflow-hidden rounded" style={{ width: 300, height: 250 }}>
              <UserImage imageUrl={imageUrl} className="absolute inset-0 w-full h-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-0 p-3">
                <p className="text-sm font-semibold">{headline}</p>
                <span className="mt-1 inline-block rounded bg-green-500 px-2 py-0.5 text-xs text-black font-semibold">{cta}</span>
              </div>
            </div>
            {gamingDummyAds.slice(0, 2).map((ad, i) => (
              <DummyBannerAd key={i} ad={ad} />
            ))}
          </aside>
        </div>
      </div>
    </PreviewFrame>
  );
}
