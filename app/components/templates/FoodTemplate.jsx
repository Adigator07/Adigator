"use client";

import { Search, Menu, Clock, Star, ChefHat, Bookmark } from "lucide-react";
import AdSlot from "../AdSlot";
import { generateTemplateContent } from "../../lib/templateContent";

export default function FoodTemplate({
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
  const content = generateTemplateContent("food");

  return (
    <div
      className={`relative bg-amber-50 shadow-2xl overflow-hidden transition-all duration-500 flex flex-col font-serif ${
        isMobile ? "rounded-[2rem] border-[8px] border-amber-900" : "rounded-xl border border-amber-200"
      }`}
      style={{ 
        width: isMobile ? 375 : 1200, 
        minHeight: isMobile ? 812 : 900 
      }}
    >
      {/* ── FOOD HEADER ── */}
      <header className="w-full bg-white border-b-2 border-amber-100 sticky top-0 z-30 font-sans">
        <div className="flex items-center justify-between px-4 md:px-8 py-5">
          <div className="flex items-center gap-4">
            <Menu className="text-amber-800 cursor-pointer hover:text-orange-500 transition" size={24} />
            {!isMobile && <span className="text-sm font-bold text-amber-700 uppercase tracking-widest">Recipes</span>}
          </div>
          <div className="flex flex-col items-center flex-1">
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-amber-900 flex items-center gap-2">
              <ChefHat className="text-orange-500" size={36} />
              Cravings
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Search className="text-amber-800 cursor-pointer hover:text-orange-500 transition" size={24} />
            <Bookmark className="text-amber-800 cursor-pointer hover:text-orange-500 transition" size={24} />
          </div>
        </div>
        {!isMobile && (
          <nav className="w-full bg-amber-50/50 py-3 flex justify-center gap-12 text-sm font-bold text-amber-900 border-t border-amber-100">
            {['Breakfast', 'Lunch', 'Dinner', 'Desserts', 'Vegan', '30-Minute Meals'].map((link) => (
              <span key={link} className="hover:text-orange-600 cursor-pointer transition uppercase tracking-wider">{link}</span>
            ))}
          </nav>
        )}
      </header>

      {/* ── TOP BANNER ZONE ── */}
      {topSlots.length > 0 && (
        <div className="w-full bg-white border-b border-amber-100 py-6 flex flex-col items-center">
          <p className="text-[10px] text-amber-400 uppercase tracking-widest mb-2 font-semibold font-sans">Advertisement</p>
          {topSlots.map((slotDef) => <AdSlot key={slotDef.id} slotDef={slotDef} {...adSlotProps} />)}
        </div>
      )}

      {/* ── MAIN LAYOUT WRAPPER ── */}
      <div className={`flex flex-1 ${isMobile ? 'flex-col px-4 py-6' : 'px-8 py-10 gap-10'} w-full max-w-[1200px] mx-auto`}>
        
        {/* ── LEFT RAIL ZONE (Desktop Only) ── */}
        {!isMobile && leftSlots.length > 0 && (
          <aside className="w-[160px] flex-shrink-0 flex flex-col gap-6 pt-4 sticky top-32 h-fit">
            <p className="text-[10px] text-amber-400 uppercase tracking-widest text-center font-semibold font-sans">Advertisement</p>
            {leftSlots.map((slotDef) => <AdSlot key={slotDef.id} slotDef={slotDef} {...adSlotProps} />)}
          </aside>
        )}

        {/* ── CENTER CONTENT ZONE ── */}
        <main className="flex-1 flex flex-col min-w-0">
          
          {/* Featured Recipe Hero */}
          <div className="mb-12 relative rounded-2xl overflow-hidden shadow-lg group">
            <img src={content.hero.image} alt="Hero" className="w-full aspect-[21/9] object-cover group-hover:scale-105 transition duration-1000" />
            <div className="absolute inset-0 bg-gradient-to-t from-amber-900/90 via-amber-900/40 to-transparent flex flex-col justify-end p-6 md:p-12">
              <span className="bg-orange-500 text-white font-sans text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full w-fit mb-4">Recipe of the Day</span>
              <h2 className="text-3xl md:text-5xl font-black text-white leading-tight mb-4 drop-shadow-md">
                {content.hero.headline}
              </h2>
              <p className="text-amber-50 md:text-xl max-w-2xl font-sans font-medium drop-shadow">{content.hero.subtitle}</p>
            </div>
          </div>

          {contentSlots.length > 0 && (
             <div className="mb-12 w-full flex flex-col items-center bg-white p-6 rounded-2xl shadow-sm border border-amber-100">
               <p className="text-[10px] text-amber-400 uppercase tracking-widest mb-3 font-semibold font-sans">Advertisement</p>
               {contentSlots.map((slotDef) => <AdSlot key={slotDef.id} slotDef={slotDef} {...adSlotProps} />)}
             </div>
          )}

          {/* Pinterest-style Masonry Grid */}
          <h3 className="text-3xl font-black text-amber-900 mb-8 border-b-2 border-orange-200 pb-2 inline-block">Trending Recipes</h3>
          
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-6' : 'grid-cols-3 gap-6'} items-start`}>
            {content.recipes.map((recipe, idx) => (
              <div key={idx} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition duration-300 border border-amber-100 group cursor-pointer flex flex-col">
                <div className="w-full aspect-[4/5] overflow-hidden relative">
                  <img src={recipe.image} alt="Recipe" className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                  <button className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-amber-700 hover:text-orange-500 hover:bg-white transition">
                    <Bookmark size={16} />
                  </button>
                </div>
                <div className="p-5 font-sans">
                  <div className="flex items-center gap-1 text-orange-400 mb-2">
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <Star size={14} fill="currentColor" />
                    <span className="text-xs text-amber-700 font-bold ml-1">{recipe.rating}</span>
                  </div>
                  <h4 className="text-lg font-bold text-amber-950 leading-tight mb-3 font-serif group-hover:text-orange-600 transition">{recipe.title}</h4>
                  <div className="flex items-center text-amber-700 text-xs font-semibold gap-1">
                    <Clock size={14} /> {recipe.time}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Interleaved Mobile Ads */}
          {isMobile && rightSlots.length > 0 && (
            <div className="my-10 flex flex-col items-center bg-white border-y border-amber-200 py-8 shadow-inner">
              <p className="text-[10px] text-amber-400 uppercase tracking-widest mb-3 font-semibold font-sans">Advertisement</p>
              {rightSlots.map((slotDef) => <AdSlot key={slotDef.id} slotDef={slotDef} {...adSlotProps} />)}
            </div>
          )}

        </main>

        {/* ── RIGHT RAIL ZONE (Desktop Only) ── */}
        {!isMobile && (
          <aside className="w-[300px] flex-shrink-0 flex flex-col gap-8 font-sans">
            <div className="rounded-2xl border border-amber-200 p-6 bg-white shadow-sm text-center">
              <img src="https://i.pravatar.cc/150?img=44" className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-orange-100" alt="Chef" />
              <h3 className="text-xl font-black text-amber-900 mb-2 font-serif">Hi, I'm Julia!</h3>
              <p className="text-sm text-amber-700 mb-4 leading-relaxed">Welcome to my kitchen! Here you'll find simple, delicious recipes for the whole family.</p>
              <button className="bg-orange-500 text-white font-bold px-6 py-2 rounded-full hover:bg-orange-600 transition w-full">Read More</button>
            </div>
            
            {rightSlots.length > 0 && (
              <div className="flex flex-col gap-6 sticky top-32 bg-white p-4 rounded-2xl border border-amber-100 shadow-sm">
                <p className="text-[10px] text-amber-400 uppercase tracking-widest text-center font-semibold">Advertisement</p>
                {rightSlots.map((slotDef) => <AdSlot key={slotDef.id} slotDef={slotDef} {...adSlotProps} />)}
              </div>
            )}
          </aside>
        )}
      </div>

      {/* ── MOBILE STICKY BOTTOM ZONE ── */}
      {bottomSlots.length > 0 && (
        <div className="w-full bg-white border-t-2 border-amber-100 py-2 flex flex-col items-center justify-center sticky bottom-0 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <p className="text-[9px] text-amber-400 uppercase tracking-widest mb-1 font-semibold font-sans">Advertisement</p>
          {bottomSlots.map((slotDef) => <AdSlot key={slotDef.id} slotDef={slotDef} {...adSlotProps} />)}
        </div>
      )}
    </div>
  );
}
