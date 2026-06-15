"use client";

import PreviewFrame from "../../shared/PreviewFrame";
import { DummyBannerAd, SponsoredBadge, UserImage } from "../../shared/previewUi";
import { newsArticle, newsDummyAds } from "../../dummy/programmaticDummy";

export default function NewsArticlesPreview({ headline, description, cta, imageUrl }) {
  const article = newsArticle;

  return (
    <PreviewFrame width={1024}>
      <div style={{ fontFamily: "Georgia, serif" }} className="bg-white text-gray-900">
        <div className="bg-red-700 text-white text-xs px-8 py-1.5 overflow-hidden whitespace-nowrap">
          {article.ticker}
        </div>
        <header className="border-b-4 border-black px-8 py-4">
          <h1 className="text-3xl font-black tracking-tight">{article.siteName}</h1>
          <nav className="flex gap-4 mt-2 text-sm font-semibold uppercase">
            {article.nav.map((n) => <span key={n}>{n}</span>)}
          </nav>
        </header>
        <div className="mx-8 mt-4 border border-gray-200 overflow-hidden" style={{ height: 90 }}>
          <div className="relative h-full flex items-center px-6 bg-slate-100">
            <UserImage imageUrl={imageUrl} className="h-14 w-24 mr-4 shrink-0" fit="contain" />
            <p className="font-bold text-sm">{headline}</p>
            <button type="button" className="ml-auto rounded bg-red-700 px-3 py-1 text-xs text-white font-semibold">{cta}</button>
          </div>
        </div>
        <div className="flex px-8 py-6 gap-8">
          <article className="flex-1">
            <h2 className="text-3xl font-bold mb-2 leading-tight">{article.headline}</h2>
            <p className="text-sm text-gray-500 mb-4">{article.author} · {article.date}</p>
            <p className="text-base leading-relaxed mb-4">{article.paragraphs[0]}</p>
            <div className="border border-gray-200 rounded p-4 my-6 bg-gray-50">
              <SponsoredBadge />
              <UserImage imageUrl={imageUrl} className="w-full h-36 rounded mt-2" />
              <h3 className="font-bold mt-2">{headline}</h3>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
            {article.paragraphs.slice(1).map((p, i) => (
              <p key={i} className="text-base leading-relaxed mb-4">{p}</p>
            ))}
            <div className="border-t border-gray-200 pt-4 mt-6">
              <p className="font-bold mb-3">Related Articles</p>
              <div className="grid grid-cols-3 gap-4">
                {article.related.map((r) => (
                  <div key={r.title} className="border border-gray-200 p-3 rounded">
                    <p className="text-xs text-red-700 uppercase">{r.category}</p>
                    <p className="text-sm font-semibold mt-1">{r.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </article>
          <aside className="w-[300px] shrink-0 space-y-4">
            <div className="relative border border-gray-200 overflow-hidden" style={{ width: 300, height: 250 }}>
              <UserImage imageUrl={imageUrl} className="absolute inset-0 w-full h-full" />
              <div className="absolute bottom-0 p-3 bg-gradient-to-t from-black/70 to-transparent text-white w-full">
                <p className="text-sm font-semibold">{headline}</p>
              </div>
            </div>
            {newsDummyAds.map((ad, i) => (
              <DummyBannerAd key={i} ad={ad} />
            ))}
          </aside>
        </div>
      </div>
    </PreviewFrame>
  );
}
