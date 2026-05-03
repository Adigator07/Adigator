"use client";

import { motion } from "framer-motion";

export default function AdSlot({
  slotDef,
  activeSlotId,
  slotCreativeMap,
  showSlotLabels,
  isMobile,
}) {
  const isActive = activeSlotId ? slotDef.id === activeSlotId : true;
  const matchedCreative = slotCreativeMap[slotDef.id] || null;

  // ── Safe dimension extraction ────────────────────────────────
  // Dimensions can live in slotDef.slot.width/height (preferred)
  // OR be parsed directly from slotDef.size ("728x90")
  let slotWidth, slotHeight;
  if (slotDef.slot && slotDef.slot.width && slotDef.slot.height) {
    slotWidth = slotDef.slot.width;
    slotHeight = slotDef.slot.height;
  } else if (slotDef.size && slotDef.size.includes("x")) {
    const [w, h] = slotDef.size.split("x").map(Number);
    slotWidth = w || 300;
    slotHeight = h || 250;
  } else {
    slotWidth = 300;
    slotHeight = 250;
  }

  // Scale down slot if it's too wide for mobile view
  const isScaled = isMobile && slotWidth > 340;
  const scaleFactor = isScaled ? 340 / slotWidth : 1;

  return (
    <div className="flex justify-center w-full my-4 overflow-hidden">
      <motion.div
        className={`relative flex-shrink-0 origin-center ${
          isActive
            ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-white shadow-2xl shadow-blue-500/20 z-10"
            : "opacity-30 grayscale-[50%] pointer-events-none"
        }`}
        style={{
          width: slotWidth,
          height: slotHeight,
          borderRadius: 0,
          transformOrigin: "center top",
          marginBottom: isScaled ? `-${slotHeight * (1 - scaleFactor)}px` : 0,
          background: matchedCreative && isActive ? "transparent" : "#e8ecf2",
        }}
        animate={
          isActive
            ? { scale: isScaled ? scaleFactor : 1.0 }
            : { scale: isScaled ? scaleFactor * 0.98 : 0.98 }
        }
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
      >
        {/* Size label badge */}
        {(showSlotLabels || isActive) && (
          <div
            className={`absolute top-0 left-0 z-20 px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] font-bold ${
              isActive
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/40"
                : "bg-slate-900/90 text-white/90"
            }`}
          >
            {slotDef.size}
          </div>
        )}

        {/* ── Creative image ── */}
        {matchedCreative && isActive ? (
          <img
            src={matchedCreative.url || matchedCreative.image}
            alt={matchedCreative.name || slotDef.size}
            style={{
              width: slotWidth,
              height: slotHeight,
              display: "block",
              objectFit: "cover",
            }}
          />
        ) : (
          /* ── Placeholder ── */
          <div
            className="flex flex-col h-full w-full items-center justify-center text-center p-4"
            style={{
              border: isActive ? "2px dashed #818cf8" : "2px dashed #cbd5e1",
              background: isActive
                ? "linear-gradient(135deg, #f0f4ff 0%, #e8eeff 100%)"
                : "linear-gradient(135deg, #f5f5f5 0%, #ebebeb 100%)",
            }}
          >
            <p
              className="text-sm font-semibold"
              style={{ color: isActive ? "#6366f1" : "#94a3b8" }}
            >
              {slotDef.size}
            </p>
            <p
              className="text-[10px] mt-1 uppercase tracking-wider"
              style={{ color: isActive ? "#818cf8" : "#b0bec5" }}
            >
              {isActive ? "Missing Creative" : "Placeholder"}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}