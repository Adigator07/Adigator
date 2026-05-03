"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TemplateRenderer from "./TemplateRenderer";
import { universalSlots } from "../templates/universalSlots";
import {
  ChevronLeft, ChevronRight, Layers, Monitor, Smartphone,
  CheckCircle2, LayoutGrid, Square, Sparkles, PanelRight, X,
  Sun, Sunset, Zap, Camera
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const SIZE_PRIORITY = {
  "970x250": 10, "728x90": 9, "300x600": 8,
  "300x250": 7, "160x600": 6, "320x50": 5, "300x1050": 4,
};

const ASPECT_W = 16;
const ASPECT_H = 9;

// Scene environments for photorealistic context
const DESKTOP_SCENES = [
  {
    id: "studio_desk",
    label: "Studio Desk",
    bg: "linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)",
    deskColor: "#2d2416",
    ambientColor: "rgba(99,179,237,0.08)",
    lightPos: "top-right",
    grain: true,
  },
  {
    id: "bright_office",
    label: "Bright Office",
    bg: "linear-gradient(160deg, #e8f4fd 0%, #d1ecf9 50%, #b8e0f7 100%)",
    deskColor: "#f0ede8",
    ambientColor: "rgba(255,220,150,0.12)",
    lightPos: "top-left",
    grain: false,
  },
  {
    id: "evening_warm",
    label: "Evening Warm",
    bg: "linear-gradient(145deg, #1c0a00 0%, #3d1a00 50%, #6b3000 100%)",
    deskColor: "#2a1506",
    ambientColor: "rgba(255,140,0,0.15)",
    lightPos: "top-right",
    grain: true,
  },
];

const MOBILE_SCENES = [
  {
    id: "hand_hold",
    label: "Hand Hold",
    bg: "linear-gradient(160deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
    ambientColor: "rgba(120,100,255,0.12)",
    grain: true,
  },
  {
    id: "coffee_table",
    label: "Coffee Table",
    bg: "linear-gradient(135deg, #f5f0e8 0%, #ede8dc 100%)",
    ambientColor: "rgba(200,160,100,0.15)",
    grain: false,
  },
  {
    id: "outdoor",
    label: "Outdoor",
    bg: "linear-gradient(180deg, #87ceeb 0%, #98d8f0 60%, #b8e8d4 100%)",
    ambientColor: "rgba(255,255,200,0.2)",
    grain: false,
  },
];

// ─────────────────────────────────────────────────────────────
// SLIDE VARIANTS
// ─────────────────────────────────────────────────────────────
const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? "6%" : "-6%", opacity: 0, scale: 0.96 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir) => ({ x: dir < 0 ? "6%" : "-6%", opacity: 0, scale: 0.96 }),
};

// ─────────────────────────────────────────────────────────────
// GRAIN OVERLAY SVG
// ─────────────────────────────────────────────────────────────
function GrainOverlay({ opacity = 0.04 }) {
  return (
    <svg
      style={{
        position: "absolute", inset: 0, width: "100%", height: "100%",
        pointerEvents: "none", zIndex: 50, opacity,
      }}
    >
      <filter id="grain-filter">
        <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain-filter)" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// MACBOOK FRAME — photorealistic desktop mockup
// ─────────────────────────────────────────────────────────────
function MacBookFrame({ children, scene, tilt = true }) {
  const lidAngle = tilt ? "perspective(1200px) rotateX(2deg) rotateY(-1.5deg)" : "none";

  return (
    <div
      className="relative w-full flex flex-col items-center"
      style={{ transform: lidAngle, transformOrigin: "center bottom", transition: "transform 0.6s ease" }}
    >
      {/* Screen bezel */}
      <div
        className="relative w-full rounded-t-2xl overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #1a1a1a 0%, #111 100%)",
          padding: "18px 20px 0 20px",
          boxShadow: "inset 0 2px 4px rgba(255,255,255,0.06), 0 -2px 0 #333",
        }}
      >
        {/* Camera dot */}
        <div
          className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
          style={{ background: "#222", boxShadow: "0 0 0 1px #333, inset 0 1px 2px #000" }}
        />

        {/* Screen */}
        <div
          className="relative rounded-lg overflow-hidden"
          style={{
            aspectRatio: "16/9",
            background: "#000",
            boxShadow: "inset 0 0 30px rgba(0,0,0,0.8), 0 0 1px rgba(255,255,255,0.1)",
          }}
        >
          {/* Screen glare */}
          <div
            className="absolute inset-0 pointer-events-none z-20"
            style={{
              background: scene?.lightPos === "top-right"
                ? "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 40%)"
                : "linear-gradient(225deg, rgba(255,255,255,0.06) 0%, transparent 40%)",
            }}
          />
          {/* Screen content */}
          <div className="absolute inset-0">{children}</div>
        </div>
      </div>

      {/* Hinge + base */}
      <div
        className="w-[105%] relative"
        style={{
          height: "16px",
          background: "linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)",
          borderRadius: "0 0 4px 4px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        }}
      >
        {/* Hinge center indent */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2"
          style={{
            width: "60px", height: "6px",
            background: "linear-gradient(180deg, #333 0%, #222 100%)",
            borderRadius: "0 0 6px 6px",
          }}
        />
      </div>

      {/* Base / palm rest */}
      <div
        className="w-[112%] relative"
        style={{
          height: "28px",
          background: "linear-gradient(180deg, #1d1d1d 0%, #141414 100%)",
          borderRadius: "0 0 14px 14px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        {/* Trackpad hint */}
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2"
          style={{
            width: "80px", height: "8px",
            background: "rgba(255,255,255,0.04)",
            borderRadius: "4px",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        />
      </div>

      {/* Table reflection */}
      <div
        className="w-[120%] mt-0.5 opacity-20"
        style={{
          height: "24px",
          background: "linear-gradient(180deg, rgba(200,200,220,0.3) 0%, transparent 100%)",
          borderRadius: "0 0 8px 8px",
          filter: "blur(4px)",
          transform: "scaleY(-1) translateY(-4px)",
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// iPHONE FRAME — photorealistic mobile mockup
// ─────────────────────────────────────────────────────────────
function IPhoneFrame({ children, scene, tilt = true }) {
  const tiltTransform = tilt
    ? "perspective(900px) rotateX(3deg) rotateY(2deg) rotateZ(-1deg)"
    : "none";

  return (
    <div
      className="relative inline-block"
      style={{
        transform: tiltTransform,
        transformOrigin: "center center",
        transition: "transform 0.6s ease",
      }}
    >
      {/* Outer shell */}
      <div
        className="relative rounded-[44px] overflow-hidden"
        style={{
          width: "280px",
          background: "linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 40%, #222 100%)",
          padding: "14px 10px",
          boxShadow: `
            0 0 0 1px rgba(255,255,255,0.08),
            0 0 0 2px rgba(0,0,0,0.6),
            inset 0 0 30px rgba(0,0,0,0.4),
            4px 20px 60px rgba(0,0,0,0.7),
            -2px -4px 20px rgba(255,255,255,0.04)
          `,
        }}
      >
        {/* Side buttons */}
        <div
          className="absolute left-[-3px] top-[90px]"
          style={{
            width: "3px", height: "28px",
            background: "linear-gradient(180deg, #2a2a2a, #1a1a1a)",
            borderRadius: "2px 0 0 2px",
          }}
        />
        <div
          className="absolute left-[-3px] top-[128px]"
          style={{
            width: "3px", height: "44px",
            background: "linear-gradient(180deg, #2a2a2a, #1a1a1a)",
            borderRadius: "2px 0 0 2px",
          }}
        />
        <div
          className="absolute left-[-3px] top-[182px]"
          style={{
            width: "3px", height: "44px",
            background: "linear-gradient(180deg, #2a2a2a, #1a1a1a)",
            borderRadius: "2px 0 0 2px",
          }}
        />
        {/* Power button */}
        <div
          className="absolute right-[-3px] top-[148px]"
          style={{
            width: "3px", height: "64px",
            background: "linear-gradient(180deg, #2a2a2a, #1a1a1a)",
            borderRadius: "0 2px 2px 0",
          }}
        />

        {/* Screen area */}
        <div
          className="relative rounded-[34px] overflow-hidden"
          style={{
            background: "#000",
            boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)",
          }}
        >
          {/* Dynamic Island */}
          <div
            className="absolute top-3 left-1/2 -translate-x-1/2 z-30"
            style={{
              width: "90px", height: "26px",
              background: "#000",
              borderRadius: "14px",
            }}
          />

          {/* Status bar */}
          <div
            className="flex items-center justify-between px-6 pt-3 pb-1 z-20 relative"
            style={{
              background: "rgba(0,0,0,0.85)",
              fontSize: "11px",
              color: "#fff",
              fontFamily: "'SF Pro Display', system-ui, sans-serif",
              fontWeight: 600,
            }}
          >
            <span style={{ paddingTop: "20px" }}>9:41</span>
            <div style={{ width: "90px" }} /> {/* Dynamic Island space */}
            <div style={{ paddingTop: "20px", display: "flex", gap: "5px", alignItems: "center" }}>
              <span>●●●●</span>
              <span>WiFi</span>
              <span>⚡</span>
            </div>
          </div>

          {/* Screen content */}
          <div style={{ height: "460px", overflow: "hidden" }}>
            {children}
          </div>

          {/* Home indicator */}
          <div
            className="flex items-center justify-center py-2"
            style={{ background: "rgba(0,0,0,0.9)" }}
          >
            <div
              style={{
                width: "120px", height: "5px",
                background: "rgba(255,255,255,0.35)",
                borderRadius: "3px",
              }}
            />
          </div>

          {/* Screen glare */}
          <div
            className="absolute inset-0 pointer-events-none z-20"
            style={{
              background: "linear-gradient(145deg, rgba(255,255,255,0.08) 0%, transparent 35%)",
            }}
          />
        </div>
      </div>

      {/* Phone reflection on surface */}
      <div
        className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-[80%] opacity-20"
        style={{
          height: "20px",
          background: "linear-gradient(180deg, rgba(150,150,200,0.5), transparent)",
          filter: "blur(8px)",
          transform: "translateX(-50%) scaleY(-1)",
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCENE WRAPPER — puts device in environment
// ─────────────────────────────────────────────────────────────
function SceneWrapper({ scene, isMobile, children }) {
  return (
    <div
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
      style={{ background: scene.bg }}
    >
      {/* Grain */}
      {scene.grain && <GrainOverlay opacity={0.035} />}

      {/* Ambient light blob */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "60%", height: "60%",
          background: scene.ambientColor,
          borderRadius: "50%",
          filter: "blur(80px)",
          top: scene.lightPos === "top-right" ? "0" : "0",
          right: scene.lightPos === "top-right" ? "0" : "auto",
          left: scene.lightPos === "top-left" ? "0" : "auto",
        }}
      />

      {/* Desk surface (desktop only) */}
      {!isMobile && (
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: "35%",
            background: `linear-gradient(180deg, ${scene.deskColor || "#1a1a1a"} 0%, rgba(0,0,0,0.3) 100%)`,
            boxShadow: "inset 0 2px 20px rgba(0,0,0,0.3)",
          }}
        />
      )}

      {/* Subtle desk objects (desktop) */}
      {!isMobile && (
        <>
          {/* Coffee cup silhouette */}
          <div
            className="absolute bottom-[28%] right-[8%] opacity-20"
            style={{
              width: "28px", height: "38px",
              background: "rgba(255,255,255,0.15)",
              borderRadius: "4px 4px 6px 6px",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          />
          {/* Notebook */}
          <div
            className="absolute bottom-[28%] left-[6%] opacity-15"
            style={{
              width: "60px", height: "44px",
              background: "rgba(200,200,220,0.2)",
              borderRadius: "2px",
              transform: "rotate(-3deg)",
            }}
          />
        </>
      )}

      {/* Device + content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Depth of field — bottom blur */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: "30%",
          background: "linear-gradient(0deg, rgba(0,0,0,0.4) 0%, transparent 100%)",
          backdropFilter: "blur(2px)",
          WebkitMaskImage: "linear-gradient(0deg, black 0%, transparent 100%)",
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// SCENE SELECTOR
// ─────────────────────────────────────────────────────────────
function SceneSelector({ scenes, activeId, onSelect }) {
  return (
    <div className="flex items-center gap-2">
      <Camera size={13} className="text-gray-500" />
      {scenes.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s.id)}
          title={s.label}
          className={`w-5 h-5 rounded-full border-2 transition-all ${activeId === s.id
            ? "border-blue-400 scale-110"
            : "border-white/20 hover:border-white/50"
            }`}
          style={{
            background: typeof s.bg === "string"
              ? s.bg.includes("gradient") ? s.bg : s.bg
              : "#333",
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// VIEW MODE TOGGLE
// ─────────────────────────────────────────────────────────────
function ViewModeToggle({ viewMode, setViewMode }) {
  return (
    <div className="flex items-center bg-black/40 p-1.5 rounded-xl border border-white/10">
      <button
        onClick={() => setViewMode("multiple")}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === "multiple"
          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
          : "text-gray-400 hover:text-white"
          }`}
      >
        <Square size={15} /> Multiple Slides
      </button>
      <button
        onClick={() => setViewMode("single")}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === "single"
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
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <span className="text-xs font-bold text-white uppercase tracking-widest">Slides</span>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition">
          <X size={14} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-white/10">
        {slides.map((slide, idx) => (
          <button
            key={slide.key}
            onClick={() => onSelect(idx)}
            className={`w-full group relative rounded-lg overflow-hidden border-2 transition-all ${idx === activeIndex
              ? "border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)]"
              : "border-transparent hover:border-white/30"
              }`}
          >
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
  const [realisticMode, setRealisticMode] = useState(true);
  const [activeSceneId, setActiveSceneId] = useState(DESKTOP_SCENES[0].id);
  const [tiltEnabled, setTiltEnabled] = useState(true);

  const touchStartX = useRef(null);
  const containerRef = useRef(null);

  // Switch to a sensible default scene when device changes
  useEffect(() => {
    setActiveSceneId(isMobile ? MOBILE_SCENES[0].id : DESKTOP_SCENES[0].id);
  }, [isMobile]);

  const scenes = isMobile ? MOBILE_SCENES : DESKTOP_SCENES;
  const activeScene = scenes.find((s) => s.id === activeSceneId) || scenes[0];

  const creativesToUse = useMemo(() => {
    return validCreatives.filter(c => c && (c.url || c.text || c.image || c.title));
  }, [validCreatives]);

  const { displayedSlots, slotCreativeMap } = useMemo(() => {
    const slots = [];
    const map = {};
    const usedBaseSlots = {};

    creativesToUse.forEach((c, i) => {
      const matchingBaseSlots = universalSlots.filter(s => s.size === c.size);
      let baseSlot = matchingBaseSlots[0] || universalSlots[0];

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

  const slides = useMemo(() => {
    if (viewMode === "single") {
      return [{ key: "single-slide", label: "All Creatives", thumbnail: null }];
    }
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

  useEffect(() => { setActiveIndex(0); }, [viewMode, totalSlides]);

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

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) navigate(diff > 0 ? 1 : -1);
    touchStartX.current = null;
  };

  const activeSlide = slides[safeActiveIndex];
  const activeSlot = viewMode === "multiple"
    ? (displayedSlots[safeActiveIndex] || displayedSlots[0])
    : null;

  const filledSlots = displayedSlots.filter((s) => slotCreativeMap[s.id]).length;

  // ── The template content to render ───────────────────────────
  const templateContent = (
    <TemplateRenderer
      allSlots={displayedSlots}
      activeSlotId={viewMode === "multiple" ? activeSlot?.id : null}
      slotCreativeMap={slotCreativeMap}
      showSlotLabels={showSlotLabels}
      isMobile={isMobile}
      selectedTemplate={selectedTemplate}
    />
  );

  return (
    <div className="space-y-4">
      {/* ── Preview Engine Header ─────────────────────────── */}
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
                <CheckCircle2 size={13} className="text-green-400" /> Photorealistic device frames
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                <CheckCircle2 size={13} className="text-green-400" /> Real ad formats
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Desktop / Mobile toggle */}
            <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setIsMobile(false)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition ${!isMobile ? "bg-white/10 text-white shadow-md" : "text-gray-500 hover:text-gray-300"
                  }`}
              >
                <Monitor size={15} /> Desktop
              </button>
              <button
                onClick={() => setIsMobile(true)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition ${isMobile ? "bg-white/10 text-white shadow-md" : "text-gray-500 hover:text-gray-300"
                  }`}
              >
                <Smartphone size={15} /> Mobile
              </button>
            </div>

            {/* View Mode */}
            <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />

            {/* Realistic toggle */}
            <button
              onClick={() => setRealisticMode((v) => !v)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition ${realisticMode
                ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                }`}
            >
              <Zap size={15} /> {realisticMode ? "Realistic" : "Flat"}
            </button>

            {/* Sidebar toggle */}
            <button
              onClick={() => setShowSidebar((v) => !v)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition ${showSidebar
                ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                }`}
            >
              <PanelRight size={15} /> Thumbnails
            </button>
          </div>
        </div>

        {/* Scene selector row (only in realistic mode) */}
        {realisticMode && (
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10">
            <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Scene</span>
            <SceneSelector scenes={scenes} activeId={activeSceneId} onSelect={setActiveSceneId} />
            <span className="text-xs text-gray-600">·</span>
            <button
              onClick={() => setTiltEnabled((v) => !v)}
              className={`text-xs font-semibold px-2 py-1 rounded-lg transition ${tiltEnabled
                ? "text-blue-400 bg-blue-500/10"
                : "text-gray-500 hover:text-gray-300"
                }`}
            >
              {tiltEnabled ? "3D Tilt ✦" : "Flat View"}
            </button>
          </div>
        )}
      </div>

      {/* ── Template Selector ─────────────────────────────── */}
      {TEMPLATES && TEMPLATES.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => setSelectedTemplate?.(tpl.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border-2 ${selectedTemplate === tpl.id
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

      {/* ── Empty State ───────────────────────────────────── */}
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
                  onClick={() => {
                    setDirection(idx > safeActiveIndex ? 1 : -1);
                    setActiveIndex(idx);
                  }}
                  className={`rounded-full transition-all ${idx === safeActiveIndex
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
            <div className="flex-1 min-w-0">
              <div
                className="relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.5)]"
                style={{ aspectRatio: `${ASPECT_W}/${ASPECT_H}`, background: "#0a0a0f" }}
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
                    transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                    className="absolute inset-0 w-full h-full"
                  >
                    {realisticMode ? (
                      /* ── PHOTOREALISTIC MODE ── */
                      <SceneWrapper scene={activeScene} isMobile={isMobile}>
                        {isMobile ? (
                          <IPhoneFrame scene={activeScene} tilt={tiltEnabled}>
                            <div style={{ transform: "scale(0.75)", transformOrigin: "top center", width: "133%", marginLeft: "-16.5%" }}>
                              {templateContent}
                            </div>
                          </IPhoneFrame>
                        ) : (
                          <div className="w-full px-8 pb-4">
                            <MacBookFrame scene={activeScene} tilt={tiltEnabled}>
                              <TemplateScaler isMobile={false}>
                                {templateContent}
                              </TemplateScaler>
                            </MacBookFrame>
                          </div>
                        )}
                      </SceneWrapper>
                    ) : (
                      /* ── FLAT MODE (original) ── */
                      <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-slate-950">
                        <TemplateScaler isMobile={isMobile}>
                          {templateContent}
                        </TemplateScaler>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Badge */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full border border-white/10 z-30">
                  {safeActiveIndex + 1} / {totalSlides}
                </div>

                {/* Realistic badge */}
                {realisticMode && (
                  <div className="absolute top-3 left-3 bg-amber-500/20 border border-amber-500/30 backdrop-blur-sm text-amber-300 text-[10px] font-bold px-2 py-1 rounded-lg z-30 flex items-center gap-1">
                    <Zap size={10} /> Photorealistic
                  </div>
                )}

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

          {/* ── Stats row ─────────────────────────────────── */}
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
// TEMPLATE SCALER
// ─────────────────────────────────────────────────────────────
function TemplateScaler({ children, isMobile }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const container = el.parentElement;
    if (!container) return;

    const update = () => {
      const parentW = container.offsetWidth;
      const parentH = container.offsetHeight;
      const contentW = isMobile ? 375 : 1200;
      const contentH = el.offsetHeight || (isMobile ? 812 : 900);
      const scaleW = parentW / contentW;
      const scaleH = parentH / contentH;
      const scale = Math.min(scaleW, scaleH, 1);
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
        height: "fit-content",
      }}
    >
      {children}
    </div>
  );
}