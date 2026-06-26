"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ClipboardList, Radio, ShieldCheck, Target } from "lucide-react";

const CAMPAIGN_CHECKS = [
  { label: "Campaign objective", status: "Aligned" },
  { label: "Creative", status: "Validated" },
  { label: "Landing page", status: "Matched" },
  { label: "URL", status: "Reachable" },
  { label: "Tracking", status: "Detected" },
  { label: "Platform", status: "Compatible" },
];

const TECHNICAL_CHECKS = [
  "Supported sizes",
  "Safe zones",
  "Placement compatibility",
  "Device compatibility",
  "File weight",
  "Platform requirements",
];

const LAUNCH_SIGNALS = [
  { label: "Critical issues", value: "0", tone: "emerald" },
  { label: "Warnings", value: "2", tone: "amber" },
  { label: "Ready creatives", value: "4/4", tone: "emerald" },
  { label: "Launch recommendation", value: "Proceed", tone: "lime" },
];

const VALIDATION_LINES = [
  { prefix: "Campaign", text: "Objective vs creative: aligned" },
  { prefix: "Landing", text: "Page message matches ad promise" },
  { prefix: "Meta Ads", text: "Feed 1080×1080: PASS" },
  { prefix: "Google Ads", text: "Responsive display: PASS" },
  { prefix: "Programmatic", text: "Native inventory: PASS" },
  { prefix: "Launch", text: "Ready before media spend begins ✓" },
];

function CampaignValidationCard({ reduceMotion }: { reduceMotion: boolean }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % CAMPAIGN_CHECKS.length);
    }, 2400);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  return (
    <article className="hero-live-card group flex min-h-[260px] flex-col overflow-hidden rounded-[20px] border border-[#2A2A2A] bg-[#111111] p-5 text-white shadow-[0_16px_40px_rgba(0,0,0,0.3)] sm:min-h-[280px] sm:rounded-[24px] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold tracking-tight">Campaign Validation</h3>
          <p className="mt-1 text-sm text-white/50">Everything checked together, not in silos.</p>
        </div>
        <span className="rounded-full border border-[#C8F04D]/30 bg-[#C8F04D]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#C8F04D]">
          Unified
        </span>
      </div>

      <div className="mt-5 flex-1 space-y-2 sm:mt-6">
        {CAMPAIGN_CHECKS.map((item, i) => {
          const active = i <= index;
          return (
            <motion.div
              key={item.label}
              animate={{ opacity: active ? 1 : 0.35 }}
              className="flex items-center justify-between rounded-xl border border-white/8 bg-[#1A1A1A] px-4 py-2.5"
            >
              <span className="flex items-center gap-2 text-xs text-white/80 sm:text-sm">
                <ClipboardList size={14} className="text-[#C8F04D]/80" />
                {item.label}
              </span>
              {active ? (
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">{item.status}</span>
              ) : (
                <span className="text-[10px] text-white/30">Pending</span>
              )}
            </motion.div>
          );
        })}
      </div>
    </article>
  );
}

function TechnicalValidationCard({ reduceMotion }: { reduceMotion: boolean }) {
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
          <h3 className="text-lg font-bold tracking-tight">Technical Validation</h3>
          <p className="mt-1 text-sm text-white/50">Specs, safe zones, and placement rules, automated.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          Live
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {TECHNICAL_CHECKS.map((check) => (
          <span
            key={check}
            className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-white/60"
          >
            {check}
          </span>
        ))}
      </div>

      <div className="mt-4 flex-1 overflow-hidden rounded-2xl border border-white/8 bg-[#0A0A0A] p-4 font-mono text-[11px] leading-relaxed shadow-inner">
        <div className="mb-3 flex items-center gap-2 border-b border-white/5 pb-3">
          <Radio size={12} className="text-emerald-400" />
          <span className="text-white/40">validation-engine.adigator</span>
        </div>
        <div className="min-h-[100px] space-y-2">
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
    </article>
  );
}

function LaunchReadinessCard({ reduceMotion }: { reduceMotion: boolean }) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => setPulse((p) => !p), 3000);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  return (
    <article className="hero-live-card group flex min-h-[260px] flex-col overflow-hidden rounded-[20px] border border-[#2A2A2A] bg-[#111111] p-5 text-white shadow-[0_16px_40px_rgba(0,0,0,0.3)] sm:min-h-[280px] sm:rounded-[24px] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold tracking-tight">Launch Readiness</h3>
          <p className="mt-1 text-sm text-white/50">Clear signal on what ships and what blocks launch.</p>
        </div>
        <ShieldCheck size={20} className="text-[#C8F04D]" />
      </div>

      <div className="mt-6 grid flex-1 grid-cols-2 gap-3">
        {LAUNCH_SIGNALS.map((signal) => (
          <div
            key={signal.label}
            className="rounded-2xl border border-white/8 bg-[#1A1A1A] p-4"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">{signal.label}</p>
            <p
              className={`mt-2 text-xl font-black ${
                signal.tone === "lime"
                  ? "text-[#C8F04D]"
                  : signal.tone === "amber"
                    ? "text-amber-400"
                    : "text-emerald-400"
              }`}
            >
              {signal.value}
            </p>
          </div>
        ))}
      </div>

      <motion.div
        animate={{
          backgroundColor: pulse ? "rgba(200, 240, 77, 1)" : "rgba(200, 240, 77, 0.15)",
          color: pulse ? "#0D0D0D" : "rgba(200, 240, 77, 0.9)",
        }}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-bold"
      >
        <Target size={16} />
        Launch with confidence
      </motion.div>
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
      className="mt-8 grid gap-4 sm:gap-5 md:grid-cols-3"
    >
      <CampaignValidationCard reduceMotion={!!reduceMotion} />
      <TechnicalValidationCard reduceMotion={!!reduceMotion} />
      <LaunchReadinessCard reduceMotion={!!reduceMotion} />
    </motion.div>
  );
}
