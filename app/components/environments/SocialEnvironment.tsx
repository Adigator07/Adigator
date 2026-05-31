"use client";

import { Fragment } from "react";
import type { EnvironmentProps } from "./adSlotUtils";
import { pickPlacement, useFallbackMap, WebsiteAdSlot } from "./adSlotUtils";

const POSTS = [
  {
    avatar: "bg-gradient-to-br from-pink-400 to-rose-500",
    username: "maya.creates",
    handle: "@maya.creates",
    verified: true,
    time: "2m ago",
    content: "Just wrapped up the biggest brand shoot of my career. Three weeks, four cities, one incredible team. Grateful doesn't even cover it. ✨",
    image: "bg-gradient-to-br from-pink-200 to-rose-300",
    likes: "12.4K",
    comments: "847",
    shares: "2.1K",
    tag: "#BrandWork #Photography",
  },
  {
    avatar: "bg-gradient-to-br from-blue-400 to-indigo-500",
    username: "techpulse.daily",
    handle: "@techpulse.daily",
    verified: true,
    time: "14m ago",
    content: "🚨 Breaking: The new chip architecture claims 40% better energy efficiency than current gen. Independent benchmarks coming tomorrow. Here's what we know so far...",
    image: null,
    likes: "8.9K",
    comments: "1.2K",
    shares: "5.6K",
    tag: "#Tech #Chips #AI",
  },
  {
    avatar: "bg-gradient-to-br from-green-400 to-teal-500",
    username: "noah.adventures",
    handle: "@noah.adventures",
    verified: false,
    time: "1h ago",
    content: "Hiking the Dolomites solo for 10 days. No meetings. No Slack. No excuses. This is why I work hard. Day 3 recap in the thread below 👇",
    image: "bg-gradient-to-br from-green-200 to-teal-300",
    likes: "4.2K",
    comments: "312",
    shares: "891",
    tag: "#Travel #Outdoors #Hiking",
  },
];

const SUGGESTED = [
  { name: "Iris Patel", handle: "@iris.design", avatar: "bg-gradient-to-br from-violet-400 to-purple-500", followers: "84.2K" },
  { name: "Jake Morales", handle: "@jakeintech", avatar: "bg-gradient-to-br from-cyan-400 to-blue-500", followers: "231K" },
  { name: "Anya Kim", handle: "@anya.wellness", avatar: "bg-gradient-to-br from-amber-400 to-orange-500", followers: "56.7K" },
];

const TRENDING_TAGS = ["#AIRevolution", "#MondayMotivation", "#TravelDiaries", "#MarketWrap", "#NewDrops", "#WorldCup2026"];

export default function SocialEnvironment({ content, slotType, creativeUrl, creativeSize, device }: EnvironmentProps) {
  const isMobile = device === "mobile";
  const activePlacement = pickPlacement(creativeSize, slotType);
  const fallback = useFallbackMap(content.publisherName, "Flair", device);
  const appName = content.publisherName || "Flair";

  return (
    <article className="min-h-[1400px] bg-slate-950 text-white font-sans">
      {/* Top navbar */}
      <header className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-3 md:px-8 flex items-center justify-between gap-4">
          <div className="text-2xl font-black bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">{appName}</div>
          {!isMobile && (
            <div className="flex-1 max-w-sm relative">
              <input type="text" placeholder="Search people, tags, content..." className="w-full bg-white/10 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-fuchsia-500/50" />
            </div>
          )}
          <div className="flex items-center gap-3 text-slate-400">
            <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm hover:bg-white/20 transition">🔔</button>
            <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm hover:bg-white/20 transition">✉️</button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">U</div>
          </div>
        </div>
        {/* Header banner ad */}
        <div className="border-t border-white/10 px-4 py-2 md:px-8">
          <div className="mx-auto max-w-6xl">
            <p className="text-[9px] uppercase tracking-widest text-slate-500 text-center mb-1">Sponsored</p>
            <WebsiteAdSlot slot="header-banner" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["header-banner"]} fit="contain" className="mx-auto" />
          </div>
        </div>
      </header>

      {/* Leaderboard */}
      <section className="border-b border-white/10 px-4 py-3 md:px-8 bg-slate-900">
        <div className="mx-auto max-w-6xl">
          <WebsiteAdSlot slot="top-leaderboard" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["top-leaderboard"]} fit="contain" className="mx-auto" />
        </div>
      </section>

      {/* Stories row */}
      <section className="border-b border-white/10 px-4 py-4 md:px-8 overflow-x-auto">
        <div className="mx-auto max-w-6xl flex gap-4 min-w-max md:min-w-0">
          {["Your Story", "maya.creates", "techpulse", "noah.adv", "iris.design", "jakeintech", "anya.k", "worldnews"].map((s, i) => (
            <div key={s} className="flex flex-col items-center gap-1 cursor-pointer">
              <div className={`w-14 h-14 rounded-full p-0.5 ${i === 0 ? "border-2 border-dashed border-slate-500" : "bg-gradient-to-br from-fuchsia-500 to-purple-500"}`}>
                <div className={`w-full h-full rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-slate-800 text-slate-400" : "bg-slate-900 text-white"}`}>
                  {i === 0 ? "+" : s[0].toUpperCase()}
                </div>
              </div>
              <span className="text-[10px] text-slate-400 truncate w-14 text-center">{s}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Feed + sidebar */}
      <div className={`mx-auto max-w-6xl px-4 py-5 md:px-8 ${isMobile ? "" : "grid grid-cols-[1fr_300px] gap-6"}`}>

        {/* Feed */}
        <div className="space-y-5">
          {POSTS.map((post, idx) => (
            <Fragment key={`${post.username}-${idx}`}>
              <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden">
                {/* Post header */}
                <div className="flex items-center justify-between px-4 pt-4 pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${post.avatar}`} />
                    <div>
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-bold text-white">{post.username}</p>
                        {post.verified && <span className="text-fuchsia-400 text-xs">✓</span>}
                      </div>
                      <p className="text-[11px] text-slate-500">{post.handle} · {post.time}</p>
                    </div>
                  </div>
                  <button className="text-slate-500 hover:text-white text-lg">···</button>
                </div>

                {/* Content */}
                <div className="px-4 pb-3">
                  <p className="text-sm leading-relaxed text-slate-200">{post.content}</p>
                  <p className="text-xs text-fuchsia-400 mt-1">{post.tag}</p>
                </div>

                {post.image && (
                  <div className={`w-full h-52 ${post.image}`} />
                )}

                {/* Engagement */}
                <div className="px-4 py-3 border-t border-white/10 flex items-center gap-5 text-slate-400 text-sm">
                  <button className="flex items-center gap-1.5 hover:text-rose-400 transition"><span>❤️</span><span className="text-xs">{post.likes}</span></button>
                  <button className="flex items-center gap-1.5 hover:text-blue-400 transition"><span>💬</span><span className="text-xs">{post.comments}</span></button>
                  <button className="flex items-center gap-1.5 hover:text-green-400 transition"><span>🔄</span><span className="text-xs">{post.shares}</span></button>
                  <button className="ml-auto hover:text-yellow-400 transition">🔖</button>
                </div>
              </div>

              {/* Native feed ad after first post */}
              {idx === 0 && (
                <div className="bg-slate-900 border border-fuchsia-500/30 rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-2 border-b border-white/10">
                    <span className="text-[9px] uppercase tracking-widest text-fuchsia-400 font-semibold">Sponsored</span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="p-4">
                      <p className="text-sm font-semibold text-white mb-2">Discover what's trending</p>
                      <p className="text-xs text-slate-400 leading-relaxed">Join millions of creators and brands connecting on Flair.</p>
                      <button className="mt-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold px-4 py-2 rounded-full transition">Explore Now</button>
                    </div>
                    <WebsiteAdSlot slot="native-feed" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["native-feed"]} fit="contain" className="mx-auto" />
                  </div>
                </div>
              )}

              {/* Inline ad after second post */}
              {idx === 1 && (
                <div className="bg-slate-900 border border-white/10 rounded-2xl p-3">
                  <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-2 text-center">Promoted</p>
                  <WebsiteAdSlot slot="inline-article" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["inline-article"]} fit="contain" className="mx-auto" />
                </div>
              )}
            </Fragment>
          ))}
        </div>

        {/* Right sidebar */}
        {!isMobile && (
          <aside className="space-y-5 self-start sticky top-[120px]">
            {/* Suggested accounts */}
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Suggested for you</h4>
              <div className="space-y-3">
                {SUGGESTED.map((a) => (
                  <div key={a.handle} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full ${a.avatar}`} />
                      <div>
                        <p className="text-xs font-semibold text-white">{a.name}</p>
                        <p className="text-[10px] text-slate-500">{a.followers} followers</p>
                      </div>
                    </div>
                    <button className="text-[11px] font-bold text-fuchsia-400 border border-fuchsia-500/30 px-2 py-1 rounded-full hover:bg-fuchsia-500/10 transition">Follow</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending tags */}
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Trending Tags</h4>
              <div className="flex flex-wrap gap-2">
                {TRENDING_TAGS.map((tag) => (
                  <span key={tag} className="text-[11px] bg-fuchsia-500/10 text-fuchsia-300 px-2 py-1 rounded-full cursor-pointer hover:bg-fuchsia-500/20 transition">{tag}</span>
                ))}
              </div>
            </div>

            {/* Sidebar ad */}
            <div>
              <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1 text-center">Sponsored</p>
              <WebsiteAdSlot slot="sidebar-sticky" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["sidebar-sticky"]} fit="contain" className="mx-auto" />
            </div>
          </aside>
        )}
      </div>

      <footer className="border-t border-white/10 bg-slate-900 px-4 py-5 md:px-8 mt-4">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-lg font-black bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">{appName}</p>
          <div className="flex flex-wrap gap-4 text-xs text-slate-500">
            {["About", "Privacy", "Terms", "Cookies", "Help", "Advertise", "Careers"].map((l) => (
              <a key={l} href="#" className="hover:text-white transition">{l}</a>
            ))}
          </div>
          <p className="text-[11px] text-slate-600">© 2026 {appName}</p>
        </div>
      </footer>
    </article>
  );
}