"use client";

import PreviewFrame from "../../shared/PreviewFrame";
import { DummyBannerAd, SponsoredBadge, UserImage } from "../../shared/previewUi";
import { foodArticle, foodDummyAds } from "../../dummy/programmaticDummy";

export default function FoodRestaurantPreview({ headline, description, cta, imageUrl, brandName }) {
  const article = foodArticle;

  return (
    <PreviewFrame width={1024}>
      <div style={{ fontFamily: "Georgia, serif" }} className="bg-[#fffbf5] text-gray-900">
        <header className="border-b border-orange-200 px-8 py-4 bg-orange-50">
          <h1 className="text-2xl font-bold text-orange-800">{article.siteName}</h1>
          <nav className="flex gap-4 mt-2 text-sm text-orange-700">
            {article.nav.map((n) => <span key={n}>{n}</span>)}
          </nav>
        </header>
        <div className="flex px-8 py-6 gap-8">
          <article className="flex-1">
            <h2 className="text-3xl font-bold mb-2">{article.headline}</h2>
            <p className="text-sm text-gray-500 mb-4">{article.author} · {article.date}</p>
            {article.paragraphs.map((p, i) => (
              <p key={i} className="text-base leading-relaxed mb-4">{p}</p>
            ))}
            <div className="border border-orange-200 rounded-xl p-4 bg-white shadow-sm">
              <SponsoredBadge />
              <div className="flex gap-4 mt-2">
                <UserImage imageUrl={imageUrl} className="w-40 h-28 rounded-lg shrink-0" />
                <div>
                  <p className="text-xs text-orange-600 uppercase">{brandName}</p>
                  <h3 className="font-bold text-lg">{headline}</h3>
                  <p className="text-sm text-gray-600 mt-1">{description}</p>
                  <button type="button" className="mt-2 rounded-full bg-orange-500 px-4 py-1.5 text-sm text-white font-semibold">{cta}</button>
                </div>
              </div>
            </div>
          </article>
          <aside className="w-[300px] shrink-0 space-y-4">
            {foodDummyAds.map((ad, i) => (
              <DummyBannerAd key={i} ad={ad} />
            ))}
          </aside>
        </div>
      </div>
    </PreviewFrame>
  );
}
