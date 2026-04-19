"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TemplateRenderer from "./TemplateRenderer";
import { templates } from "../templates/newsTemplates";
import {
  UploadCloud,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Trash2,
  Edit2,
  Check,
  X,
  Download,
  Eye,
  Palette,
  Library,
  FileImage,
} from "lucide-react";

// 🎯 PROGRAMMATIC SIZES
const ALLOWED_SIZES = [
  "300x250",
  "728x90",
  "160x600",
  "300x600",
  "320x50",
  "970x250",
  "300x1050",
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function PreviewTool() {
  const [step, setStep] = useState(1);
  const [drag, setDrag] = useState(false);
  const [creatives, setCreatives] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("news");
  const [showSlotLabels, setShowSlotLabels] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const fileRef = useRef(null);

  // Rename
  const updateName = (index, value) => {
    const updated = [...creatives];
    updated[index].name = value;
    setCreatives(updated);
  };

  // Start editing
  const startEdit = (id, currentName) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  // Save edit
  const saveEdit = (id) => {
    updateName(creatives.findIndex(c => c.id === id), editingName);
    setEditingId(null);
  };

  // Remove creative
  const removeCreative = (id) => {
    setCreatives((prev) => prev.filter((c) => c.id !== id));
  };

  // Upload with loading state
  const handleFiles = (files) => {
    setIsLoading(true);
    Array.from(files).forEach((file) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          const size = `${img.width}x${img.height}`;

          setCreatives((prev) => [
            ...prev,
            {
              id: `${Date.now()}-${Math.random()}`,
              name: file.name.replace(/\.[^/.]+$/, ""),
              url: e.target.result,
              size,
              valid: ALLOWED_SIZES.includes(size),
              originalFile: file.name,
            },
          ]);
          setIsLoading(false);
        };

        img.src = e.target.result;
      };

      reader.readAsDataURL(file);
    });
  };

  const validCreatives = creatives.filter((c) => c.valid);
  const invalidCreatives = creatives.filter((c) => !c.valid);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/30 border-b border-white/10 px-10 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Adigator Creative Studio
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Professional creative preview for programmatic ads
            </p>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <motion.div
                key={s}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition ${
                  step === s
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/30"
                    : step > s
                    ? "bg-green-600 text-white"
                    : "bg-white/10 text-gray-500"
                }`}
              >
                {step > s ? "✓" : s}
              </motion.div>
            ))}
          </div>
        </div>
      </header>

      {/* PROGRESS BAR */}
      <div className="h-1 bg-white/5">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
          initial={{ width: "0%" }}
          animate={{ width: `${(step / 5) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-10 py-12">
        <AnimatePresence mode="wait">
          {/* STEP 1: UPLOAD */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-4xl font-bold text-white mb-2">
                  Step 1: Upload Creatives
                </h2>
                <p className="text-gray-400">
                  Drag and drop your ad creatives or click to browse. Supported sizes: {ALLOWED_SIZES.join(", ")}
                </p>
              </div>

              {/* UPLOAD AREA */}
              <motion.div
                className={`relative rounded-3xl border-2 border-dashed transition-all p-16 text-center cursor-pointer ${
                  drag
                    ? "border-purple-500 bg-purple-500/10 shadow-2xl shadow-purple-500/20"
                    : "border-white/20 bg-white/5 hover:border-purple-400 hover:bg-purple-500/5"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDrag(true);
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDrag(false);
                  handleFiles(e.dataTransfer.files);
                }}
                onClick={() => fileRef.current?.click()}
              >
                <motion.div
                  animate={{ scale: drag ? 1.1 : 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <UploadCloud
                    size={64}
                    className="mx-auto mb-4 text-purple-400"
                  />
                </motion.div>

                <h3 className="text-3xl font-bold text-white mb-2">
                  {drag ? "Drop files here" : "Upload Creatives"}
                </h3>
                <p className="text-gray-400 mb-6">
                  or click to browse your computer
                </p>

                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    handleFiles(e.target.files);
                    e.target.value = "";
                  }}
                />

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    fileRef.current?.click();
                  }}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition inline-block"
                >
                  Browse Files
                </motion.button>
              </motion.div>

              {/* UPLOADED CREATIVES PREVIEW */}
              {creatives.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <h3 className="text-xl font-semibold text-white">
                    Uploaded ({creatives.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {creatives.map((creative) => (
                      <motion.div
                        key={creative.id}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className={`relative group rounded-xl overflow-hidden border-2 transition ${
                          creative.valid
                            ? "border-green-500/50 bg-green-500/10"
                            : "border-red-500/50 bg-red-500/10"
                        }`}
                      >
                        <img
                          src={creative.url}
                          alt={creative.name}
                          className="w-full h-32 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <Trash2
                            size={20}
                            className="text-red-400 cursor-pointer"
                            onClick={() => removeCreative(creative.id)}
                          />
                        </div>
                        <div className="p-2 bg-black/40">
                          <p className="text-xs font-semibold text-white truncate">
                            {creative.name}
                          </p>
                          <p
                            className={`text-xs mt-1 font-bold ${
                              creative.valid
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {creative.size}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* LOADING STATE */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-400 mt-4">Processing images...</p>
                </motion.div>
              )}

              {/* ACTION BUTTONS */}
              {creatives.length > 0 && (
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setCreatives([])}
                    className="flex-1 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition"
                  >
                    Clear All
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setStep(2)}
                    className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/30 transition"
                  >
                    Next: Validation →
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 2: VALIDATION */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-4xl font-bold text-white mb-2">
                  Step 2: Validation
                </h2>
                <p className="text-gray-400">
                  Check which creatives meet programmatic ad standards
                </p>
              </div>

              {/* STATS */}
              <div className="grid grid-cols-3 gap-4">
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-4 text-center"
                >
                  <p className="text-3xl font-bold text-blue-400">
                    {creatives.length}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">Total Uploaded</p>
                </motion.div>
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-4 text-center"
                >
                  <p className="text-3xl font-bold text-green-400">
                    {validCreatives.length}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">Valid</p>
                </motion.div>
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 rounded-xl p-4 text-center"
                >
                  <p className="text-3xl font-bold text-red-400">
                    {invalidCreatives.length}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">Invalid</p>
                </motion.div>
              </div>

              {/* VALID CREATIVES */}
              {validCreatives.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={24} className="text-green-500" />
                    <h3 className="text-xl font-semibold text-white">
                      Valid Creatives ({validCreatives.length})
                    </h3>
                  </div>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                  >
                    {validCreatives.map((creative) => (
                      <motion.div
                        key={creative.id}
                        variants={itemVariants}
                        className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/30 rounded-xl overflow-hidden hover:border-green-500/60 transition group"
                      >
                        <div className="relative h-40 bg-black/20 overflow-hidden">
                          <img
                            src={creative.url}
                            alt={creative.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                          <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">
                            ✓ Valid
                          </div>
                        </div>
                        <div className="p-3">
                          <p className="text-xs font-semibold text-green-400 mb-2">
                            {creative.size}
                          </p>
                          <p className="text-sm text-gray-300 break-words">
                            {creative.name}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </motion.div>
              )}

              {/* INVALID CREATIVES */}
              {invalidCreatives.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <XCircle size={24} className="text-red-500" />
                    <h3 className="text-xl font-semibold text-white">
                      Invalid Creatives ({invalidCreatives.length})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {invalidCreatives.map((creative) => (
                      <motion.div
                        key={creative.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-gradient-to-r from-red-500/10 to-red-600/10 border-2 border-red-500/30 rounded-xl p-4 flex items-center justify-between group hover:border-red-500/60 transition"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-red-400 mb-1">
                            {creative.name}
                          </p>
                          <p className="text-xs text-red-300">
                            Size: {creative.size} (Not supported)
                          </p>
                        </div>
                        <button
                          onClick={() => removeCreative(creative.id)}
                          className="ml-4 p-2 hover:bg-red-500/20 rounded transition text-red-400"
                        >
                          <Trash2 size={18} />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 bg-white/5 border border-white/10 rounded p-3">
                    <AlertCircle className="inline mr-2 mb-1" size={16} />
                    Supported sizes: {ALLOWED_SIZES.join(", ")}
                  </p>
                </motion.div>
              )}

              {/* ACTION BUTTONS */}
              <div className="flex gap-4 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition"
                >
                  ← Back
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(3)}
                  disabled={validCreatives.length === 0}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next: Creative Library →
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: CREATIVE LIBRARY */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-4xl font-bold text-white mb-2">
                  Step 3: Creative Library
                </h2>
                <p className="text-gray-400">
                  Review and organize your valid creatives
                </p>
              </div>

              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2 md:grid-cols-4 gap-6"
              >
                {validCreatives.map((creative) => (
                  <motion.div
                    key={creative.id}
                    variants={itemVariants}
                    layout
                    className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-2 border-purple-500/30 rounded-xl overflow-hidden hover:border-purple-500/60 transition group"
                  >
                    {/* IMAGE */}
                    <div className="relative h-48 bg-black/20 overflow-hidden">
                      <img
                        src={creative.url}
                        alt={creative.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                      <div className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold">
                        {creative.size}
                      </div>
                    </div>

                    {/* CONTENT */}
                    <div className="p-4 space-y-3">
                      {/* NAME EDIT */}
                      {editingId === creative.id ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="flex-1 bg-white/10 border border-white/20 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-purple-500"
                            autoFocus
                          />
                          <button
                            onClick={() => saveEdit(creative.id)}
                            className="p-1 hover:bg-green-500/20 rounded transition text-green-400"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 hover:bg-red-500/20 rounded transition text-red-400"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-white break-words flex-1">
                            {creative.name}
                          </p>
                          <button
                            onClick={() =>
                              startEdit(creative.id, creative.name)
                            }
                            className="p-1 hover:bg-purple-500/20 rounded transition text-purple-400 flex-shrink-0"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      )}

                      {/* METADATA */}
                      <div className="text-xs text-gray-400 space-y-1">
                        <p className="flex justify-between">
                          <span>Original:</span>
                          <span className="text-gray-300">
                            {creative.originalFile}
                          </span>
                        </p>
                      </div>

                      {/* REMOVE BUTTON */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => removeCreative(creative.id)}
                        className="w-full py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded hover:bg-red-500/30 transition text-sm font-semibold flex items-center justify-center gap-2"
                      >
                        <Trash2 size={16} />
                        Remove
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-4 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition"
                >
                  ← Back
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(4)}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition"
                >
                  Next: Select Template →
                </motion.button>
              </div>
            </motion.div>
          )}

          // ...existing code...

          {/* STEP 4: TEMPLATE SELECTION */}
          {step === 4 && (
            <motion.div
              key="step-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-4xl font-bold text-white mb-2">
                  Step 4: Select Template
                </h2>
                <p className="text-gray-400">
                  Choose a website template to preview your creatives in a realistic context
                </p>
              </div>

              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-3 gap-6"
              >
                {["news", "gaming", "ecommerce"].map((type, idx) => (
                  <motion.button
                    key={type}
                    variants={itemVariants}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedTemplate(type)}
                    className={`p-6 rounded-xl border-2 transition text-center ${
                      selectedTemplate === type
                        ? "border-purple-600 bg-purple-500/20"
                        : "border-white/20 bg-white/5 hover:border-white/40"
                    }`}
                  >
                    <div className="text-6xl mb-4">
                      {type === "news" ? "📰" : type === "gaming" ? "🎮" : "🛍️"}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 capitalize">
                      {type}
                    </h3>
                    <p className="text-xs text-gray-400 mb-3">
                      {type === "news" ? "Modern news portal" : type === "gaming" ? "Gaming website" : "E-commerce page"}
                    </p>
                    <p className="text-sm font-semibold text-purple-400">
                      Multiple ad slots
                    </p>
                  </motion.button>
                ))}
              </motion.div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-4 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition"
                >
                  ← Back
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(5)}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition"
                >
                  Next: Preview & Export →
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: PREVIEW & EXPORT */}
          {step === 5 && (
            <motion.div
              key="step-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-4xl font-bold text-white mb-2">
                    Step 5: Preview & Export
                  </h2>
                  <p className="text-gray-400">
                    See your creatives in real website contexts
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.print()}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/30 transition flex items-center gap-2"
                >
                  <Download size={20} />
                  Export PPT
                </motion.button>
              </div>

              {/* PREVIEW CONTROLS */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-3 cursor-pointer bg-white/5 border border-white/20 rounded-lg px-4 py-3 hover:bg-white/10 transition">
                  <input
                    type="checkbox"
                    checked={showSlotLabels}
                    onChange={(e) => setShowSlotLabels(e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span className="text-sm font-medium text-white">
                    Show slot IDs
                  </span>
                </label>
              </div>

              {/* PREVIEW */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={selectedTemplate}
                className="bg-gradient-to-br from-white/5 to-white/10 border border-white/20 p-8 rounded-xl overflow-x-auto"
              >
                <div className="inline-block">
                  {templates.map((tpl, i) => {
                    const matchedCreative = validCreatives.find(
                      (c) => c.size === tpl.size
                    );

                    return (
                      <div key={i} className="mb-8">
                        <h3 className="text-white mb-4 text-center">
                          Slide {i + 1} — {tpl.size}
                        </h3>
                        <TemplateRenderer
                          template={tpl}
                          creative={matchedCreative}
                          showSlotLabels={showSlotLabels}
                        />
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* STATS */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-blue-400">
                    {validCreatives.length}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">Creatives Loaded</p>
                </div>
                <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-green-400">
                    {templates.length}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">Ad Slots</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-purple-400">
                    {Math.round((validCreatives.length / templates.length) * 100)}%
                  </p>
                  <p className="text-xs text-gray-400 mt-2">Coverage</p>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-4 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(4)}
                  className="flex-1 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition"
                >
                  ← Back
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => window.print()}
                  className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/30 transition flex items-center justify-center gap-2"
                >
                  <Download size={20} />
                  Download PPT
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}