"use client";

import type { EnvironmentProps } from "./adSlotUtils";
import { pickPlacement, useFallbackMap, WebsiteAdSlot } from "./adSlotUtils";

const ARTICLES = [
  {
    category: "BREAKING",
    categoryColor: "bg-red-600",
    headline: "Global markets rally as inflation cools for third consecutive quarter",
    byline: "Sarah Mitchell · Economics Desk",
    excerpt:
      "Central banks across three continents signal a pivot as consumer price data comes in below expectations, sparking the biggest single-day gains in 18 months.",
    readTime: "4 min read",
  },
  {
    category: "TECH",
    categoryColor: "bg-blue-600",
    headline: "AI regulation framework passes senate committee with bipartisan support",
    byline: "James Okafor · Tech Policy",
    excerpt:
      "A landmark bill requiring transparency disclosures for AI-generated content passed the senate technology committee 11-4 in a rare show of cross-party consensus.",
    readTime: "6 min read",
  },
  {
    category: "WORLD",
    categoryColor: "bg-green-600",
    headline: "UN climate summit reaches binding agreement on carbon credit markets",
    byline: "Priya Ramesh · World Affairs",
    excerpt:
      "After 72 hours of negotiations, 140 nations signed a framework standardising carbon credit pricing — a deal analysts call the most consequential since Paris 2015.",
    readTime: "5 min read",
  },
  {
    category: "SCIENCE",
    categoryColor: "bg-purple-600",
    headline: "Researchers publish results of first successful lab-grown kidney transplant",
    byline: "Dr. Elena Vasquez · Health & Science",
    excerpt:
      "A team at Johns Hopkins has documented a 100-day follow-up with a transplant patient showing full organ function — a milestone for bioengineered organ research.",
    readTime: "7 min read",
  },
];

const TRENDING = [
  "Markets rebound after Fed comments",
  "Elections in 3 key states today",
  "New space telescope images released",
  "Premier League transfer deadline recap",
  "Supreme Court rules on data privacy",
];

export default function NewsEnvironment({ content, slotType, creativeUrl, creativeSize, device }: EnvironmentProps) {
  const isMobile = device === "mobile";
  const activePlacement = pickPlacement(creativeSize, slotType);
  const fallback = useFallbackMap(content.publisherName, "The Daily Chronicle", device);

  const publisherName = content.publisherName || "The Daily Chronicle";
  const featured = ARTICLES[0];
  const sideArticles = ARTICLES.slice(1);

  return (
    <article className="min-h-[1400px] bg-white text-slate-900 font-serif">
      {/* Top utility bar */}
      <div className="bg-slate-900 text-slate-300 text-[10px] font-sans uppercase tracking-widest px-4 py-1.5 flex items-center justify-between">
        <span>Monday, May 11, 2026</span>
        <div className="flex gap-4">
          <span>Print Edition</span>
          <span>Newsletter</span>
          <span>Subscribe</span>
        </div>
      </div>

      {/* Masthead */}
      <header className="border-b-4 border-slate-900 px-4 pt-5 pb-3 md:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-4">
            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900">{publisherName}</h1>
            <p className="text-xs font-sans uppercase tracking-[0.3em] text-slate-500 mt-1">Trusted News · Since 1888 · World Edition</p>
          </div>

          {/* Nav */}
          <nav className="border-t border-b border-slate-300 py-2 font-sans">
            <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-[11px] font-semibold uppercase tracking-widest text-slate-700">
              {["Front Page", "World", "U.S.", "Business", "Tech", "Science", "Arts", "Opinion", "Sports"].map((item) => (
                <li key={item}><a href="#" className="hover:text-blue-700 transition">{item}</a></li>
              ))}
            </ul>
          </nav>

          {/* Header banner ad */}
          <div className="mt-3 flex justify-center">
            <div className="w-full">
              <p className="text-[9px] font-sans uppercase tracking-widest text-slate-400 text-center mb-1">Advertisement</p>
              <WebsiteAdSlot slot="header-banner" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["header-banner"]} fit="contain" className="mx-auto" />
            </div>
          </div>
        </div>
      </header>

      {/* Breaking ticker */}
      <div className="bg-red-600 text-white font-sans text-xs font-semibold px-4 py-2 flex items-center gap-3 overflow-hidden">
        <span className="bg-white text-red-600 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider shrink-0">Breaking</span>
        <span className="truncate">Global markets rally · AI regulation bill passes · UN climate deal signed · Lab-grown kidney milestone · 3 state elections today</span>
      </div>

      {/* Leaderboard */}
      <section className="bg-slate-100 border-b border-slate-200 px-4 py-4 md:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-[9px] font-sans uppercase tracking-widest text-slate-400 text-center mb-2">Advertisement</p>
          <WebsiteAdSlot slot="top-leaderboard" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["top-leaderboard"]} fit="cover" className="mx-auto" />
        </div>
      </section>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8">
        <div className={isMobile ? "space-y-6" : "grid grid-cols-[1fr_280px] gap-7"}>

          {/* Articles */}
          <div className="space-y-6">
            {/* Featured article */}
            <article className="border-b-2 border-slate-900 pb-6">
              <span className={`inline-block text-[10px] font-sans font-bold uppercase tracking-widest text-white px-2 py-0.5 rounded mb-3 ${featured.categoryColor}`}>{featured.category}</span>
              <h2 className="text-3xl md:text-4xl font-black leading-tight text-slate-900 mb-3">{featured.headline}</h2>
              <p className="text-xs font-sans uppercase tracking-wider text-slate-500 mb-3">{featured.byline} · {featured.readTime}</p>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="h-44 rounded bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-400 font-sans text-sm">Photo · AFP</div>
                <div className="h-44 rounded bg-gradient-to-br from-blue-100 to-slate-200 flex items-center justify-center text-slate-400 font-sans text-sm">Photo · Reuters</div>
              </div>
              <p className="text-base leading-relaxed text-slate-700 mb-4">{featured.excerpt}</p>
              <p className="text-base leading-relaxed text-slate-600 mb-4">
                Economists surveyed by Bloomberg put the probability of a rate cut within 90 days at 74%, up sharply from 41% just three weeks ago. Bond yields fell across the curve as traders recalibrated expectations for the upcoming Federal Reserve meeting.
              </p>
              {/* Inline article ad */}
              <div className="my-5">
                <p className="text-[9px] font-sans uppercase tracking-widest text-slate-400 mb-2">Advertisement</p>
                <WebsiteAdSlot slot="inline-article" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["inline-article"]} fit="contain" className="mx-auto" />
              </div>
              <p className="text-base leading-relaxed text-slate-600">
                Consumer confidence indexes rose 4.2 points in the latest University of Michigan survey, while spending on discretionary goods ticked upward for the second month. Analysts warned that services inflation, particularly in housing, remained elevated.
              </p>
            </article>

            {/* Secondary articles grid */}
            <div className="grid md:grid-cols-3 gap-5 border-b border-slate-200 pb-6">
              {sideArticles.map((a) => (
                <article key={a.headline} className="space-y-2">
                  <span className={`inline-block text-[9px] font-sans font-bold uppercase tracking-widest text-white px-1.5 py-0.5 rounded ${a.categoryColor}`}>{a.category}</span>
                  <h3 className="text-sm font-bold leading-snug text-slate-900">{a.headline}</h3>
                  <p className="text-[11px] font-sans text-slate-500">{a.byline}</p>
                  <p className="text-xs leading-relaxed text-slate-600">{a.excerpt}</p>
                  <a href="#" className="text-[11px] font-sans font-semibold text-blue-700 hover:underline">Read more →</a>
                </article>
              ))}
            </div>

            {/* Native feed slot */}
            <div className="grid md:grid-cols-2 gap-4">
              <article className="space-y-2">
                <span className="inline-block text-[9px] font-sans font-bold uppercase tracking-widest bg-orange-500 text-white px-1.5 py-0.5 rounded">Opinion</span>
                <h3 className="text-sm font-bold leading-snug text-slate-900">Why the press must stay independent in an era of AI-generated content</h3>
                <p className="text-[11px] font-sans text-slate-500">Editorial Board · 8 min read</p>
                <p className="text-xs leading-relaxed text-slate-600">The integrity of public information depends on editorial gatekeeping that no algorithm can replicate.</p>
              </article>
              <WebsiteAdSlot slot="native-feed" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["native-feed"]} fit="cover" className="mx-auto" />
            </div>
          </div>

          {/* Sidebar */}
          {!isMobile && (
            <aside className="space-y-5">
              <div className="sticky top-4 space-y-5">
                <div>
                  <p className="text-[9px] font-sans uppercase tracking-widest text-slate-400 mb-2">Advertisement</p>
                  <WebsiteAdSlot slot="sidebar-sticky" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["sidebar-sticky"]} fit="contain" className="mx-auto" />
                </div>
                <div className="border border-slate-200 rounded p-4">
                  <h4 className="text-[10px] font-sans font-bold uppercase tracking-widest text-slate-500 mb-3 border-b border-slate-200 pb-2">Trending Now</h4>
                  <ol className="space-y-2">
                    {TRENDING.map((item, i) => (
                      <li key={item} className="flex gap-2 items-start">
                        <span className="text-2xl font-black text-slate-200 leading-none">{i + 1}</span>
                        <p className="text-xs font-semibold text-slate-700 leading-snug">{item}</p>
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="border border-slate-200 rounded p-4">
                  <h4 className="text-[10px] font-sans font-bold uppercase tracking-widest text-slate-500 mb-3">Today's Weather</h4>
                  <div className="text-center">
                    <p className="text-4xl font-black text-slate-800">68°F</p>
                    <p className="text-xs font-sans text-slate-500">Partly Cloudy · New York</p>
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>
      </main>

      <footer className="bg-slate-900 text-slate-400 px-4 py-6 md:px-8 font-sans mt-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xl font-black text-white mb-3">{publisherName}</p>
          <div className="flex flex-wrap justify-center gap-4 text-[11px] uppercase tracking-wider mb-4">
            {["About Us", "Advertise", "Privacy", "Terms", "Corrections", "Contact", "RSS"].map((l) => (
              <a key={l} href="#" className="hover:text-white transition">{l}</a>
            ))}
          </div>
          <p className="text-center text-[10px] text-slate-600">© 2026 {publisherName}. All rights reserved. Reproduction in whole or in part without permission is prohibited.</p>
        </div>
      </footer>
    </article>
  );
}