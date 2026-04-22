"use client";

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
          
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="flex-1">
              <span className="text-emerald-600 font-bold uppercase tracking-wider text-xs mb-2 block flex items-center gap-1"><Leaf size={14}/> Wellness</span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
                {content.hero.headline}
              </h2>
              <p className="text-slate-600 text-lg mb-6 leading-relaxed">
                {content.hero.subtitle}
              </p>
              <div className="flex items-center gap-3">
                <img src="https://i.pravatar.cc/100?img=47" className="w-10 h-10 rounded-full" alt="Doctor" />
                <div>
                  <p className="text-sm font-bold text-slate-900">Dr. Emily Chen, MD</p>
                  <p className="text-xs text-slate-500">Medically reviewed</p>
                </div>
              </div>
            </div>
            
            {contentSlots.length > 0 ? (
               <div className="flex-shrink-0 flex items-center justify-center bg-slate-50 rounded-xl p-4">
                 {contentSlots.map((slotDef) => <AdSlot key={slotDef.id} slotDef={slotDef} {...adSlotProps} />)}
               </div>
            ) : (
              <div className="w-full md:w-1/2 aspect-video rounded-xl overflow-hidden shadow-md">
                <img src={content.hero.image} alt="Health" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {['Heart Health', 'Mental Wellness', 'Nutrition', 'Sleep'].map((topic, i) => (
              <div key={i} className="bg-emerald-50 rounded-xl p-4 text-center cursor-pointer hover:bg-emerald-100 transition border border-emerald-100">
                <Activity className="mx-auto text-emerald-600 mb-2" size={24} />
                <span className="font-bold text-emerald-900 text-sm">{topic}</span>
              </div>
            ))}
          </div>

          {/* Interleaved Mobile Ads */}
          {isMobile && rightSlots.length > 0 && (
            <div className="my-8 flex flex-col items-center bg-slate-50 border-y border-slate-200 py-6">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-3 font-semibold">Advertisement</p>
              {rightSlots.map((slotDef) => <AdSlot key={slotDef.id} slotDef={slotDef} {...adSlotProps} />)}
            </div>
          )}

          <h3 className="text-2xl font-black text-slate-900 border-b-2 border-emerald-500 pb-2 mb-6 inline-block">Latest Health Insights</h3>
          <div className="space-y-6">
            {content.articles.map((article, idx) => (
              <div key={idx} className="flex gap-4 group cursor-pointer">
                <div className="w-1/3 aspect-video rounded-lg overflow-hidden flex-shrink-0">
                  <img src={article.image} alt="Article" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition leading-snug mb-2">{article.title}</h4>
                  <p className="text-sm text-slate-500 line-clamp-2">Learn more about how recent studies are reshaping our understanding of daily health habits and long-term vitality.</p>
                </div>
              </div>
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
