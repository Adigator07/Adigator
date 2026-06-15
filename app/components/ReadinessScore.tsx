"use client";

import type { ReadinessLevel } from "@/app/types/validation";

const LEVEL_CONFIG: Record<
  ReadinessLevel,
  { label: string; color: string; ring: string; text: string }
> = {
  ready: {
    label: "Ready",
    color: "#10b981",
    ring: "#059669",
    text: "text-emerald-700",
  },
  review_needed: {
    label: "Review Needed",
    color: "#f59e0b",
    ring: "#d97706",
    text: "text-amber-700",
  },
  not_ready: {
    label: "Not Ready",
    color: "#ef4444",
    ring: "#dc2626",
    text: "text-red-700",
  },
};

export default function ReadinessScore({
  score,
  level,
  size = 120,
}: {
  score: number;
  level: ReadinessLevel;
  size?: number;
}) {
  const config = LEVEL_CONFIG[level];
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="8"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={config.color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-slate-900">{score}</span>
          <span className="text-[10px] uppercase tracking-wide text-slate-500">/ 100</span>
        </div>
      </div>
      <span className={`text-sm font-bold ${config.text}`}>{config.label}</span>
    </div>
  );
}
