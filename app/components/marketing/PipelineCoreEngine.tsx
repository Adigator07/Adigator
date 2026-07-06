"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  BarChart3,
  Brain,
  Briefcase,
  ClipboardList,
  Download,
  FileText,
  Globe,
  History,
  LayoutGrid,
  Lightbulb,
  Link2,
  Monitor,
  Rocket,
  Target,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type FlowNode = {
  id: string;
  label: string;
  icon: LucideIcon;
};

const INPUTS: FlowNode[] = [
  { id: "platform", label: "Platform", icon: LayoutGrid },
  { id: "advertiser", label: "Advertiser", icon: Briefcase },
  { id: "brief", label: "Campaign Brief", icon: FileText },
  { id: "objective", label: "Campaign Objective", icon: Target },
  { id: "vertical", label: "Business Vertical", icon: Globe },
  { id: "url", label: "Landing Page / URL & UTM", icon: Link2 },
];

const ENGINE_FEATURES: FlowNode[] = [
  { id: "activity", label: "Campaign Activity", icon: Activity },
  { id: "lifecycle", label: "Campaign Lifecycle", icon: History },
  { id: "history", label: "Campaign History", icon: ClipboardList },
];

const INTELLIGENCE_ITEMS: FlowNode[] = [
  { id: "overview", label: "Campaign Overview", icon: BarChart3 },
  { id: "recommendations", label: "AI Recommendations", icon: Lightbulb },
  { id: "task-analysis", label: "Task Analysis", icon: ClipboardList },
  { id: "preview", label: "Campaign Preview", icon: Monitor },
  { id: "downloads", label: "Downloads", icon: Download },
  { id: "reporting", label: "Reporting", icon: FileText },
];

const LEFT_BRAIN: FlowNode[] = INTELLIGENCE_ITEMS.slice(0, 3);
const RIGHT_BRAIN: FlowNode[] = INTELLIGENCE_ITEMS.slice(3);

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-[#C8F04D]/80">
      {children}
    </p>
  );
}

function FlowNodeCard({ node, active, compact = false }: { node: FlowNode; active: boolean; compact?: boolean }) {
  const Icon = node.icon;
  return (
    <div
      className={`rounded-xl border px-3 py-2.5 transition-all duration-300 ${
        active
          ? "border-[#C8F04D]/50 bg-[#C8F04D]/10 shadow-[0_0_20px_rgba(200,240,77,0.15)]"
          : "border-white/10 bg-[#141414]/80"
      } ${compact ? "text-center" : ""}`}
    >
      <div className={`flex items-center gap-2 ${compact ? "flex-col" : ""}`}>
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
            active ? "bg-[#C8F04D]/20 text-[#C8F04D]" : "bg-white/5 text-white/50"
          }`}
        >
          <Icon size={14} />
        </div>
        <span className={`font-semibold text-white ${compact ? "text-[10px] leading-tight" : "text-xs"}`}>
          {node.label}
        </span>
      </div>
    </div>
  );
}

function BrainPanel({
  title,
  nodes,
  activeIndex,
  side,
}: {
  title: string;
  nodes: FlowNode[];
  activeIndex: number;
  side: "left" | "right";
}) {
  return (
    <div className={`relative z-10 w-full max-w-[220px] ${side === "left" ? "lg:mr-0" : "lg:ml-0"}`}>
      <SectionLabel>{title}</SectionLabel>
      <div className="flex flex-col gap-2">
        {nodes.map((node, i) => (
          <FlowNodeCard key={node.id} node={node} active={i <= activeIndex} />
        ))}
      </div>
    </div>
  );
}

function HubConnections({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 z-0 hidden h-full w-full lg:block"
      viewBox="0 0 900 420"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      <motion.path
        d="M450 118 L450 168"
        stroke="url(#hubLineVert)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        initial={reduceMotion ? undefined : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.1 }}
      />
      <motion.path
        d="M200 248 L340 248"
        stroke="url(#hubLineHoriz)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        initial={reduceMotion ? undefined : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.25 }}
      />
      <motion.path
        d="M560 248 L700 248"
        stroke="url(#hubLineHoriz)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        initial={reduceMotion ? undefined : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.35 }}
      />
      {!reduceMotion ? (
        <>
          <motion.circle
            r="4"
            fill="#C8F04D"
            animate={{ cx: [450, 450], cy: [118, 168], opacity: [0, 1, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.circle
            r="4"
            fill="#C8F04D"
            animate={{ cx: [200, 340], cy: [248, 248], opacity: [0, 1, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
          />
          <motion.circle
            r="4"
            fill="#C8F04D"
            animate={{ cx: [700, 560], cy: [248, 248], opacity: [0, 1, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
          />
        </>
      ) : null}
      <defs>
        <linearGradient id="hubLineVert" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#C8F04D" stopOpacity="0.9" />
          <stop offset="1" stopColor="#C8F04D" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="hubLineHoriz" x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#C8F04D" stopOpacity="0.2" />
          <stop offset="0.5" stopColor="#C8F04D" stopOpacity="0.9" />
          <stop offset="1" stopColor="#C8F04D" stopOpacity="0.2" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function CoreEngineHub({ active }: { active: boolean }) {
  return (
    <div className="relative z-10 flex flex-col items-center">
      <div
        className={`relative flex h-24 w-24 items-center justify-center rounded-2xl border transition-all duration-300 sm:h-28 sm:w-28 ${
          active
            ? "border-[#C8F04D]/55 bg-[#1A1A1A] shadow-[0_0_40px_rgba(200,240,77,0.25)]"
            : "border-white/15 bg-[#0D0D0D]"
        }`}
      >
        {!active ? null : (
          <motion.div
            className="absolute inset-0 rounded-2xl bg-[#C8F04D]/8"
            animate={{ opacity: [0.3, 0.65, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        <Brain className={active ? "text-[#C8F04D]" : "text-white/60"} size={36} strokeWidth={1.5} />
      </div>
      <p className="mt-2 max-w-[160px] text-center text-[11px] font-bold uppercase leading-snug tracking-[0.1em] text-white/85">
        AI Validation Engine
      </p>
      <p className="text-center text-[9px] font-semibold uppercase tracking-wider text-white/45">Core Engine</p>
      <div className="mt-2 space-y-0.5">
        {ENGINE_FEATURES.map((feature) => (
          <p key={feature.id} className={`text-center text-[9px] ${active ? "text-[#C8F04D]/80" : "text-white/35"}`}>
            {feature.label}
          </p>
        ))}
      </div>
    </div>
  );
}

function CampaignIntelligenceBar({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="relative z-10 mx-auto w-full max-w-3xl">
      <SectionLabel>Campaign Intelligence</SectionLabel>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {INTELLIGENCE_ITEMS.map((node, i) => (
          <FlowNodeCard key={node.id} node={node} active={i <= activeIndex} compact />
        ))}
      </div>
    </div>
  );
}

function UserIllustration({ active }: { active: boolean }) {
  return (
    <div
      className={`flex flex-col items-center rounded-2xl border p-3 transition-all duration-300 sm:p-4 ${
        active ? "border-[#C8F04D]/40 bg-[#C8F04D]/5" : "border-white/10 bg-[#141414]"
      }`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-gradient-to-b from-[#2A2A2A] to-[#111111]">
        <User size={24} className="text-white/80" strokeWidth={1.5} />
      </div>
      <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-wider text-white/70">Campaign Team</p>
      <p className="mt-1 max-w-[96px] text-center text-[9px] leading-snug text-white/40">
        User starts the campaign setup.
      </p>
    </div>
  );
}

function LaunchNode({ active }: { active: boolean }) {
  return (
    <div
      className={`flex flex-col items-center rounded-2xl border px-4 py-4 transition-all duration-300 sm:px-5 ${
        active ? "border-emerald-500/40 bg-emerald-500/10" : "border-white/10 bg-[#141414]"
      }`}
    >
      <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.16em] text-white/45">Final Outcome</p>
      <div className={`flex h-11 w-11 items-center justify-center rounded-full ${active ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/40"}`}>
        <Rocket size={20} />
      </div>
      <p className="mt-2 text-center text-xs font-black leading-tight text-white sm:text-sm">Launch with Confidence</p>
    </div>
  );
}

export default function PipelineCoreEngine() {
  const reduceMotion = useReducedMotion();
  const [tick, setTick] = useState(0);

  const phases = ["setup", "intelligence", "engine", "brains", "launch"] as const;
  const phaseIndex = tick % phases.length;
  const phase = phases[phaseIndex];
  const subTick = Math.floor(tick / phases.length);

  const setupActive = phase === "setup";
  const intelligenceActive = phase === "intelligence" || phase === "engine" || phase === "brains" || phase === "launch";
  const engineActive = phase === "engine" || phase === "brains" || phase === "launch";
  const brainsActive = phase === "brains" || phase === "launch";
  const launchActive = phase === "launch";

  const activeInput = setupActive ? subTick % INPUTS.length : INPUTS.length - 1;
  const activeIntel = !intelligenceActive
    ? -1
    : phase === "intelligence"
      ? subTick % INTELLIGENCE_ITEMS.length
      : INTELLIGENCE_ITEMS.length - 1;
  const activeLeftBrain = brainsActive ? subTick % LEFT_BRAIN.length : -1;
  const activeRightBrain = brainsActive ? subTick % RIGHT_BRAIN.length : -1;

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1600);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  return (
    <div className="pipeline-core-engine relative overflow-hidden rounded-2xl border border-[#2A2A2A] bg-[#0A0A0A] shadow-[0_16px_48px_rgba(0,0,0,0.35)] sm:rounded-3xl">
      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
        aria-hidden
      />

      <div className="relative p-4 sm:p-6 lg:p-8">
        {/* Top: Campaign Team + Setup */}
        <div className="mb-6 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-start lg:gap-6">
          <UserIllustration active={setupActive} />
          <div className="min-w-0 flex-1">
            <SectionLabel>Campaign Setup</SectionLabel>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {INPUTS.map((node, i) => (
                <FlowNodeCard key={node.id} node={node} active={i <= activeInput && setupActive} compact />
              ))}
            </div>
          </div>
        </div>

        {/* Hub: Intelligence top → Engine center → Brains left/right */}
        <div className="relative mx-auto min-h-[320px] max-w-4xl lg:min-h-[380px]">
          <HubConnections reduceMotion={!!reduceMotion} />

          <div className="relative z-10 flex flex-col items-center gap-6 lg:gap-8">
            <CampaignIntelligenceBar activeIndex={activeIntel} />

            <div className="hidden h-6 w-px bg-gradient-to-b from-[#C8F04D]/70 to-[#C8F04D]/10 lg:block" aria-hidden />

            <div className="grid w-full items-center gap-6 lg:grid-cols-[1fr_auto_1fr] lg:gap-4">
              <div className="flex justify-center lg:justify-end">
                <BrainPanel title="Left Brain" nodes={LEFT_BRAIN} activeIndex={activeLeftBrain} side="left" />
              </div>

              <CoreEngineHub active={engineActive} />

              <div className="flex justify-center lg:justify-start">
                <BrainPanel title="Right Brain" nodes={RIGHT_BRAIN} activeIndex={activeRightBrain} side="right" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom outcome */}
        <div className="mt-6 flex justify-center lg:mt-8">
          <LaunchNode active={launchActive} />
        </div>
      </div>

      <div className="border-t border-white/5 bg-[#111111]/90 px-4 py-2.5 backdrop-blur-sm sm:px-5">
        <p className="text-center text-[11px] text-white/45 sm:text-xs">
          Campaign Team → Campaign Setup → AI Validation Engine → Campaign Intelligence → Launch with Confidence
        </p>
      </div>
    </div>
  );
}
