"use client";

import React, { useMemo } from "react";
import { generateTemplateContent } from "../../lib/templateContent";
import AdSlot from "../AdSlot";
import { TrendingUp, BarChart2, Briefcase, Globe, Menu, Search, User } from "lucide-react";

export default function BusinessTemplate({
  topSlots = [],
  leftSlots = [],
  rightSlots = [],
  contentSlots = [],
  bottomSlots = [],
  activeSlotId,
  slotCreativeMap,
  showSlotLabels,
  isMobile,
}) {
  const content = useMemo(() => generateTemplateContent("business"), []);

  return (
    <div className="min-h-[1080px] bg-slate-50 font-sans text-slate-900 w-full overflow-hidden">
      {/* ── HEADER ── */}
      <header className="bg-[#0f172a] text-white sticky top-0 z-40 border-b border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Menu className="w-6 h-6 text-slate-300" />
            <div className="flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-blue-500" />
              <span className="text-2xl font-bold tracking-tight">MARKET<span className="text-blue-500">PRO</span></span>
            </div>
            <nav className="hidden md:flex items-center gap-6 ml-8 text-sm font-semibold text-slate-300">
              <span className="hover:text-white cursor-pointer transition">Markets</span>
              <span className="hover:text-white cursor-pointer transition">Economy</span>
              <span className="hover:text-white cursor-pointer transition">Tech</span>
              <span className="hover:text-white cursor-pointer transition">Finance</span>
              <span className="hover:text-white cursor-pointer transition">Real Estate</span>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Search className="w-5 h-5 text-slate-300" />
            <User className="w-5 h-5 text-slate-300" />
            <button className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded">
              SUBSCRIBE
            </button>
          </div>
        </div>
        {/* Ticker Tape */}
        <div className="bg-[#1e293b] py-2 overflow-hidden whitespace-nowrap border-b border-slate-800">
          <div className="animate-pulse flex items-center gap-8 text-xs font-mono text-slate-300 px-4">
            <span className="text-green-400">▲ S&P 500 5,204.30 (+0.8%)</span>
            <span className="text-red-400">▼ NASDAQ 16,342.10 (-0.2%)</span>
            <span className="text-green-400">▲ DOW 39,120.50 (+1.1%)</span>
            <span className="text-green-400">▲ BTC $68,420 (+2.4%)</span>
            <span className="text-red-400">▼ OIL $81.20 (-1.5%)</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* ── TOP BANNER ── */}
        {topSlots.length > 0 && (
          <div className="w-full flex justify-center mb-8 border-b border-slate-200 pb-8">
            <AdSlot
              slotDef={topSlots[0]}
              activeSlotId={activeSlotId}
              slotCreativeMap={slotCreativeMap}
              showSlotLabels={showSlotLabels}
              isMobile={isMobile}
            />
          </div>
        )}

        {/* ── HERO SECTION ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Main Hero */}
          <div className="lg:col-span-8 group cursor-pointer relative overflow-hidden rounded-xl">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent z-10" />
            <img
              src={content.hero.image}
              alt="Hero"
              className="w-full h-[500px] object-cover group-hover:scale-105 transition duration-700"
            />
            <div className="absolute bottom-0 left-0 p-8 z-20 w-full">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded mb-4">
                <Globe className="w-3 h-3" /> EXCLUSIVE
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4 group-hover:text-blue-400 transition">
                {content.hero.headline}
              </h1>
              <p className="text-lg text-slate-200 max-w-3xl line-clamp-2">
                {content.hero.subtitle}
              </p>
            </div>
          </div>

          {/* Right Hero Side - Ads or Trending */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <BarChart2 className="w-4 h-4" /> Market Movers
              </h3>
              <div className="flex flex-col gap-4">
                {content.trending.slice(0, 4).map((title, i) => (
                  <div key={i} className="group cursor-pointer border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                    <h4 className="font-semibold text-slate-800 leading-snug group-hover:text-blue-600 transition">
                      {title}
                    </h4>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Sidebar Ad */}
            {rightSlots.length > 0 && (
              <div className="bg-slate-100 p-4 rounded-xl flex items-center justify-center min-h-[250px]">
                <AdSlot
                  slotDef={rightSlots[0]}
                  activeSlotId={activeSlotId}
                  slotCreativeMap={slotCreativeMap}
                  showSlotLabels={showSlotLabels}
                  isMobile={isMobile}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── MAIN CONTENT GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Articles Feed */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Latest Industry News</h2>
            </div>
            
            <div className="flex flex-col gap-8">
              {content.articles.map((article, i) => (
                <React.Fragment key={i}>
                  <article className="group flex flex-col sm:flex-row gap-6 items-start cursor-pointer">
                    <div className="w-full sm:w-1/3 aspect-[4/3] rounded-lg overflow-hidden shrink-0">
                      <img
                        src={article.image}
                        alt="Article"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    </div>
                    <div className="flex flex-col justify-between py-2">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{article.category}</span>
                        <span className="text-xs text-slate-400">• {article.timeAgo}</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition leading-snug">
                        {article.title}
                      </h3>
                      <p className="text-sm text-slate-600 line-clamp-2">
                        Industry leaders weigh in on the implications of recent market shifts and what it means for the upcoming fiscal quarter.
                      </p>
                    </div>
                  </article>

                  {/* Interleave Content Ads */}
                  {i % 2 === 1 && contentSlots[Math.floor(i / 2)] && (
                    <div className="w-full my-8 py-8 border-y border-slate-100 flex flex-col items-center justify-center bg-slate-50">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">Advertisement</span>
                      <AdSlot
                        slotDef={contentSlots[Math.floor(i / 2)]}
                        activeSlotId={activeSlotId}
                        slotCreativeMap={slotCreativeMap}
                        showSlotLabels={showSlotLabels}
                        isMobile={isMobile}
                      />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Left Sidebar (rendered on right in layout) */}
          <aside className="lg:col-span-4 space-y-8">
            {leftSlots.map((slot, i) => (
              <div key={i} className="sticky top-24 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
                 <span className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">Sponsored</span>
                <AdSlot
                  slotDef={slot}
                  activeSlotId={activeSlotId}
                  slotCreativeMap={slotCreativeMap}
                  showSlotLabels={showSlotLabels}
                  isMobile={isMobile}
                />
              </div>
            ))}

            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
              <Briefcase className="w-8 h-8 text-blue-600 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-2">Market Insights Newsletter</h3>
              <p className="text-sm text-slate-600 mb-4">Get the daily briefing delivered straight to your inbox before the opening bell.</p>
              <input type="email" placeholder="Your corporate email" className="w-full px-4 py-2 rounded border border-slate-300 mb-3 text-sm" />
              <button className="w-full bg-blue-600 text-white font-bold py-2 rounded text-sm hover:bg-blue-700 transition">Subscribe Now</button>
            </div>
          </aside>
        </div>

        {/* ── BOTTOM BANNER ── */}
        {bottomSlots.length > 0 && (
          <div className="w-full mt-16 mb-8 pt-8 border-t border-slate-200 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest mb-4">Advertisement</span>
            <AdSlot
              slotDef={bottomSlots[0]}
              activeSlotId={activeSlotId}
              slotCreativeMap={slotCreativeMap}
              showSlotLabels={showSlotLabels}
              isMobile={isMobile}
            />
          </div>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0f172a] text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-6 h-6 text-blue-500" />
              <span className="text-xl font-bold text-white tracking-tight">MARKET<span className="text-blue-500">PRO</span></span>
            </div>
            <p className="text-sm leading-relaxed mb-6">
              The premier source for global business news, real-time market data, and expert financial analysis.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4 uppercase text-sm">Sections</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="hover:text-blue-400 cursor-pointer transition">Global Markets</span></li>
              <li><span className="hover:text-blue-400 cursor-pointer transition">Technology</span></li>
              <li><span className="hover:text-blue-400 cursor-pointer transition">Finance & Banking</span></li>
              <li><span className="hover:text-blue-400 cursor-pointer transition">Real Estate</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4 uppercase text-sm">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="hover:text-blue-400 cursor-pointer transition">About Us</span></li>
              <li><span className="hover:text-blue-400 cursor-pointer transition">Careers</span></li>
              <li><span className="hover:text-blue-400 cursor-pointer transition">Contact</span></li>
              <li><span className="hover:text-blue-400 cursor-pointer transition">Advertise</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4 uppercase text-sm">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="hover:text-blue-400 cursor-pointer transition">Terms of Service</span></li>
              <li><span className="hover:text-blue-400 cursor-pointer transition">Privacy Policy</span></li>
              <li><span className="hover:text-blue-400 cursor-pointer transition">Cookie Settings</span></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t border-slate-800 text-xs text-center">
          © 2026 MarketPro Financial News. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
