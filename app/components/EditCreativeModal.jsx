"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useImageEditor } from "../hooks/useImageEditor";
import {
  X, Maximize2, Crop, Wand2, Undo2,
  Check, Star, ArrowRight, Loader2, ZoomIn,
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
    handleResize,
    handleAutoFit,
    handleUndo,
    reset,
    suggestBestSizes,
    ALLOWED_SIZES,
  } = useImageEditor();

  const [selectedSize, setSelectedSize] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [compareMode, setCompareMode] = useState(false);
  const [sliderPos, setSliderPos] = useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [customW, setCustomW] = useState("");
  const [customH, setCustomH] = useState("");

  // Parse creative's original dimensions
  const [origW, origH] = creative.size.split("x").map(Number);

  useEffect(() => {
    reset();
    const ranked = suggestBestSizes(origW, origH);
    setSuggestions(ranked);
    if (ranked.length > 0) {
      setSelectedSize(ranked[0]);
    }
  }, [creative.id, origW, origH, reset, suggestBestSizes]);

  const handleApply = useCallback(() => {
    if (!previewUrl || !previewSize) return;
    onApply(creative.id, {
      url: previewUrl,
      size: previewSize,
      valid: true,
    });
    onClose();
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
          className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-[#1a1035] to-slate-900 shadow-2xl shadow-purple-500/10"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-xl px-8 py-5">
            <div>
              <h2 className="text-2xl font-bold text-white">Edit Creative</h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {creative.name} — Current: {creative.size}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition text-gray-400 hover:text-white"
            >
              <X size={22} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-0">
            {/* Left Panel — Size Selection */}
            <div className="border-r border-white/10 p-6 space-y-6">
              {/* Current Size */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  Current Size
                </p>
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                    <span className="text-red-400 text-xs font-bold">
                      {creative.valid ? "✓" : "✗"}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">{creative.size}</p>
                    <p className="text-xs text-gray-500">
                      {creative.valid ? "Valid size" : "Not supported"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Target Sizes */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                  Select Target Size
                </p>
                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                  {suggestions.map((size, idx) => (
                    <motion.button
                      key={size.label}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedSize(size)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                        selectedSize?.label === size.label
                          ? "border-purple-500 bg-purple-500/15 shadow-lg shadow-purple-500/10"
                          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-semibold text-sm">
                            {size.label}
                          </span>
                          {idx === 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase">
                              <Star size={10} fill="currentColor" /> Best
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Match: {size.score}%
                        </p>
                      </div>
                      <div
                        className="rounded-md border border-white/10 bg-white/5"
                        style={{
                          width: Math.max(24, size.w / 20),
                          height: Math.max(12, size.h / 20),
                          maxWidth: 60,
                          maxHeight: 40,
                        }}
                      />
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Custom Size */}
              <div className="pt-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                  Custom Size
                </p>
                <div className="flex gap-2 mb-3">
                  <input
                    type="number"
                    placeholder="W"
                    value={customW}
                    onChange={(e) => setCustomW(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-purple-500/50 focus:bg-purple-500/5 transition"
                  />
                  <span className="text-gray-500 self-center font-bold">×</span>
                  <input
                    type="number"
                    placeholder="H"
                    value={customH}
                    onChange={(e) => setCustomH(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-purple-500/50 focus:bg-purple-500/5 transition"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!customW || !customH || isProcessing}
                  onClick={() => {
                    const w = parseInt(customW);
                    const h = parseInt(customH);
                    setSelectedSize({ label: `${w}x${h}`, w, h, score: 100 });
                    handleResize(creative.url, creative.size, w, h);
                  }}
                  className="w-full py-2.5 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-xl text-xs font-bold text-white uppercase tracking-wider transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Apply Custom Size
                </motion.button>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  Actions
                </p>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={!selectedSize || isProcessing}
                  onClick={() =>
                    handleResize(creative.url, creative.size, selectedSize.w, selectedSize.h)
                  }
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600/80 to-blue-500/80 border border-blue-400/20 text-white font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Maximize2 size={18} />
                  <span className="flex-1 text-left">Resize to Fit</span>
                  <ArrowRight size={16} className="opacity-50" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={!selectedSize || isProcessing}
                  onClick={() =>
                    handleAutoFit(creative.url, creative.size, selectedSize.w, selectedSize.h)
                  }
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600/80 to-pink-500/80 border border-purple-400/20 text-white font-semibold text-sm hover:shadow-lg hover:shadow-purple-500/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Crop size={18} />
                  <span className="flex-1 text-left">Smart Crop (Center)</span>
                  <ArrowRight size={16} className="opacity-50" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={!selectedSize || isProcessing}
                  onClick={() => {
                    const best = suggestions[0];
                    if (best) handleAutoFit(creative.url, creative.size, best.w, best.h);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-600/80 to-orange-500/80 border border-amber-400/20 text-white font-semibold text-sm hover:shadow-lg hover:shadow-amber-500/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Wand2 size={18} />
                  <span className="flex-1 text-left">Auto-Fix (Best Match)</span>
                  <ArrowRight size={16} className="opacity-50" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={undoCount === 0 || isProcessing}
                  onClick={handleUndo}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-semibold text-sm hover:bg-white/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Undo2 size={18} />
                  <span className="flex-1 text-left">
                    Undo {undoCount > 0 && `(${undoCount})`}
                  </span>
                </motion.button>
              </div>
            </div>

            {/* Right Panel — Preview Area */}
            <div className="p-6 space-y-6">
              {/* Toggle */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCompareMode(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    !compareMode
                      ? "bg-purple-600 text-white"
                      : "bg-white/5 text-gray-400 hover:text-white"
                  }`}
                >
                  <ZoomIn size={14} className="inline mr-2 mb-0.5" />
                  Live Preview
                </button>
                <button
                  onClick={() => setCompareMode(true)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    compareMode
                      ? "bg-purple-600 text-white"
                      : "bg-white/5 text-gray-400 hover:text-white"
                  }`}
                >
                  Before / After
                </button>
                {isProcessing && (
                  <div className="flex items-center gap-2 text-purple-400 text-sm ml-auto">
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
                  className="relative rounded-xl border border-white/10 bg-[repeating-conic-gradient(rgba(255,255,255,0.03)_0%_25%,transparent_0%_50%)] bg-[length:20px_20px] overflow-hidden flex items-center justify-center min-h-[360px]"
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
                    <p className="text-xs font-bold text-white">{currentSize}</p>
                  </div>
                  {previewUrl && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-4 right-4 bg-green-600/90 backdrop-blur-sm rounded-lg px-3 py-1.5"
                    >
                      <p className="text-xs font-bold text-white flex items-center gap-1">
                        <Check size={12} /> Resized
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                /* Before / After Comparison */
                <div
                  className="relative rounded-xl border border-white/10 overflow-hidden min-h-[360px] cursor-ew-resize select-none"
                  onMouseMove={handleSliderMove}
                  onMouseDown={() => setIsDraggingSlider(true)}
                  onMouseUp={() => setIsDraggingSlider(false)}
                  onMouseLeave={() => setIsDraggingSlider(false)}
                >
                  {/* After (full) */}
                  <div className="w-full flex items-center justify-center bg-[repeating-conic-gradient(rgba(255,255,255,0.03)_0%_25%,transparent_0%_50%)] bg-[length:20px_20px] min-h-[360px]">
                    <img
                      src={currentPreview}
                      alt="After"
                      className="max-w-full max-h-[500px] object-contain"
                    />
                  </div>

                  {/* Before (clipped) */}
                  <div
                    className="absolute inset-0 flex items-center justify-center bg-[repeating-conic-gradient(rgba(255,255,255,0.05)_0%_25%,rgba(0,0,0,0.1)_0%_50%)] bg-[length:20px_20px] overflow-hidden"
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
                    className="absolute top-0 bottom-0 w-0.5 bg-white/80 shadow-lg shadow-white/20"
                    style={{ left: `${sliderPos}%` }}
                  >
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-xl flex items-center justify-center">
                      <ArrowRight size={12} className="text-gray-800 -rotate-180" />
                      <ArrowRight size={12} className="text-gray-800" />
                    </div>
                  </div>

                  {/* Labels */}
                  <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1.5">
                    <p className="text-xs font-bold text-white">Before: {creative.size}</p>
                  </div>
                  <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1.5">
                    <p className="text-xs font-bold text-white">After: {currentSize}</p>
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
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">Original</p>
                    <p className="text-lg font-bold text-red-400">{creative.size}</p>
                    <p className="text-[11px] text-gray-600 mt-1">
                      {creative.valid ? "Valid" : "Invalid"}
                    </p>
                  </div>
                  <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">New Size</p>
                    <p className="text-lg font-bold text-green-400">{previewSize}</p>
                    <p className="text-[11px] text-green-600 mt-1">Valid ✓</p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 flex items-center justify-between border-t border-white/10 bg-black/40 backdrop-blur-xl px-8 py-4">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 font-semibold text-sm hover:bg-white/10 hover:text-white transition"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              disabled={!previewUrl || isProcessing}
              onClick={handleApply}
              className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold text-sm shadow-lg shadow-green-500/20 hover:shadow-green-500/40 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
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
