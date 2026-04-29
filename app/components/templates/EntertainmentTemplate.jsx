"use client";

import React from "react";
import { Search, Menu, Play, Info, Plus, ChevronRight } from "lucide-react";
import AdSlot from "../AdSlot";
import { generateTemplateContent } from "../../lib/templateContent";

export default function EntertainmentTemplate({
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
  const content = generateTemplateContent("entertainment");

  return (
    <div
      className={`relative bg-[#141414] shadow-2xl overflow-hidden transition-all duration-500 flex flex-col font-sans text-white ${
        isMobile ? "rounded-[2rem] border-[8px] border-black" : "rounded-xl border border-[#333]"
      }`}
      style={{ 
        width: isMobile ? 375 : 1200, 
        minHeight: isMobile ? 812 : 900 
      }}
    >
      {/* ── ENTERTAINMENT HEADER ── */}
      <header className="w-full absolute top-0 z-40 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between px-4 md:px-12 py-6">
          <div className="flex items-center gap-8">
            <Menu className="text-white cursor-pointer hover:text-red-500 transition md:hidden" size={24} />
            <div className="text-red-600 font-black text-2xl tracking-tighter uppercase">
              CINE<span className="text-white">STREAM</span>
            </div>
            {!isMobile && (
              <nav className="flex gap-6 text-sm font-medium text-gray-200">
                <span className="text-white font-bold cursor-pointer">Home</span>
                <span className="hover:text-gray-400 cursor-pointer transition">Series</span>
                <span className="hover:text-gray-400 cursor-pointer transition">Films</span>
                <span className="hover:text-gray-400 cursor-pointer transition">New & Popular</span>
              </nav>
            )}
          </div>
          <div className="flex items-center gap-6">
            <Search className="text-white cursor-pointer hover:text-gray-300 transition" size={20} />
            {!isMobile && <span className="text-sm font-medium hover:text-gray-300 cursor-pointer">Kids</span>}
            <div className="w-8 h-8 rounded bg-blue-500 cursor-pointer"></div>
          </div>
        </div>
      </header>

      {/* ── MAIN LAYOUT WRAPPER ── */}
      <div className="flex flex-col flex-1 w-full relative pb-20">
        
        {/* Hero Section */}
        <div className="w-full relative">
          <div className="w-full aspect-[4/5] md:aspect-[21/9] relative">
            <img src={content.hero.image} alt="Hero" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/20 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/50 to-transparent"></div>
            
            <div className="absolute bottom-[10%] md:bottom-[20%] left-4 md:left-12 max-w-2xl z-20">
              <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-4 drop-shadow-lg tracking-tight">
                {content.hero.headline}
              </h1>
              <p className="text-lg md:text-xl text-gray-200 font-medium mb-6 drop-shadow-md line-clamp-3">
                {content.hero.subtitle}
              </p>
              <div className="flex gap-4">
                <button className="bg-white text-black font-bold px-6 md:px-8 py-2 md:py-3 rounded flex items-center gap-2 hover:bg-gray-200 transition">
                  <Play size={20} fill="currentColor" /> Play
                </button>
                <button className="bg-gray-500/50 backdrop-blur text-white font-bold px-6 py-2 md:py-3 rounded flex items-center gap-2 hover:bg-gray-500/70 transition">
                  <Info size={20} /> More Info
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── TOP BANNER ZONE (Appears directly below hero) ── */}
        {topSlots.length > 0 && (
          <div className="w-full px-4 md:px-12 relative z-20 -mt-10 md:-mt-20 mb-10 flex flex-col items-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-semibold">Advertisement</p>
            {topSlots.map((slotDef) => <AdSlot key={slotDef.id} slotDef={slotDef} {...adSlotProps} />)}
          </div>
        )}

        {/* Content Rows */}
        <div className={`px-4 md:px-12 flex flex-col gap-14 ${topSlots.length === 0 ? '-mt-10 md:-mt-20' : ''} relative z-20`}>
          
          <div className="w-full">
            <h3 className="text-xl md:text-3xl font-black text-white mb-6 flex items-center gap-2 group cursor-pointer tracking-tighter uppercase">
              Trending Now <ChevronRight className="text-red-600 group-hover:translate-x-1 transition" size={28}/>
            </h3>
            <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-8">
              {content.movies.map((movie, idx) => (
                <React.Fragment key={idx}>
                  <div className="w-[180px] md:w-[280px] flex-shrink-0 group cursor-pointer relative">
                    <div className="aspect-video rounded-xl overflow-hidden bg-zinc-900 relative z-10 group-hover:scale-105 group-hover:ring-4 group-hover:ring-red-600 transition duration-500 shadow-2xl">
                      <img src={movie.image} alt={movie.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition duration-300"></div>
                      <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition">
                         <Plus className="w-6 h-6 bg-black/60 rounded-full p-1" />
                      </div>
                      {!isMobile && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col justify-end p-6">
                          <h4 className="font-black text-lg leading-tight mb-2 tracking-tight uppercase">{movie.title}</h4>
                          <div className="flex items-center gap-3">
                            <span className="text-red-600 font-black text-xs uppercase tracking-widest">{movie.match} Match</span>
                            <span className="bg-white/20 backdrop-blur-md text-white text-[9px] px-2 py-0.5 rounded font-black">4K UHD</span>
                          </div>
                        </div>
                      )}
                    </div>
                    {isMobile && <h4 className="font-black text-xs mt-3 text-white uppercase tracking-tighter">{movie.title}</h4>}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* ── AD BREAK SECTION (Native full-width zone) ── */}
          {contentSlots.length > 0 && (
            <div className="w-full relative py-12 border-y border-white/5 bg-gradient-to-r from-red-600/5 via-zinc-900 to-blue-600/5">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-6">Sponsored Ad Break</span>
                <div className="max-w-4xl w-full flex justify-center scale-110 md:scale-125">
                  <AdSlot slotDef={contentSlots[0]} {...adSlotProps} />
                </div>
              </div>
            </div>
          )}

          <div className="w-full">
            <h3 className="text-xl md:text-3xl font-black text-white mb-6 uppercase tracking-tighter">Binge-worthy Collections</h3>
            <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-8">
              {[...content.movies].reverse().map((movie, idx) => (
                <div key={idx} className="w-[180px] md:w-[280px] flex-shrink-0 group cursor-pointer relative">
                  <div className="aspect-video rounded-xl overflow-hidden bg-zinc-900 group-hover:scale-105 group-hover:ring-4 group-hover:ring-white transition duration-500 shadow-2xl">
                    <img src={movie.image} alt="Movie" className="w-full h-full object-cover" />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── MOBILE STICKY BOTTOM ZONE ── */}
      {bottomSlots.length > 0 && (
        <div className="w-full bg-[#141414] border-t border-[#333] py-2 flex flex-col items-center justify-center sticky bottom-0 z-50">
          <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1 font-semibold">Advertisement</p>
          {bottomSlots.map((slotDef) => <AdSlot key={slotDef.id} slotDef={slotDef} {...adSlotProps} />)}
        </div>
      )}
    </div>
  );
}
