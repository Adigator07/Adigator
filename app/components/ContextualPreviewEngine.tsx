"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PreviewEngineOutput, EnvironmentFamily, DeviceType } from "@/app/lib/preview-engine/types";
import NewsEnvironment from "./environments/NewsEnvironment";
import CommerceEnvironment from "./environments/CommerceEnvironment";
import SocialEnvironment from "./environments/SocialEnvironment";
import FinanceEnvironment from "./environments/FinanceEnvironment";
import TravelEnvironment from "./environments/TravelEnvironment";
import SportsEnvironment from "./environments/SportsEnvironment";
import GamingEnvironment from "./environments/GamingEnvironment";
import SaasEnvironment from "./environments/SaasEnvironment";

interface Props {
  creativeUrl: string;
  creativeSize: string;
  vertical: string;
  goal: "awareness" | "consideration" | "conversion";
  analyzerOutput?: Record<string, unknown>;
  ctaText?: string;
  headline?: string;
}

const ENV_LABELS: Record<EnvironmentFamily, { label: string; icon: string; color: string }> = {
  news: { label: "News / Editorial", icon: "📰", color: "from-blue-600/20 to-blue-800/10 border-blue-500/30" },
  commerce: { label: "E-Commerce", icon: "🛒", color: "from-orange-600/20 to-orange-800/10 border-orange-500/30" },
  social: { label: "Social Feed", icon: "📱", color: "from-purple-600/20 to-purple-800/10 border-purple-500/30" },
  luxury: { label: "Luxury / Lifestyle", icon: "✨", color: "from-amber-600/20 to-amber-800/10 border-amber-500/30" },
  sports: { label: "Sports", icon: "⚡", color: "from-yellow-600/20 to-yellow-800/10 border-yellow-500/30" },
  gaming: { label: "Gaming / App", icon: "🎮", color: "from-emerald-600/20 to-emerald-800/10 border-emerald-500/30" },
  finance: { label: "Finance / Data", icon: "📈", color: "from-slate-600/20 to-slate-800/10 border-slate-500/30" },
  travel: { label: "Travel / Booking", icon: "✈️", color: "from-cyan-600/20 to-cyan-800/10 border-cyan-500/30" },
  saas: { label: "SaaS / Dashboard", icon: "⚙️", color: "from-violet-600/20 to-violet-800/10 border-violet-500/30" },
  booking: { label: "Booking / Local", icon: "📍", color: "from-rose-600/20 to-rose-800/10 border-rose-500/30" },
};

const DEVICE_OPTIONS: { id: DeviceType; label: string; icon: string; width: string }[] = [
  { id: "desktop", label: "Desktop", icon: "🖥️", width: "w-full" },
  { id: "tablet", label: "Tablet", icon: "📱", width: "max-w-2xl" },
  { id: "mobile", label: "Mobile", icon: "📲", width: "max-w-sm" },
];

function ValidationBadge({ status, label }: { status: "pass" | "fail" | "warn"; label: string }) {
  const config = {
    pass: { bg: "bg-green-500/20 border-green-500/40 text-green-300", icon: "✅" },
    fail: { bg: "bg-red-500/20 border-red-500/40 text-red-300", icon: "❌" },
    warn: { bg: "bg-yellow-500/20 border-yellow-500/40 text-yellow-300", icon: "⚠️" },
  }[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-lg border ${config.bg}`}>
      {config.icon} {label}
    </span>
  );
}

function EnvironmentRenderer({
  env,
  output,
  creativeUrl,
  creativeSize,
  device,
}: {
  env: EnvironmentFamily;
  output: PreviewEngineOutput;
  creativeUrl: string;
  creativeSize: string;
  device: DeviceType;
}) {
  const props = {
    content: output.generatedEnvironment,
    slotType: output.creativeMapping.slotType,
    creativeUrl,
    creativeSize,
    device,
  };

  switch (env) {
    case "commerce": return <CommerceEnvironment {...props} />;
    case "social": return <SocialEnvironment {...props} />;
    case "finance": return <FinanceEnvironment {...props} />;
    case "travel": return <TravelEnvironment {...props} />;
    case "sports": return <SportsEnvironment {...props} />;
    case "gaming": return <GamingEnvironment {...props} />;
    case "saas": return <SaasEnvironment {...props} />;
    case "luxury": return <NewsEnvironment {...props} />; // luxury falls back to editorial
    case "booking": return <TravelEnvironment {...props} />;
    default: return <NewsEnvironment {...props} />;
  }
}

export default function ContextualPreviewEngine({ creativeUrl, creativeSize, vertical, goal, analyzerOutput, ctaText, headline }: Props) {
  const [output, setOutput] = useState<PreviewEngineOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [showValidation, setShowValidation] = useState(true);
  const [activeEnv, setActiveEnv] = useState<EnvironmentFamily | null>(null);

  const fetchPreview = useCallback(async () => {
    if (!creativeUrl || !vertical || !goal) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/preview-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vertical,
          goal,
          device,
          creativeSize,
          creativeType: "display",
          analyzerOutput: analyzerOutput ?? {},
          ctaText,
          headline,
          logoPresent: true,
          riskFlags: [],
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `Request failed: ${res.status}`);
      }
      const data = (await res.json()) as PreviewEngineOutput;
      setOutput(data);
      setActiveEnv(data.previewDecision.environment);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Preview generation failed");
    } finally {
      setLoading(false);
    }
  }, [creativeUrl, vertical, goal, device, creativeSize, analyzerOutput, ctaText, headline]);

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  const currentEnv = activeEnv ?? output?.previewDecision.environment ?? "news";
  const envMeta = ENV_LABELS[currentEnv] ?? ENV_LABELS.news;

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full" />
          <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin" />
          <div className="absolute inset-2 border-2 border-transparent border-t-pink-400 rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "0.7s" }} />
        </div>
        <div className="text-center">
          <p className="text-white font-semibold text-lg">Simulating {vertical} environment…</p>
          <p className="text-gray-400 text-sm mt-1">AI is generating contextual surroundings for your creative</p>
        </div>
        <div className="flex gap-2 mt-2">
          {["Selecting environment", "Generating content", "Injecting creative", "Validating placement"].map((step, i) => (
            <div key={step} className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
              {step}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center text-2xl">⚠️</div>
        <div className="text-center">
          <p className="text-red-400 font-semibold">Preview generation failed</p>
          <p className="text-gray-500 text-sm mt-1">{error}</p>
        </div>
        <button
          onClick={fetchPreview}
          className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!output) return null;

  const { previewDecision, creativeMapping, validation, recommendations } = output;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Control bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Environment switcher */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1">
          {(Object.entries(ENV_LABELS) as [EnvironmentFamily, typeof ENV_LABELS[EnvironmentFamily]][])
            .filter(([k]) => ["news", "commerce", "social", "finance", "travel", "sports", "gaming", "saas"].includes(k))
            .map(([k, v]) => (
              <button
                key={k}
                onClick={() => setActiveEnv(k)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                  activeEnv === k
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>{v.icon}</span>
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            ))}
        </div>

        {/* Device switcher */}
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 ml-auto">
          {DEVICE_OPTIONS.map((d) => (
            <button
              key={d.id}
              onClick={() => setDevice(d.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                device === d.id
                  ? "bg-white/15 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
              title={d.label}
            >
              {d.icon} <span className="hidden sm:inline">{d.label}</span>
            </button>
          ))}
        </div>

        {/* Regenerate */}
        <button
          onClick={fetchPreview}
          className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2"
        >
          🔄 Regenerate
        </button>
      </div>

      {/* Decision badge */}
      <div className={`flex flex-wrap items-center gap-3 bg-linear-to-r ${envMeta.color} border rounded-xl px-4 py-3`}>
        <span className="text-2xl">{envMeta.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">{envMeta.label} Environment</p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">{previewDecision.reason}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs bg-white/10 text-gray-300 px-2 py-1 rounded-lg font-mono">{creativeMapping.slotType}</span>
          <span className="text-xs bg-white/10 text-gray-300 px-2 py-1 rounded-lg font-mono">{previewDecision.primaryTemplate}</span>
        </div>
      </div>

      {/* Browser chrome */}
      <div className={`mx-auto transition-all duration-300 ${DEVICE_OPTIONS.find((d) => d.id === device)?.width ?? "w-full"}`}>
        {/* Browser bar */}
        <div className="bg-[#1c1f27] border border-white/10 rounded-t-xl px-4 py-2.5 flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
          </div>
          <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-xs text-gray-400 font-mono truncate">
            https://www.{output.generatedEnvironment.publisherName?.toLowerCase().replace(/\s+/g, "") ?? "publisher"}.com/
            {output.generatedEnvironment.contextBlocks[0]?.text?.toLowerCase().replace(/\s+/g, "-").slice(0, 30) ?? "article"}
          </div>
          <div className="flex items-center gap-2 text-gray-600 text-xs">
            <span className="bg-green-900/40 text-green-400 border border-green-900/60 px-2 py-0.5 rounded text-[10px] font-bold">🔒 Secure</span>
          </div>
        </div>

        {/* Environment render */}
        <div className="border-x border-b border-white/10 rounded-b-xl overflow-hidden max-h-[700px] overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentEnv}-${device}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <EnvironmentRenderer
                env={currentEnv}
                output={output}
                creativeUrl={creativeUrl}
                creativeSize={creativeSize}
                device={device}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Validation + insights panel */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Validation */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-white">Safe Area Validation</p>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${validation.overallStatus === "pass" ? "bg-green-500/20 text-green-300 border border-green-500/30" : validation.overallStatus === "warning" ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30" : "bg-red-500/20 text-red-300 border border-red-500/30"}`}>
              {validation.overallStatus.toUpperCase()}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <ValidationBadge status={validation.ctaVisibility} label="CTA" />
            <ValidationBadge status={validation.logoVisibility} label="Logo" />
            <ValidationBadge status={validation.textOverflow} label="Text" />
            <ValidationBadge status={validation.croppingRisk} label="Crop" />
            <ValidationBadge status={validation.contextFit} label="Context" />
          </div>
        </div>

        {/* Placement info */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-sm font-bold text-white mb-3">Placement Details</p>
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-xs">
              <span className="text-gray-500 w-24 flex-shrink-0">Slot type</span>
              <span className="text-gray-200 font-mono bg-white/5 px-2 py-0.5 rounded">{creativeMapping.slotType}</span>
            </div>
            <div className="flex items-start gap-2 text-xs">
              <span className="text-gray-500 w-24 flex-shrink-0">Placement</span>
              <span className="text-gray-200">{creativeMapping.placementType}</span>
            </div>
            <div className="flex items-start gap-2 text-xs">
              <span className="text-gray-500 w-24 flex-shrink-0">Injection</span>
              <span className="text-gray-300 leading-relaxed">{creativeMapping.injectionNotes}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-sm font-bold text-white mb-3">Recommendations</p>
          <ul className="space-y-2">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-purple-400 mt-0.5 flex-shrink-0">→</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
