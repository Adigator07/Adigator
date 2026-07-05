"use client";

import type { EnvironmentProps } from "./adSlotUtils";
import { pickPlacement, useFallbackMap, WebsiteAdSlot } from "./adSlotUtils";
import {
  deriveBreakingTicker,
  deriveEditorialArticles,
  deriveNativePromo,
  deriveTrendingItems,
  labelVertical,
} from "@/app/lib/previewEnvironmentContent";

export default function NewsEnvironment({
  content,
  slotType,
  creativeUrl,
  creativeSize,
  device,
  vertical = "general",
  brandName = "",
}: EnvironmentProps & { vertical?: string; brandName?: string }) {
  const isMobile = device === "mobile";
  const activePlacement = pickPlacement(creativeSize, slotType);
  const fallback = useFallbackMap(content.publisherName, labelVertical(vertical), device);

  const publisherName = content.publisherName || `${labelVertical(vertical)} Journal`;
  const articles = deriveEditorialArticles(content, vertical);
  const trending = deriveTrendingItems(content, vertical);
  const nativePromo = deriveNativePromo(content, brandName);
  const featured = articles[0];
  const sideArticles = articles.slice(1);
  const ticker = deriveBreakingTicker(content, vertical);

  return (
    <article className="min-h-[1400px] bg-white text-slate-900 font-serif">
      <div className="bg-slate-900 text-slate-300 text-[10px] font-sans uppercase tracking-widest px-4 py-1.5 flex items-center justify-between">
        <span>{labelVertical(vertical)} Edition</span>
        <div className="flex gap-4">
          <span>Newsletter</span>
          <span>Subscribe</span>
        </div>
      </div>

      <header className="border-b-4 border-slate-900 px-4 pt-5 pb-3 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-4">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900">{publisherName}</h1>
            <p className="text-xs font-sans uppercase tracking-[0.3em] text-slate-500 mt-1">
              Trusted {labelVertical(vertical)} coverage
            </p>
          </div>

          <nav className="border-t border-b border-slate-300 py-2 font-sans">
            <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-[11px] font-semibold uppercase tracking-widest text-slate-700">
              {["Front Page", labelVertical(vertical), "Business", "Insights", "Guides", "Opinion"].map((item, index) => (
                <li key={`nav-${index}`}><span className="hover:text-blue-700 transition">{item}</span></li>
              ))}
            </ul>
          </nav>

          <div className="mt-3 flex justify-center">
            <div className="w-full">
              <p className="text-[9px] font-sans uppercase tracking-widest text-slate-400 text-center mb-1">Advertisement</p>
              <WebsiteAdSlot slot="header-banner" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["header-banner"]} fit="contain" className="mx-auto" />
            </div>
          </div>
        </div>
      </header>

      <div className="bg-red-600 text-white font-sans text-xs font-semibold px-4 py-2 flex items-center gap-3 overflow-hidden">
        <span className="bg-white text-red-600 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider shrink-0">Latest</span>
        <span className="truncate">{ticker}</span>
      </div>

      <section className="bg-slate-100 border-b border-slate-200 px-4 py-4 md:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-[9px] font-sans uppercase tracking-widest text-slate-400 text-center mb-2">Advertisement</p>
          <WebsiteAdSlot slot="top-leaderboard" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["top-leaderboard"]} fit="contain" className="mx-auto" />
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8">
        <div className={isMobile ? "space-y-6" : "grid grid-cols-[1fr_280px] gap-7"}>
          <div className="space-y-6">
            <article className="border-b-2 border-slate-900 pb-6">
              <span className={`inline-block text-[10px] font-sans font-bold uppercase tracking-widest text-white px-2 py-0.5 rounded mb-3 ${featured.categoryColor}`}>{featured.category}</span>
              <h2 className="text-3xl md:text-4xl font-black leading-tight text-slate-900 mb-3">{featured.headline}</h2>
              <p className="text-xs font-sans uppercase tracking-wider text-slate-500 mb-3">{featured.byline} · {featured.readTime}</p>
              <p className="text-base leading-relaxed text-slate-700 mb-4">{featured.excerpt}</p>
              <div className="my-5">
                <p className="text-[9px] font-sans uppercase tracking-widest text-slate-400 mb-2">Advertisement</p>
                <WebsiteAdSlot slot="inline-article" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["inline-article"]} fit="contain" className="mx-auto" />
              </div>
              <p className="text-base leading-relaxed text-slate-600">{nativePromo.description}</p>
            </article>

            <div className="grid md:grid-cols-3 gap-5 border-b border-slate-200 pb-6">
              {sideArticles.map((article) => (
                <article key={article.headline} className="space-y-2">
                  <span className={`inline-block text-[9px] font-sans font-bold uppercase tracking-widest text-white px-1.5 py-0.5 rounded ${article.categoryColor}`}>{article.category}</span>
                  <h3 className="text-sm font-bold leading-snug text-slate-900">{article.headline}</h3>
                  <p className="text-[11px] font-sans text-slate-500">{article.byline}</p>
                  <p className="text-xs leading-relaxed text-slate-600">{article.excerpt}</p>
                </article>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <article className="space-y-2">
                <span className="inline-block text-[9px] font-sans font-bold uppercase tracking-widest bg-orange-500 text-white px-1.5 py-0.5 rounded">Sponsored</span>
                <h3 className="text-sm font-bold leading-snug text-slate-900">{nativePromo.headline}</h3>
                <p className="text-[11px] font-sans text-slate-500">{nativePromo.sponsorLabel}</p>
                <p className="text-xs leading-relaxed text-slate-600">{nativePromo.description}</p>
              </article>
              <WebsiteAdSlot slot="native-feed" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["native-feed"]} fit="contain" className="mx-auto" />
            </div>
          </div>

          {!isMobile ? (
            <aside className="space-y-5">
              <div className="sticky top-4 space-y-5">
                <div>
                  <p className="text-[9px] font-sans uppercase tracking-widest text-slate-400 mb-2">Advertisement</p>
                  <WebsiteAdSlot slot="sidebar-sticky" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["sidebar-sticky"]} fit="contain" className="mx-auto" />
                </div>
                <div className="border border-slate-200 rounded p-4">
                  <h4 className="text-[10px] font-sans font-bold uppercase tracking-widest text-slate-500 mb-3 border-b border-slate-200 pb-2">Trending Now</h4>
                  <ol className="space-y-2">
                    {trending.map((item, index) => (
                      <li key={`trending-${index}`} className="flex gap-2 items-start">
                        <span className="text-2xl font-black text-slate-200 leading-none">{index + 1}</span>
                        <p className="text-xs font-semibold text-slate-700 leading-snug">{item}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </aside>
          ) : null}
        </div>
      </main>

      <footer className="bg-slate-900 text-slate-400 px-4 py-6 md:px-8 font-sans mt-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xl font-black text-white mb-3">{publisherName}</p>
          <p className="text-center text-[10px] text-slate-600">© 2026 {publisherName}. Campaign-aligned preview content.</p>
        </div>
      </footer>
    </article>
  );
}
