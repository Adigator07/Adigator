"use client";

import React from "react";
import { Search, Menu, ShoppingCart, Star, Heart } from "lucide-react";
import AdSlot from "../AdSlot";
import { generateTemplateContent } from "../../lib/templateContent";

export default function EcommerceTemplate({
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
  const content = generateTemplateContent("ecommerce");

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
      {/* ── ECOMMERCE HEADER ── */}
      <header className="w-full bg-indigo-900 text-white sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 md:px-8 py-4">
          <div className="flex items-center gap-4">
            <Menu className="cursor-pointer hover:text-indigo-300 transition" size={24} />
            <h1 className="text-xl md:text-2xl font-black tracking-tight italic">
              CARTMAX
            </h1>
          </div>
          
          {!isMobile && (
            <div className="flex-1 max-w-2xl mx-8 relative">
              <input 
                type="text" 
                placeholder="Search products, brands and categories" 
                className="w-full py-2.5 pl-4 pr-10 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <Search className="absolute right-3 top-2.5 text-slate-400" size={20} />
            </div>
          )}

          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center cursor-pointer hover:text-indigo-300 transition">
              <span className="text-xs font-semibold">Hello, Sign In</span>
              <span className="text-sm font-bold">Account & Lists</span>
            </div>
            <div className="relative cursor-pointer hover:text-indigo-300 transition">
              <ShoppingCart size={28} />
              <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">3</span>
            </div>
          </div>
        </div>
        
        {/* Category Nav */}
        <nav className="w-full bg-indigo-800 py-2.5 px-4 md:px-8 flex gap-6 text-sm font-medium overflow-x-auto whitespace-nowrap scrollbar-hide">
          {['All Departments', 'Today\'s Deals', 'Customer Service', 'Registry', 'Gift Cards', 'Sell', 'Electronics', 'Fashion'].map((link) => (
            <span key={link} className="hover:text-indigo-200 cursor-pointer transition">{link}</span>
          ))}
        </nav>
      </header>

      {/* ── TOP BANNER ZONE ── */}
      {topSlots.length > 0 && (
        <div className="w-full bg-slate-50 border-b border-slate-200 py-4 flex flex-col items-center">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-semibold">Advertisement</p>
          {topSlots.map((slotDef) => <AdSlot key={slotDef.id} slotDef={slotDef} {...adSlotProps} />)}
        </div>
      )}

      {/* ── MAIN LAYOUT WRAPPER ── */}
      <div className={`flex flex-1 ${isMobile ? 'flex-col px-4 py-6' : 'px-8 py-8 gap-10'} w-full max-w-[1200px] mx-auto bg-slate-50`}>
        
        {/* ── LEFT RAIL ZONE (Filters) ── */}
        {!isMobile && (
          <aside className="w-[220px] flex-shrink-0 flex flex-col gap-8 pt-2">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-black text-slate-900 mb-5 uppercase tracking-tighter text-sm">Filter Results</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Categories</h4>
                  <ul className="text-sm text-slate-600 space-y-2">
                    <li className="font-black text-indigo-600 flex items-center justify-between">Tech & Gadgets <span className="text-[10px] bg-indigo-50 px-1.5 rounded">24</span></li>
                    <li className="hover:text-indigo-600 cursor-pointer transition">Home Office</li>
                    <li className="hover:text-indigo-600 cursor-pointer transition">Entertainment</li>
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Price Range</h4>
                  <ul className="text-sm text-slate-600 space-y-2">
                    <li className="flex items-center gap-2 cursor-pointer hover:text-indigo-600"><div className="w-4 h-4 border-2 border-slate-300 rounded" /> Under $100</li>
                    <li className="flex items-center gap-2 cursor-pointer hover:text-indigo-600"><div className="w-4 h-4 border-2 border-slate-300 rounded" /> $100 - $500</li>
                    <li className="flex items-center gap-2 cursor-pointer hover:text-indigo-600"><div className="w-4 h-4 border-2 border-slate-300 rounded" /> Over $500</li>
                  </ul>
                </div>
              </div>
            </div>

            {leftSlots.length > 0 && (
              <div className="flex flex-col gap-4 sticky top-40">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest text-center font-black">Sponsored</p>
                {leftSlots.map((slotDef) => (
                  <div key={slotDef.id} className="bg-white p-3 rounded-xl border border-indigo-100 shadow-xl shadow-indigo-500/5">
                    <AdSlot slotDef={slotDef} {...adSlotProps} />
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}

        {/* ── CENTER CONTENT ZONE ── */}
        <main className="flex-1 flex flex-col min-w-0 gap-10">
          
          {/* Main Hero Promotion */}
          <div className="w-full aspect-[21/7] bg-slate-900 rounded-[2rem] overflow-hidden relative shadow-2xl group">
            <img src={content.hero.image} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition duration-[2s]" alt="Promo" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent flex items-center px-12">
              <div className="max-w-md">
                <span className="bg-rose-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">Flash Sale</span>
                <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight tracking-tighter">{content.hero.headline}</h2>
                <p className="text-slate-300 text-lg mb-8 leading-relaxed font-medium">{content.hero.subtitle}</p>
                <button className="bg-white text-slate-950 font-black px-8 py-4 rounded-xl hover:bg-indigo-400 hover:text-white transition-all shadow-xl shadow-black/20 uppercase tracking-widest text-xs">
                  Shop Now
                </button>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <section>
            <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Featured Inventory</h2>
              <div className="flex gap-4 text-xs font-bold text-slate-500">
                <span className="text-indigo-600 border-b-2 border-indigo-600 pb-4">Most Popular</span>
                <span className="hover:text-indigo-600 cursor-pointer">New Arrivals</span>
              </div>
            </div>
            
            <div className={`grid ${isMobile ? 'grid-cols-2 gap-4' : 'grid-cols-3 gap-8'}`}>
              {content.products.map((item, idx) => (
                <React.Fragment key={idx}>
                  {/* NATIVE AD CARD: Inject every 2nd product if we have slots */}
                  {idx > 0 && idx % 2 === 0 && contentSlots[Math.floor(idx / 2) - 1] && (
                    <div className="bg-white p-5 rounded-3xl border-2 border-indigo-100 shadow-xl shadow-indigo-500/5 relative group flex flex-col">
                      <div className="absolute top-4 left-4 z-10">
                        <span className="bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest shadow-lg shadow-indigo-500/20">Sponsored</span>
                      </div>
                      <div className="aspect-square bg-slate-50 rounded-2xl mb-5 overflow-hidden border border-slate-100 flex items-center justify-center p-2">
                        <AdSlot slotDef={contentSlots[Math.floor(idx / 2) - 1]} {...adSlotProps} />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-black text-slate-900 line-clamp-1 text-sm uppercase tracking-tight mb-1">Premium Partner</h3>
                          <p className="text-[11px] text-slate-500 leading-tight mb-4">Discover specialized solutions designed for high-performance workflows.</p>
                        </div>
                        <button className="w-full bg-slate-900 text-white py-3 rounded-xl font-black text-[10px] hover:bg-indigo-600 transition-all uppercase tracking-widest shadow-lg shadow-slate-200 mt-2">
                          View Details
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-2xl hover:border-indigo-200 transition-all duration-500 relative group flex flex-col">
                    <button className="absolute top-4 right-4 text-slate-200 hover:text-rose-500 transition-all z-10 bg-white shadow-sm p-2 rounded-full"><Heart size={18} /></button>
                    <div className="aspect-square bg-slate-50 rounded-2xl mb-5 flex items-center justify-center p-8 group-hover:scale-105 transition duration-700">
                      <img src={item.image} alt={item.name} className="object-contain w-full h-full mix-blend-multiply drop-shadow-2xl" />
                    </div>
                    <div className="flex-1 flex flex-col">
                      <h3 className="font-black text-slate-900 line-clamp-2 text-sm leading-snug mb-2 group-hover:text-indigo-600 transition">{item.name}</h3>
                      <div className="flex items-center gap-1 text-amber-400 mb-4">
                        {[...Array(4)].map((_, i) => <Star key={i} size={11} fill="currentColor" />)}
                        <Star size={11} className="text-slate-200" />
                        <span className="text-[10px] text-slate-400 font-black ml-1 uppercase tracking-tighter">{item.reviews} reviews</span>
                      </div>
                      <div className="flex items-baseline gap-2 mb-6">
                        <span className="text-2xl font-black text-slate-900 tracking-tighter">${item.price}</span>
                        <span className="text-xs text-slate-400 line-through">${item.oldPrice}</span>
                        <span className="ml-auto text-[10px] text-green-600 font-black uppercase tracking-widest">In Stock</span>
                      </div>
                    </div>
                    <button className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-xs hover:bg-slate-950 transition-all uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95">
                      Buy Now
                    </button>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </section>
        </main>

        {/* ── RIGHT RAIL ZONE (Desktop Only) ── */}
        {!isMobile && rightSlots.length > 0 && (
          <aside className="w-[300px] flex-shrink-0 flex flex-col gap-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">Your Browsing History</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="aspect-square bg-slate-100 rounded-md"></div>
                <div className="aspect-square bg-slate-100 rounded-md"></div>
                <div className="aspect-square bg-slate-100 rounded-md"></div>
                <div className="aspect-square bg-slate-100 rounded-md"></div>
              </div>
            </div>
            
            <div className="flex flex-col gap-6 sticky top-40">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest text-center font-semibold">Advertisement</p>
              {rightSlots.map((slotDef) => <AdSlot key={slotDef.id} slotDef={slotDef} {...adSlotProps} />)}
            </div>
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
