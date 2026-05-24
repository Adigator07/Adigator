"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useImageEditor } from "../hooks/useImageEditor";
import { validateCreativeAsset } from "../lib/creativeValidation";
import {
  X, Maximize2, Crop, Undo2,
  Check, ArrowRight, Loader2, ZoomIn,
} from "lucide-react";

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 30 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", damping: 25, stiffness: 300 },
  },
  exit: { opacity: 0, scale: 0.92, y: 30, transition: { duration: 0.2 } },
};

export default function EditCreativeModal({ creative, onApply, onClose }) {
  const {
    previewUrl,
    previewSize,
    isProcessing,
    undoCount,
    handleAutoFit,
    handleResizePixelProportional,
    handleUndo,
    reset,
  } = useImageEditor();

  const [compareMode, setCompareMode] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [customW, setCustomW] = useState("");
  const [customH, setCustomH] = useState("");
  const [cropW, setCropW] = useState("");
  const [cropH, setCropH] = useState("");
  const [activeEditor, setActiveEditor] = useState(null);

  // Parse creative's original dimensions
  const [origW, origH] = creative.size.split("x").map(Number);

  const parseDims = useCallback((sizeText) => {
    const [w, h] = String(sizeText || "").split("x").map((n) => Number(n));
    if (!w || !h) return { w: origW, h: origH };
    return { w, h };
  }, [origW, origH]);

  const deriveRatioLockedSize = useCallback((nextWInput, nextHInput, changedField) => {
    const base = parseDims(previewSize || creative.size);
    const ratio = base.w / base.h;
    const parsedW = Number.parseInt(String(nextWInput || ""), 10);
    const parsedH = Number.parseInt(String(nextHInput || ""), 10);

    if (changedField === "w") {
      if (!Number.isFinite(parsedW) || parsedW <= 0) return { w: "", h: "" };
      const nextH = Math.max(1, Math.round(parsedW / ratio));
      return { w: String(parsedW), h: String(nextH) };
    }

    if (!Number.isFinite(parsedH) || parsedH <= 0) return { w: "", h: "" };
    const nextW = Math.max(1, Math.round(parsedH * ratio));
    return { w: String(nextW), h: String(parsedH) };
  }, [creative.size, previewSize, parseDims]);

  const handleCustomWidthChange = useCallback((e) => {
    const sanitized = String(e.target.value || "").replace(/[^\d]/g, "");
    const next = deriveRatioLockedSize(sanitized, customH, "w");
    setCustomW(next.w);
    setCustomH(next.h);
  }, [customH, deriveRatioLockedSize]);

  const handleCustomHeightChange = useCallback((e) => {
    const sanitized = String(e.target.value || "").replace(/[^\d]/g, "");
    const next = deriveRatioLockedSize(customW, sanitized, "h");
    setCustomW(next.w);
    setCustomH(next.h);
  }, [customW, deriveRatioLockedSize]);

  const handleApplyPixelResize = useCallback(() => {
    const w = Number.parseInt(customW, 10);
    const h = Number.parseInt(customH, 10);
    if (!w || !h) return;
    handleResizePixelProportional(creative.url, creative.size, w, h);
  }, [customW, customH, creative.url, creative.size, handleResizePixelProportional]);

  const handleCropWidthChange = useCallback((e) => {
    const sanitized = String(e.target.value || "").replace(/[^\d]/g, "");
    setCropW(sanitized);
  }, []);

  const handleCropHeightChange = useCallback((e) => {
    const sanitized = String(e.target.value || "").replace(/[^\d]/g, "");
    setCropH(sanitized);
  }, []);

  const handleApplyCropCreative = useCallback(() => {
    const w = Number.parseInt(cropW, 10);
    const h = Number.parseInt(cropH, 10);
    if (!w || !h) return;
    handleAutoFit(creative.url, creative.size, w, h);
  }, [cropW, cropH, creative.url, creative.size, handleAutoFit]);

  useEffect(() => {
    reset();
    setActiveEditor(null);
    setCustomW(String(origW));
    setCustomH(String(origH));
    setCropW(String(origW));
    setCropH(String(origH));
  }, [creative.id, origW, origH, reset]);

  const handleApply = useCallback(() => {
    if (!previewUrl || !previewSize) return;
    const [newW, newH] = previewSize.split("x").map(Number);
    validateCreativeAsset({ file: null, image: { width: newW, height: newH }, platform: "programmatic" }).then((freshValidation) => {
      onApply(creative.id, {
        url: previewUrl,
        size: previewSize,
        validation: freshValidation,
        placementType: freshValidation.intelligence?.placementType,
        deviceClassification: freshValidation.intelligence?.deviceClassification,
        iabCompatibility: freshValidation.intelligence?.iabCompatibility,
        dspCompatibility: freshValidation.intelligence?.dspCompatibility,
        inventoryAvailability: freshValidation.intelligence?.inventory,
        auctionReadiness: freshValidation.intelligence?.auctionReadiness,
        premiumPlacementPotential: freshValidation.intelligence?.premiumPlacement,
      });
      onClose();
    });
  }, [creative.id, previewUrl, previewSize, onApply, onClose]);

  const handleSliderMove = useCallback(
    (e) => {
      if (!isDraggingSlider) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      setSliderPos((x / rect.width) * 100);
    },
    [isDraggingSlider]
  );

  const currentPreview = previewUrl || creative.url;
  const currentSize = previewSize || creative.size;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl border border-cyan-400/25 bg-linear-to-br from-[#050915] via-[#110a2c] to-[#040812] shadow-2xl shadow-cyan-500/10"
        >
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-2xl"
            animate={{ opacity: [0.16, 0.24, 0.16] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
            style={{ boxShadow: "inset 0 0 0 1px rgba(34,211,238,0.18), inset 0 0 40px rgba(56,189,248,0.1)" }}
          />

          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-cyan-300/20 bg-[#070b1a]/85 backdrop-blur-xl px-8 py-5">
            <div>
              <h2 className="text-2xl font-bold text-slate-100">Edit Creative</h2>
              <p className="text-sm text-slate-300 mt-0.5">
                {creative.name} — Current: {creative.size}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-cyan-500/15 transition text-slate-300 hover:text-cyan-200"
            >
              <X size={22} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-0">
            {/* Left Panel — Editing Controls */}
            <div className="border-r border-cyan-300/20 bg-[#060a17]/70 p-6 space-y-6">
              {/* Current Size */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Current Size
                </p>
                <div className="flex items-center gap-3 bg-slate-900/70 border border-cyan-300/20 rounded-xl px-4 py-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                    <span className="text-red-400 text-xs font-bold">
                      {creative.valid ? "✓" : "✗"}
                    </span>
                  </div>
                  <div>
                    <p className="text-slate-100 font-bold text-lg">{creative.size}</p>
                    <p className="text-xs text-slate-400">
                      {creative.valid ? "Valid size" : "Not supported"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Actions
                </p>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={isProcessing}
                  onClick={() => setActiveEditor("resize")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-linear-to-r from-blue-600/90 to-cyan-500/85 border border-cyan-300/35 text-slate-100 font-semibold text-sm hover:shadow-lg hover:shadow-cyan-500/30 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Maximize2 size={18} />
                  <span className="flex-1 text-left">Resize to Fit</span>
                  <ArrowRight size={16} className="opacity-50" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={isProcessing}
                  onClick={() => setActiveEditor("crop")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-linear-to-r from-purple-700/90 to-fuchsia-500/85 border border-fuchsia-300/35 text-slate-100 font-semibold text-sm hover:shadow-lg hover:shadow-fuchsia-500/30 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Crop size={18} />
                  <span className="flex-1 text-left">Crop Creative (Open Editor)</span>
                  <ArrowRight size={16} className="opacity-50" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={isProcessing}
                  onClick={() => setActiveEditor("resize")}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-linear-to-r from-amber-600/90 to-orange-500/85 border border-amber-300/35 text-slate-100 font-semibold text-sm hover:shadow-lg hover:shadow-amber-500/30 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Maximize2 size={18} />
                  <span className="flex-1 text-left">Resize Creative Pixel (Open Editor)</span>
                  <ArrowRight size={16} className="opacity-50" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={undoCount === 0 || isProcessing}
                  onClick={handleUndo}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-linear-to-r from-slate-800/90 to-slate-700/80 border border-cyan-300/45 text-slate-50 font-semibold text-sm hover:from-cyan-700/40 hover:to-blue-700/35 hover:border-cyan-200/70 hover:text-white hover:shadow-lg hover:shadow-cyan-400/25 transition disabled:opacity-45 disabled:cursor-not-allowed disabled:from-slate-900/75 disabled:to-slate-800/70 disabled:border-slate-500/35 disabled:text-slate-200"
                >
                  <Undo2 size={18} />
                  <span className="flex-1 text-left">
                    Undo {undoCount > 0 && `(${undoCount})`}
                  </span>
                </motion.button>
              </div>

              {/* Editor Panels */}
              {activeEditor === "resize" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pt-3 border-t border-cyan-300/25 mt-2"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-300 mb-3">
                    Resize Creative Pixel Editor
                  </p>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="number"
                      placeholder="Width (px)"
                      value={customW}
                      onChange={handleCustomWidthChange}
                      className="w-full !bg-black border border-slate-500/45 rounded-xl px-3 py-2.5 !text-white !caret-white placeholder:text-slate-300 text-sm outline-none focus:border-amber-400/70 focus:shadow-[0_0_0_1px_rgba(251,191,36,0.35)] transition"
                      style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
                    />
                    <span className="text-slate-400 self-center font-bold">×</span>
                    <input
                      type="number"
                      placeholder="Height (px)"
                      value={customH}
                      onChange={handleCustomHeightChange}
                      className="w-full !bg-black border border-slate-500/45 rounded-xl px-3 py-2.5 !text-white !caret-white placeholder:text-slate-300 text-sm outline-none focus:border-amber-400/70 focus:shadow-[0_0_0_1px_rgba(251,191,36,0.35)] transition"
                      style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!customW || !customH || isProcessing}
                    onClick={handleApplyPixelResize}
                    className="w-full py-2.5 bg-linear-to-r from-amber-600/30 to-orange-500/25 border border-amber-300/40 hover:border-amber-200/60 hover:bg-amber-500/35 rounded-xl text-xs font-bold text-amber-100 uppercase tracking-wider transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Apply Pixel Resize
                  </motion.button>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Enter width or height only. The other value auto-calculates to keep aspect ratio without crop or distortion.
                  </p>
                </motion.div>
              )}

              {activeEditor === "crop" && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pt-3 border-t border-fuchsia-300/25 mt-2"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-fuchsia-300 mb-3">
                    Crop Creative Editor
                  </p>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="number"
                      placeholder="Width (px)"
                      value={cropW}
                      onChange={handleCropWidthChange}
                      className="w-full !bg-black border border-slate-500/45 rounded-xl px-3 py-2.5 !text-white !caret-white placeholder:text-slate-300 text-sm outline-none focus:border-fuchsia-400/70 focus:shadow-[0_0_0_1px_rgba(217,70,239,0.35)] transition"
                      style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
                    />
                    <span className="text-slate-400 self-center font-bold">×</span>
                    <input
                      type="number"
                      placeholder="Height (px)"
                      value={cropH}
                      onChange={handleCropHeightChange}
                      className="w-full !bg-black border border-slate-500/45 rounded-xl px-3 py-2.5 !text-white !caret-white placeholder:text-slate-300 text-sm outline-none focus:border-fuchsia-400/70 focus:shadow-[0_0_0_1px_rgba(217,70,239,0.35)] transition"
                      style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!cropW || !cropH || isProcessing}
                    onClick={handleApplyCropCreative}
                    className="w-full py-2.5 bg-linear-to-r from-fuchsia-600/30 to-purple-600/25 border border-fuchsia-300/40 hover:border-fuchsia-200/60 hover:bg-fuchsia-500/35 rounded-xl text-xs font-bold text-fuchsia-100 uppercase tracking-wider transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Apply Crop Creative
                  </motion.button>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Crops from center to match the exact width and height you enter.
                  </p>
                </motion.div>
              )}
            </div>

            {/* Right Panel — Preview Area */}
            <div className="p-6 space-y-6 bg-[#040815]/40">
              {/* Toggle */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCompareMode(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    !compareMode
                      ? "bg-cyan-600 text-slate-50 shadow-[0_0_18px_rgba(34,211,238,0.32)]"
                      : "bg-slate-900/60 text-slate-300 hover:text-cyan-200"
                  }`}
                >
                  <ZoomIn size={14} className="inline mr-2 mb-0.5" />
                  Live Preview
                </button>
                <button
                  onClick={() => setCompareMode(true)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    compareMode
                      ? "bg-cyan-600 text-slate-50 shadow-[0_0_18px_rgba(34,211,238,0.32)]"
                      : "bg-slate-900/60 text-slate-300 hover:text-cyan-200"
                  }`}
                >
                  Before / After
                </button>
                {isProcessing && (
                  <div className="flex items-center gap-2 text-cyan-300 text-sm ml-auto">
                    <Loader2 size={16} className="animate-spin" />
                    Processing...
                  </div>
                )}
              </div>

              {/* Preview Content */}
              {!compareMode ? (
                /* Single Preview */
                <motion.div
                  layout
                  className="relative rounded-xl border border-cyan-300/20 bg-[repeating-conic-gradient(rgba(34,211,238,0.04)_0%_25%,transparent_0%_50%)] bg-[length:20px_20px] overflow-hidden flex items-center justify-center min-h-[360px]"
                >
                  <motion.img
                    key={currentPreview}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    src={currentPreview}
                    alt="Preview"
                    className="max-w-full max-h-[500px] object-contain"
                  />
                  {/* Size badge */}
                  <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-1.5">
                    <p className="text-xs font-bold text-slate-100">{currentSize}</p>
                  </div>
                  {previewUrl && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-4 right-4 bg-green-600/90 backdrop-blur-sm rounded-lg px-3 py-1.5"
                    >
                      <p className="text-xs font-bold text-slate-100 flex items-center gap-1">
                        <Check size={12} /> Resized
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                /* Before / After Comparison */
                <div
                  className="relative rounded-xl border border-cyan-300/20 overflow-hidden min-h-[360px] cursor-ew-resize select-none"
                  onMouseMove={handleSliderMove}
                  onMouseDown={() => setIsDraggingSlider(true)}
                  onMouseUp={() => setIsDraggingSlider(false)}
                  onMouseLeave={() => setIsDraggingSlider(false)}
                >
                  {/* After (full) */}
                  <div className="w-full flex items-center justify-center bg-[repeating-conic-gradient(rgba(34,211,238,0.04)_0%_25%,transparent_0%_50%)] bg-[length:20px_20px] min-h-[360px]">
                    <img
                      src={currentPreview}
                      alt="After"
                      className="max-w-full max-h-[500px] object-contain"
                    />
                  </div>

                  {/* Before (clipped) */}
                  <div
                    className="absolute inset-0 flex items-center justify-center bg-[repeating-conic-gradient(rgba(34,211,238,0.06)_0%_25%,rgba(0,0,0,0.18)_0%_50%)] bg-[length:20px_20px] overflow-hidden"
                    style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                  >
                    <img
                      src={creative.url}
                      alt="Before"
                      className="max-w-full max-h-[500px] object-contain"
                    />
                  </div>

                  {/* Slider line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-cyan-200/90 shadow-lg shadow-cyan-300/30"
                    style={{ left: `${sliderPos}%` }}
                  >
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-cyan-100 shadow-xl shadow-cyan-300/40 flex items-center justify-center">
                      <ArrowRight size={12} className="text-gray-800 -rotate-180" />
                      <ArrowRight size={12} className="text-gray-800" />
                    </div>
                  </div>

                  {/* Labels */}
                  <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-cyan-300/20">
                    <p className="text-xs font-bold text-slate-100">Before: {creative.size}</p>
                  </div>
                  <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-cyan-300/20">
                    <p className="text-xs font-bold text-slate-100">After: {currentSize}</p>
                  </div>
                </div>
              )}

              {/* Dimension Info */}
              {previewUrl && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="bg-slate-900/60 border border-slate-500/30 rounded-xl p-4 text-center">
                    <p className="text-xs text-slate-400 mb-1">Original</p>
                    <p className="text-lg font-bold text-red-300">{creative.size}</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {creative.valid ? "Valid" : "Invalid"}
                    </p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-300/25 rounded-xl p-4 text-center">
                    <p className="text-xs text-slate-300 mb-1">New Size</p>
                    <p className="text-lg font-bold text-emerald-300">{previewSize}</p>
                    <p className="text-[11px] text-emerald-200 mt-1">Valid ✓</p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 flex items-center justify-between border-t border-cyan-300/20 bg-[#060b18]/85 backdrop-blur-xl px-8 py-4">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-slate-900/70 border border-slate-500/35 text-slate-300 font-semibold text-sm hover:bg-slate-800/80 hover:text-slate-100 hover:border-cyan-300/30 transition"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              disabled={!previewUrl || isProcessing}
              onClick={handleApply}
              className="px-8 py-2.5 rounded-xl bg-linear-to-r from-emerald-600 to-green-500 text-slate-50 font-bold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/45 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Check size={18} />
              Apply Changes
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
