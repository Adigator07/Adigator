"use client";

import React from "react";
import { Search, Menu, HeartPulse, Activity, Leaf, Stethoscope } from "lucide-react";
import AdSlot from "../AdSlot";
import { generateTemplateContent } from "../../lib/templateContent";

export default function HealthTemplate({
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
  const content = generateTemplateContent("health");

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
      {/* ── HEALTH HEADER ── */}
      <header className="w-full bg-white border-b-4 border-emerald-500 sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 md:px-8 py-5">
          <div className="flex items-center gap-4">
            <Menu className="text-slate-600 cursor-pointer hover:text-emerald-600 transition" size={24} />
          </div>
          <div className="flex flex-col items-center flex-1">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-emerald-800 uppercase flex items-center gap-2">
              <HeartPulse className="text-rose-500" size={32} />
              VITALITY HEALTH
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {!isMobile && (
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search conditions, symptoms..." 
                  className="bg-slate-100 py-2 pl-4 pr-10 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64"
                />
                <Search className="absolute right-3 top-2 text-slate-400" size={16} />
              </div>
            )}
          </div>
        </div>
        {!isMobile && (
          <nav className="w-full bg-emerald-50 py-3 flex justify-center gap-10 text-sm font-bold text-emerald-900">
            {['Conditions', 'Drugs & Supplements', 'Well-Being', 'Symptom Checker', 'Find a Doctor'].map((link) => (
              <span key={link} className="hover:text-emerald-600 cursor-pointer transition">{link}</span>
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
          
          <div className="flex flex-col gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-emerald-600 text-white px-2 py-0.5 text-[10px] font-black uppercase rounded tracking-widest">Trust Verified</span>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1"><Leaf size={14}/> Wellness Guide</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-[1.1] mb-6 tracking-tight">
                {content.hero.headline}
              </h2>
              <p className="text-slate-500 text-xl mb-8 leading-relaxed font-medium max-w-3xl">
                {content.hero.subtitle}
              </p>
              <div className="flex items-center justify-between border-y border-slate-100 py-6">
                <div className="flex items-center gap-4">
                  <img src="https://i.pravatar.cc/100?img=47" className="w-14 h-14 rounded-full border-2 border-emerald-100 p-0.5 shadow-sm" alt="Doctor" />
                  <div>
                    <p className="text-base font-black text-slate-900">Dr. Michael Foster, MD</p>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                      <Stethoscope size={12} className="text-emerald-500"/> Medically reviewed • Oct 2026
                    </p>
                  </div>
                </div>
                <button className="text-emerald-600 font-black text-xs uppercase tracking-widest hover:text-emerald-800 transition">Expert Panel &rarr;</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {['Prevention', 'Treatment', 'Lifestyle', 'Research'].map((topic, i) => (
              <div key={i} className="group bg-white rounded-2xl p-6 text-center cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-slate-100">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-600 group-hover:text-white transition">
                  <Activity size={24} />
                </div>
                <span className="font-black text-slate-900 text-xs uppercase tracking-widest">{topic}</span>
              </div>
            ))}
          </div>

          {/* ── NATIVE HEALTH AD ── */}
          {contentSlots.length > 0 && (
            <div className="w-full mb-16 p-10 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <span className="bg-emerald-200 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest mb-4 inline-block">Trusted Partner</span>
                <h3 className="text-2xl font-black text-emerald-900 mb-4 leading-tight">Personalized Care Solutions</h3>
                <p className="text-emerald-700/80 mb-6 font-medium">Discover holistic approaches to wellness tailored to your unique biological profile. Proven results backed by clinical data.</p>
                <button className="bg-emerald-600 text-white px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition shadow-lg shadow-emerald-200">
                  Learn More
                </button>
              </div>
              <div className="w-full md:w-[300px] flex-shrink-0">
                <AdSlot slotDef={contentSlots[0]} {...adSlotProps} />
              </div>
            </div>
          )}

          <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-10 border-b-4 border-emerald-100 pb-4">Scientific Journals</h3>
          <div className="space-y-10">
            {content.articles.map((article, idx) => (
              <React.Fragment key={idx}>
                <div className="flex gap-8 group cursor-pointer items-center">
                  <div className="w-1/3 aspect-[4/3] rounded-2xl overflow-hidden flex-shrink-0 shadow-lg group-hover:shadow-emerald-200 transition">
                    <img src={article.image} alt="Article" className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em] mb-2 block">Clinical Review</span>
                    <h4 className="text-2xl font-black text-slate-900 group-hover:text-emerald-600 transition leading-tight mb-4 tracking-tight">{article.title}</h4>
                    <p className="text-slate-500 font-medium line-clamp-2 mb-4 leading-relaxed italic">Comprehensive analysis of metabolic efficiency and long-term vitality metrics.</p>
                    <span className="text-xs font-black text-slate-950 uppercase tracking-widest border-b-2 border-emerald-500 pb-1">Read Full Study &rarr;</span>
                  </div>
                </div>
              </React.Fragment>
            ))}
          </div>

        </main>

        {/* ── RIGHT RAIL ZONE (Desktop Only) ── */}
        {!isMobile && (
          <aside className="w-[300px] flex-shrink-0 flex flex-col gap-8">
            <div className="rounded-xl border border-blue-100 p-6 bg-blue-50 shadow-sm relative overflow-hidden">
              <Stethoscope className="absolute -right-4 -top-4 text-blue-100 opacity-50" size={100} />
              <h3 className="text-lg font-black text-blue-900 mb-2 relative z-10">Ask a Doctor</h3>
              <p className="text-sm text-blue-800 mb-4 relative z-10">Get personalized medical advice from certified professionals within minutes.</p>
              <button className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg relative z-10 hover:bg-blue-700 transition">Start Consultation</button>
            </div>
            
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Popular Topics</h3>
              <ul className="space-y-3 text-sm text-slate-600">
                {content.trending.map((title, i) => (
                  <li key={i} className="hover:text-emerald-600 cursor-pointer font-medium leading-tight">{title}</li>
                ))}
              </ul>
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

      {/* ── MOBILE STICKY BOTTOM ZONE ── */}
      {bottomSlots.length > 0 && (
        <div className="w-full bg-white border-t border-slate-200 py-2 flex flex-col items-center justify-center sticky bottom-0 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-1 font-semibold">Advertisement</p>
          {bottomSlots.map((slotDef) => <AdSlot key={slotDef.id} slotDef={slotDef} {...adSlotProps} />)}
        </div>
      )}
    </div>
  );
}
