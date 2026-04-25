"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SlidePreview from "./SlidePreview";
import EditCreativeModal from "./EditCreativeModal";
import CreativeCard from "./CreativeCard";
import { supabase } from "../lib/supabase";
import { analyzeCreativeLocal } from "../lib/localAnalyzer";
// exportToPptx is loaded dynamically (browser-only) to avoid SSR issues with pptxgenjs
import {
  UploadCloud, CheckCircle2, XCircle, AlertCircle,
  Download, LayoutGrid, Square, CheckSquare,
  Newspaper, ShoppingCart, Coffee, Activity, Laptop, Briefcase, GraduationCap, Gamepad2, Film,
} from "lucide-react";

// ── Toast Component ──────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl text-sm font-medium text-white ${
              t.type === "success" ? "bg-green-900/80 border-green-500/40" :
              t.type === "error"   ? "bg-red-900/80 border-red-500/40" :
                                     "bg-slate-900/80 border-white/20"
            }`}
          >
            <span>{t.type === "success" ? "✅" : t.type === "error" ? "❌" : "⏳"}</span>
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

const TEMPLATES = [
  { id: "newspaper", name: "Newspaper", icon: Newspaper, desc: "Modern news portal", slots: 7 },
  { id: "ecommerce", name: "Ecommerce", icon: ShoppingCart, desc: "Online storefront", slots: 7 },
  { id: "food", name: "Food & Recipe", icon: Coffee, desc: "Culinary blog", slots: 6 },
  { id: "health", name: "Health", icon: Activity, desc: "Medical & wellness", slots: 5 },
  { id: "technology", name: "Technology", icon: Laptop, desc: "Tech review site", slots: 7 },
  { id: "business", name: "Business", icon: Briefcase, desc: "Corporate dashboard", slots: 6 },
  { id: "education", name: "Education", icon: GraduationCap, desc: "Online learning", slots: 5 },
  { id: "gaming", name: "Gaming", icon: Gamepad2, desc: "Esports & streaming", slots: 7 },
  { id: "entertainment", name: "Entertainment", icon: Film, desc: "Movie & media portal", slots: 6 },
];

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
  const [selectedTemplate, setSelectedTemplate] = useState("newspaper");
  const [viewMode, setViewMode] = useState("multiple");
  const [drag, setDrag] = useState(false);
  const [creatives, setCreatives] = useState([]);
  const [showSlotLabels, setShowSlotLabels] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [editModalCreative, setEditModalCreative] = useState(null);
  const [originalBackups, setOriginalBackups] = useState({});
  const [toasts, setToasts] = useState([]);
  // AI analysis state
  const [campaignGoal, setCampaignGoal] = useState(null); // 'awareness'|'consideration'|'conversion'
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState(null);
  const fileRef = useRef(null);
  const userRef = useRef(null);

  const addToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  // Download a creative as a file
  const downloadCreative = useCallback((creative) => {
    if (!creative.url) return;
    const a = document.createElement("a");
    a.href = creative.url;
    a.download = `${creative.name || "creative"}.${creative.url.startsWith("data:image/png") ? "png" : creative.url.startsWith("data:image/gif") ? "gif" : "jpg"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    addToast(`Downloaded: ${creative.name}`, "success");
  }, [addToast]);

  // Call Local AI analysis for all valid creatives
  const runAnalysis = useCallback(async () => {
    const validCr = creatives.filter((c) => c.valid);
    if (validCr.length === 0) { addToast("No valid creatives to analyze.", "error"); return; }
    if (!campaignGoal) { addToast("Please select a campaign goal first.", "error"); return; }
    setAnalysisLoading(true);
    setAnalysisResult(null);
    setShowAnalysis(true);
    try {
      const results = [];
      for (const creative of validCr) {
        const data = await analyzeCreativeLocal(creative.url, campaignGoal);
        results.push({ creative, data });
      }
      setAnalysisResult(results);
      addToast("Local AI analysis complete ✨", "success");
    } catch (err) {
      addToast(err.message || "Analysis failed.", "error");
    } finally {
      setAnalysisLoading(false);
    }
  }, [creatives, campaignGoal, addToast]);

  const handleExportPptx = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);
    addToast("Generating PPTX...", "info");
    try {
      // Dynamic import keeps pptxgenjs out of the SSR bundle
      const { exportToPptx } = await import("../lib/exportPptx");
      const templateName = TEMPLATES.find((t) => t.id === selectedTemplate)?.name || "Template";
      // Derive valid creatives inline to avoid TDZ (const validCreatives is declared later)
      const validCr = creatives.filter((c) => c.valid);
      const filename = await exportToPptx(validCr, viewMode, templateName);
      addToast(`Downloaded: ${filename}`, "success");
    } catch (err) {
      console.error("Export error:", err);
      addToast("Export failed. Please try again.", "error");
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, creatives, viewMode, selectedTemplate, addToast]);

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

  const validCreatives = creatives.filter((c) => c && c.valid && (c.url || c.text || c.image || c.title));
  const invalidCreatives = creatives.filter((c) => !c.valid || !(c.url || c.text || c.image || c.title));


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
    setStep(6);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-black/30 border-b border-white/10 px-10 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Adigator Creative Studio
            </h1>
          </div>
        </div>
      </header>

      {/* PROGRESS BAR */}
      <div className="h-1 bg-white/5">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
          initial={{ width: "0%" }}
          animate={{ width: `${(step / 6) * 100}%` }}
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
                        onRemove={removeCreative}
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
                    Next: Edit Creative →
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 2: VALIDATION */}
          {step === 2 && (
            <motion.div key="step-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              <div>
                <h2 className="text-4xl font-bold text-white mb-2">Step 2: Edit Creative</h2>
                <p className="text-gray-400">Review and edit your creatives to meet programmatic ad standards</p>
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
                      <div key={creative.id} className="flex flex-col gap-1">
                        <CreativeCard creative={creative} onRemove={removeCreative} />
                        {/* Rename row */}
                        {editingId === creative.id ? (
                          <div className="flex gap-1">
                            <input autoFocus value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") saveEdit(creative.id); if (e.key === "Escape") setEditingId(null); }}
                              className="flex-1 min-w-0 bg-white/10 border border-purple-500 rounded-lg px-2 py-1 text-xs text-white outline-none" />
                            <button onClick={() => saveEdit(creative.id)} className="px-2 py-1 bg-purple-600 rounded-lg text-xs text-white">✓</button>
                            <button onClick={() => setEditingId(null)} className="px-2 py-1 bg-white/10 rounded-lg text-xs text-white">✕</button>
                          </div>
                        ) : (
                          <button onClick={() => startEdit(creative.id, creative.name)}
                            className="text-left flex items-center gap-1 group/rn">
                            <span className="text-xs text-gray-400 truncate group-hover/rn:text-purple-300 transition">{creative.name}</span>
                            <span className="text-[10px] text-gray-600 group-hover/rn:text-purple-400">✏️</span>
                          </button>
                        )}
                        {/* Download button */}
                        <button onClick={() => downloadCreative(creative)}
                          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-green-400 transition bg-white/5 hover:bg-white/10 rounded-lg px-2 py-1.5">
                          <Download size={12} /> Download
                        </button>
                      </div>
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
                        onRemove={removeCreative}
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
                <h2 className="text-4xl font-bold text-white mb-2">Step 3: Campaign Goal</h2>
                <p className="text-gray-400">Select your campaign objective — this guides the AI analysis</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { id: "awareness",     emoji: "📣", title: "Awareness",     color: "from-blue-600/30 to-blue-800/20",    border: "border-blue-500/50",   glow: "shadow-blue-500/20",    desc: "Maximize reach, visual clarity, and brand recognition." },
                  { id: "consideration",emoji: "🤔", title: "Consideration", color: "from-purple-600/30 to-purple-800/20",border: "border-purple-500/50", glow: "shadow-purple-500/20",  desc: "Balance information, value proposition, and moderate CTA." },
                  { id: "conversion",   emoji: "⚡", title: "Conversion",    color: "from-orange-600/30 to-orange-800/20",border: "border-orange-500/50",glow: "shadow-orange-500/20",  desc: "Strong CTA, high contrast, urgent and direct messaging." },
                ].map((g) => {
                  const sel = campaignGoal === g.id;
                  return (
                    <motion.div key={g.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => setCampaignGoal(g.id)}
                      className={`cursor-pointer rounded-2xl p-8 border-2 transition-all duration-200 bg-gradient-to-br ${
                        sel ? `${g.color} ${g.border} shadow-2xl ${g.glow}` : "border-white/10 bg-white/5 hover:border-white/25"
                      }`}>
                      <div className="text-5xl mb-4">{g.emoji}</div>
                      <h3 className={`text-2xl font-extrabold mb-2 ${sel ? "text-white" : "text-gray-200"}`}>{g.title}</h3>
                      <p className="text-sm text-gray-400 leading-relaxed">{g.desc}</p>
                      {sel && <div className="mt-4 flex items-center gap-2 text-xs font-bold text-white/70"><CheckCircle2 size={14} className="text-green-400" /> Selected</div>}
                    </motion.div>
                  );
                })}
              </div>

              <div className="flex gap-4 pt-4">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setStep(2)}
                  className="flex-1 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition">← Back</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(4)}
                  disabled={!campaignGoal}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition">
                  {campaignGoal ? `Next: AI Analysis →` : "Select a goal to continue"}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: AI ANALYSIS */}
          {step === 4 && (
            <motion.div key="step-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div>
                <h2 className="text-4xl font-bold text-white mb-2">Step 4: AI Analysis</h2>
                <p className="text-gray-400">Analyze all your creatives with AI — see which ones are ready and which need work</p>
              </div>

              {/* Run Analysis bar */}
              <div className="flex items-center justify-between flex-wrap gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div>
                  <p className="text-sm font-semibold text-white">Campaign Goal: <span className="text-purple-400 capitalize">{campaignGoal}</span></p>
                  <p className="text-xs text-gray-500 mt-0.5">Analyzing {validCreatives.length} valid creative{validCreatives.length !== 1 ? "s" : ""}</p>
                </div>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={async () => {
                    if (validCreatives.length === 0) { addToast("No valid creatives to analyze.", "error"); return; }
                    if (!campaignGoal) { addToast("Please select a campaign goal first.", "error"); return; }
                    setAnalysisLoading(true);
                    setAnalysisResult(null);
                    setShowAnalysis(false);
                    setSelectedAnalysisId(null);
                    try {
                      const results = [];
                      for (const creative of validCreatives) {
                        const data = await analyzeCreativeLocal(creative.url, campaignGoal);
                        results.push({ creative, data });
                      }
                      setAnalysisResult(results);
                      setSelectedAnalysisId(results[0]?.creative.id || null);
                      setShowAnalysis(true);
                      addToast(`Analyzed ${results.length} creative${results.length !== 1 ? "s" : ""} ✨`, "success");
                    } catch (err) {
                      addToast(err.message || "Analysis failed.", "error");
                    } finally {
                      setAnalysisLoading(false);
                    }
                  }}
                  disabled={analysisLoading || !campaignGoal}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition">
                  {analysisLoading
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analyzing all creatives...</>
                    : <><span>🧠</span> Run Analysis on All Creatives</>}
                </motion.button>
              </div>

              {/* Loading progress */}
              {analysisLoading && (
                <div className="text-center py-10 space-y-4">
                  <div className="w-14 h-14 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-gray-400 text-sm">AI is analyzing your creatives one by one...</p>
                </div>
              )}

              {/* Results */}
              {showAnalysis && analysisResult && Array.isArray(analysisResult) && !analysisLoading && (() => {
                const perfect = analysisResult.filter(r => r.data.overall_score >= 70);
                const needsWork = analysisResult.filter(r => r.data.overall_score < 70);
                const selected = analysisResult.find(r => r.creative.id === selectedAnalysisId);

                return (
                  <div className="space-y-6">
                    {/* Summary Banner */}
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-white/10 space-y-2">
                      <h3 className="text-base font-bold text-white mb-3">📊 Analysis Summary</h3>
                      {perfect.length > 0 && (
                        <p className="text-sm text-green-300">
                          ✅ <strong>{perfect.map(r => r.creative.name).join(", ")}</strong> {perfect.length === 1 ? "has" : "have"} strong IAB standards and {perfect.length === 1 ? "is" : "are"} ready for preview.
                        </p>
                      )}
                      {needsWork.length > 0 && (
                        <p className="text-sm text-yellow-300">
                          ⚠️ <strong>{needsWork.map(r => r.creative.name).join(", ")}</strong> {needsWork.length === 1 ? "needs" : "need"} improvements — click on {needsWork.length === 1 ? "it" : "them"} to see suggestions.
                        </p>
                      )}
                    </div>

                    {/* Two-panel layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* LEFT: Creative List */}
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Creatives</p>
                        {analysisResult.map((res) => {
                          const score = res.data.overall_score;
                          const isGood = score >= 70;
                          const isSelected = selectedAnalysisId === res.creative.id;
                          return (
                            <motion.button
                              key={res.creative.id}
                              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                              onClick={() => setSelectedAnalysisId(res.creative.id)}
                              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                                isSelected
                                  ? "border-fuchsia-500 bg-fuchsia-900/30"
                                  : "border-white/10 bg-white/5 hover:border-white/25"
                              }`}
                            >
                              <img src={res.creative.url} className="w-12 h-10 rounded-lg object-cover shrink-0 border border-white/20" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{res.creative.name}</p>
                                <p className={`text-xs font-bold ${isGood ? "text-green-400" : score >= 45 ? "text-yellow-400" : "text-red-400"}`}>{score}/100 — {isGood ? "Ready ✓" : "Needs work"}</p>
                              </div>
                              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isGood ? "bg-green-400" : score >= 45 ? "bg-yellow-400" : "bg-red-400"}`} />
                            </motion.button>
                          );
                        })}
                      </div>

                      {/* RIGHT: Detail Panel */}
                      {selected && (() => {
                        const r = selected.data;
                        const insightColor = r.overall_score >= 70 ? "text-green-400" : r.overall_score >= 45 ? "text-yellow-400" : "text-red-400";
                        const bars = [
                          { label: "Brightness", value: r.brightness, color: "bg-yellow-400" },
                          { label: "Contrast", value: r.contrast, color: "bg-blue-400" },
                          { label: "Text Clarity", value: r.text_clarity, color: "bg-cyan-400" },
                          { label: "Layout Score", value: r.layout_score, color: "bg-green-400" },
                          { label: "Goal Alignment", value: r.goal_fit, color: "bg-fuchsia-400" },
                          { label: "Overall Score", value: r.overall_score, color: "bg-purple-400" },
                        ];
                        return (
                          <motion.div
                            key={selected.creative.id}
                            initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                            className="lg:col-span-2 rounded-2xl border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-900/20 to-purple-900/20 p-6 space-y-5"
                          >
                            {/* Header */}
                            <div className="flex items-center gap-4">
                              <img src={selected.creative.url} className="w-20 h-16 rounded-xl object-cover border border-white/20" />
                              <div>
                                <h4 className="text-lg font-bold text-white">{selected.creative.name} – Suggestions</h4>
                                <p className={`text-sm font-semibold ${insightColor}`}>
                                  {r.overall_score >= 70 ? "Strong creative ✨" : r.overall_score >= 45 ? "Needs some work 🛠" : "Low performance ⚠️"} ({r.overall_score}/100)
                                </p>
                              </div>
                            </div>

                            {/* Badges */}
                            <div className="flex flex-wrap gap-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${r.cta_presence ? "bg-green-500/15 border-green-500/40 text-green-300" : "bg-red-500/15 border-red-500/40 text-red-300"}`}>
                                {r.cta_presence ? "✅ CTA Present" : "❌ No CTA"}
                              </span>
                              <span className="px-3 py-1 rounded-full text-xs font-bold border border-white/15 bg-white/5 text-gray-300">
                                CTA: <span className="text-white capitalize">{r.cta_strength}</span>
                              </span>
                              <span className="px-3 py-1 rounded-full text-xs font-bold border border-white/15 bg-white/5 text-gray-300">
                                Text: <span className="text-white capitalize">{r.text_density}</span>
                              </span>
                            </div>

                            {/* Metric bars */}
                            <div className="grid grid-cols-2 gap-3">
                              {bars.map(b => (
                                <div key={b.label}>
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-400">{b.label}</span>
                                    <span className="text-white font-bold">{b.value}</span>
                                  </div>
                                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${b.value}%` }} transition={{ duration: 0.7, ease: "easeOut" }}
                                      className={`h-full rounded-full ${b.color}`} />
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Suggestions */}
                            <div>
                              <p className="text-sm font-bold text-white mb-2">💡 Suggestions</p>
                              {r.suggestions?.length > 0 ? r.suggestions.map((s, i) => (
                                <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-white/5 border border-white/8 text-sm text-gray-300 mb-1.5">
                                  <span className="text-fuchsia-400 shrink-0">→</span>{s}
                                </div>
                              )) : (
                                <p className="text-sm text-green-400">No improvements needed — this creative is ready!</p>
                              )}
                            </div>
                          </motion.div>
                        );
                      })()}
                    </div>

                    {/* Download Full Report (PDF) */}
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={async () => {
                        try {
                          const { jsPDF } = await import("jspdf");
                          const doc = new jsPDF({ format: 'a4', unit: 'pt' });
                          
                          // Page 1: Summary
                          doc.setFillColor(15, 23, 42); // slate-900 background
                          doc.rect(0, 0, 595.28, 841.89, 'F');
                          
                          doc.setTextColor(255, 255, 255);
                          doc.setFontSize(24);
                          doc.text("Adigator AI Analysis Report", 40, 60);
                          
                          doc.setFontSize(14);
                          doc.setTextColor(203, 213, 225); // slate-300
                          doc.text(`Campaign Goal: ${(campaignGoal || 'None').toUpperCase()}`, 40, 90);
                          doc.text(`Date: ${new Date().toLocaleString()}`, 40, 110);
                          
                          const perfect2 = analysisResult.filter(r => r.data.overall_score >= 70);
                          const needs2 = analysisResult.filter(r => r.data.overall_score < 70);
                          
                          doc.setFontSize(16);
                          doc.setTextColor(74, 222, 128); // green-400
                          doc.text(`Ready: ${perfect2.length} creatives`, 40, 150);
                          if (perfect2.length > 0) {
                            doc.setFontSize(12);
                            const textLines = doc.splitTextToSize(perfect2.map(c => c.creative.name).join(", "), 515);
                            doc.text(textLines, 40, 170);
                          }
                          
                          doc.setFontSize(16);
                          doc.setTextColor(250, 204, 21); // yellow-400
                          doc.text(`Needs Improvement: ${needs2.length} creatives`, 40, 220);
                          if (needs2.length > 0) {
                            doc.setFontSize(12);
                            const textLines = doc.splitTextToSize(needs2.map(c => c.creative.name).join(", "), 515);
                            doc.text(textLines, 40, 240);
                          }

                          // Load all images first
                          const imagePromises = analysisResult.map(res => {
                            return new Promise((resolve) => {
                              const img = new Image();
                              img.onload = () => resolve({ img, res });
                              img.onerror = () => resolve({ img: null, res }); // Skip if error
                              img.src = res.creative.url;
                            });
                          });
                          
                          const loadedData = await Promise.all(imagePromises);
                          
                          for (const { img, res } of loadedData) {
                            doc.addPage();
                            doc.setFillColor(15, 23, 42);
                            doc.rect(0, 0, 595.28, 841.89, 'F');
                            
                            doc.setTextColor(255, 255, 255);
                            doc.setFontSize(22);
                            doc.text(`Creative: ${res.creative.name}`, 40, 60);
                            
                            let currentY = 100;
                            
                            if (img) {
                              const maxImgW = 515;
                              const maxImgH = 300;
                              let imgW = img.width;
                              let imgH = img.height;
                              const ratio = Math.min(maxImgW / imgW, maxImgH / imgH);
                              imgW = imgW * ratio;
                              imgH = imgH * ratio;
                              
                              const imgX = 40 + (maxImgW - imgW) / 2;
                              // Try rendering the image, fallback gracefully
                              try {
                                doc.addImage(res.creative.url, imgX, currentY, imgW, imgH);
                              } catch (e) {
                                console.warn("Failed to add image to PDF", e);
                              }
                              
                              currentY += imgH + 40;
                            }
                            
                            // Score
                            const isGood = res.data.overall_score >= 70;
                            const isOk = res.data.overall_score >= 45;
                            if (isGood) doc.setTextColor(74, 222, 128);
                            else if (isOk) doc.setTextColor(250, 204, 21);
                            else doc.setTextColor(248, 113, 113);
                            
                            doc.setFontSize(18);
                            doc.text(`Confidence Score: ${res.data.overall_score}/100`, 40, currentY);
                            
                            currentY += 30;
                            doc.setTextColor(148, 163, 184); // slate-400
                            doc.setFontSize(14);
                            doc.text(`Brightness: ${res.data.brightness} | Contrast: ${res.data.contrast} | Layout: ${res.data.layout_score}`, 40, currentY);
                            
                            currentY += 20;
                            doc.text(`CTA: ${res.data.cta_presence ? "Present" : "Missing"} | Strength: ${res.data.cta_strength} | Text Density: ${res.data.text_density}`, 40, currentY);
                            
                            currentY += 40;
                            doc.setTextColor(255, 255, 255);
                            doc.setFontSize(16);
                            doc.text("Suggestions:", 40, currentY);
                            
                            currentY += 25;
                            doc.setTextColor(203, 213, 225);
                            doc.setFontSize(14);
                            const suggestions = res.data.suggestions || [];
                            if (suggestions.length === 0) {
                              doc.setTextColor(74, 222, 128);
                              doc.text("• Ready for preview! No improvements needed.", 40, currentY);
                            } else {
                              suggestions.forEach(s => {
                                const lines = doc.splitTextToSize(`• ${s}`, 515);
                                doc.text(lines, 40, currentY);
                                currentY += lines.length * 18;
                              });
                            }
                          }
                          
                          doc.save("Campaign_Analysis_Report.pdf");
                        } catch (error) {
                          console.error("Failed to generate PDF report", error);
                          addToast("Failed to generate report PDF", "error");
                        }
                      }}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-white/10 hover:bg-white/20 border border-fuchsia-500/40 text-fuchsia-200 rounded-xl font-bold transition">
                      <Download size={18} /> Download Full Analysis Report (PDF)
                    </motion.button>
                  </div>
                );
              })()}

              <div className="flex gap-4 pt-2">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setStep(3)}
                  className="flex-1 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition">← Back</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setStep(5)}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold transition">
                  Next: Select Template →
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: SELECT TEMPLATE + VIEW MODE */}
          {step === 5 && (
            <motion.div key="step-5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              <div>
                <h2 className="text-4xl font-bold text-white mb-2">Step 5: Select Template</h2>
                <p className="text-gray-400">Choose a website category and view mode for your preview</p>
              </div>

              {/* VIEW MODE SELECTOR */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">View Mode</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: "multiple", icon: Square, title: "Multiple Slides", desc: "Each creative gets its own slide. Total slides = number of creatives." },
                    { id: "single",   icon: LayoutGrid, title: "Single Slide (All Creatives)", desc: "All creatives displayed inside one slide in a responsive grid." },
                  ].map((m) => {
                    const Icon = m.icon;
                    const sel = viewMode === m.id;
                    return (
                      <motion.div
                        key={m.id}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => setViewMode(m.id)}
                        className={`cursor-pointer rounded-2xl p-5 border-2 transition-all flex gap-4 items-start ${
                          sel ? "border-purple-500 bg-purple-900/30 shadow-[0_0_24px_rgba(168,85,247,0.25)]" : "border-white/10 bg-white/5 hover:border-white/30"
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                          sel ? "bg-purple-500 text-white" : "bg-white/10 text-gray-400"
                        }`}><Icon size={22} /></div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-white">{m.title}</h4>
                            {sel && <CheckSquare size={16} className="text-purple-400" />}
                          </div>
                          <p className="text-sm text-gray-400">{m.desc}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* TEMPLATE GRID */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">Template Category</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {TEMPLATES.map((tpl) => {
                    const Icon = tpl.icon;
                    const isSelected = selectedTemplate === tpl.id;
                    return (
                      <motion.div
                        key={tpl.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedTemplate(tpl.id)}
                        className={`relative cursor-pointer rounded-2xl p-6 border-2 transition-all overflow-hidden ${
                          isSelected ? "border-blue-500 bg-gradient-to-br from-blue-900/40 to-purple-900/40 shadow-[0_0_30px_rgba(59,130,246,0.3)]" : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
                        }`}
                      >
                        {isSelected && <div className="absolute top-4 right-4 text-blue-400"><CheckCircle2 size={24} /></div>}
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${isSelected ? "bg-blue-500 text-white shadow-lg shadow-blue-500/50" : "bg-white/10 text-gray-300"}`}>
                          <Icon size={28} />
                        </div>
                        <h3 className={`text-xl font-bold mb-1 ${isSelected ? "text-white" : "text-gray-200"}`}>{tpl.name}</h3>
                        <p className="text-sm text-gray-400 mb-4">{tpl.desc}</p>
                        <div className="text-xs font-semibold uppercase tracking-wider text-purple-400 bg-purple-500/10 w-fit px-3 py-1 rounded-full">{tpl.slots} Ad Zones</div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setStep(4)}
                  className="flex-1 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition">← Back</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setStep(6)}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold transition">
                  Next: Generate Preview Engine →
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* STEP 6: PREVIEW & EXPORT */}
          {step === 6 && (
            <motion.div key="step-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-4xl font-bold text-white mb-2">Step 5: Preview & Export</h2>
                  <p className="text-gray-400">See your creatives in real website contexts</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={handleExportPptx}
                  disabled={isExporting}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold flex items-center gap-2 disabled:opacity-60"
                >
                  <Download size={20} /> {isExporting ? "Exporting..." : "Export PPTX"}
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
                  selectedTemplate={selectedTemplate}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                />
              </motion.div>

              <div className="flex gap-4 pt-4">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setStep(5)}
                  className="flex-1 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition">← Back</motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleExportPptx}
                  disabled={isExporting}
                  className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Download size={20} /> {isExporting ? "Exporting..." : "Download PPTX"}
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

      {/* Toast Notifications */}
      <Toast toasts={toasts} />
    </div>
  );
}