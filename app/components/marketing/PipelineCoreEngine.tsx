"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  Brain,
  Eye,
  FileText,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type PipelineModule = {
  id: string;
  label: string;
  short: string;
  icon: LucideIcon;
  x: number;
  y: number;
};

const PIPELINE_MODULES: PipelineModule[] = [
  { id: "insights", label: "Performance Insights", short: "Live metrics & campaign intelligence", icon: BarChart3, x: 50, y: 10 },
  { id: "setup", label: "Campaign Setup", short: "Objectives, vertical & platform scope", icon: Settings2, x: 20, y: 26 },
  { id: "validation", label: "Creative Validation", short: "Dimensions, file size & format QA", icon: ShieldCheck, x: 80, y: 26 },
  { id: "analysis", label: "AI Analysis", short: "10-layer strategic scoring engine", icon: Sparkles, x: 14, y: 52 },
  { id: "report", label: "Report Generation", short: "PPTX export for stakeholders", icon: FileText, x: 86, y: 52 },
  { id: "collab", label: "Team Collaboration", short: "Org workspaces & communications", icon: Users, x: 24, y: 78 },
  { id: "preview", label: "Preview Studio", short: "Publisher-context ad previews", icon: Eye, x: 76, y: 78 },
];

const CENTER = { x: 50, y: 50 };

function PipelineStatusBar({
  activeIndex,
  activeModule,
  onSelect,
  reduceMotion,
}: {
  activeIndex: number;
  activeModule: PipelineModule;
  onSelect: (index: number) => void;
  reduceMotion: boolean;
}) {
  return (
    <div className="border-t border-white/5 bg-[#111111]/90 px-4 py-3 backdrop-blur-sm sm:px-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            {!reduceMotion ? (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C8F04D] opacity-50" />
            ) : null}
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#C8F04D]" />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50 sm:text-xs">
            Pipeline active
          </span>
        </div>
        <motion.p
          key={activeModule.id}
          initial={{ opacity: 0, x: 6 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xs font-medium text-white sm:text-sm"
        >
          <span className="text-violet-400">{activeIndex + 1}/{PIPELINE_MODULES.length}</span>
          {" · "}
          {activeModule.label}
        </motion.p>
      </div>
      <p className="mt-1 text-[11px] text-white/40 lg:hidden">{activeModule.short}</p>
      <div className="mt-2.5 flex gap-1">
        {PIPELINE_MODULES.map((mod, i) => (
          <button
            key={mod.id}
            type="button"
            onClick={() => onSelect(i)}
            className="group flex-1"
            aria-label={`Show ${mod.label}`}
          >
            <div
              className={`h-1 rounded-full transition-all ${
                i === activeIndex
                  ? "bg-gradient-to-r from-violet-500 to-[#C8F04D]"
                  : "bg-white/10 group-hover:bg-white/20"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function PipelineMobileView({
  activeIndex,
  setActiveIndex,
  reduceMotion,
}: {
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  reduceMotion: boolean;
}) {
  const activeModule = PIPELINE_MODULES[activeIndex];
  const Icon = activeModule.icon;

  return (
    <div className="p-4 sm:p-5 lg:hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeModule.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="flex items-center gap-3 rounded-2xl border border-violet-500/30 bg-[#141414] p-4"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-400/30 bg-violet-500/15 text-violet-300">
            <Icon size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
              Step {activeIndex + 1} of {PIPELINE_MODULES.length}
            </p>
            <p className="truncate text-sm font-bold text-white">{activeModule.label}</p>
            <p className="mt-0.5 text-xs leading-snug text-white/50">{activeModule.short}</p>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#C8F04D]/30 bg-[#C8F04D]/10">
            <Brain size={16} className="text-[#C8F04D]" />
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
        {PIPELINE_MODULES.map((mod, i) => {
          const StepIcon = mod.icon;
          const active = i === activeIndex;
          return (
            <button
              key={mod.id}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`flex flex-col items-center gap-1 rounded-xl border p-2 transition ${
                active
                  ? "border-violet-400/50 bg-violet-500/15 text-violet-200"
                  : "border-white/8 bg-white/5 text-white/40"
              }`}
              aria-label={mod.label}
            >
              <StepIcon size={14} />
              <span className="hidden text-[8px] font-semibold uppercase leading-tight sm:block">
                {mod.label.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>

      {!reduceMotion ? (
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-white/30">
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-violet-500/50" />
          <Brain size={12} className="text-violet-400/60" />
          <span className="h-px w-8 bg-gradient-to-l from-transparent to-violet-500/50" />
        </div>
      ) : null}
    </div>
  );
}

function ConnectionLines({ activeId, reduceMotion }: { activeId: string; reduceMotion: boolean }) {
  const lines = useMemo(
    () =>
      PIPELINE_MODULES.map((mod) => ({
        id: mod.id,
        x1: CENTER.x,
        y1: CENTER.y,
        x2: mod.x,
        y2: mod.y,
      })),
    [],
  );

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden>
      <defs>
        <linearGradient id="pipe-line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(168, 85, 247, 0.15)" />
          <stop offset="50%" stopColor="rgba(200, 240, 77, 0.55)" />
          <stop offset="100%" stopColor="rgba(168, 85, 247, 0.35)" />
        </linearGradient>
      </defs>
      {lines.map((line) => {
        const active = line.id === activeId;
        return (
          <g key={line.id}>
            <line
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke={active ? "url(#pipe-line-grad)" : "rgba(168, 85, 247, 0.16)"}
              strokeWidth={active ? 0.28 : 0.16}
              strokeDasharray={active ? "1 0.7" : "0.7 1"}
              className={active && !reduceMotion ? "pipeline-line-active" : undefined}
            />
            {!reduceMotion && active ? (
              <motion.circle
                r="0.45"
                fill="#C8F04D"
                animate={{
                  cx: [line.x2, line.x1],
                  cy: [line.y2, line.y1],
                  opacity: [0, 1, 1, 0],
                }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              />
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

function HubDiagram({
  activeIndex,
  setActiveIndex,
  reduceMotion,
}: {
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  reduceMotion: boolean;
}) {
  const activeModule = PIPELINE_MODULES[activeIndex];

  return (
    <div className="relative mx-auto h-[260px] max-w-lg xl:h-[280px] xl:max-w-xl">
      <ConnectionLines activeId={activeModule.id} reduceMotion={reduceMotion} />

      {PIPELINE_MODULES.map((mod, i) => {
        const Icon = mod.icon;
        const active = i === activeIndex;
        return (
          <motion.button
            key={mod.id}
            type="button"
            onClick={() => setActiveIndex(i)}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${mod.x}%`, top: `${mod.y}%` }}
            animate={{ scale: active ? 1.05 : 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            aria-label={mod.label}
          >
            <div
              className={`flex items-center gap-1.5 rounded-xl border px-2 py-1.5 backdrop-blur-md ${
                active
                  ? "border-violet-400/50 bg-[#1A1A1A]/95 shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                  : "border-white/10 bg-[#141414]/80"
              }`}
            >
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-md ${
                  active ? "bg-violet-500/20 text-violet-300" : "bg-white/5 text-violet-400/70"
                }`}
              >
                <Icon size={12} />
              </div>
              {active ? (
                <span className="max-w-[88px] truncate text-[9px] font-bold uppercase tracking-wide text-white/80">
                  {mod.label.split(" ")[0]}
                </span>
              ) : null}
            </div>
          </motion.button>
        );
      })}

      <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
        {!reduceMotion ? (
          <motion.div
            className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/20 blur-2xl"
            animate={{ scale: [1, 1.1, 1], opacity: [0.35, 0.55, 0.35] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        ) : null}
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-violet-400/40 bg-[#0D0D0D]/95 shadow-[0_0_24px_rgba(168,85,247,0.3)]">
          <Brain className="text-violet-300" size={24} strokeWidth={1.5} />
        </div>
        <p className="mt-1.5 text-center text-[8px] font-bold uppercase tracking-[0.18em] text-white/70">
          Core Engine
        </p>
      </div>
    </div>
  );
}

export default function PipelineCoreEngine() {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const activeModule = PIPELINE_MODULES[activeIndex];

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % PIPELINE_MODULES.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  return (
    <div className="pipeline-core-engine relative overflow-hidden rounded-2xl border border-[#2A2A2A] bg-[#0A0A0A] shadow-[0_16px_48px_rgba(0,0,0,0.35)] sm:rounded-3xl">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(168,85,247,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.05) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <PipelineMobileView
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
        reduceMotion={!!reduceMotion}
      />

      <div className="relative hidden px-4 pb-2 pt-4 lg:block">
        <HubDiagram
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
          reduceMotion={!!reduceMotion}
        />
        <p className="mt-1 text-center text-xs text-white/40">{activeModule.short}</p>
      </div>

      <PipelineStatusBar
        activeIndex={activeIndex}
        activeModule={activeModule}
        onSelect={setActiveIndex}
        reduceMotion={!!reduceMotion}
      />
    </div>
  );
}
