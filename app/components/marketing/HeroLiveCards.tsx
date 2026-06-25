"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Brain, Check, Radio } from "lucide-react";

const ANALYSIS_LAYERS = [
  {
    icon: "◎",
    title: "Attention Mapping",
    description: "Visual hierarchy and focal-point scoring across every creative frame.",
  },
  {
    icon: "✦",
    title: "Platform Fit",
    description: "Dimension, format, and placement alignment for each ad channel.",
  },
  {
    icon: "↗",
    title: "Goal Alignment",
    description: "Campaign objective and vertical fit scored with explicit mismatch flags.",
  },
  {
    icon: "◉",
    title: "Strategic Scoring",
    description: "Weighted launch-readiness intelligence in one deterministic pass.",
  },
];

const VALIDATION_LINES = [
  { prefix: "Adigator", text: "Scanning creative dimensions…" },
  { prefix: "Google Ads", text: "Display 300×250 — PASS" },
  { prefix: "Meta Ads", text: "Feed 1080×1080 — PASS" },
  { prefix: "Programmatic", text: "Native 1200×627 — PASS" },
  { prefix: "Analysis", text: "10-layer orchestrator complete ✓" },
  { prefix: "Decision", text: "Launch readiness: 94% — approved" },
];

const PLATFORMS = [
  { id: "google", label: "Google Ads", short: "G", checks: ["Display matrix", "Search extensions", "File-size guardrails"] },
  { id: "meta", label: "Meta Ads", short: "M", checks: ["Feed & Stories", "Reels placements", "Aspect-ratio QA"] },
  { id: "dsp", label: "Programmatic", short: "P", checks: ["Native inventory", "Publisher templates", "DSP size tiers"] },
];

function AnalysisDepthCard({ reduceMotion }: { reduceMotion: boolean }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % ANALYSIS_LAYERS.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const layer = ANALYSIS_LAYERS[index];

  return (
    <article className="hero-live-card group flex min-h-[260px] flex-col overflow-hidden rounded-[20px] border border-[#2A2A2A] bg-[#111111] p-5 text-white shadow-[0_16px_40px_rgba(0,0,0,0.3)] sm:min-h-[280px] sm:rounded-[24px] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold tracking-tight">Creative Analysis</h3>
          <p className="mt-1 text-sm text-white/50">10-layer intelligence that scores every asset.</p>
        </div>
        <span className="rounded-full border border-[#C8F04D]/30 bg-[#C8F04D]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#C8F04D]">
          10 layers
        </span>
      </div>

      <div className="relative mt-5 flex flex-1 items-center justify-center sm:mt-6">
        <div className="relative h-[150px] w-full max-w-[240px] sm:h-[170px] sm:max-w-[260px]">
          {[2, 1, 0].map((offset) => {
            const layerIndex = (index + offset) % ANALYSIS_LAYERS.length;
            const item = ANALYSIS_LAYERS[layerIndex];
            const isFront = offset === 0;
            return (
              <motion.div
                key={`${layerIndex}-${offset}`}
                layout
                animate={{
                  y: offset * 14,
                  scale: 1 - offset * 0.06,
                  opacity: isFront ? 1 : 0.35 - offset * 0.08,
                  zIndex: 10 - offset,
                }}
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
                className="absolute inset-x-0 top-0 rounded-2xl border border-white/10 bg-[#1A1A1A] p-5 shadow-xl"
                style={{ transformOrigin: "center top" }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#C8F04D]/15 text-lg text-[#C8F04D]">
                    {offset === 0 ? <Brain size={18} /> : <span>{item.icon}</span>}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white">{item.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/55">{item.description}</p>
                  </div>
                </div>
                {isFront ? (
                  <motion.div
                    className="mt-4 h-1 overflow-hidden rounded-full bg-white/10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-[#C8F04D] to-[#9AE635]"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2.8, ease: "easeInOut" }}
                      key={index}
                    />
                  </motion.div>
                ) : null}
              </motion.div>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={layer.title}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="mt-4 text-center text-xs font-medium text-[#C8F04D]/80"
        >
          Layer {index + 1} of {ANALYSIS_LAYERS.length} · {layer.title}
        </motion.p>
      </AnimatePresence>
    </article>
  );
}

function LiveValidationCard({ reduceMotion }: { reduceMotion: boolean }) {
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [history, setHistory] = useState<typeof VALIDATION_LINES>([]);

  const currentLine = VALIDATION_LINES[lineIndex];
  const displayed = currentLine.text.slice(0, charIndex);

  useEffect(() => {
    if (reduceMotion) {
      setHistory(VALIDATION_LINES.slice(0, 3));
      return;
    }

    if (charIndex < currentLine.text.length) {
      const id = window.setTimeout(() => setCharIndex((c) => c + 1), 28);
      return () => window.clearTimeout(id);
    }

    const id = window.setTimeout(() => {
      setHistory((prev) => [...prev.slice(-4), currentLine]);
      setLineIndex((prev) => (prev + 1) % VALIDATION_LINES.length);
      setCharIndex(0);
    }, 900);
    return () => window.clearTimeout(id);
  }, [charIndex, currentLine, lineIndex, reduceMotion]);

  return (
    <article className="hero-live-card group flex min-h-[260px] flex-col overflow-hidden rounded-[20px] border border-[#2A2A2A] bg-[#111111] p-5 text-white shadow-[0_16px_40px_rgba(0,0,0,0.3)] sm:min-h-[280px] sm:rounded-[24px] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold tracking-tight">Live Validation</h3>
          <p className="mt-1 text-sm text-white/50">Real-time creative compliance checks.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          Live Feed
        </span>
      </div>

      <div className="mt-6 flex-1 overflow-hidden rounded-2xl border border-white/8 bg-[#0A0A0A] p-4 font-mono text-[11px] leading-relaxed shadow-inner">
        <div className="mb-3 flex items-center gap-2 border-b border-white/5 pb-3">
          <Radio size={12} className="text-emerald-400" />
          <span className="text-white/40">validation-engine.adigator</span>
        </div>

        <div className="space-y-2 min-h-[140px]">
          {history.map((line, i) => (
            <p key={`${line.prefix}-${i}`} className="text-white/45">
              <span className="text-[#C8F04D]/70">&gt; {line.prefix}:</span> {line.text}
            </p>
          ))}
          <p className="text-white/80">
            <span className="text-[#C8F04D]">&gt; {currentLine.prefix}:</span> {displayed}
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 bg-[#C8F04D]"
            />
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-white/40">
        <span>Validation accuracy</span>
        <motion.span
          key={lineIndex}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="font-bold text-emerald-400"
        >
          99.2%
        </motion.span>
      </div>
    </article>
  );
}

function PlatformCoverageCard({ reduceMotion }: { reduceMotion: boolean }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [deployed, setDeployed] = useState(false);
  const platform = PLATFORMS[activeIndex];

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setDeployed(false);
      setActiveIndex((prev) => {
        const next = (prev + 1) % PLATFORMS.length;
        return next;
      });
    }, 4000);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setTimeout(() => setDeployed(true), 2200);
    return () => window.clearTimeout(id);
  }, [activeIndex, reduceMotion]);

  return (
    <article className="hero-live-card group flex min-h-[260px] flex-col overflow-hidden rounded-[20px] border border-[#2A2A2A] bg-[#111111] p-5 text-white shadow-[0_16px_40px_rgba(0,0,0,0.3)] sm:min-h-[280px] sm:rounded-[24px] sm:p-6">
      <div>
        <h3 className="text-lg font-bold tracking-tight">Platform Coverage</h3>
        <p className="mt-1 text-sm text-white/50">Google, Meta & Programmatic in one view.</p>
      </div>

      <div className="mt-6 flex justify-center gap-2">
        {PLATFORMS.map((p, i) => (
          <motion.button
            key={p.id}
            type="button"
            animate={{
              scale: i === activeIndex ? 1.08 : 1,
              backgroundColor: i === activeIndex ? "rgba(200, 240, 77, 0.2)" : "rgba(255,255,255,0.05)",
              borderColor: i === activeIndex ? "rgba(200, 240, 77, 0.5)" : "rgba(255,255,255,0.1)",
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full border text-xs font-bold text-white"
            onClick={() => {
              setDeployed(false);
              setActiveIndex(i);
            }}
          >
            {p.short}
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={platform.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="mt-5 flex-1 space-y-2"
        >
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-[#C8F04D]/80">
            {platform.label}
          </p>
          {platform.checks.map((check, i) => (
            <motion.div
              key={check}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
              className="flex items-center justify-between rounded-xl border border-white/8 bg-[#1A1A1A] px-4 py-2.5"
            >
              <span className="text-xs text-white/70">{check}</span>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 + i * 0.2, type: "spring" }}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400"
              >
                <Check size={12} />
              </motion.span>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      <motion.button
        type="button"
        animate={{
          backgroundColor: deployed ? "rgba(200, 240, 77, 1)" : "rgba(200, 240, 77, 0.15)",
          color: deployed ? "#0D0D0D" : "rgba(200, 240, 77, 0.9)",
        }}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-bold transition"
      >
        {deployed ? (
          <>
            <Check size={16} /> Ready to Launch
          </>
        ) : (
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          >
            Validating channels…
          </motion.span>
        )}
      </motion.button>
    </article>
  );
}

export default function HeroLiveCards() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.85 }}
      className="mt-10 grid gap-4 sm:mt-12 sm:gap-5 md:grid-cols-3"
    >
      <AnalysisDepthCard reduceMotion={!!reduceMotion} />
      <LiveValidationCard reduceMotion={!!reduceMotion} />
      <PlatformCoverageCard reduceMotion={!!reduceMotion} />
    </motion.div>
  );
}
