"use client";
import { useEffect, useState } from "react";

interface Metric {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  change: number;
  icon: string;
  color: string;
  glow: string;
  decimals?: number;
}

const BASE_METRICS: Metric[] = [
  {
    label: "Total Users",
    value: 48291,
    change: 12.4,
    icon: "◎",
    color: "from-violet-600/20 to-violet-800/10",
    glow: "shadow-violet-500/10",
  },
  {
    label: "Revenue",
    prefix: "$",
    value: 128450,
    change: 8.7,
    icon: "◆",
    color: "from-cyan-600/20 to-cyan-800/10",
    glow: "shadow-cyan-500/10",
  },
  {
    label: "Ad Orders",
    value: 3842,
    change: -3.2,
    icon: "◈",
    color: "from-emerald-600/20 to-emerald-800/10",
    glow: "shadow-emerald-500/10",
  },
  {
    label: "Avg CTR",
    value: 4.73,
    suffix: "%",
    change: 21.5,
    icon: "⬡",
    color: "from-amber-600/20 to-amber-800/10",
    glow: "shadow-amber-500/10",
    decimals: 2,
  },
];

function useAnimatedValue(target: number, duration = 1200) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    const initial = 0;
    function step(ts: number) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCurrent(initial + (target - initial) * ease);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [target, duration]);
  return current;
}

function KPICard({ metric, index }: { metric: Metric; index: number }) {
  const animated = useAnimatedValue(metric.value);
  const [hovered, setHovered] = useState(false);
  const positive = metric.change >= 0;

  const displayValue =
    metric.decimals !== undefined
      ? animated.toFixed(metric.decimals)
      : Math.round(animated).toLocaleString();

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        relative rounded-2xl border border-white/10 p-5 cursor-default
        transition-all duration-300 overflow-hidden
        bg-gradient-to-br ${metric.color}
        ${hovered ? `scale-[1.02] shadow-2xl ${metric.glow} border-white/20` : "scale-100"}
      `}
      style={{
        animationDelay: `${index * 100}ms`,
        background: hovered ? undefined : "rgba(255,255,255,0.02)",
      }}
    >
      {/* Decorative circle */}
      <div
        className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10
        bg-gradient-to-br ${metric.color}`}
      />

      <div className="flex items-start justify-between mb-4">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-sm
          bg-white/10 border border-white/10"
        >
          {metric.icon}
        </div>
        <span
          className={`
          flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full
          ${
            positive
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }
        `}
        >
          {positive ? "↑" : "↓"} {Math.abs(metric.change)}%
        </span>
      </div>

      <div>
        <p
          className="text-2xl font-bold text-white tracking-tight"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {metric.prefix}
          {displayValue}
          {metric.suffix}
        </p>
        <p
          className="text-xs text-white/40 mt-1"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {metric.label}
        </p>
      </div>

      {/* Mini sparkline */}
      <div className="mt-3 h-8 flex items-end gap-0.5 opacity-30">
        {[40, 65, 45, 70, 55, 80, 60, 90, 75, 100].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm bg-white transition-all duration-500"
            style={{ height: `${h}%`, opacity: hovered ? 0.6 : 0.3 }}
          />
        ))}
      </div>
    </div>
  );
}

export default function DashboardCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {BASE_METRICS.map((m, i) => (
        <KPICard key={m.label} metric={m} index={i} />
      ))}
    </div>
  );
}