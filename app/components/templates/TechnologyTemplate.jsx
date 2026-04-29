"use client";

import React from "react";
import { Search, Menu, Zap, TrendingUp, Cpu, Hash } from "lucide-react";
import AdSlot from "../AdSlot";
import { generateTemplateContent } from "../../lib/templateContent";

export default function TechnologyTemplate({
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
  const content = generateTemplateContent("technology");

  return (
    <div
      className={`relative bg-slate-50 shadow-2xl overflow-hidden transition-all duration-500 flex flex-col font-sans ${
        isMobile ? "rounded-[2rem] border-[8px] border-slate-900" : "rounded-xl border border-slate-200"
      }`}
      style={{ 
        width: isMobile ? 375 : 1200, 
        minHeight: isMobile ? 812 : 900 
      }}
    >
      {/* ── TECH HEADER ── */}
      <header className="w-full bg-slate-900 text-white sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 md:px-8 py-5">
          <div className="flex items-center gap-4">
            <Menu className="text-slate-400 cursor-pointer hover:text-blue-400 transition" size={24} />
            {!isMobile && <Search className="text-slate-400 cursor-pointer hover:text-blue-400 transition" size={20} />}
          </div>
          <div className="flex flex-col items-center flex-1">
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase flex items-center gap-1">
              <Zap className="text-blue-500" fill="currentColor" size={28} />
              TECH<span className="text-blue-500">WIRE</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {!isMobile && (
              <button className="text-xs font-bold uppercase tracking-wider bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 transition">
                Subscribe
              </button>
            )}
          </div>
        </div>
        {!isMobile && (
          <nav className="w-full bg-slate-950 py-3 flex justify-center gap-10 text-xs font-bold text-slate-400 uppercase tracking-widest border-t border-slate-800">
            {['Reviews', 'AI', 'Startups', 'Gadgets', 'Security', 'Enterprise'].map((link) => (
              <span key={link} className="hover:text-blue-400 cursor-pointer transition">{link}</span>
            ))}
          </nav>
        )}
      </header>

      {/* ── TOP BANNER ZONE ── */}
      {topSlots.length > 0 && (
        <div className="w-full bg-slate-100 border-b border-slate-200 py-6 flex flex-col items-center">
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
          
          <div className="flex flex-col md:flex-row gap-6 mb-10">
            <div className="flex-1 order-2 md:order-1 flex flex-col justify-center">
              <span className="text-blue-600 font-bold uppercase tracking-widest text-xs mb-3 flex items-center gap-1"><Cpu size={14}/> Innovation</span>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight mb-4 tracking-tight">
                {content.hero.headline}
              </h2>
              <p className="text-slate-500 text-lg mb-6 leading-relaxed">
                {content.hero.subtitle}
              </p>
              <div className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
                By Michael Foster <span className="text-slate-400 mx-2">|</span> 4 min read
              </div>
            </div>
            
            <div className="w-full md:w-[45%] flex-shrink-0 order-1 md:order-2">
              {contentSlots.length > 0 ? (
                 <div className="w-full flex items-center justify-center bg-white border border-slate-200 p-4 shadow-sm">
                   {contentSlots.map((slotDef) => <AdSlot key={slotDef.id} slotDef={slotDef} {...adSlotProps} />)}
                 </div>
              ) : (
                <div className="aspect-square md:aspect-[4/5] bg-slate-900 relative">
                  <img src={content.hero.image} alt="Tech" className="w-full h-full object-cover opacity-90" />
                  <div className="absolute top-4 left-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 uppercase tracking-widest">Editor's Pick</div>
                </div>
              )}
            </div>
          </div>

          <div className="w-full h-px bg-slate-200 mb-8"></div>

          {/* Clean Grid of Articles */}
          <div className="flex flex-col gap-12 mb-12">
            <article className="prose prose-slate max-w-none">
              <p className="text-xl font-bold text-slate-800 leading-relaxed mb-6">
                Our latest benchmarks reveal a significant breakthrough in edge-computed neural networks. By leveraging a new instruction set, we've achieved 40% lower latency on standard vision tasks.
              </p>
              
              <div className="bg-slate-900 rounded-xl p-6 mb-8 shadow-2xl font-mono text-sm overflow-x-auto text-blue-300">
                <div className="flex gap-2 mb-4 border-b border-slate-800 pb-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <p><span className="text-purple-400">const</span> <span className="text-yellow-400">benchmark</span> = <span className="text-purple-400">async</span> () ={'>'} {'{'}</p>
                <p className="pl-4"><span className="text-purple-400">const</span> results = <span className="text-purple-400">await</span> engine.<span className="text-yellow-400">run</span>();</p>
                <p className="pl-4 text-emerald-400 font-bold">// Performance boost: +42%</p>
                <p className="pl-4 text-slate-500">console.log(<span className="text-emerald-400">"Efficiency:"</span>, results.efficiency);</p>
                <p>{'}'};</p>
              </div>

              {/* In-content Ad Slot 1 */}
              {contentSlots.length > 0 && (
                <div className="w-full my-12 py-8 border-y-2 border-slate-100 flex flex-col items-center bg-blue-50/30 rounded-2xl">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">Enterprise Solution Partner</span>
                  <AdSlot slotDef={contentSlots[0]} {...adSlotProps} />
                </div>
              )}

              <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tighter uppercase">Architectural Comparison</h3>
              <div className="overflow-x-auto mb-8">
                <table className="w-full text-left border-collapse bg-white rounded-xl overflow-hidden shadow-sm">
                  <thead>
                    <tr className="bg-slate-900 text-white">
                      <th className="p-4 text-xs font-black uppercase tracking-widest">Platform</th>
                      <th className="p-4 text-xs font-black uppercase tracking-widest">Throughput</th>
                      <th className="p-4 text-xs font-black uppercase tracking-widest">Efficiency</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-bold text-slate-600">
                    <tr className="border-b border-slate-100"><td className="p-4">Legacy Node</td><td className="p-4">12k req/s</td><td className="p-4 text-red-500">Low</td></tr>
                    <tr className="border-b border-slate-100"><td className="p-4">Edge Edge</td><td className="p-4">48k req/s</td><td className="p-4 text-emerald-500">High</td></tr>
                  </tbody>
                </table>
              </div>
            </article>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {content.articles.slice(0, 2).map((article, idx) => (
                <div key={idx} className="group cursor-pointer flex flex-col gap-4">
                  <div className="w-full aspect-video bg-slate-200 overflow-hidden rounded-xl shadow-md group-hover:shadow-xl transition duration-500">
                    <img src={article.image} alt="Article" className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition leading-snug tracking-tight uppercase">{article.title}</h4>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">Evaluating the technical debt and scalability of modern framework architectures.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interleaved Mobile Ads */}
          {isMobile && rightSlots.length > 0 && (
            <div className="my-8 flex flex-col items-center bg-slate-100 border-y border-slate-200 py-6">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-3 font-semibold">Advertisement</p>
              {rightSlots.map((slotDef) => <AdSlot key={slotDef.id} slotDef={slotDef} {...adSlotProps} />)}
            </div>
          )}

        </main>

        {/* ── RIGHT RAIL ZONE (Desktop Only) ── */}
        {!isMobile && (
          <aside className="w-[300px] flex-shrink-0 flex flex-col gap-8">
            <div className="border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-500" />
                Trending Now
              </h3>
              <div className="space-y-6">
                {content.trending.map((title, i) => (
                  <div key={i} className="group cursor-pointer flex gap-4">
                    <span className="text-xl font-black text-slate-200 group-hover:text-blue-200 transition">0{i+1}</span>
                    <h4 className="font-bold text-sm text-slate-800 group-hover:text-blue-600 transition leading-snug">{title}</h4>
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
