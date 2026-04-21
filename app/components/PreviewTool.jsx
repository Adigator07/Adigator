"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TemplateRenderer from "./TemplateRenderer";
import SlidePreview from "./SlidePreview";
import EditCreativeModal from "./EditCreativeModal";
import CreativeCard from "./CreativeCard";
import { supabase } from "../lib/supabase";
import { suggestBestSizes, autoFitImage } from "../hooks/useImageEditor";
import {
  UploadCloud, CheckCircle2, XCircle, AlertCircle,
  Trash2, Edit2, Check, X, Download, Wand2,
} from "lucide-react";

const ALLOWED_SIZES = [
  "300x250", "728x90", "160x600", "300x600",
  "320x50", "970x250", "300x1050",
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function PreviewTool() {
  const [step, setStep] = useState(1);
  const [drag, setDrag] = useState(false);
  const [creatives, setCreatives] = useState([]);
  const [showSlotLabels, setShowSlotLabels] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editModalCreative, setEditModalCreative] = useState(null);
  const [originalBackups, setOriginalBackups] = useState({});
  const fileRef = useRef(null);
  const userRef = useRef(null);

  // Cache user to avoid multiple auth calls
  const getUser = useCallback(async () => {
    if (userRef.current) return userRef.current;
    const { data: { session } } = await supabase.auth.getSession();
    userRef.current = session?.user || null;
    return userRef.current;
  }, []);

  useEffect(() => {
    const savedStep = localStorage.getItem("adigator_step");
    if (savedStep) setStep(parseInt(savedStep));
  }, []);

  useEffect(() => {
    localStorage.setItem("adigator_step", step.toString());
  }, [step]);


  // Save creative metadata to Supabase (no image URL)
  const saveToSupabase = async (creative) => {
    try {
      const user = await getUser();
      if (!user) return;
      await supabase.from("creatives").upsert({
        id: creative.id,
        user_id: user.id,
        name: creative.name,
        size: creative.size,
        valid: creative.valid,
        previewed: false,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error("saveToSupabase error:", e);
    }
  };

  const updateName = (index, value) => {
    const updated = [...creatives];
    updated[index].name = value;
    setCreatives(updated);
  };

  const startEdit = (id, currentName) => {
    setEditingId(id);
    setEditingName(currentName);
  };

  const saveEdit = (id) => {
    updateName(creatives.findIndex((c) => c.id === id), editingName);
    setEditingId(null);
  };

  const removeCreative = async (id) => {
    setCreatives((prev) => prev.filter((c) => c.id !== id));
    try {
      const user = await getUser();
      if (user) {
        await supabase.from("creatives").delete().eq("id", id).eq("user_id", user.id);
      }
    } catch (e) {
      console.error("removeCreative error:", e);
    }
  };

  // Update a creative after editing (resize/crop)
  const handleCreativeUpdate = useCallback((id, updates) => {
    setCreatives((prev) => {
      return prev.map((c) => {
        if (c.id !== id) return c;
        // Store original backup before first edit
        if (!originalBackups[id]) {
          setOriginalBackups((b) => ({ ...b, [id]: { ...c } }));
        }
        const updated = { ...c, ...updates };
        saveToSupabase(updated);
        return updated;
      });
    });
  }, [originalBackups, saveToSupabase]);

  // One-click auto-fix: suggest best size → auto-fit → update
  const handleAutoFix = useCallback(async (id) => {
    const creative = creatives.find((c) => c.id === id);
    if (!creative) return;
    const [origW, origH] = creative.size.split("x").map(Number);
    const suggestions = suggestBestSizes(origW, origH);
    if (suggestions.length === 0) return;
    const best = suggestions[0];
    try {
      const newUrl = await autoFitImage(creative.url, best.w, best.h);
      handleCreativeUpdate(id, {
        url: newUrl,
        size: best.label,
        valid: true,
      });
    } catch (e) {
      console.error("handleAutoFix error:", e);
    }
  }, [creatives, handleCreativeUpdate]);

  const handleFiles = (files) => {
    setIsLoading(true);
    let processed = 0;
    const total = files.length;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const size = `${img.width}x${img.height}`;
          const creative = {
            id: `${Date.now()}-${Math.random()}`,
            name: file.name.replace(/\.[^/.]+$/, ""),
            url: e.target.result,
            size,
            valid: ALLOWED_SIZES.includes(size),
            originalFile: file.name,
          };
          setCreatives((prev) => [...prev, creative]);
          saveToSupabase(creative);
          processed++;
          if (processed === total) setIsLoading(false);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const validCreatives = creatives.filter((c) => c.valid);
  const invalidCreatives = creatives.filter((c) => !c.valid);


  const handlePreview = async () => {
    try {
      const user = await getUser();
      if (user && validCreatives.length > 0) {
        for (const c of validCreatives) {
          await supabase.from("creatives").update({ previewed: true }).eq("id", c.id).eq("user_id", user.id);
        }
      }
    } catch (e) {
      console.error("handlePreview error:", e);
    }
    setStep(5);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/30 border-b border-white/10 px-10 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Adigator Creative Studio
            </h1>
            <p className="text-sm text-gray-400 mt-1">Professional creative preview for programmatic ads</p>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 5].map((s) => (
              <motion.div key={s}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition ${step === s ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/30"
                    : step > s ? "bg-green-600 text-white"
                      : "bg-white/10 text-gray-500"
                  }`}
              >
                {step > s ? "✓" : s === 5 ? 4 : s}
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

      <main className="max-w-7xl mx-auto px-10 py-12">
        <AnimatePresence mode="wait">

          {/* STEP 1: UPLOAD */}
          {step === 1 && (
            <motion.div key="step-1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              <div>
                <h2 className="text-4xl font-bold text-white mb-2">Step 1: Upload Creatives</h2>
                <p className="text-gray-400">Supported sizes: {ALLOWED_SIZES.join(", ")}</p>
              </div>

              <motion.div
                className={`relative rounded-3xl border-2 border-dashed transition-all p-16 text-center cursor-pointer ${drag ? "border-purple-500 bg-purple-500/10" : "border-white/20 bg-white/5 hover:border-purple-400"
                  }`}
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
                onClick={() => fileRef.current?.click()}
              >
                <UploadCloud size={64} className="mx-auto mb-4 text-purple-400" />
                <h3 className="text-3xl font-bold text-white mb-2">{drag ? "Drop files here" : "Upload Creatives"}</h3>
                <p className="text-gray-400 mb-6">or click to browse your computer</p>
                <input ref={fileRef} type="file" multiple hidden accept="image/*" onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg transition inline-block"
                >Browse Files</motion.button>
              </motion.div>

              {creatives.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <h3 className="text-xl font-semibold text-white">Uploaded ({creatives.length})</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {creatives.map((creative) => (
                      <CreativeCard
                        key={creative.id}
                        creative={creative}
                        compact
                        onEdit={(c) => setEditModalCreative(c)}
                        onAutoFix={handleAutoFix}
                        onRemove={removeCreative}
                        showFixButton={!creative.valid}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {isLoading && (
                <div className="text-center py-8">
                  <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-400 mt-4">Processing images...</p>
                </div>
              )}

              {creatives.length > 0 && (
                <div className="flex gap-4 pt-4">
                  <button onClick={() => { setCreatives([]); setStep(1); }}
                    className="flex-1 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition">
                    Clear All
                  </button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setStep(2)}
                    className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold transition">
                    Next: Validation →
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 2: VALIDATION */}
          {step === 2 && (
            <motion.div key="step-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              <div>
                <h2 className="text-4xl font-bold text-white mb-2">Step 2: Validation</h2>
                <p className="text-gray-400">Check which creatives meet programmatic ad standards</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-blue-400">{creatives.length}</p>
                  <p className="text-sm text-gray-400 mt-1">Total Uploaded</p>
                </div>
                <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-green-400">{validCreatives.length}</p>
                  <p className="text-sm text-gray-400 mt-1">Valid</p>
                </div>
                <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold text-red-400">{invalidCreatives.length}</p>
                  <p className="text-sm text-gray-400 mt-1">Invalid</p>
                </div>
              </div>

              {validCreatives.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={24} className="text-green-500" />
                    <h3 className="text-xl font-semibold text-white">Valid Creatives ({validCreatives.length})</h3>
                  </div>
                  <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {validCreatives.map((creative) => (
                      <CreativeCard
                        key={creative.id}
                        creative={creative}
                        onEdit={(c) => setEditModalCreative(c)}
                        onRemove={removeCreative}
                      />
                    ))}
                  </motion.div>
                </div>
              )}

              {invalidCreatives.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <XCircle size={24} className="text-red-500" />
                    <h3 className="text-xl font-semibold text-white">Invalid Creatives ({invalidCreatives.length})</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {invalidCreatives.map((creative) => (
                      <CreativeCard
                        key={creative.id}
                        creative={creative}
                        onEdit={(c) => setEditModalCreative(c)}
                        onAutoFix={handleAutoFix}
                        onRemove={removeCreative}
                        showFixButton
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 bg-white/5 border border-white/10 rounded p-3">
                    <AlertCircle className="inline mr-2 mb-1" size={16} />
                    Supported sizes: {ALLOWED_SIZES.join(", ")}
                  </p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition">← Back</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setStep(3)}
                  disabled={validCreatives.length === 0}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition">
                  Next: Creative Library →
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: CREATIVE LIBRARY */}
          {step === 3 && (
            <motion.div key="step-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              <div>
                <h2 className="text-4xl font-bold text-white mb-2">Step 3: Creative Library</h2>
                <p className="text-gray-400">Review and organize your valid creatives</p>
              </div>

              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {validCreatives.map((creative) => (
                  <CreativeCard
                    key={creative.id}
                    creative={creative}
                    onEdit={(c) => setEditModalCreative(c)}
                    onRemove={removeCreative}
                  />
                ))}
              </motion.div>

              <div className="flex gap-4 pt-4">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setStep(2)}
                  className="flex-1 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition">← Back</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setStep(5)}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold transition">
                  Next: Generate Dynamic Layout →
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: PREVIEW & EXPORT */}
          {step === 5 && (
            <motion.div key="step-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-4xl font-bold text-white mb-2">Step 5: Preview & Export</h2>
                  <p className="text-gray-400">See your creatives in real website contexts</p>
                </div>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => window.print()}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold flex items-center gap-2">
                  <Download size={20} /> Export PPT
                </motion.button>
              </div>

              <label className="flex items-center gap-3 cursor-pointer bg-white/5 border border-white/20 rounded-lg px-4 py-3 hover:bg-white/10 transition w-fit">
                <input type="checkbox" checked={showSlotLabels} onChange={(e) => setShowSlotLabels(e.target.checked)} className="w-4 h-4 cursor-pointer" />
                <span className="text-sm font-medium text-white">Show slot IDs</span>
              </label>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <SlidePreview
                  validCreatives={validCreatives}
                  showSlotLabels={showSlotLabels}
                />
              </motion.div>



              <div className="flex gap-4 pt-4">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setStep(3)}
                  className="flex-1 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition">← Back</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => window.print()}
                  className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2">
                  <Download size={20} /> Download PPT
                </motion.button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Edit Creative Modal */}
      {editModalCreative && (
        <EditCreativeModal
          creative={editModalCreative}
          onApply={handleCreativeUpdate}
          onClose={() => setEditModalCreative(null)}
        />
      )}
    </div>
  );
}