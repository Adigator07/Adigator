"use client";

import { Fragment } from "react";
import type { EnvironmentProps } from "./adSlotUtils";
import { pickPlacement, useFallbackMap, WebsiteAdSlot } from "./adSlotUtils";
import {
  deriveEditorialArticles,
  deriveNativePromo,
  deriveTrendingItems,
  labelVertical,
} from "@/app/lib/previewEnvironmentContent";

export default function NativeDisplayEnvironment({
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
  const publisherName = content.publisherName || `${labelVertical(vertical)} Digest`;
  const articles = deriveEditorialArticles(content, vertical);
  const trending = deriveTrendingItems(content, vertical);
  const nativePromo = deriveNativePromo(content, brandName);
  const featured = articles[0];
  const related = articles.slice(1);

  return (
    <article className="min-h-[1400px] bg-[#f7f5f1] text-slate-900 font-sans">
      <header className="border-b border-slate-200 bg-white px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">Native Publisher Preview</p>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">{publisherName}</h1>
          </div>
          <div className="hidden text-xs text-slate-500 md:block">{labelVertical(vertical)} · Sponsored content modules</div>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-white px-4 py-3 md:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="mb-1 text-center text-[9px] uppercase tracking-widest text-slate-400">Advertisement</p>
          <WebsiteAdSlot slot="top-leaderboard" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["top-leaderboard"]} fit="contain" className="mx-auto" />
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8">
        <div className={isMobile ? "space-y-6" : "grid grid-cols-[1fr_320px] gap-8"}>
          <div className="space-y-6">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="inline-block rounded bg-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                {featured.category}
              </span>
              <h2 className="mt-3 text-2xl font-black leading-tight text-slate-900">{featured.headline}</h2>
              <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">{featured.byline} · {featured.readTime}</p>
              <p className="mt-4 text-sm leading-relaxed text-slate-700">{featured.excerpt}</p>
            </article>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <span className="rounded bg-amber-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white">Sponsored</span>
                <span className="text-[11px] font-semibold text-amber-900">{nativePromo.sponsorLabel}</span>
              </div>
              <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{nativePromo.headline}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{nativePromo.description}</p>
                  <button type="button" className="mt-3 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white">
                    {nativePromo.cta}
                  </button>
                </div>
                <WebsiteAdSlot slot="native-feed" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["native-feed"]} fit="contain" className="mx-auto" />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Recommended for you</h3>
              {related.map((article, index) => (
                <Fragment key={`related-${index}`}>
                  <article className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_220px]">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{article.category}</span>
                      <h4 className="mt-1 text-base font-bold leading-snug text-slate-900">{article.headline}</h4>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">{article.excerpt}</p>
                      <p className="mt-2 text-[11px] text-slate-500">{article.byline}</p>
                    </div>
                    <div className="flex min-h-[120px] items-center justify-center rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 text-xs text-slate-500">
                      Editorial image
                    </div>
                  </article>
                </Fragment>
              ))}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="mb-2 text-center text-[9px] uppercase tracking-widest text-slate-400">Promoted</p>
              <WebsiteAdSlot slot="inline-article" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["inline-article"]} fit="contain" className="mx-auto" />
            </div>
          </div>

          {!isMobile ? (
            <aside className="space-y-5 self-start">
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h4 className="border-b border-slate-200 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Trending in {labelVertical(vertical)}
                </h4>
                <ol className="mt-3 space-y-2">
                  {trending.map((item, index) => (
                    <li key={`trending-${index}`} className="flex gap-2 items-start">
                      <span className="text-xl font-black leading-none text-slate-200">{index + 1}</span>
                      <p className="text-xs font-semibold leading-snug text-slate-700">{item}</p>
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <p className="mb-1 text-center text-[9px] uppercase tracking-widest text-slate-400">Sponsored</p>
                <WebsiteAdSlot slot="sidebar-sticky" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["sidebar-sticky"]} fit="contain" className="mx-auto" />
              </div>
            </aside>
          ) : null}
        </div>
      </main>
    </article>
  );
}
