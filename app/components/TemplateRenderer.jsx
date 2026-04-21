"use client";

import { motion } from "framer-motion";

export default function TemplateRenderer({
  allSlots = [],
  activeSlotId,
  slotCreativeMap = {},
  showSlotLabels = false,
}) {
  // Group slots by zone
  const topSlots = allSlots.filter(s => s.zone === "top");
  const leftSlots = allSlots.filter(s => s.zone === "left");
  const rightSlots = allSlots.filter(s => s.zone === "right");
  const contentSlots = allSlots.filter(s => s.zone === "content");
  const bottomSlots = allSlots.filter(s => s.zone === "bottom");

  // ── Render a single embedded slot box ──
  const renderSlot = (slotDef) => {
    const isActive = activeSlotId ? slotDef.id === activeSlotId : true;
    const matchedCreative = slotCreativeMap[slotDef.id] || null;

    return (
      <motion.div
        key={slotDef.id}
        className={`relative overflow-hidden flex-shrink-0 ${isActive
            ? "ring-2 ring-purple-500 ring-offset-2 ring-offset-white shadow-2xl shadow-purple-500/30 bg-slate-100 z-10"
            : "opacity-30 grayscale-[50%] bg-slate-100 border-2 border-dashed border-slate-300 pointer-events-none"
          }`}
        style={{
          width: slotDef.slot.width,
          height: slotDef.slot.height,
          borderRadius: 0, // Enforce sharp edges
        }}
        animate={isActive ? { scale: 1.0 } : { scale: 0.98 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
      >
        {/* Slot label */}
        {(showSlotLabels || isActive) && (
          <div
            className={`absolute top-0 left-0 z-20 px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] font-bold ${isActive
                ? "bg-purple-600 text-white shadow-lg shadow-purple-500/40"
                : "bg-slate-900/90 text-white/90"
              }`}
          >
            {slotDef.size}
          </div>
        )}

        {/* 
          CRITICAL BUG FIX: Isolated Creative Visibility 
          If the slot is INACTIVE, we NEVER render the image. 
          This guarantees NO background distraction or bleeding.
        */}
        {matchedCreative && isActive ? (
          <img
            src={matchedCreative.url}
            alt={matchedCreative.name}
            style={{
              width: slotDef.slot.width,
              height: slotDef.slot.height,
            }}
            className="object-cover block absolute top-0 left-0"
          />
        ) : (
          <div className="flex flex-col h-full w-full items-center justify-center text-center p-4">
            <p className="text-sm font-semibold text-slate-400">{slotDef.size}</p>
            <p className="text-[10px] text-slate-300 mt-1 uppercase tracking-wider">
              {isActive ? "Missing Creative" : "Placeholder"}
            </p>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div
      className="relative bg-white border border-slate-200 shadow-xl overflow-hidden transition-all duration-500 flex flex-col"
      style={{ width: 980, minHeight: 760 }}
    >
      {/* ── TOP BANNER ZONE ── */}
      {topSlots.length > 0 && (
        <div className="w-full bg-slate-50 border-b border-slate-100 py-6 flex flex-col items-center gap-6">
          {topSlots.map(renderSlot)}
        </div>
      )}

      {/* ── MAIN LAYOUT WRAPPER ── */}
      <div className="flex flex-1 p-8 gap-8">

        {/* ── LEFT RAIL ZONE ── */}
        {leftSlots.length > 0 && (
          <aside className="w-[160px] flex-shrink-0 flex flex-col gap-6">
            {leftSlots.map(renderSlot)}
          </aside>
        )}

        {/* ── CENTER CONTENT ZONE ── */}
        <main className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold mb-1">
                Dynamic Ad Layout Engine
              </p>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Creative-Aware Template Generator
              </h2>
            </div>
          </div>

          {/* Render content slots (e.g., 970x250 Hero Banner if it somehow got squeezed into content, or inline 300x250) */}
          {contentSlots.length > 0 && (
            <div className="mb-8 flex flex-col items-center gap-6">
              {contentSlots.map(renderSlot)}
            </div>
          )}

          {/* Fake Article Content */}
          <div className="space-y-6">
            <div className="rounded-none overflow-hidden bg-slate-100 border border-slate-200">
              <img
                src="https://via.placeholder.com/900x400?text=Featured+Article"
                alt="Featured"
                className="w-full h-64 object-cover opacity-80 mix-blend-multiply"
              />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-slate-800">
                Adapting natively to your ad inventory
              </h3>
              <p className="text-base text-slate-600 leading-relaxed">
                This layout is a true flex/grid system. The ad units do not float above the content; they actively push the content around and seamlessly embed into the DOM flow.
              </p>
              <div className="h-4 bg-slate-100 rounded w-3/4 mt-4"></div>
              <div className="h-4 bg-slate-100 rounded w-full"></div>
              <div className="h-4 bg-slate-100 rounded w-5/6"></div>
              <div className="h-4 bg-slate-100 rounded w-full"></div>
              <div className="h-4 bg-slate-100 rounded w-2/3"></div>
            </div>
          </div>
        </main>

        {/* ── RIGHT RAIL ZONE ── */}
        {rightSlots.length > 0 && (
          <aside className="w-[300px] flex-shrink-0 flex flex-col gap-6">
            <div className="rounded-none border border-slate-200 p-5 bg-slate-50/50 mb-2">
              <h3 className="text-xs uppercase tracking-[0.2em] text-slate-500 font-bold mb-3">
                Sidebar
              </h3>
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-12 h-12 bg-slate-200 rounded-none flex-shrink-0"></div>
                    <div className="space-y-2 flex-1 pt-1">
                      <div className="h-2 bg-slate-200 rounded w-full"></div>
                      <div className="h-2 bg-slate-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right rail ads stack naturally below the sidebar widget */}
            {rightSlots.map(renderSlot)}
          </aside>
        )}
      </div>

      {/* ── MOBILE STICKY BOTTOM ZONE ── */}
      {bottomSlots.length > 0 && (
        <div className="w-full bg-slate-900 border-t border-slate-800 py-4 flex flex-col items-center justify-center sticky bottom-0 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
          {bottomSlots.map(renderSlot)}
        </div>
      )}
    </div>
  );
}