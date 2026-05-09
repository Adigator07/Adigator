"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  creatives: Array<{
    id?: string | number;
    name?: string;
    url: string;
    size: string;
    analyzerOutput?: Record<string, unknown>;
    ctaText?: string;
    headline?: string;
  }>;
  vertical: string;
  goal: "awareness" | "consideration" | "conversion";
}

const ENV_LABELS: Record<EnvironmentFamily, { label: string; icon: string; color: string }> = {
  news: { label: "News / Editorial", icon: "??", color: "from-blue-600/20 to-blue-800/10 border-blue-500/30" },
  commerce: { label: "E-Commerce", icon: "??", color: "from-orange-600/20 to-orange-800/10 border-orange-500/30" },
  social: { label: "Social Feed", icon: "??", color: "from-purple-600/20 to-purple-800/10 border-purple-500/30" },
  luxury: { label: "Luxury / Lifestyle", icon: "?", color: "from-amber-600/20 to-amber-800/10 border-amber-500/30" },
  sports: { label: "Sports", icon: "?", color: "from-yellow-600/20 to-yellow-800/10 border-yellow-500/30" },
  gaming: { label: "Gaming / App", icon: "??", color: "from-emerald-600/20 to-emerald-800/10 border-emerald-500/30" },
  finance: { label: "Finance / Data", icon: "??", color: "from-slate-600/20 to-slate-800/10 border-slate-500/30" },
  travel: { label: "Travel / Booking", icon: "??", color: "from-cyan-600/20 to-cyan-800/10 border-cyan-500/30" },
  saas: { label: "SaaS / Dashboard", icon: "??", color: "from-violet-600/20 to-violet-800/10 border-violet-500/30" },
  booking: { label: "Booking / Local", icon: "??", color: "from-rose-600/20 to-rose-800/10 border-rose-500/30" },
};

const DEVICE_OPTIONS: { id: DeviceType; label: string; icon: string; width: string }[] = [
  { id: "desktop", label: "Desktop", icon: "???", width: "w-full" },
  { id: "tablet", label: "Tablet", icon: "??", width: "max-w-2xl" },
  { id: "mobile", label: "Mobile", icon: "??", width: "max-w-sm" },
];

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
    case "luxury": return <NewsEnvironment {...props} />;
    case "booking": return <TravelEnvironment {...props} />;
    default: return <NewsEnvironment {...props} />;
  }
}

export default function ContextualPreviewEngine({ creatives, vertical, goal }: Props) {
  const [output, setOutput] = useState<PreviewEngineOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [device, setDevice] = useState<DeviceType>("desktop");
  const [selectedEnvironment, setSelectedEnvironment] = useState<EnvironmentFamily | null>(null);
  const [activeCreativeIndex, setActiveCreativeIndex] = useState(0);
  const previewCacheRef = useRef<Map<string, PreviewEngineOutput>>(new Map());
  const activeKeyRef = useRef<string>("");

  const safeCreativeIndex = Math.min(activeCreativeIndex, Math.max(0, creatives.length - 1));
  const activeCreative = creatives[safeCreativeIndex];
  const resolvedCreativeUrl = activeCreative?.url || "";

  const buildCacheKey = useCallback((creative: Props["creatives"][number], envOverride: EnvironmentFamily | null = selectedEnvironment) => {
    return [vertical, goal, device, envOverride ?? "auto", creative.url, creative.size].join("|");
  }, [vertical, goal, device, selectedEnvironment]);

  useEffect(() => {
    if (safeCreativeIndex !== activeCreativeIndex) {
      setActiveCreativeIndex(safeCreativeIndex);
    }
  }, [safeCreativeIndex, activeCreativeIndex]);

  useEffect(() => {
    activeKeyRef.current = activeCreative ? buildCacheKey(activeCreative, selectedEnvironment) : "";
  }, [activeCreative, buildCacheKey]);

  const fetchPreview = useCallback(async (targetCreative: Props["creatives"][number], withLoading = true, envOverride: EnvironmentFamily | null = selectedEnvironment) => {
    if (!targetCreative?.url || !vertical || !goal) return;

    const cacheKey = buildCacheKey(targetCreative, envOverride);
    const cached = previewCacheRef.current.get(cacheKey);

    if (cached) {
      if (cacheKey === activeKeyRef.current) {
        setOutput(cached);
        setSelectedEnvironment(envOverride ?? cached.previewDecision.environment);
        setError(null);
      }
      return;
    }

    if (withLoading) setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/preview-engine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vertical,
          goal,
          preferredEnvironment: envOverride ?? undefined,
          device,
          creativeSize: targetCreative.size,
          creativeType: "display",
          analyzerOutput: targetCreative.analyzerOutput ?? {},
          ctaText: targetCreative.ctaText,
          headline: targetCreative.headline,
          logoPresent: true,
          riskFlags: [],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `Request failed: ${res.status}`);
      }

      const data = (await res.json()) as PreviewEngineOutput;
      previewCacheRef.current.set(cacheKey, data);

      if (cacheKey === activeKeyRef.current) {
        setOutput(data);
        setSelectedEnvironment(envOverride ?? data.previewDecision.environment);
      }
    } catch (e) {
      if (cacheKey === activeKeyRef.current) {
        setError(e instanceof Error ? e.message : "Preview generation failed");
      }
    } finally {
      if (withLoading && cacheKey === activeKeyRef.current) setLoading(false);
    }
  }, [buildCacheKey, vertical, goal, device, selectedEnvironment]);

  useEffect(() => {
    if (!activeCreative) return;

    const activeKey = buildCacheKey(activeCreative, selectedEnvironment);
    const cached = previewCacheRef.current.get(activeKey);

    if (cached) {
      setOutput(cached);
      setSelectedEnvironment(selectedEnvironment ?? cached.previewDecision.environment);
      setError(null);
      setLoading(false);
      return;
    }

    fetchPreview(activeCreative, true, selectedEnvironment);
  }, [activeCreative, buildCacheKey, fetchPreview, selectedEnvironment]);

  useEffect(() => {
    if (creatives.length <= 1) return;

    let cancelled = false;
    const runPrefetch = async () => {
      for (let i = 0; i < creatives.length; i += 1) {
        if (cancelled) return;
        if (i === safeCreativeIndex) continue;

        const c = creatives[i];
        const key = buildCacheKey(c, selectedEnvironment);
        if (previewCacheRef.current.has(key)) continue;

        await fetchPreview(c, false, selectedEnvironment);
      }
    };

    runPrefetch();
    return () => {
      cancelled = true;
    };
  }, [creatives, safeCreativeIndex, buildCacheKey, fetchPreview, selectedEnvironment]);

  const currentEnv = selectedEnvironment ?? output?.previewDecision.environment ?? "news";
  const envMeta = ENV_LABELS[currentEnv] ?? ENV_LABELS.news;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full" />
          <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin" />
          <div className="absolute inset-2 border-2 border-transparent border-t-pink-400 rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "0.7s" }} />
        </div>
        <div className="text-center">
          <p className="text-white font-semibold text-lg">Simulating {vertical} environment...</p>
          <p className="text-gray-400 text-sm mt-1">AI is generating contextual surroundings for your creative</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center text-2xl">!</div>
        <div className="text-center">
          <p className="text-red-400 font-semibold">Preview generation failed</p>
          <p className="text-gray-500 text-sm mt-1">{error}</p>
        </div>
        <button
          onClick={() => activeCreative && fetchPreview(activeCreative, true)}
          className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!output || !activeCreative) return null;

  const { previewDecision, creativeMapping } = output;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1">
          {(Object.entries(ENV_LABELS) as [EnvironmentFamily, typeof ENV_LABELS[EnvironmentFamily]][])
            .map(([k, v]) => (
              <button
                key={k}
                onClick={() => {
                  setSelectedEnvironment(k);
                  if (activeCreative) {
                    fetchPreview(activeCreative, true, k);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                  currentEnv === k
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>{v.icon}</span>
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            ))}
        </div>

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

        <button
          onClick={() => activeCreative && fetchPreview(activeCreative, true, selectedEnvironment)}
          className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2"
        >
          Regenerate
        </button>
      </div>

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

      {output.compatibility.deviceFit !== "pass" && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            output.compatibility.deviceFit === "fail"
              ? "bg-red-500/10 border-red-500/30 text-red-200"
              : "bg-yellow-500/10 border-yellow-500/30 text-yellow-200"
          }`}
        >
          <p className="font-semibold">Device Compatibility Check</p>
          <p className="mt-1">{output.compatibility.message}</p>
          <p className="mt-1 text-xs opacity-90">Suggested sizes: {output.compatibility.suggestedSizes.join(", ")}</p>
        </div>
      )}

      <div className={`mx-auto transition-all duration-300 ${DEVICE_OPTIONS.find((d) => d.id === device)?.width ?? "w-full"}`}>
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
            <span className="bg-green-900/40 text-green-400 border border-green-900/60 px-2 py-0.5 rounded text-[10px] font-bold">Secure</span>
          </div>
        </div>

        <div className="border-x border-b border-white/10 rounded-b-xl overflow-hidden max-h-175 overflow-y-auto flex">
          <div className="w-1/3 bg-gray-900 border-r border-white/10 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 font-semibold">CREATIVES ({creatives.length})</p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveCreativeIndex((prev) => (prev - 1 + creatives.length) % creatives.length)}
                  className="px-2 py-1 text-xs rounded bg-white/10 text-gray-300 hover:bg-white/15"
                  disabled={creatives.length <= 1}
                >
                  ?
                </button>
                <button
                  onClick={() => setActiveCreativeIndex((prev) => (prev + 1) % creatives.length)}
                  className="px-2 py-1 text-xs rounded bg-white/10 text-gray-300 hover:bg-white/15"
                  disabled={creatives.length <= 1}
                >
                  ?
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {creatives.map((creative, index) => (
                <button
                  key={creative.id ?? `${creative.name ?? "creative"}-${index}`}
                  onClick={() => setActiveCreativeIndex(index)}
                  className={`w-full text-left p-2 rounded-lg border transition ${
                    safeCreativeIndex === index
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <p className="text-xs text-white truncate font-medium">{creative.name ?? `Creative ${index + 1}`}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{creative.size}</p>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-center bg-gray-800 rounded-lg overflow-hidden w-full max-w-xs mx-auto">
              {resolvedCreativeUrl ? (
                <img
                  key={`${safeCreativeIndex}-${currentEnv}-${resolvedCreativeUrl}`}
                  src={resolvedCreativeUrl}
                  alt="Creative"
                  className="max-w-full max-h-96 object-contain"
                />
              ) : (
                <div className="w-full py-12 text-center text-xs text-gray-500">Image not available</div>
              )}
            </div>
            <p className="text-[10px] text-gray-500 text-center font-mono">{activeCreative.size}</p>
          </div>

          <div className="flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentEnv}-${device}-${safeCreativeIndex}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <EnvironmentRenderer
                  env={currentEnv}
                  output={output}
                  creativeUrl={resolvedCreativeUrl}
                  creativeSize={activeCreative.size}
                  device={device}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
