"use client";
import { useEffect, useState } from "react";

interface StrategicCardModel {
  label: string;
  emphasis: string;
  summary: string;
  guidance: string;
  icon: string;
  color: string;
  glow: string;
}

const STRATEGIC_CARDS: StrategicCardModel[] = [
  {
    label: "Main Strategic Problem",
    emphasis: "Clarify primary friction before scale",
    summary: "Anchor each launch decision on the dominant strategic conflict.",
    guidance: "Prioritize the top orchestrator issue before creative iteration.",
    icon: "MS",
    color: "from-violet-600/20 to-violet-800/10",
    glow: "shadow-violet-500/10",
  },
  {
    label: "Audience Resistance",
    emphasis: "Diagnose why audiences hesitate",
    summary: "Translate resistance into concrete strategic response changes.",
    guidance: "Align value framing, trust cues, and action pressure with audience intent.",
    icon: "AR",
    color: "from-cyan-600/20 to-cyan-800/10",
    glow: "shadow-cyan-500/10",
  },
  {
    label: "Business Consequence",
    emphasis: "Connect message behavior to commercial risk",
    summary: "Every creative issue should map to an expected business outcome.",
    guidance: "Use consequence mapping to focus revisions that protect spend quality.",
    icon: "BC",
    color: "from-emerald-600/20 to-emerald-800/10",
    glow: "shadow-emerald-500/10",
  },
  {
    label: "Strategic Recommendation",
    emphasis: "Convert intelligence into immediate action",
    summary: "Use orchestrator recommendations as the execution roadmap.",
    guidance: "Implement top recommendations and re-evaluate alignment after each change.",
    icon: "SR",
    color: "from-amber-600/20 to-amber-800/10",
    glow: "shadow-amber-500/10",
  },
];

function useReveal(duration = 500) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    function step(ts: number) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCurrent(ease);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [duration]);
  return current;
}

function StrategicCard({ card, index }: { card: StrategicCardModel; index: number }) {
  const reveal = useReveal(900);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        relative rounded-2xl border border-white/10 p-5 cursor-default
        transition-all duration-300 overflow-hidden
        bg-linear-to-br ${card.color}
        ${hovered ? `scale-[1.02] shadow-2xl ${card.glow} border-white/20` : "scale-100"}
      `}
      style={{
        animationDelay: `${index * 100}ms`,
        background: hovered ? undefined : "rgba(255,255,255,0.02)",
      }}
    >
      {/* Decorative circle */}
      <div
        className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10
        bg-linear-to-br ${card.color}`}
      />

      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-sm
          bg-white/10 border border-white/10"
        >
          {card.icon}
        </div>
        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
          STRATEGIC
        </span>
      </div>

      <div>
        <p
          className="text-lg font-bold text-white tracking-tight"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {card.label}
        </p>
        <p
          className="text-xs text-cyan-200/90 mt-1"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {card.emphasis}
        </p>
        <p className="text-[11px] text-white/70 mt-3 leading-relaxed">{card.summary}</p>
        <p className="text-[11px] text-white/50 mt-2 leading-relaxed">{card.guidance}</p>
      </div>

      <div className="mt-3 h-2 flex items-end gap-0.5 opacity-40">
        {[15, 35, 55, 75, 100].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm bg-white transition-all duration-500"
            style={{ height: `${h * reveal}%`, opacity: hovered ? 0.7 : 0.35 }}
          />
        ))}
      </div>
    </div>
  );
}

export default function DashboardCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {STRATEGIC_CARDS.map((card, i) => (
        <StrategicCard key={card.label} card={card} index={i} />
      ))}
    </div>
  );
}
