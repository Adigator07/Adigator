"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TemplateRenderer from "./TemplateRenderer";
import { universalSlots } from "../templates/universalSlots";
import {
  ChevronLeft, ChevronRight, Shuffle, Layers, Monitor, Smartphone,
  CheckCircle2, LayoutGrid, Square, Sparkles, PanelRight, X
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const SIZE_PRIORITY = {
  "970x250": 10, "728x90": 9, "300x600": 8,
  "300x250": 7, "160x600": 6, "320x50": 5, "300x1050": 4,
};

// Slide canvas aspect ratio (16:9)
const ASPECT_W = 16;
const ASPECT_H = 9;

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function generateDynamicTemplate(validCreatives, baseSlots) {
  const bySize = {};
  validCreatives.forEach((c) => { bySize[c.size] = (bySize[c.size] || 0) + 1; });
  const slotsBySize = {};
  baseSlots.forEach((slot) => {
    if (!slotsBySize[slot.size]) slotsBySize[slot.size] = [];
    slotsBySize[slot.size].push(slot);
  });
  const availableSizes = Object.keys(bySize).sort(
    (a, b) => (SIZE_PRIORITY[b] || 0) - (SIZE_PRIORITY[a] || 0)
  );
  const dynamicSlots = [];
  availableSizes.forEach((size) => {
    const count = bySize[size];
    const matchingBaseSlots = slotsBySize[size];
    if (matchingBaseSlots && matchingBaseSlots.length > 0) {
      for (let i = 0; i < count; i++) {
        if (i < matchingBaseSlots.length) {
          dynamicSlots.push({ ...matchingBaseSlots[i], id: `${matchingBaseSlots[i].id}-gen-${i}` });
        } else {
          const templateSlot = matchingBaseSlots[matchingBaseSlots.length - 1];
          dynamicSlots.push({ ...templateSlot, id: `${templateSlot.id}-dup-${i}`, slot: { ...templateSlot.slot } });
        }
      }
    }
  });
  return dynamicSlots;
}

function buildSlotCreativeMap(slotsToMap, validCreatives) {
  // We simply map the slot's matching creative id if it was injected
  const map = {};
  slotsToMap.forEach((slot) => {
    // We embedded creativeId in the slot when we generated it below
    if (slot.creativeId) {
      const creative = validCreatives.find(c => c.id === slot.creativeId);
      if (creative) map[slot.id] = creative;
    }
  });
  return map;
}

// ─────────────────────────────────────────────────────────────
// SLIDE VARIANTS (framer-motion)
// ─────────────────────────────────────────────────────────────
const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? "8%" : "-8%", opacity: 0, scale: 0.97 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir) => ({ x: dir < 0 ? "8%" : "-8%", opacity: 0, scale: 0.97 }),
};

// ─────────────────────────────────────────────────────────────
// VIEW MODE TOGGLE
// ─────────────────────────────────────────────────────────────
function ViewModeToggle({ viewMode, setViewMode }) {
  return (
    <div className="flex items-center bg-black/40 p-1.5 rounded-xl border border-white/10">
      <button
        onClick={() => setViewMode("multiple")}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
          viewMode === "multiple"
            ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
            : "text-gray-400 hover:text-white"
        }`}
      >
        <Square size={15} /> Multiple Slides
      </button>
      <button
        onClick={() => setViewMode("single")}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
          viewMode === "single"
            ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
            : "text-gray-400 hover:text-white"
        }`}
      >
        <LayoutGrid size={15} /> Single Slide
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// THUMBNAIL SIDEBAR
// ─────────────────────────────────────────────────────────────
function ThumbnailSidebar({ slides, activeIndex, onSelect, onClose }) {
  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="w-44 shrink-0 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <span className="text-xs font-bold text-white uppercase tracking-widest">Slides</span>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition">
          <X size={14} />
        </button>
      </div>

      {/* Thumbnails */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-white/10">
        {slides.map((slide, idx) => (
          <button
            key={slide.key}
            onClick={() => onSelect(idx)}
            className={`w-full group relative rounded-lg overflow-hidden border-2 transition-all ${
              idx === activeIndex
                ? "border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)]"
                : "border-transparent hover:border-white/30"
            }`}
          >
            {/* 16:9 mini thumbnail */}
            <div
              className="w-full bg-slate-800 flex items-center justify-center text-[8px] text-gray-500"
              style={{ aspectRatio: "16/9" }}
            >
              {slide.thumbnail ? (
                <img src={slide.thumbnail} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
              ) : (
                <span className="text-center px-1">{slide.label}</span>
              )}
            </div>
            {/* Index badge */}
            <div className="absolute top-1 left-1 text-[9px] bg-black/70 text-white rounded px-1 font-bold">
              {idx + 1}
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function SlidePreview({
  validCreatives,
  showSlotLabels,
  selectedTemplate,
  setSelectedTemplate,
  TEMPLATES,
  viewMode: externalViewMode,
  onViewModeChange,
}) {
  const [internalViewMode, setInternalViewMode] = useState("multiple");
  const viewMode = externalViewMode ?? internalViewMode;
  const setViewMode = onViewModeChange ?? setInternalViewMode;

  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  // Touch swipe
  const touchStartX = useRef(null);
  const containerRef = useRef(null);

  const creativesToUse = useMemo(() => {
    return validCreatives.filter(c => c && (c.url || c.text || c.image || c.title));
  }, [validCreatives]);

  // ── Build exactly 1 slot per valid creative ──────────────────
  const { displayedSlots, slotCreativeMap } = useMemo(() => {
    const slots = [];
    const map = {};
    const usedBaseSlots = {};
    
    creativesToUse.forEach((c, i) => {
      // Find base slots for this size
      const matchingBaseSlots = universalSlots.filter(s => s.size === c.size);
      let baseSlot = matchingBaseSlots[0] || universalSlots[0]; // fallback to first slot if none match
      
      if (matchingBaseSlots.length > 0) {
        const usedCount = usedBaseSlots[c.size] || 0;
        baseSlot = usedCount < matchingBaseSlots.length 
          ? matchingBaseSlots[usedCount] 
          : matchingBaseSlots[matchingBaseSlots.length - 1];
        usedBaseSlots[c.size] = usedCount + 1;
      }
      
      const slotId = `${baseSlot.id}-gen-${c.id}-${i}`;
      const newSlot = { ...baseSlot, id: slotId, creativeId: c.id };
      slots.push(newSlot);
      map[slotId] = c;
    });
    
    return { displayedSlots: slots, slotCreativeMap: map };
  }, [creativesToUse]);

  // ── Slides array depends on viewMode ─────────────────────────
  const slides = useMemo(() => {
    if (viewMode === "single") {
      return [{ key: "single-slide", label: "All Creatives", thumbnail: null }];
    }
    // Multiple: ONE slide per VALID creative exactly
    return creativesToUse.map((c, i) => ({
      key: c.id || `creative-${i}`,
      label: `${c.name || "Untitled"}\n${c.size}`,
      thumbnail: c.url || c.image,
      creative: c,
      slot: displayedSlots[i] || null,
    }));
  }, [viewMode, creativesToUse, displayedSlots]);

  const totalSlides = slides.length;
  const safeActiveIndex = Math.min(activeIndex, Math.max(0, totalSlides - 1));

  // Reset active index when slide count changes
  useEffect(() => { setActiveIndex(0); }, [viewMode, totalSlides]);

  // ── Keyboard navigation ───────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") navigate(-1);
      if (e.key === "ArrowRight") navigate(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [totalSlides]);

  const navigate = useCallback(
    (newDir) => {
      setDirection(newDir);
      setActiveIndex((prev) => {
        const next = prev + newDir;
        if (next < 0) return totalSlides - 1;
        if (next >= totalSlides) return 0;
        return next;
      });
    },
    [totalSlides]
  );

  // ── Touch swipe ───────────────────────────────────────────────
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) navigate(diff > 0 ? 1 : -1);
    touchStartX.current = null;
  };

  // ── Active slide content ──────────────────────────────────────
  const activeSlide = slides[safeActiveIndex];

  // For multiple mode: which slot and creative to highlight in the template
  const activeSlot = viewMode === "multiple"
    ? (displayedSlots[safeActiveIndex] || displayedSlots[0])
    : null;

  // Stats
  const filledSlots = displayedSlots.filter((s) => slotCreativeMap[s.id]).length;

  return (
    <div className="space-y-4">
      {/* ── Preview Engine Header ───────────────────────────── */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-purple-400 mb-1">
              <Sparkles size={15} />
              <span className="text-xs font-bold tracking-widest uppercase">Preview Engine</span>
            </div>
            <h2 className="text-xl font-bold text-white">See Your Ads Before They Go Live</h2>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <CheckCircle2 size={13} className="text-green-400" /> Multi-platform preview
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <CheckCircle2 size={13} className="text-green-400" /> 16:9 slide canvas
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <CheckCircle2 size={13} className="text-green-400" /> Real ad formats
              </span>
            </div>
          </div>

          {/* Controls row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Desktop / Mobile toggle */}
            <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setIsMobile(false)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                  !isMobile ? "bg-white/10 text-white shadow-md" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <Monitor size={15} /> Desktop
              </button>
              <button
                onClick={() => setIsMobile(true)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition ${
                  isMobile ? "bg-white/10 text-white shadow-md" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <Smartphone size={15} /> Mobile
              </button>
            </div>

            {/* View Mode */}
            <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />

            {/* Sidebar toggle */}
            <button
              onClick={() => setShowSidebar((v) => !v)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition ${
                showSidebar
                  ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                  : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
              }`}
            >
              <PanelRight size={15} /> Thumbnails
            </button>
          </div>
        </div>
      </div>

      {/* ── Template Selector ───────────────────────────────── */}
      {TEMPLATES && TEMPLATES.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => setSelectedTemplate?.(tpl.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border-2 ${
                selectedTemplate === tpl.id
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 border-transparent text-white shadow-lg"
                  : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/30"
              }`}
            >
              <tpl.icon size={16} />
              {tpl.name}
            </button>
          ))}
        </div>
      )}

      {/* ── Empty State ─────────────────────────────────────── */}
      {validCreatives.length === 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 text-center">
          <p className="text-red-400 font-bold mb-2">No Valid Creatives Found</p>
          <p className="text-sm text-red-300">Upload and validate creatives to generate a preview.</p>
        </div>
      )}

      {validCreatives.length > 0 && (
        <>
          {/* ── Navigation bar ──────────────────────────────── */}
          <div className="flex items-center justify-between gap-4">
            {/* Prev / Counter / Next */}
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(-1)}
                disabled={totalSlides <= 1}
                className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition disabled:opacity-30"
              >
                <ChevronLeft size={20} />
              </motion.button>

              <div className="text-center min-w-[120px]">
                <p className="text-base font-bold text-white">
                  {safeActiveIndex + 1}
                  <span className="text-gray-500 font-normal"> / {totalSlides}</span>
                </p>
                <p className="text-xs text-purple-400 font-semibold truncate max-w-[120px]">
                  {viewMode === "single" ? "All Creatives" : (activeSlide?.creative?.name || activeSlot?.name || "")}
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(1)}
                disabled={totalSlides <= 1}
                className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition disabled:opacity-30"
              >
                <ChevronRight size={20} />
              </motion.button>
            </div>
          </div>

          {/* ── Dot navigation ──────────────────────────────── */}
          {totalSlides > 1 && (
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {slides.map((slide, idx) => (
                <button
                  key={slide.key}
                  onClick={() => { setDirection(idx > safeActiveIndex ? 1 : -1); setActiveIndex(idx); }}
                  className={`rounded-full transition-all ${
                    idx === safeActiveIndex
                      ? "w-8 h-2.5 bg-gradient-to-r from-purple-500 to-blue-500 shadow-lg shadow-purple-500/30"
                      : "w-2.5 h-2.5 bg-white/20 hover:bg-white/40"
                  }`}
                  title={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {/* ── Main canvas + sidebar ───────────────────────── */}
          <div className="flex gap-4 items-start" ref={containerRef}>
            {/* 16:9 Canvas */}
            <div className="flex-1 min-w-0">
              <div
                className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-slate-950 shadow-[0_0_60px_rgba(0,0,0,0.5)]"
                style={{ aspectRatio: `${ASPECT_W}/${ASPECT_H}` }}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
              >
                <AnimatePresence custom={direction} mode="wait">
                  <motion.div
                    key={activeSlide?.key}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                    className="absolute inset-0 w-full h-full"
                  >
                    {viewMode === "single" ? (
                      /* Single slide: ALL creatives integrated perfectly into ONE template */
                      <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-slate-950">
                        <TemplateScaler isMobile={isMobile}>
                          <TemplateRenderer
                            allSlots={displayedSlots}
                            activeSlotId={null} // null makes ALL slots active simultaneously
                            slotCreativeMap={slotCreativeMap}
                            showSlotLabels={showSlotLabels}
                            isMobile={isMobile}
                            selectedTemplate={selectedTemplate}
                          />
                        </TemplateScaler>
                      </div>
                    ) : (
                      /* Multiple slides: full template scaled perfectly highlighting ONE slot */
                      <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-slate-950">
                        <TemplateScaler isMobile={isMobile}>
                          <TemplateRenderer
                            allSlots={displayedSlots}
                            activeSlotId={activeSlot?.id}
                            slotCreativeMap={slotCreativeMap}
                            showSlotLabels={showSlotLabels}
                            isMobile={isMobile}
                            selectedTemplate={selectedTemplate}
                          />
                        </TemplateScaler>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Slide number badge */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full border border-white/10">
                  {safeActiveIndex + 1} / {totalSlides}
                </div>

                {/* Keyboard hint */}
                <div className="absolute bottom-3 right-3 text-[10px] text-gray-600 hidden md:block">
                  ← → keys to navigate
                </div>
              </div>
            </div>

            {/* Thumbnail sidebar */}
            <AnimatePresence>
              {showSidebar && (
                <ThumbnailSidebar
                  slides={slides}
                  activeIndex={safeActiveIndex}
                  onSelect={(idx) => {
                    setDirection(idx > safeActiveIndex ? 1 : -1);
                    setActiveIndex(idx);
                  }}
                  onClose={() => setShowSidebar(false)}
                />
              )}
            </AnimatePresence>
          </div>

          {/* ── Stats row ───────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-blue-500/15 to-blue-600/15 border border-blue-500/25 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-blue-400">{totalSlides}</p>
              <p className="text-[11px] text-gray-500 mt-1">
                {viewMode === "single" ? "Total Slide" : "Slides"}
              </p>
            </div>
            <div className="bg-gradient-to-br from-green-500/15 to-green-600/15 border border-green-500/25 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-400">{filledSlots}</p>
              <p className="text-[11px] text-gray-500 mt-1">Filled Slots</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500/15 to-purple-600/15 border border-purple-500/25 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-purple-400">
                {displayedSlots.length > 0
                  ? Math.round((filledSlots / displayedSlots.length) * 100)
                  : 0}%
              </p>
              <p className="text-[11px] text-gray-500 mt-1">Coverage</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TEMPLATE SCALER — CSS-scales the full template to fit 16:9
// ─────────────────────────────────────────────────────────────
function TemplateScaler({ children, isMobile }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const container = el.parentElement; // The 16:9 absolute inset-0 wrapper
    if (!container) return;

    const update = () => {
      // 16:9 canvas dimensions
      const parentW = container.offsetWidth;
      const parentH = container.offsetHeight;

      // Natural dimensions of the template content
      // Width is fixed per device type, height is dynamic to the template's content
      const contentW = isMobile ? 375 : 1200;
      const contentH = el.offsetHeight || (isMobile ? 812 : 900);

      // Fit ENTIRE template within the canvas bounds to prevent overflow
      const scaleW = parentW / contentW;
      const scaleH = parentH / contentH;
      const scale = Math.min(scaleW, scaleH, 1);

      el.style.setProperty("--slide-scale", scale.toString());
      el.style.transform = `scale(${scale})`;
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(container);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isMobile]);

  return (
    <div 
      ref={ref} 
      style={{ 
        transformOrigin: "center center",
        width: isMobile ? "375px" : "1200px",
        height: "fit-content", // Allow natural height
      }}
    >
      {children}
    </div>
  );
}
