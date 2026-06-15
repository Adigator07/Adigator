"use client";

import PreviewFrame from "../../shared/PreviewFrame";
import { DummyBannerAd, SponsoredBadge, UserImage } from "../../shared/previewUi";
import { blogArticle, blogDummyAds } from "../../dummy/programmaticDummy";

export default function BlogsPreview({ headline, description, cta, imageUrl }) {
  const article = blogArticle;

  return (
    <PreviewFrame width={1024}>
      <div style={{ fontFamily: "Georgia, serif" }} className="bg-white text-gray-900">
        <header className="px-8 py-6 border-b border-gray-200 text-center">
          <h1 className="text-xl font-serif italic text-gray-800">{article.siteName}</h1>
        </header>
        <div className="flex px-8 py-8 gap-8 max-w-4xl mx-auto">
          <article className="flex-1 max-w-2xl">
            <h2 className="text-4xl font-bold leading-tight mb-4">{article.headline}</h2>
            <p className="text-sm text-gray-500 mb-6">{article.author} · {article.date} · {article.readTime}</p>
            {article.paragraphs.slice(0, 3).map((p, i) => (
              <p key={i} className="text-lg leading-relaxed mb-5 text-gray-800">{p}</p>
            ))}
            <div className="border border-gray-200 rounded-xl p-5 my-8 bg-stone-50">
              <SponsoredBadge />
              <UserImage imageUrl={imageUrl} className="w-full h-44 rounded-lg mt-3 object-cover" />
              <h3 className="text-xl font-bold mt-4">{headline}</h3>
              <p className="text-base text-gray-600 mt-2">{description}</p>
              <button type="button" className="mt-4 rounded-full border-2 border-gray-900 px-6 py-2 text-sm font-semibold hover:bg-gray-900 hover:text-white transition">{cta}</button>
            </div>
            {article.paragraphs.slice(3).map((p, i) => (
              <p key={i} className="text-lg leading-relaxed mb-5 text-gray-800">{p}</p>
            ))}
            <div className="border-t border-gray-200 pt-8 mt-8">
              <p className="font-bold mb-4">You might also like</p>
              <div className="space-y-4">
                {article.related.map((r) => (
                  <div key={r.title} className="border-b border-gray-100 pb-3">
                    <p className="font-semibold">{r.title}</p>
                    <p className="text-sm text-gray-500">{r.author}</p>
                  </div>
                ))}
              </div>
            </div>
          </article>
          <aside className="w-[300px] shrink-0 hidden lg:block space-y-4 sticky top-4 self-start">
            <div className="relative border border-gray-200 overflow-hidden sticky" style={{ width: 300, height: 250 }}>
              <UserImage imageUrl={imageUrl} className="absolute inset-0 w-full h-full" />
              <div className="absolute bottom-0 p-3 bg-gradient-to-t from-black/70 to-transparent text-white w-full">
                <p className="text-sm font-semibold">{headline}</p>
                <span className="text-xs underline">{cta}</span>
              </div>
            </div>
            {blogDummyAds.map((ad, i) => (
              <DummyBannerAd key={i} ad={ad} />
            ))}
          </aside>
        </div>
      </div>
    </PreviewFrame>
  );
}
