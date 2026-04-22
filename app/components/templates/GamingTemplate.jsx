"use client";

import { Search, Menu, PlayCircle, Trophy, Users, MonitorPlay } from "lucide-react";
import AdSlot from "../AdSlot";
import { generateTemplateContent } from "../../lib/templateContent";

export default function GamingTemplate({
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
  const content = generateTemplateContent("gaming");

  return (
    <div
      className={`relative bg-slate-900 shadow-2xl overflow-hidden transition-all duration-500 flex flex-col font-sans text-slate-200 ${
        isMobile ? "rounded-[2rem] border-[8px] border-black" : "rounded-xl border border-slate-700"
      }`}
      style={{ 
        width: isMobile ? 375 : 1200, 
        minHeight: isMobile ? 812 : 900 
      }}
    >
      {/* ── GAMING HEADER ── */}
      <header className="w-full bg-black border-b border-purple-900/50 sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 md:px-8 py-4">
          <div className="flex items-center gap-4">
            <Menu className="text-slate-400 cursor-pointer hover:text-purple-400 transition" size={24} />
            {!isMobile && <Search className="text-slate-500 cursor-pointer hover:text-purple-400 transition" size={20} />}
          </div>
          <div className="flex flex-col items-center">
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 uppercase">
              NEXUS ESPORTS
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {!isMobile && (
              <button className="text-xs font-bold uppercase tracking-wider bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition shadow-[0_0_15px_rgba(147,51,234,0.5)]">
                Watch Live
              </button>
            )}
            <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-purple-500 overflow-hidden cursor-pointer">
              <img src="https://i.pravatar.cc/100?img=3" alt="User" />
            </div>
          </div>
        </div>
        {!isMobile && (
          <nav className="w-full bg-slate-900 border-t border-slate-800 py-3 flex justify-center gap-8 text-sm font-bold text-slate-400 uppercase tracking-wider">
            {['News', 'Tournaments', 'Teams', 'Matches', 'Streams', 'Hardware'].map((link) => (
              <span key={link} className="hover:text-purple-400 cursor-pointer transition">{link}</span>
            ))}
          </nav>
        )}
      </header>

      {/* ── TOP BANNER ZONE ── */}
      {topSlots.length > 0 && (
        <div className="w-full bg-slate-950 border-b border-slate-800 py-6 flex flex-col items-center">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-2 font-semibold">Advertisement</p>
          {topSlots.map((slotDef) => <AdSlot key={slotDef.id} slotDef={slotDef} {...adSlotProps} />)}
        </div>
      )}

      {/* ── MAIN LAYOUT WRAPPER ── */}
      <div className={`flex flex-1 ${isMobile ? 'flex-col px-4 py-6' : 'px-8 py-10 gap-10'} w-full max-w-[1200px] mx-auto`}>
        
        {/* ── LEFT RAIL ZONE (Desktop Only) ── */}
        {!isMobile && leftSlots.length > 0 && (
          <aside className="w-[160px] flex-shrink-0 flex flex-col gap-6 pt-4 sticky top-32 h-fit">
            <p className="text-[10px] text-slate-600 uppercase tracking-widest text-center font-semibold">Advertisement</p>
            {leftSlots.map((slotDef) => <AdSlot key={slotDef.id} slotDef={slotDef} {...adSlotProps} />)}
          </aside>
        )}

        {/* ── CENTER CONTENT ZONE ── */}
        <main className="flex-1 flex flex-col min-w-0">
          
          {/* Hero Section */}
          <div className="mb-10 w-full relative rounded-2xl overflow-hidden group">
            {contentSlots.length > 0 ? (
               <div className="w-full flex flex-col items-center bg-slate-950 p-4">
                 {contentSlots.map((slotDef) => <AdSlot key={slotDef.id} slotDef={slotDef} {...adSlotProps} />)}
               </div>
            ) : (
              <>
                <img
                  src={content.hero.image}
                  alt="Hero"
                  className="w-full aspect-[16/9] object-cover group-hover:scale-105 transition duration-700 opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent flex flex-col justify-end p-6 md:p-10">
                  <span className="bg-pink-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded w-fit mb-3">Live Event</span>
                  <h2 className="text-3xl md:text-5xl font-black text-white leading-tight mb-3">
                    {content.hero.headline}
                  </h2>
                  <p className="text-slate-300 md:text-lg max-w-2xl">{content.hero.subtitle}</p>
                </div>
              </>
            )}
          </div>

          {/* Game Cards Grid */}
          <div className="mb-10">
            <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-6 border-b border-slate-800 pb-2 flex items-center gap-2">
              <Trophy className="text-yellow-500" /> Top Broadcasts
            </h3>
            <div className={`grid ${isMobile ? 'grid-cols-2 gap-4' : 'grid-cols-4 gap-6'}`}>
              {content.games.map((game, idx) => (
                <div key={idx} className="group cursor-pointer">
                  <div className="aspect-[3/4] bg-slate-800 mb-3 rounded-xl overflow-hidden relative border border-slate-700 group-hover:border-purple-500 transition">
                    <img src={game.image} alt="Game" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" />
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> LIVE
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1">
                      <Users size={12} /> {game.viewers}
                    </div>
                  </div>
                  <h4 className="font-bold text-slate-200 group-hover:text-purple-400 transition text-sm truncate">{game.title}</h4>
                </div>
              ))}
            </div>
          </div>

          {/* Interleaved Mobile Ads */}
          {isMobile && rightSlots.length > 0 && (
            <div className="my-8 flex flex-col items-center bg-slate-950 border-y border-slate-800 py-6">
              <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-3 font-semibold">Advertisement</p>
              {rightSlots.map((slotDef) => <AdSlot key={slotDef.id} slotDef={slotDef} {...adSlotProps} />)}
            </div>
          )}

          {/* Streams Section */}
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                 <MonitorPlay className="text-purple-500" /> Pro Streams
               </h3>
               <span className="text-purple-400 text-sm font-bold cursor-pointer hover:text-purple-300">View All</span>
             </div>
             <div className="aspect-video bg-black rounded-xl overflow-hidden relative group cursor-pointer border border-slate-700">
               <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80" alt="Stream" className="w-full h-full object-cover opacity-50" />
               <div className="absolute inset-0 flex items-center justify-center">
                 <PlayCircle size={64} className="text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition" />
               </div>
             </div>
          </div>

        </main>

        {/* ── RIGHT RAIL ZONE (Desktop Only) ── */}
        {!isMobile && (
          <aside className="w-[300px] flex-shrink-0 flex flex-col gap-8">
            <div className="rounded-xl border border-slate-800 p-6 bg-slate-900/50 shadow-sm">
              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-5 flex items-center gap-2">
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></div>
                Trending Matches
              </h3>
              <div className="space-y-4">
                {content.trending.map((title, i) => (
                  <div key={i} className="group cursor-pointer border-b border-slate-800 pb-4 last:border-0 last:pb-0">
                    <h4 className="font-semibold text-sm text-slate-300 group-hover:text-purple-400 transition leading-snug">{title}</h4>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Starts in 2 hours</p>
                  </div>
                ))}
              </div>
            </div>
            
            {rightSlots.length > 0 && (
              <div className="flex flex-col gap-6 sticky top-32">
                <p className="text-[10px] text-slate-600 uppercase tracking-widest text-center font-semibold">Advertisement</p>
                {rightSlots.map((slotDef) => <AdSlot key={slotDef.id} slotDef={slotDef} {...adSlotProps} />)}
              </div>
            )}
          </aside>
        )}
      </div>

      {/* ── MOBILE STICKY BOTTOM ZONE ── */}
      {bottomSlots.length > 0 && (
        <div className="w-full bg-slate-950 border-t border-slate-900 py-2 flex flex-col items-center justify-center sticky bottom-0 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-1 font-semibold">Advertisement</p>
          {bottomSlots.map((slotDef) => <AdSlot key={slotDef.id} slotDef={slotDef} {...adSlotProps} />)}
        </div>
      )}
    </div>
  );
}
