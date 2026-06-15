"use client";

import PreviewFrame from "../../shared/PreviewFrame";
import { DummyBannerAd, SponsoredBadge, UserImage } from "../../shared/previewUi";
import { techArticle, techDummyAds } from "../../dummy/programmaticDummy";

export default function TechnologyPreview({ headline, description, cta, imageUrl }) {
  const article = techArticle;

  return (
    <PreviewFrame width={1024}>
      <div style={{ fontFamily: "Georgia, serif" }} className="bg-white text-gray-900">
        <header className="bg-slate-900 text-white px-8 py-4">
          <h1 className="text-2xl font-bold">{article.siteName}</h1>
          <nav className="flex gap-4 mt-2 text-sm text-slate-300">
            {article.nav.map((n) => <span key={n}>{n}</span>)}
          </nav>
        </header>
        <div className="flex px-8 py-6 gap-8">
          <article className="flex-1">
            <h2 className="text-3xl font-bold mb-2">{article.headline}</h2>
            <p className="text-sm text-gray-500 mb-4">{article.author} · {article.date}</p>
            <p className="text-base leading-relaxed mb-4">{article.paragraphs[0]}</p>
            <div className="border border-gray-200 rounded-lg p-4 my-6">
              <SponsoredBadge />
              <UserImage imageUrl={imageUrl} className="w-full h-40 rounded mt-2" />
              <h3 className="font-bold mt-3">{headline}</h3>
              <p className="text-sm text-gray-600 mt-1">{description}</p>
              <button type="button" className="mt-2 rounded bg-blue-600 px-4 py-1.5 text-sm text-white font-semibold">{cta}</button>
            </div>
            <p className="text-base leading-relaxed">{article.paragraphs[1]}</p>
          </article>
          <aside className="w-[300px] shrink-0 space-y-4">
            {techDummyAds.map((ad, i) => (
              <DummyBannerAd key={i} ad={ad} />
            ))}
          </aside>
        </div>
      </div>
    </PreviewFrame>
  );
}
