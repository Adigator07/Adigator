/** Dark neon theme tokens for Step 3 analysis panels inside Preview Tool */

export const RISK_TONES = {
  emerald: {
    border: "border-emerald-400/35",
    bg: "bg-emerald-500/10",
    text: "text-emerald-100",
    badge: "text-emerald-100 bg-emerald-500/20 border-emerald-400/40",
    subtext: "text-emerald-200/90",
  },
  amber: {
    border: "border-amber-400/35",
    bg: "bg-amber-500/10",
    text: "text-amber-100",
    badge: "text-amber-100 bg-amber-500/20 border-amber-400/40",
    subtext: "text-amber-200/90",
  },
  red: {
    border: "border-rose-400/35",
    bg: "bg-rose-500/10",
    text: "text-rose-100",
    badge: "text-rose-100 bg-rose-500/20 border-rose-400/40",
    subtext: "text-rose-200/90",
  },
};

export const PANEL = {
  section: "neon-card rounded-2xl border border-white/12 p-5",
  sectionSm: "neon-card rounded-xl border border-white/12 p-4",
  inset: "rounded-lg border border-white/10 bg-black/25 p-3",
  insetMuted: "rounded-lg border border-white/10 bg-white/[0.04] p-3",
  heading: "text-sm font-semibold text-[#f4f4f8]",
  label: "text-[10px] font-semibold uppercase tracking-wider text-[#9a9aad]",
  body: "text-sm text-[#d4d4de] leading-relaxed",
  bodyStrong: "text-sm text-[#f4f4f8] leading-relaxed",
  title: "text-xl font-black text-[#f4f4f8]",
  statValue: "text-3xl font-black leading-none text-[#f4f4f8] tabular-nums",
};

export const STAT_ACCENTS = {
  slate: "border-white/12 bg-white/[0.05]",
  emerald: "border-emerald-400/35 bg-emerald-500/12 shadow-[0_0_20px_-6px_rgba(74,222,128,0.25)]",
  amber: "border-amber-400/35 bg-amber-500/12 shadow-[0_0_20px_-6px_rgba(251,191,36,0.25)]",
  red: "border-rose-400/35 bg-rose-500/12 shadow-[0_0_20px_-6px_rgba(251,113,133,0.25)]",
  violet: "border-violet-400/35 bg-violet-500/12 shadow-[0_0_20px_-6px_rgba(167,139,250,0.25)]",
};

export const INSIGHT_TONES = {
  emerald: "border-emerald-400/30 bg-emerald-500/8",
  amber: "border-amber-400/30 bg-amber-500/8",
  sky: "border-cyan-400/30 bg-cyan-500/8",
};

export const ALIGNMENT_BADGE = {
  emerald: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
  amber: "border-amber-400/40 bg-amber-500/15 text-amber-200",
  red: "border-rose-400/40 bg-rose-500/15 text-rose-200",
};

export const PRESENCE_TONES = {
  detected: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
  partial: "border-amber-400/40 bg-amber-500/15 text-amber-200",
  not_detected: "border-rose-400/40 bg-rose-500/15 text-rose-200",
};
