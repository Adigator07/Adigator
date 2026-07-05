"use client";

import { Fragment } from "react";
import type { EnvironmentProps } from "./adSlotUtils";
import { pickPlacement, useFallbackMap, WebsiteAdSlot } from "./adSlotUtils";
import {
  deriveNativePromo,
  deriveSocialFeedPosts,
  deriveSuggestedAccounts,
  deriveTrendingItems,
  labelVertical,
} from "@/app/lib/previewEnvironmentContent";

export default function SocialEnvironment({
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
  const appName = content.publisherName || `${labelVertical(vertical)} Network`;
  const posts = deriveSocialFeedPosts(content, vertical);
  const suggested = deriveSuggestedAccounts(content, vertical);
  const trendingTags = deriveTrendingItems(content, vertical).map(
    (item) => `#${item.replace(/[^a-zA-Z0-9\s]/g, "").trim().split(/\s+/).slice(0, 3).join("")}`,
  );
  const nativePromo = deriveNativePromo(content, brandName);

  return (
    <article className="min-h-[1400px] bg-slate-950 text-white font-sans">
      <header className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-3 md:px-8 flex items-center justify-between gap-4">
          <div className="text-2xl font-black bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">{appName}</div>
          {!isMobile ? (
            <div className="flex-1 max-w-sm relative">
              <input type="text" placeholder={`Search ${labelVertical(vertical).toLowerCase()} topics…`} className="w-full bg-white/10 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-fuchsia-500/50" readOnly />
            </div>
          ) : null}
        </div>
        <div className="border-t border-white/10 px-4 py-2 md:px-8">
          <div className="mx-auto max-w-6xl">
            <p className="text-[9px] uppercase tracking-widest text-slate-500 text-center mb-1">Sponsored</p>
            <WebsiteAdSlot slot="header-banner" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["header-banner"]} fit="contain" className="mx-auto" />
          </div>
        </div>
      </header>

      <section className="border-b border-white/10 px-4 py-3 md:px-8 bg-slate-900">
        <div className="mx-auto max-w-6xl">
          <WebsiteAdSlot slot="top-leaderboard" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["top-leaderboard"]} fit="contain" className="mx-auto" />
        </div>
      </section>

      <div className={`mx-auto max-w-6xl px-4 py-5 md:px-8 ${isMobile ? "" : "grid grid-cols-[1fr_300px] gap-6"}`}>
        <div className="space-y-5">
          {posts.map((post, idx) => (
            <Fragment key={`${post.username}-${idx}`}>
              <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 pt-4 pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${post.avatar}`} />
                    <div>
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-bold text-white">{post.username}</p>
                        {post.verified ? <span className="text-fuchsia-400 text-xs">✓</span> : null}
                      </div>
                      <p className="text-[11px] text-slate-500">{post.handle} · {post.time}</p>
                    </div>
                  </div>
                </div>
                <div className="px-4 pb-3">
                  <p className="text-sm leading-relaxed text-slate-200">{post.content}</p>
                  <p className="text-xs text-fuchsia-400 mt-1">{post.tag}</p>
                </div>
                {post.image ? <div className={`w-full h-52 ${post.image}`} /> : null}
                <div className="px-4 py-3 border-t border-white/10 flex items-center gap-5 text-slate-400 text-sm">
                  <span className="text-xs">{post.likes}</span>
                  <span className="text-xs">{post.comments}</span>
                  <span className="text-xs">{post.shares}</span>
                </div>
              </div>

              {idx === 0 ? (
                <div className="bg-slate-900 border border-fuchsia-500/30 rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10">
                    <span className="text-[9px] uppercase tracking-widest text-fuchsia-400 font-semibold">Sponsored</span>
                    <span className="text-[11px] text-slate-400">{nativePromo.sponsorLabel}</span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="p-4">
                      <p className="text-sm font-semibold text-white mb-2">{nativePromo.headline}</p>
                      <p className="text-xs text-slate-400 leading-relaxed">{nativePromo.description}</p>
                      <button type="button" className="mt-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold px-4 py-2 rounded-full transition">{nativePromo.cta}</button>
                    </div>
                    <WebsiteAdSlot slot="native-feed" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["native-feed"]} fit="contain" className="mx-auto" />
                  </div>
                </div>
              ) : null}

              {idx === 1 ? (
                <div className="bg-slate-900 border border-white/10 rounded-2xl p-3">
                  <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-2 text-center">Promoted</p>
                  <WebsiteAdSlot slot="inline-article" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["inline-article"]} fit="contain" className="mx-auto" />
                </div>
              ) : null}
            </Fragment>
          ))}
        </div>

        {!isMobile ? (
          <aside className="space-y-5 self-start sticky top-[120px]">
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Suggested for you</h4>
              <div className="space-y-3">
                {suggested.map((account) => (
                  <div key={account.handle} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full ${account.avatar}`} />
                      <div>
                        <p className="text-xs font-semibold text-white">{account.name}</p>
                        <p className="text-[10px] text-slate-500">{account.followers}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Trending Tags</h4>
              <div className="flex flex-wrap gap-2">
                {trendingTags.map((tag) => (
                  <span key={tag} className="text-[11px] bg-fuchsia-500/10 text-fuchsia-300 px-2 py-1 rounded-full">{tag}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1 text-center">Sponsored</p>
              <WebsiteAdSlot slot="sidebar-sticky" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["sidebar-sticky"]} fit="contain" className="mx-auto" />
            </div>
          </aside>
        ) : null}
      </div>

      <footer className="border-t border-white/10 bg-slate-900 px-4 py-5 md:px-8 mt-4">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-lg font-black bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">{appName}</p>
          <p className="text-[11px] text-slate-600">© 2026 {appName} · {labelVertical(vertical)} preview</p>
        </div>
      </footer>
    </article>
  );
}
