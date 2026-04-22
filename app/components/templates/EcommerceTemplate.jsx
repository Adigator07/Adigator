"use client";

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
      <div className={`flex flex-1 ${isMobile ? 'flex-col px-4 py-4' : 'px-8 py-8 gap-8'} w-full max-w-[1200px] mx-auto bg-slate-50`}>
        
        {/* ── LEFT RAIL ZONE (Filters / Ads) ── */}
        {!isMobile && (
          <aside className="w-[160px] md:w-[200px] flex-shrink-0 flex flex-col gap-6 pt-2">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-3">Categories</h3>
              <ul className="text-sm text-slate-600 space-y-2">
                <li className="font-semibold text-indigo-600">Smartphones</li>
                <li className="hover:text-indigo-600 cursor-pointer">Laptops & PCs</li>
                <li className="hover:text-indigo-600 cursor-pointer">Wearables</li>
                <li className="hover:text-indigo-600 cursor-pointer">Audio</li>
              </ul>
              
              <h3 className="font-bold text-slate-900 mt-6 mb-3">Price</h3>
              <ul className="text-sm text-slate-600 space-y-2">
                <li><label className="flex items-center gap-2"><input type="checkbox" /> Under $50</label></li>
                <li><label className="flex items-center gap-2"><input type="checkbox" /> $50 to $100</label></li>
                <li><label className="flex items-center gap-2"><input type="checkbox" /> $100 to $500</label></li>
              </ul>
            </div>

            {leftSlots.length > 0 && (
              <div className="flex flex-col gap-4 sticky top-40">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest text-center font-semibold">Advertisement</p>
                {leftSlots.map((slotDef) => <AdSlot key={slotDef.id} slotDef={slotDef} {...adSlotProps} />)}
              </div>
            )}
          </aside>
        )}

        {/* ── CENTER CONTENT ZONE ── */}
        <main className="flex-1 flex flex-col min-w-0 gap-6">
          
          {/* Hero Banner (Promotional) */}
          {contentSlots.length > 0 ? (
             <div className="w-full flex flex-col items-center">
               {contentSlots.map((slotDef) => <AdSlot key={slotDef.id} slotDef={slotDef} {...adSlotProps} />)}
             </div>
          ) : (
            <div className="w-full aspect-[4/1] bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl overflow-hidden relative shadow-md flex items-center px-8">
              <div className="text-white z-10">
                <h2 className="text-3xl font-black mb-2">{content.hero.headline}</h2>
                <p className="text-indigo-100 mb-4">{content.hero.subtitle}</p>
                <button className="bg-white text-indigo-600 font-bold px-6 py-2 rounded-full hover:bg-indigo-50 transition">Shop Now</button>
              </div>
            </div>
          )}

          {/* Product Grid */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Featured Deals</h2>
            <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-3 gap-6'}`}>
              {content.products.map((item, idx) => (
                <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition relative group">
                  <button className="absolute top-3 right-3 text-slate-300 hover:text-rose-500 transition z-10"><Heart size={20} /></button>
                  <div className="aspect-square bg-slate-100 rounded-lg mb-4 flex items-center justify-center p-4">
                    <img src={item.image} alt={item.name} className="object-contain w-full h-full mix-blend-multiply opacity-80" />
                  </div>
                  <h3 className="font-semibold text-slate-800 line-clamp-2 text-sm">{item.name}</h3>
                  <div className="flex items-center gap-1 mt-2 text-amber-400">
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} className="text-slate-300" />
                    <span className="text-xs text-slate-500 ml-1">({item.reviews})</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div>
                      <span className="text-lg font-black text-slate-900">${item.price}</span>
                      <span className="text-xs text-slate-400 line-through ml-2">${item.oldPrice}</span>
                    </div>
                  </div>
                  <button className="w-full mt-4 bg-indigo-600 text-white font-bold text-sm py-2 rounded-lg hover:bg-indigo-700 transition opacity-0 group-hover:opacity-100">
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          {/* Interleaved Mobile Ads */}
          {isMobile && rightSlots.length > 0 && (
            <div className="my-4 flex flex-col items-center">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2 font-semibold">Advertisement</p>
              {rightSlots.map((slotDef) => <AdSlot key={slotDef.id} slotDef={slotDef} {...adSlotProps} />)}
            </div>
          )}

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
