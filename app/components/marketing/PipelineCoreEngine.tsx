"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  Brain,
  FileText,
  Globe,
  LayoutGrid,
  Lightbulb,
  Link2,
  Rocket,
  Sparkles,
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
  { id: "platforms", label: "Platforms", icon: LayoutGrid },
  { id: "objective", label: "Campaign Objective", icon: Target },
  { id: "vertical", label: "Vertical", icon: Globe },
  { id: "brief", label: "Brief", icon: FileText },
  { id: "url", label: "URL", icon: Link2 },
];

const OUTPUTS: FlowNode[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "recommendations", label: "Recommendations", icon: Lightbulb },
  { id: "analysis", label: "Creative Analysis", icon: Sparkles },
  { id: "preview", label: "Preview", icon: Globe },
  { id: "pptx", label: "PPTX", icon: FileText },
];

type FlowPhase = "user" | "input" | "engine" | "output" | "launch";

function getPhase(step: number): FlowPhase {
  if (step === 0) return "user";
  if (step <= INPUTS.length) return "input";
  if (step === INPUTS.length + 1) return "engine";
  if (step <= INPUTS.length + 1 + OUTPUTS.length) return "output";
  return "launch";
}

function FlowNodeCard({
  node,
  active,
  compact = false,
}: {
  node: FlowNode;
  active: boolean;
  compact?: boolean;
}) {
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

function UserIllustration({ active }: { active: boolean }) {
  return (
    <div
      className={`flex flex-col items-center rounded-2xl border p-4 transition-all duration-300 ${
        active
          ? "border-[#C8F04D]/40 bg-[#C8F04D]/5 shadow-[0_0_24px_rgba(200,240,77,0.12)]"
          : "border-white/10 bg-[#141414]"
      }`}
    >
      <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-gradient-to-b from-[#2A2A2A] to-[#111111]">
        <User size={28} className="text-white/80" strokeWidth={1.5} />
        {active ? (
          <motion.span
            className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-[#C8F04D]"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        ) : null}
      </div>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-white/50">Campaign Team</p>
    </div>
  );
}

function FlowArrow({ active, horizontal = true }: { active: boolean; horizontal?: boolean }) {
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center ${
        horizontal ? "h-8 w-6 sm:w-10" : "h-6 w-full"
      }`}
    >
      <div
        className={`${horizontal ? "h-px w-full" : "h-full w-px"} ${
          active ? "bg-[#C8F04D]/60" : "bg-white/10"
        }`}
      />
      {active ? (
        <motion.div
          className={`absolute h-2 w-2 rounded-full bg-[#C8F04D] shadow-[0_0_8px_rgba(200,240,77,0.8)] ${
            horizontal ? "" : ""
          }`}
          animate={horizontal ? { left: ["0%", "100%"], opacity: [0, 1, 1, 0] } : { top: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          style={horizontal ? { top: "50%", transform: "translateY(-50%)" } : { left: "50%", transform: "translateX(-50%)" }}
        />
      ) : null}
    </div>
  );
}

function CoreEngineHub({ active }: { active: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative flex h-20 w-20 items-center justify-center rounded-2xl border transition-all duration-300 sm:h-24 sm:w-24 ${
          active
            ? "border-[#C8F04D]/50 bg-[#1A1A1A] shadow-[0_0_32px_rgba(200,240,77,0.2)]"
            : "border-white/15 bg-[#0D0D0D]"
        }`}
      >
        {!active ? null : (
          <motion.div
            className="absolute inset-0 rounded-2xl bg-[#C8F04D]/5"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        <Brain className={active ? "text-[#C8F04D]" : "text-white/60"} size={32} strokeWidth={1.5} />
      </div>
      <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
        Core Engine
      </p>
    </div>
  );
}

function LaunchNode({ active }: { active: boolean }) {
  return (
    <div
      className={`flex flex-col items-center rounded-2xl border px-4 py-5 transition-all duration-300 sm:px-5 ${
        active
          ? "border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_28px_rgba(16,185,129,0.15)]"
          : "border-white/10 bg-[#141414]"
      }`}
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full ${
          active ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-white/40"
        }`}
      >
        <Rocket size={22} />
      </div>
      <p className="mt-3 max-w-[120px] text-center text-xs font-black leading-tight text-white sm:text-sm">
        Campaign Launch with Perfection
      </p>
    </div>
  );
}

export default function PipelineCoreEngine() {
  const reduceMotion = useReducedMotion();
  const [tick, setTick] = useState(0);

  const totalSteps = 1 + INPUTS.length + 1 + OUTPUTS.length + 1;
  const step = tick % totalSteps;

  let activeInput = -1;
  let activeOutput = -1;
  let userActive = false;
  let engineActive = false;
  let launchActive = false;
  let arrowUserToInput = false;
  let arrowInputToEngine = false;
  let arrowEngineToOutput = false;
  let arrowOutputToLaunch = false;

  if (step === 0) {
    userActive = true;
    arrowUserToInput = true;
  } else if (step <= INPUTS.length) {
    activeInput = step - 1;
    arrowInputToEngine = activeInput === INPUTS.length - 1;
  } else if (step === INPUTS.length + 1) {
    engineActive = true;
    arrowEngineToOutput = true;
  } else if (step <= INPUTS.length + 1 + OUTPUTS.length) {
    activeOutput = step - INPUTS.length - 2;
    arrowOutputToLaunch = activeOutput === OUTPUTS.length - 1;
  } else {
    launchActive = true;
  }

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1400);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const phase = getPhase(step);

  if (reduceMotion) {
    userActive = false;
    engineActive = true;
    launchActive = false;
    activeInput = INPUTS.length - 1;
    activeOutput = OUTPUTS.length - 1;
  }

  return (
    <div className="pipeline-core-engine relative overflow-hidden rounded-2xl border border-[#2A2A2A] bg-[#0A0A0A] shadow-[0_16px_48px_rgba(0,0,0,0.35)] sm:rounded-3xl">
      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Desktop horizontal flow */}
      <div className="relative hidden p-6 lg:block xl:p-8">
        <div className="flex items-center gap-2 xl:gap-3">
          <UserIllustration active={userActive || (phase === "input" && activeInput === 0)} />
          <FlowArrow active={arrowUserToInput || activeInput >= 0} />

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            {INPUTS.map((node, i) => (
              <FlowNodeCard key={node.id} node={node} active={i <= activeInput && phase !== "user"} />
            ))}
          </div>

          <FlowArrow active={arrowInputToEngine || engineActive || phase === "output" || phase === "launch"} />

          <CoreEngineHub active={engineActive || phase === "output" || phase === "launch"} />

          <FlowArrow active={arrowEngineToOutput || activeOutput >= 0 || launchActive} />

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            {OUTPUTS.map((node, i) => (
              <FlowNodeCard key={node.id} node={node} active={i <= activeOutput && (phase === "output" || phase === "launch")} />
            ))}
          </div>

          <FlowArrow active={arrowOutputToLaunch || launchActive} />

          <LaunchNode active={launchActive} />
        </div>
      </div>

      {/* Mobile / tablet vertical flow */}
      <div className="space-y-2 p-4 sm:p-5 lg:hidden">
        <div className="flex justify-center">
          <UserIllustration active={userActive} />
        </div>
        <FlowArrow active={arrowUserToInput} horizontal={false} />

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {INPUTS.map((node, i) => (
            <FlowNodeCard key={node.id} node={node} active={i <= activeInput} compact />
          ))}
        </div>

        <FlowArrow active={arrowInputToEngine || engineActive} horizontal={false} />

        <div className="flex justify-center">
          <CoreEngineHub active={engineActive || phase === "output" || phase === "launch"} />
        </div>

        <FlowArrow active={arrowEngineToOutput || activeOutput >= 0} horizontal={false} />

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {OUTPUTS.map((node, i) => (
            <FlowNodeCard key={node.id} node={node} active={i <= activeOutput} compact />
          ))}
        </div>

        <FlowArrow active={arrowOutputToLaunch || launchActive} horizontal={false} />

        <div className="flex justify-center">
          <LaunchNode active={launchActive} />
        </div>
      </div>

      <div className="border-t border-white/5 bg-[#111111]/90 px-4 py-2.5 backdrop-blur-sm sm:px-5">
        <p className="text-center text-[11px] text-white/45 sm:text-xs">
          Campaign team → inputs → validation engine → outputs → launch ready
        </p>
      </div>
    </div>
  );
}
