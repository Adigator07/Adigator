"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TemplateRenderer from "./TemplateRenderer";
import { universalSlots } from "../templates/universalSlots";
import {
  ChevronLeft, ChevronRight, Shuffle, Layers, Info, Sparkles
} from "lucide-react";

const SIZE_PRIORITY = {
  "970x250": 10,
  "728x90": 9,
  "300x600": 8,
  "300x250": 7,
  "160x600": 6,
  "320x50": 5,
  "300x1050": 4
};

/**
 * Smart Layout Decision Engine
 * Dynamically decides which slots to show based on available creatives.
 */
function generateDynamicTemplate(validCreatives, baseSlots) {
  const bySize = {};
  validCreatives.forEach(c => {
    bySize[c.size] = (bySize[c.size] || 0) + 1;
  });

  const dynamicSlots = [];
  const slotsBySize = {};
  
  baseSlots.forEach(slot => {
    if (!slotsBySize[slot.size]) slotsBySize[slot.size] = [];
    slotsBySize[slot.size].push(slot);
  });

  const availableSizes = Object.keys(bySize).sort((a, b) => (SIZE_PRIORITY[b] || 0) - (SIZE_PRIORITY[a] || 0));

  availableSizes.forEach(size => {
    const count = bySize[size];
    const matchingBaseSlots = slotsBySize[size];
    
    if (matchingBaseSlots && matchingBaseSlots.length > 0) {
      for (let i = 0; i < count; i++) {
        if (i < matchingBaseSlots.length) {
          // Use existing base slot
          dynamicSlots.push({ ...matchingBaseSlots[i], id: `${matchingBaseSlots[i].id}-gen-${i}` });
        } else {
          // Duplicate the last matching base slot and shift its Y coordinate
          const templateSlot = matchingBaseSlots[matchingBaseSlots.length - 1];
          dynamicSlots.push({
            ...templateSlot,
            id: `${templateSlot.id}-dup-${i}`,
            slot: {
              ...templateSlot.slot
            }
          });
        }
      }
    }
  });

  return dynamicSlots;
}

/**
 * Build creative → slot mapping.
 * For each slot, picks a matching-size creative (sequential rotation).
 */
function buildSlotCreativeMap(slotsToMap, validCreatives) {
  const bySize = {};
  validCreatives.forEach((c) => {
    if (!bySize[c.size]) bySize[c.size] = [];
    bySize[c.size].push(c);
  });

  const usedIndex = {};
  const map = {};

  slotsToMap.forEach((slot) => {
    const pool = bySize[slot.size];
    if (!pool || pool.length === 0) return;
    if (usedIndex[slot.size] == null) usedIndex[slot.size] = 0;
    map[slot.id] = pool[usedIndex[slot.size] % pool.length];
    usedIndex[slot.size]++;
  });

  return map;
}

/**
 * Shuffle array (Fisher-Yates)
 */
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir < 0 ? 60 : -60, opacity: 0 }),
};

export default function SlidePreview({
  validCreatives,
  showSlotLabels,
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [shuffledCreatives, setShuffledCreatives] = useState(null);

  const creativesToUse = shuffledCreatives || validCreatives;

  const displayedSlots = useMemo(() => {
    const generated = generateDynamicTemplate(creativesToUse, universalSlots);
    return generated.length > 0 ? generated : [];
  }, [creativesToUse]);

  const slotCreativeMap = useMemo(
    () => buildSlotCreativeMap(displayedSlots, creativesToUse),
    [displayedSlots, creativesToUse]
  );

  const safeActiveIndex = Math.min(activeIndex, Math.max(0, displayedSlots.length - 1));
  const activeSlot = displayedSlots[safeActiveIndex] || displayedSlots[0];
  const activeCreative = slotCreativeMap[activeSlot?.id] || null;

  const navigate = useCallback(
    (newDir) => {
      setDirection(newDir);
      setActiveIndex((prev) => {
        const next = prev + newDir;
        if (next < 0) return displayedSlots.length - 1;
        if (next >= displayedSlots.length) return 0;
        return next;
      });
    },
    [displayedSlots.length]
  );

  const handleShuffle = useCallback(() => {
    setShuffledCreatives(shuffleArray(validCreatives));
  }, [validCreatives]);

  const handleAutoFill = useCallback(() => {
    setShuffledCreatives(null);
  }, []);

  // Stats
  const filledSlots = displayedSlots.filter((s) => slotCreativeMap[s.id]).length;
  const emptySlots = displayedSlots.length - filledSlots;

  return (
    <div className="space-y-6">
      {/* Auto Layout Header */}
      {displayedSlots.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between bg-purple-500/10 border border-purple-500/20 rounded-xl px-4 py-3"
        >
          <div className="flex items-center gap-2 text-purple-400">
            <Sparkles size={18} />
            <span className="text-sm font-semibold">Dynamic Layout Engine: Ad placements optimized</span>
          </div>
        </motion.div>
      )}

      {displayedSlots.length === 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center">
          <p className="text-red-400 font-bold mb-2">No Valid Creatives Found</p>
          <p className="text-sm text-red-300">Please upload and fix creatives to generate a dynamic layout.</p>
        </div>
      )}

      {displayedSlots.length > 0 && (
        <>
          {/* Slide Navigation Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition"
              >
                <ChevronLeft size={20} />
              </motion.button>

              <div className="text-center min-w-[200px]">
                <p className="text-lg font-bold text-white">
                  Slide {safeActiveIndex + 1}
                  <span className="text-gray-500 font-normal"> / {displayedSlots.length}</span>
                </p>
                <p className="text-sm text-purple-400 font-semibold">{activeSlot?.name}</p>
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(1)}
                className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition"
              >
                <ChevronRight size={20} />
              </motion.button>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAutoFill}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600/70 to-cyan-600/70 border border-blue-400/20 text-white text-sm font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/20 transition"
              >
                <Layers size={16} /> Auto Fill
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleShuffle}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600/70 to-pink-600/70 border border-purple-400/20 text-white text-sm font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-purple-500/20 transition"
              >
                <Shuffle size={16} /> Shuffle
              </motion.button>
            </div>
          </div>

      {/* Slot Dots Navigation */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {displayedSlots.map((slot, idx) => {
          const hasCr = !!slotCreativeMap[slot.id];
          const isActive = idx === activeIndex;
          return (
            <motion.button
              key={slot.id}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setDirection(idx > safeActiveIndex ? 1 : -1);
                setActiveIndex(idx);
              }}
              className={`relative rounded-full transition-all ${
                isActive
                  ? "w-10 h-3 bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30"
                  : hasCr
                    ? "w-3 h-3 bg-green-500/60 hover:bg-green-500"
                    : "w-3 h-3 bg-white/20 hover:bg-white/40"
              }`}
              title={`${slot.name} (${slot.size})`}
            />
          );
        })}
      </div>

      {/* Active Slide Info Card */}
      <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl px-5 py-3">
        <div className="w-10 h-10 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
          <Info size={18} className="text-purple-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">{activeSlot?.name}</p>
          <p className="text-xs text-gray-400">
            Slot size: <span className="text-purple-400 font-semibold">{activeSlot?.size}</span>
            {activeCreative && (
              <>
                {" · "}Creative: <span className="text-green-400 font-semibold">{activeCreative.name}</span>
              </>
            )}
            {!activeCreative && (
              <span className="text-red-400 font-semibold"> · No matching creative</span>
            )}
          </p>
        </div>
        <div
          className="rounded-lg border border-white/10 bg-white/5 flex items-center justify-center"
          style={{
            width: Math.max(30, (activeSlot?.slot?.width || 100) / 15),
            height: Math.max(15, (activeSlot?.slot?.height || 50) / 15),
            maxWidth: 80,
            maxHeight: 50,
          }}
        >
          <span className="text-[8px] text-gray-500 font-bold">
            {activeSlot?.size}
          </span>
        </div>
      </div>

      {/* Template Preview with Slot Highlight */}
      <AnimatePresence custom={direction} mode="wait">
        <motion.div
          key={activeSlot?.id}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="overflow-x-auto"
        >
          <div className="inline-block">
            <TemplateRenderer
              allSlots={displayedSlots}
              activeSlotId={activeSlot?.id}
              slotCreativeMap={slotCreativeMap}
              showSlotLabels={showSlotLabels}
            />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Slot Coverage Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-blue-500/15 to-blue-600/15 border border-blue-500/25 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-blue-400">{displayedSlots.length}</p>
          <p className="text-[11px] text-gray-500 mt-1">Generated Slots</p>
        </div>
        <div className="bg-gradient-to-br from-green-500/15 to-green-600/15 border border-green-500/25 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-green-400">{filledSlots}</p>
          <p className="text-[11px] text-gray-500 mt-1">Filled</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/15 to-purple-600/15 border border-purple-500/25 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-purple-400">
            {displayedSlots.length > 0 ? Math.round((filledSlots / displayedSlots.length) * 100) : 0}%
          </p>
          <p className="text-[11px] text-gray-500 mt-1">Coverage</p>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
