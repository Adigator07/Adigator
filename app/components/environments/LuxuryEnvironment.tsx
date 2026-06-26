"use client";

import type { EnvironmentProps } from "./adSlotUtils";
import { pickPlacement, useFallbackMap, WebsiteAdSlot } from "./adSlotUtils";

const EDITORIALS = [
  {
    category: "Style & Design",
    headline: "The New Language of Quiet Luxury",
    subhead: "How restraint became the ultimate status signal in fashion and interiors",
    author: "Céline Marchetti",
    issue: "Issue 142 · May 2026",
    gradient: "from-stone-800 to-stone-900",
  },
  {
    category: "Travel",
    headline: "Patagonia in First Light",
    subhead: "A private expedition through the world's last untouched wilderness",
    author: "James Thornton",
    issue: "Issue 141 · April 2026",
    gradient: "from-slate-800 to-slate-900",
  },
  {
    category: "Wellness",
    headline: "The Art of Doing Nothing",
    subhead: "Why the world's most successful people are embracing strategic stillness",
    author: "Dr. Nadia Solis",
    issue: "Issue 140 · March 2026",
    gradient: "from-zinc-800 to-zinc-900",
  },
];

export default function LuxuryEnvironment({ content, slotType, creativeUrl, creativeSize, device }: EnvironmentProps) {
  const isMobile = device === "mobile";
  const activePlacement = pickPlacement(creativeSize, slotType);
  const fallback = useFallbackMap(content.publisherName, "Maison", device);
  const pubName = content.publisherName || "Maison";

  return (
    <article className="min-h-[1400px] bg-stone-50 text-stone-900" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
      {/* Thin luxury header */}
      <div className="bg-stone-900 text-stone-300 text-[10px] font-sans tracking-[0.3em] uppercase text-center py-1.5">
        The Luxury Lifestyle Edition · May 2026
      </div>

      <header className="border-b border-stone-300 px-4 pt-6 pb-5 md:px-12">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-5">
            <p className="text-[10px] font-sans uppercase tracking-[0.4em] text-stone-400 mb-3">Est. 1994</p>
            <h1 className="text-5xl md:text-8xl font-black tracking-tight text-stone-900 uppercase">{pubName}</h1>
            <p className="text-[11px] font-sans tracking-[0.35em] uppercase text-stone-400 mt-2">The International Review of Fine Living</p>
          </div>

          <nav className="flex justify-center gap-8 text-[11px] font-sans uppercase tracking-[0.25em] text-stone-500 border-t border-stone-300 pt-4">
            {["Cover", "Fashion", "Travel", "Interiors", "Culture", "Wellness", "Dining", "Archive"].map((n) => (
              <a key={n} href="#" className="hover:text-stone-900 transition">{n}</a>
            ))}
          </nav>
        </div>
      </header>

      {/* Leaderboard — full bleed editorial */}
      <section className="bg-stone-100 border-b border-stone-200 px-4 py-5 md:px-12">
        <div className="mx-auto max-w-5xl">
          <p className="text-[9px] font-sans uppercase tracking-widest text-stone-400 text-center mb-2">Advertisement</p>
          <WebsiteAdSlot slot="top-leaderboard" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["top-leaderboard"]} fit="contain" className="mx-auto" />
        </div>
      </section>

      {/* Hero feature */}
      <section className="mx-auto max-w-5xl px-4 py-10 md:px-12">
        <div className={`${isMobile ? "" : "grid grid-cols-2 gap-10"} items-start`}>
          <div>
            <p className="text-[11px] font-sans uppercase tracking-[0.35em] text-stone-400 mb-4">{EDITORIALS[0].category}</p>
            <h2 className="text-4xl md:text-5xl font-black leading-tight text-stone-900 mb-5">{EDITORIALS[0].headline}</h2>
            <p className="text-lg text-stone-600 leading-relaxed mb-5">{EDITORIALS[0].subhead}</p>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-stone-600 to-stone-800" />
              <div>
                <p className="text-sm font-semibold text-stone-800">{EDITORIALS[0].author}</p>
                <p className="text-[11px] font-sans text-stone-500">{EDITORIALS[0].issue}</p>
              </div>
            </div>
            <button className="border border-stone-900 text-stone-900 px-6 py-3 text-[11px] font-sans uppercase tracking-[0.25em] hover:bg-stone-900 hover:text-white transition">Read Full Feature</button>
          </div>
          <div className="space-y-4">
            <div className={`h-72 rounded bg-gradient-to-br ${EDITORIALS[0].gradient} flex items-end p-5`}>
              <p className="text-stone-400 text-xs font-sans uppercase tracking-widest">Photography by Elara Voss · {pubName}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="h-32 rounded bg-gradient-to-br from-amber-100 to-stone-200" />
              <div className="h-32 rounded bg-gradient-to-br from-stone-200 to-zinc-200" />
            </div>
          </div>
        </div>
      </section>

      {/* Header banner */}
      <section className="bg-stone-100 border-y border-stone-200 px-4 py-4 md:px-12">
        <div className="mx-auto max-w-5xl">
          <p className="text-[9px] font-sans uppercase tracking-widest text-stone-400 text-center mb-2">Advertisement</p>
          <WebsiteAdSlot slot="header-banner" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["header-banner"]} fit="contain" className="mx-auto" />
        </div>
      </section>

      {/* Magazine grid */}
      <section className="mx-auto max-w-5xl px-4 py-8 md:px-12">
        <div className={isMobile ? "space-y-8" : "grid grid-cols-[1fr_240px] gap-8"}>
          <main className="space-y-10">
            <div className="grid md:grid-cols-2 gap-6">
              {EDITORIALS.slice(1).map((ed) => (
                <article key={ed.headline} className="space-y-3 border-t border-stone-200 pt-4">
                  <p className="text-[10px] font-sans uppercase tracking-[0.3em] text-stone-400">{ed.category}</p>
                  <h3 className="text-xl font-black leading-tight text-stone-900">{ed.headline}</h3>
                  <p className="text-sm text-stone-600 leading-relaxed">{ed.subhead}</p>
                  <div className={`h-40 rounded bg-gradient-to-br ${ed.gradient}`} />
                  <p className="text-[11px] font-sans text-stone-500">By {ed.author} · {ed.issue}</p>
                  <a href="#" className="text-[11px] font-sans uppercase tracking-wider text-stone-700 hover:text-stone-900 transition border-b border-stone-400">Continue Reading</a>
                </article>
              ))}
            </div>

            {/* Inline ad */}
            <div className="border-y border-stone-200 py-5">
              <p className="text-[9px] font-sans uppercase tracking-widest text-stone-400 text-center mb-3">Advertisement</p>
              <WebsiteAdSlot slot="inline-article" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["inline-article"]} fit="contain" className="mx-auto" />
            </div>

            {/* Full spread native */}
            <div className="grid md:grid-cols-2 gap-6 items-center border-t border-stone-200 pt-8">
              <div>
                <p className="text-[10px] font-sans uppercase tracking-[0.3em] text-stone-400 mb-3">Collector's Edition</p>
                <h3 className="text-2xl font-black text-stone-900 mb-3">Objects of Desire · Spring 2026</h3>
                <p className="text-sm text-stone-600 leading-relaxed mb-4">Our editors curate the season's most coveted pieces across fashion, jewellery, and the art of living well.</p>
                <a href="#" className="text-[11px] font-sans uppercase tracking-wider text-stone-700 border-b border-stone-400 hover:text-stone-900 transition">Explore the Edition</a>
              </div>
              <WebsiteAdSlot slot="native-feed" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["native-feed"]} fit="contain" className="mx-auto" />
            </div>
          </main>

          {!isMobile && (
            <aside className="space-y-6 self-start sticky top-6">
              <div>
                <p className="text-[9px] font-sans uppercase tracking-widest text-stone-400 mb-2 text-center">Advertisement</p>
                <WebsiteAdSlot slot="sidebar-sticky" activePlacement={activePlacement} creativeUrl={creativeUrl} creativeSize={creativeSize} fallbackSrc={fallback["sidebar-sticky"]} fit="contain" className="mx-auto" />
              </div>
              <div className="border border-stone-200 p-5">
                <p className="text-[10px] font-sans uppercase tracking-[0.3em] text-stone-400 mb-4 border-b border-stone-200 pb-3">From the Editor</p>
                <p className="text-sm text-stone-700 leading-relaxed italic">"This season we asked ourselves what luxury really means in an age of abundance. The answer surprised us."</p>
                <p className="text-[11px] font-sans mt-3 text-stone-500">Sophie Laurent, Editor-in-Chief</p>
              </div>
              <div className="border border-stone-200 p-4">
                <p className="text-[10px] font-sans uppercase tracking-[0.3em] text-stone-400 mb-3">Subscribe</p>
                <p className="text-xs text-stone-600 mb-3">12 issues per year. Print & digital access. Exclusive subscriber events.</p>
                <button className="w-full bg-stone-900 text-white text-[11px] font-sans uppercase tracking-wider py-3 hover:bg-stone-700 transition">Subscribe Now</button>
              </div>
            </aside>
          )}
        </div>
      </section>

      <footer className="bg-stone-900 text-stone-400 px-4 py-8 md:px-12 mt-6 font-sans">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-3xl font-black text-white uppercase tracking-tight mb-4">{pubName}</p>
          <div className="flex flex-wrap justify-center gap-5 text-[10px] uppercase tracking-[0.3em] mb-5">
            {["Subscribe", "Advertise", "About", "Contact", "Privacy", "Terms"].map((l) => (
              <a key={l} href="#" className="hover:text-white transition">{l}</a>
            ))}
          </div>
          <p className="text-center text-[10px] text-stone-600">© 2026 {pubName} International. All rights reserved.</p>
        </div>
      </footer>
    </article>
  );
}
