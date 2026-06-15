"use client";

import PreviewFrame from "../../shared/PreviewFrame";
import { DummyBannerAd, SponsoredBadge, UserImage } from "../../shared/previewUi";
import { healthcareDummyAds, healthcareArticle } from "../../dummy/programmaticDummy";

export default function HealthcarePreview({ headline, description, cta, imageUrl }) {
  const article = healthcareArticle;

  return (
    <PreviewFrame width={1024}>
      <div style={{ fontFamily: "Georgia, serif" }} className="bg-white text-gray-900">
        <header className="border-b-2 border-emerald-600 px-8 py-4">
          <h1 className="text-2xl font-bold text-emerald-800">{article.siteName}</h1>
          <nav className="flex gap-4 mt-2 text-sm text-gray-600">
            {article.nav.map((n) => <span key={n}>{n}</span>)}
          </nav>
        </header>
        <div className="flex px-8 py-6 gap-8">
          <article className="flex-1">
            <h2 className="text-3xl font-bold mb-2">{article.headline}</h2>
            <p className="text-sm text-gray-500 mb-4">{article.author} · {article.date}</p>
            <p className="text-base leading-relaxed mb-4">{article.paragraphs[0]}</p>
            <p className="text-base leading-relaxed mb-4">{article.paragraphs[1]}</p>
            <div className="border border-gray-200 rounded-lg p-4 my-6 bg-gray-50">
              <SponsoredBadge />
              <div className="flex gap-4 mt-2">
                <UserImage imageUrl={imageUrl} className="w-32 h-24 rounded shrink-0" />
                <div>
                  <h3 className="font-bold">{headline}</h3>
                  <p className="text-sm text-gray-600 mt-1">{description}</p>
                  <button type="button" className="mt-2 rounded bg-emerald-600 px-4 py-1.5 text-sm text-white font-semibold">{cta}</button>
                </div>
              </div>
            </div>
            <p className="text-base leading-relaxed">{article.paragraphs[2]}</p>
          </article>
          <aside className="w-[300px] shrink-0 space-y-4">
            {healthcareDummyAds.map((ad, i) => (
              <DummyBannerAd key={i} ad={ad} />
            ))}
            <div className="relative border border-gray-200 overflow-hidden" style={{ width: 300, height: 250 }}>
              <UserImage imageUrl={imageUrl} className="absolute inset-0 w-full h-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 p-3 text-white">
                <p className="text-sm font-semibold">{headline}</p>
                <span className="mt-1 inline-block rounded bg-emerald-600 px-2 py-0.5 text-xs">{cta}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </PreviewFrame>
  );
}
