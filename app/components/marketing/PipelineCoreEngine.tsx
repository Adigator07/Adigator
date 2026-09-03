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
  { id: "objective", label: "Ad Group Objective", icon: Target },
  { id: "vertical", label: "Business Vertical", icon: Globe },
  { id: "url", label: "Landing Page / URL & UTM", icon: Link2 },
];

const ENGINE_FEATURES: FlowNode[] = [
  { id: "activity", label: "Campaign Activity", icon: Activity },
  { id: "lifecycle", label: "Campaign Lifecycle", icon: History },
  { id: "history", label: "Campaign History", icon: ClipboardList },
];

const LEFT_BRAIN: FlowNode[] = [
  { id: "overview", label: "Campaign Overview", icon: BarChart3 },
  { id: "recommendations", label: "Recommendations", icon: Lightbulb },
  { id: "task-analysis", label: "Task Analysis", icon: ClipboardList },
];

const RIGHT_BRAIN: FlowNode[] = [
  { id: "preview", label: "Creative Preview", icon: Monitor },
  { id: "downloads", label: "Downloads", icon: Download },
  { id: "reporting", label: "Reporting", icon: FileText },
];

const FLOW_PATHS = {
  setupToEngine: "M 400 72 L 400 148",
  engineToLeft: "M 368 188 L 188 268",
  engineToRight: "M 432 188 L 612 268",
  leftToOutcome: "M 188 348 L 360 418",
  rightToOutcome: "M 612 348 L 440 418",
} as const;

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
          <FlowNodeCard key={node.id} node={node} active={activeIndex >= 0 && i <= activeIndex} />
        ))}
      </div>
    </div>
  );
}

function AnimatedFlowDot({
  from,
  to,
  delay,
  reduceMotion,
}: {
  from: [number, number];
  to: [number, number];
  delay: number;
  reduceMotion: boolean;
}) {
  if (reduceMotion) return null;

  return (
    <motion.circle
      r="4"
      fill="#C8F04D"
      animate={{
        cx: [from[0], to[0]],
        cy: [from[1], to[1]],
        opacity: [0, 1, 1, 0],
      }}
      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}

function HubConnections({
  reduceMotion,
  phase,
}: {
  reduceMotion: boolean;
  phase: "setup" | "engine" | "brains" | "launch";
}) {
  const showSetupLine = phase !== "setup" || !reduceMotion;
  const showEngineLines = phase === "engine" || phase === "brains" || phase === "launch";
  const showOutcomeLines = phase === "brains" || phase === "launch";

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-0 hidden h-full w-full lg:block"
      viewBox="0 0 800 460"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      <defs>
        <linearGradient id="flowLineVert" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#C8F04D" stopOpacity="0.9" />
          <stop offset="1" stopColor="#C8F04D" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="flowLineDiag" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#C8F04D" stopOpacity="0.15" />
          <stop offset="0.5" stopColor="#C8F04D" stopOpacity="0.95" />
          <stop offset="1" stopColor="#C8F04D" stopOpacity="0.15" />
        </linearGradient>
      </defs>

      {showSetupLine ? (
        <motion.path
          d={FLOW_PATHS.setupToEngine}
          stroke="url(#flowLineVert)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          initial={reduceMotion ? undefined : { pathLength: 0, opacity: 0.4 }}
          animate={{ pathLength: 1, opacity: phase === "setup" ? 0.45 : 1 }}
          transition={{ duration: 0.7, delay: 0.05 }}
        />
      ) : null}

      {showEngineLines ? (
        <>
          <motion.path
            d={FLOW_PATHS.engineToLeft}
            stroke="url(#flowLineDiag)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            initial={reduceMotion ? undefined : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.75, delay: 0.1 }}
          />
          <motion.path
            d={FLOW_PATHS.engineToRight}
            stroke="url(#flowLineDiag)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            initial={reduceMotion ? undefined : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.75, delay: 0.2 }}
          />
        </>
      ) : null}

      {showOutcomeLines ? (
        <>
          <motion.path
            d={FLOW_PATHS.leftToOutcome}
            stroke="url(#flowLineDiag)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            initial={reduceMotion ? undefined : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.75, delay: 0.1 }}
          />
          <motion.path
            d={FLOW_PATHS.rightToOutcome}
            stroke="url(#flowLineDiag)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            initial={reduceMotion ? undefined : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.75, delay: 0.2 }}
          />
        </>
      ) : null}

      {!reduceMotion ? (
        <>
          <AnimatedFlowDot from={[400, 72]} to={[400, 148]} delay={0} reduceMotion={reduceMotion} />
          {showEngineLines ? (
            <>
              <AnimatedFlowDot from={[368, 188]} to={[188, 268]} delay={0.3} reduceMotion={reduceMotion} />
              <AnimatedFlowDot from={[432, 188]} to={[612, 268]} delay={0.6} reduceMotion={reduceMotion} />
            </>
          ) : null}
          {showOutcomeLines ? (
            <>
              <AnimatedFlowDot from={[188, 348]} to={[360, 418]} delay={0.9} reduceMotion={reduceMotion} />
              <AnimatedFlowDot from={[612, 348]} to={[440, 418]} delay={1.2} reduceMotion={reduceMotion} />
            </>
          ) : null}
        </>
      ) : null}
    </svg>
  );
}

function MobileConnector({ active }: { active: boolean }) {
  return (
    <div
      className={`mx-auto h-8 w-px bg-gradient-to-b lg:hidden ${
        active ? "from-[#C8F04D]/80 to-[#C8F04D]/20" : "from-white/20 to-white/5"
      }`}
      aria-hidden
    />
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
        {active ? (
          <motion.div
            className="absolute inset-0 rounded-2xl bg-[#C8F04D]/8"
            animate={{ opacity: [0.3, 0.65, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        ) : null}
        <Brain className={active ? "text-[#C8F04D]" : "text-white/60"} size={36} strokeWidth={1.5} />
      </div>
      <p className="mt-2 max-w-[200px] text-center text-[11px] font-bold uppercase leading-snug tracking-[0.08em] text-white/85">
        Adigator IQ Validation Engine
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

function FinalOutcomeNode({ active }: { active: boolean }) {
  return (
    <div
      className={`flex flex-col items-center rounded-2xl border px-5 py-4 transition-all duration-300 sm:px-6 ${
        active ? "border-emerald-500/40 bg-emerald-500/10" : "border-white/10 bg-[#141414]"
      }`}
    >
      <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.16em] text-white/45">Final Outcome</p>
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-full ${
          active ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/40"
        }`}
      >
        <Rocket size={20} />
      </div>
      <p className="mt-2 text-center text-xs font-black leading-tight text-white sm:text-sm">Launch with Confidence</p>
    </div>
  );
}

export default function PipelineCoreEngine() {
  const reduceMotion = useReducedMotion();
  const [tick, setTick] = useState(0);

  const phases = ["setup", "engine", "brains", "launch"] as const;
  const phaseIndex = tick % phases.length;
  const phase = phases[phaseIndex];
  const subTick = Math.floor(tick / phases.length);

  const setupActive = phase === "setup";
  const engineActive = phase === "engine" || phase === "brains" || phase === "launch";
  const brainsActive = phase === "brains" || phase === "launch";
  const launchActive = phase === "launch";

  const activeInput = setupActive ? subTick % INPUTS.length : INPUTS.length - 1;
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
        {/* Top: Campaign Task */}
        <div className="relative z-10 mx-auto mb-2 w-full max-w-2xl">
          <SectionLabel>Campaign Task</SectionLabel>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {INPUTS.map((node, i) => (
              <FlowNodeCard key={node.id} node={node} active={i <= activeInput && (setupActive || engineActive)} compact />
            ))}
          </div>
        </div>

        <MobileConnector active={engineActive} />

        {/* Hub: Engine center with Left/Right Brain */}
        <div className="relative mx-auto min-h-[300px] max-w-4xl lg:min-h-[400px]">
          <HubConnections reduceMotion={!!reduceMotion} phase={phase} />

          <div className="relative z-10 flex flex-col items-center">
            <div className="hidden h-10 w-px bg-gradient-to-b from-[#C8F04D]/70 to-[#C8F04D]/10 lg:block" aria-hidden />

            <div className="grid w-full items-center gap-6 lg:grid-cols-[1fr_auto_1fr] lg:gap-8">
              <div className="order-2 flex justify-center lg:order-1 lg:justify-end">
                <BrainPanel title="Technical checks" nodes={LEFT_BRAIN} activeIndex={activeLeftBrain} side="left" />
              </div>

              <div className="order-1 flex justify-center lg:order-2">
                <CoreEngineHub active={engineActive} />
              </div>

              <div className="order-3 flex justify-center lg:justify-start">
                <BrainPanel title="Creative checks" nodes={RIGHT_BRAIN} activeIndex={activeRightBrain} side="right" />
              </div>
            </div>
          </div>
        </div>

        <MobileConnector active={launchActive} />

        {/* Bottom: Final Outcome */}
        <div className="relative z-10 mt-2 flex justify-center lg:mt-0">
          <FinalOutcomeNode active={launchActive} />
        </div>
      </div>

      <div className="border-t border-white/5 bg-[#111111]/90 px-4 py-2.5 backdrop-blur-sm sm:px-5">
        <p className="text-center text-[11px] text-white/45 sm:text-xs">
          Campaign Task → Adigator IQ Validation Engine → Technical &amp; Creative checks → Final Outcome
        </p>
      </div>
    </div>
  );
}
