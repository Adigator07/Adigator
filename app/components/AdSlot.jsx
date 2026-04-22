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

  // Scale down slot if it's too wide for mobile view
  const isScaled = isMobile && slotDef.slot.width > 340;
  const scaleFactor = isScaled ? 340 / slotDef.slot.width : 1;

  return (
    <div className="flex justify-center w-full my-4 overflow-hidden">
      <motion.div
        className={`relative flex-shrink-0 origin-center ${
          isActive
            ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-white shadow-2xl shadow-blue-500/20 bg-slate-100 z-10"
            : "opacity-30 grayscale-[50%] bg-slate-100 border-2 border-dashed border-slate-300 pointer-events-none"
        }`}
        style={{
          width: slotDef.slot.width,
          height: slotDef.slot.height,
          borderRadius: 0, // Sharp edges
          transform: isScaled ? `scale(${scaleFactor})` : "scale(1)",
          transformOrigin: "center top",
          marginBottom: isScaled ? `-${slotDef.slot.height * (1 - scaleFactor)}px` : 0
        }}
        animate={isActive ? { scale: isScaled ? scaleFactor : 1.0 } : { scale: isScaled ? scaleFactor * 0.98 : 0.98 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
      >
        {/* Slot label */}
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

        {/* Render creative if active */}
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
    </div>
  );
}
