"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion, useSpring, useTransform } from "framer-motion";
import type { ReadinessLevel } from "@/app/types/validation";

const LEVEL_CONFIG: Record<
  ReadinessLevel,
  { label: string; color: string; ring: string; text: string }
> = {
  ready: {
    label: "Ready",
    color: "#34d399",
    ring: "#10b981",
    text: "text-emerald-400",
  },
  review_needed: {
    label: "Review Needed",
    color: "#fbbf24",
    ring: "#f59e0b",
    text: "text-amber-400",
  },
  not_ready: {
    label: "Not Ready",
    color: "#fb7185",
    ring: "#f43f5e",
    text: "text-rose-400",
  },
};

function scoreColorForValue(value: number) {
  if (value >= 85) return LEVEL_CONFIG.ready.color;
  if (value >= 70) return LEVEL_CONFIG.review_needed.color;
  return LEVEL_CONFIG.not_ready.color;
}

export default function ReadinessScore({
  score,
  level,
  size = 120,
  theme = "light",
}: {
  score: number;
  level: ReadinessLevel;
  size?: number;
  theme?: "light" | "dark";
}) {
  const reduceMotion = useReducedMotion();
  const config = LEVEL_CONFIG[level];
  const isDark = theme === "dark";
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;

  const springScore = useSpring(reduceMotion ? score : 0, {
    stiffness: 80,
    damping: 18,
    mass: 0.8,
  });

  const [displayScore, setDisplayScore] = useState(reduceMotion ? score : 0);
  const animatedOffset = useTransform(springScore, (value) => {
    const clamped = Math.max(0, Math.min(100, value));
    return circumference - (clamped / 100) * circumference;
  });

  const arcColor = useMemo(() => scoreColorForValue(displayScore), [displayScore]);
  const showGlow = level === "ready" && displayScore >= 85;

  useEffect(() => {
    springScore.set(score);
  }, [score, springScore]);

  useEffect(() => {
    const unsubscribe = springScore.on("change", (value) => {
      setDisplayScore(Math.round(value));
    });
    return () => unsubscribe();
  }, [springScore]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        {showGlow && !reduceMotion ? (
          <div
            className="studio-gauge-glow pointer-events-none absolute inset-2 rounded-full"
            style={{
              background: `radial-gradient(circle, ${config.color}55 0%, transparent 70%)`,
            }}
            aria-hidden
          />
        ) : null}
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}
            strokeWidth="8"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={reduceMotion ? config.color : arcColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ strokeDashoffset: animatedOffset }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`studio-tabular text-2xl font-bold tracking-tight ${isDark ? "text-studio-text" : "text-slate-900"}`}>
            {displayScore}
          </span>
          <span className={`text-[10px] uppercase tracking-wide ${isDark ? "text-studio-muted" : "text-slate-500"}`}>/ 100</span>
        </div>
      </div>
      <span className={`text-sm font-bold studio-heading ${config.text}`}>{config.label}</span>
    </div>
  );
}
