"use client";

import PreviewFrame from "../../shared/PreviewFrame";
import { DummyBannerAd, UserImage } from "../../shared/previewUi";
import {
  dummyArticleHeadline,
  dummyArticleParagraphs,
  dummyDisplayAds,
  dummyNavLinks,
} from "../../dummy/googleDummy";

export default function DisplayPreview({ headline, description, cta, imageUrl }) {
  return (
    <PreviewFrame width={1024}>
      <div style={{ fontFamily: "'Google Sans', Arial, sans-serif" }} className="bg-white text-gray-900">
        <header className="border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-slate-800" />
            <span className="font-bold text-lg">Daily Chronicle</span>
          </div>
          <nav className="flex gap-4 text-sm text-gray-600">
            {dummyNavLinks.map((link, i) => (
              <span key={link}>{link}{i < dummyNavLinks.length - 1 ? " |" : ""}</span>
            ))}
          </nav>
        </header>

        <div className="flex px-8 py-6 gap-8">
          <article className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold leading-tight mb-4">{dummyArticleHeadline}</h1>
            <p className="text-sm text-gray-500 mb-4">By Editorial Team · June 12, 2025 · 6 min read</p>
            <p className="text-base leading-relaxed text-gray-700 mb-4">{dummyArticleParagraphs[0]}</p>
            <p className="text-base leading-relaxed text-gray-700 mb-4">{dummyArticleParagraphs[1]}</p>
          </article>

          <aside className="w-[300px] shrink-0 space-y-4">
            <DummyBannerAd ad={dummyDisplayAds[0]} />
            <div className="relative border border-gray-200 overflow-hidden" style={{ width: 300, height: 250 }}>
              <UserImage imageUrl={imageUrl} className="absolute inset-0 w-full h-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                <p className="text-sm font-semibold line-clamp-2">{headline}</p>
                <p className="text-xs mt-1 line-clamp-2 opacity-90">{description}</p>
                <span className="mt-2 inline-block rounded bg-[#1a73e8] px-3 py-1 text-xs font-semibold">{cta}</span>
              </div>
              <span className="absolute top-1 right-1 rounded bg-white/80 px-1 text-[8px]">Ad</span>
            </div>
            <DummyBannerAd ad={dummyDisplayAds[1]} />
          </aside>
        </div>

        <div className="px-8 pb-8">
          <p className="text-base leading-relaxed text-gray-700 mb-4">{dummyArticleParagraphs[2]}</p>
        </div>

        <footer className="border-t border-gray-200 px-8 py-4 text-xs text-gray-500 flex gap-4">
          {["About", "Privacy", "Terms", "Contact"].map((l) => (
            <span key={l}>{l}</span>
          ))}
        </footer>
      </div>
    </PreviewFrame>
  );
}
