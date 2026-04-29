"use client";

import React from "react";
import { Search, Menu, UserCircle, ChevronRight, Share2, BookmarkPlus } from "lucide-react";
import AdSlot from "../AdSlot";
import { generateTemplateContent } from "../../lib/templateContent";

export default function NewspaperTemplate({
  topSlots,
  leftSlots,
  rightSlots,
  contentSlots,
  bottomSlots,
  activeSlotId,
  slotCreativeMap,
  showSlotLabels,
  isMobile,
}) {
  const adSlotProps = { activeSlotId, slotCreativeMap, showSlotLabels, isMobile };
  const content = generateTemplateContent("newspaper");

  return (
    <div
      className={`relative bg-white shadow-2xl overflow-hidden transition-all duration-500 flex flex-col font-sans ${
        isMobile ? "rounded-[2rem] border-[8px] border-slate-800" : "rounded-xl border border-slate-200"
      }`}
      style={{ 
        width: isMobile ? 375 : 1200, 
        minHeight: isMobile ? 812 : 900 
      }}
    >
      {/* ── REALISTIC HEADER ── */}
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-30">
        {!isMobile && (
          <div className="w-full bg-slate-900 text-white py-1.5 px-6 flex justify-between items-center text-xs font-semibold tracking-wide">
            <span>Tuesday, October 24, 2026</span>
            <div className="flex gap-4">
              <span className="hover:text-blue-400 cursor-pointer transition">Newsletters</span>
              <span className="hover:text-blue-400 cursor-pointer transition">Podcasts</span>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between px-4 md:px-8 py-4">
          <div className="flex items-center gap-4">
            <Menu className="text-slate-700 cursor-pointer hover:text-blue-600 transition" size={24} />
            {!isMobile && <Search className="text-slate-400 cursor-pointer hover:text-blue-600 transition" size={20} />}
          </div>
          <div className="flex flex-col items-center">
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-slate-900 uppercase">
              The Daily Chronicle
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {!isMobile && (
              <button className="text-xs font-bold uppercase tracking-wider bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                Subscribe
              </button>
            )}
            <UserCircle className="text-slate-700 cursor-pointer hover:text-blue-600 transition" size={26} />
          </div>
        </div>
        {!isMobile && (
          <nav className="w-full border-t border-slate-100 py-3 flex justify-center gap-8 text-sm font-bold text-slate-600">
            {['World', 'Politics', 'Business', 'Tech', 'Science', 'Health', 'Sports', 'Entertainment'].map((link) => (
              <span key={link} className="hover:text-blue-600 cursor-pointer transition">{link}</span>
            ))}
          </nav>
        )}
      </header>

      {/* ── TOP BANNER ZONE ── */}
      {topSlots.length > 0 && (
        <div className="w-full bg-slate-50 border-b border-slate-200 py-6 flex flex-col items-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 font-semibold">Advertisement</p>
          {topSlots.map((slotDef) => <AdSlot key={slotDef.id} slotDef={slotDef} {...adSlotProps} />)}
        </div>
      )}

      {/* ── MAIN LAYOUT WRAPPER ── */}
      <div className={`flex flex-1 ${isMobile ? 'flex-col px-4 py-6' : 'px-8 py-10 gap-10'} w-full max-w-[1200px] mx-auto`}>
        
        {/* ── LEFT RAIL ZONE (Desktop Only) ── */}
        {!isMobile && leftSlots.length > 0 && (
          <aside className="w-[160px] flex-shrink-0 flex flex-col gap-6 pt-4 sticky top-32 h-fit">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest text-center font-semibold">Advertisement</p>
            {leftSlots.map((slotDef) => <AdSlot key={slotDef.id} slotDef={slotDef} {...adSlotProps} />)}
          </aside>
        )}

        {/* ── CENTER CONTENT ZONE ── */}
        <main className="flex-1 flex flex-col min-w-0">
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="bg-red-600 text-white px-2 py-0.5 text-[10px] font-black uppercase rounded animate-pulse">Breaking News</span>
              <span className="text-blue-600 font-bold uppercase tracking-wider text-xs">World News</span>
            </div>
            <h1 className={`${isMobile ? 'text-3xl' : 'text-5xl'} font-black text-slate-900 leading-[1.1] tracking-tight`}>
              {content.hero.headline}
            </h1>
            <h2 className="text-lg md:text-xl text-slate-500 leading-relaxed font-medium border-l-4 border-slate-200 pl-4">
              {content.hero.subtitle}
            </h2>
            
            <div className="flex items-center justify-between border-y border-slate-200 py-4 mt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden">
                  <img src="https://i.pravatar.cc/100?img=68" alt="Author" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">By Michael Foster</p>
                  <p className="text-xs text-slate-500">Updated 4 min ago</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition text-slate-600"><Share2 size={16} /></button>
                <button className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition text-slate-600"><BookmarkPlus size={16} /></button>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="w-full aspect-[16/9] mb-8 bg-slate-100 relative group overflow-hidden rounded-lg shadow-inner">
            <img
              src={content.hero.image}
              alt="Hero"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <p className="text-white text-xs opacity-90 font-medium">LATEST: {content.hero.headline}</p>
            </div>
          </div>

          <article className={`prose ${isMobile ? 'prose-sm' : 'prose-base md:prose-lg'} text-slate-700 max-w-none`}>
            <p className="text-xl font-bold leading-relaxed text-slate-800 mb-6 drop-cap">
              The digital landscape is evolving at a breakneck pace. With the advent of multi-agentic AI systems, the way we interact with data is fundamentally changing.
            </p>

            {/* In-article Ad Slot 1 */}
            {contentSlots.length > 0 && (
              <div className="my-10 flex flex-col items-center bg-slate-50 border-y border-slate-200 py-8 rounded-sm">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-4 font-bold">Advertisement</p>
                <AdSlot slotDef={contentSlots[0]} {...adSlotProps} />
              </div>
            )}

            <p className="mb-6">
              Global markets have shown unprecedented resilience in the face of shifting geopolitical tides. Analysts point to the rapid adoption of renewable energy technologies as a key driver for long-term industrial growth across both emerging and established economies.
            </p>
            <p className="mb-6">
              Meanwhile, local communities are finding new ways to bridge the digital divide. Grassroots initiatives focusing on AI literacy are empowering a new generation of creators, ensuring that the benefits of technological progress are felt by all.
            </p>
            <blockquote className="border-l-4 border-red-600 pl-4 py-3 my-8 italic font-bold text-slate-900 bg-red-50/50 rounded-r-lg text-2xl leading-tight">
              "The future of media isn't just about speed; it's about context, depth, and the ability to cut through the noise."
            </blockquote>
          </article>

          {/* Related Articles Section */}
          <div className="mt-12 pt-8 border-t border-slate-200">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-6 flex items-center gap-2">
              More in News <ChevronRight size={20} className="text-blue-600" />
            </h3>
            <div className={`grid ${isMobile ? 'grid-cols-1 gap-6' : 'grid-cols-2 gap-8'}`}>
              {content.articles.map((post, idx) => (
                <React.Fragment key={idx}>
                  <div className="group cursor-pointer flex flex-col">
                    <div className="aspect-[3/2] bg-slate-200 mb-3 overflow-hidden rounded-lg">
                      <img src={post.image} alt="Post" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{post.category || 'News'}</span>
                      <span className="text-[10px] text-slate-400">• {post.timeAgo || '3h ago'}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition leading-snug">{post.title}</h4>
                  </div>
                  
                  {/* Inject Inline Ad every 2 articles if available */}
                  {(idx + 1) % 2 === 0 && contentSlots[Math.floor(idx / 2)] && (
                    <div className="col-span-1 md:col-span-2 w-full my-6 py-6 border-y border-slate-100 flex flex-col items-center bg-slate-50">
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 font-semibold">Sponsored Content</p>
                      <AdSlot
                        slotDef={contentSlots[Math.floor(idx / 2)]}
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
        </main>

        {/* ── RIGHT RAIL ZONE (Desktop Only) ── */}
        {!isMobile && (
          <aside className="w-[300px] flex-shrink-0 flex flex-col gap-8">
            <div className="rounded-xl border border-slate-200 p-6 bg-white shadow-sm">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-5 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                Trending Now
              </h3>
              <div className="space-y-5">
                {content.trending.map((title, i) => (
                  <div key={i} className="flex gap-4 group cursor-pointer border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                    <span className="text-2xl font-black text-slate-200 group-hover:text-blue-200 transition">0{i+1}</span>
                    <h4 className="font-semibold text-sm text-slate-700 group-hover:text-blue-600 transition leading-snug">{title}</h4>
                  </div>
                ))}
              </div>
            </div>
            
            {rightSlots.length > 0 && (
              <div className="flex flex-col gap-6 sticky top-32">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest text-center font-semibold">Advertisement</p>
                {rightSlots.map((slotDef) => <AdSlot key={slotDef.id} slotDef={slotDef} {...adSlotProps} />)}
              </div>
            )}
          </aside>
        )}
      </div>

      {/* ── REALISTIC FOOTER ── */}
      <footer className="w-full bg-slate-950 text-slate-400 py-12 px-8 mt-auto border-t-[8px] border-blue-600">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between gap-8">
          <div className="max-w-xs">
            <h1 className="text-2xl font-black tracking-tighter text-white uppercase mb-4">
              The Daily Chronicle
            </h1>
            <p className="text-sm leading-relaxed mb-6">
              Delivering independent, highly authoritative journalism that drives the conversation forward globally.
            </p>
          </div>
          
          {!isMobile && (
            <div className="flex gap-16">
              <div>
                <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Sections</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#" className="hover:text-white transition">Politics</a></li>
                  <li><a href="#" className="hover:text-white transition">Business</a></li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </footer>

      {/* ── MOBILE STICKY BOTTOM ZONE ── */}
      {bottomSlots.length > 0 && (
        <div className="w-full bg-white border-t border-slate-200 py-2 flex flex-col items-center justify-center sticky bottom-0 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-1 font-semibold">Advertisement</p>
          {bottomSlots.map((slotDef) => <AdSlot key={slotDef.id} slotDef={slotDef} {...adSlotProps} />)}
        </div>
      )}
    </div>
  );
}
