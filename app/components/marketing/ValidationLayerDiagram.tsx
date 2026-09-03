"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  FileText,
  Megaphone,
  Palette,
  Rocket,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const BLACK_BOX_COPY =
  "Campaign managers, creative teams, and Ad Operations often work in separate systems. Adigator IQ validates every campaign task before execution so issues are caught before they become rework.";

const PRE_HANDOFF = [
  { label: "Client Brief", icon: FileText },
  { label: "Creative Team", icon: Palette },
  { label: "Campaign Manager", icon: Briefcase },
];

const POST_HANDOFF = [
  { label: "Ad Operations", icon: Megaphone },
  { label: "Task Executed", icon: Rocket },
];

const COMPARISON_ITEMS = [
  { without: "Back-and-forth between teams", with: "Validate once, execute confidently" },
  { without: "Last-minute campaign changes", with: "Catch issues before execution" },
  { without: "Manual QA checklists", with: "Automated campaign validation" },
  { without: "Creative and landing page mismatches", with: "Campaign assets stay aligned" },
  { without: "Missing URLs, UTMs, and tracking", with: "Technical requirements validated" },
  { without: "Delayed campaign execution", with: "Faster campaign readiness" },
  { without: "Repeated rework", with: "Reduced operational effort" },
  { without: "Wasted media spend from preventable mistakes", with: "Greater confidence before execution" },
];

function FlowArrow({ className = "" }: { className?: string }) {
  return (
    <div className={`flex shrink-0 items-center text-[#C8F04D]/50 ${className}`} aria-hidden>
      <div className="h-px w-4 bg-current sm:w-6" />
      <ArrowRight size={14} className="-ml-0.5" />
    </div>
  );
}

function RailStep({
  label,
  icon: Icon,
  delay = 0,
  reduceMotion,
}: {
  label: string;
  icon: LucideIcon;
  delay?: number;
  reduceMotion: boolean;
}) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.35 }}
      className="group flex min-w-[132px] flex-1 flex-col items-center"
    >
      <div className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#141414] px-3 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition group-hover:border-[#C8F04D]/30 group-hover:bg-[#1A1A1A] sm:px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-white/70 group-hover:bg-[#C8F04D]/10 group-hover:text-[#C8F04D]">
          <Icon size={16} strokeWidth={1.75} />
        </div>
        <span className="text-center text-xs font-bold leading-tight text-white sm:text-sm">{label}</span>
      </div>
    </motion.div>
  );
}

function HorizontalRail({
  steps,
  reduceMotion,
  baseDelay = 0,
}: {
  steps: Array<{ label: string; icon: LucideIcon }>;
  reduceMotion: boolean;
  baseDelay?: number;
}) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:gap-2 sm:overflow-visible sm:pb-0">
      {steps.map((step, index) => (
        <div key={step.label} className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
          <RailStep
            label={step.label}
            icon={step.icon}
            delay={baseDelay + index * 0.05}
            reduceMotion={reduceMotion}
          />
          {index < steps.length - 1 ? <FlowArrow className="hidden sm:flex" /> : null}
        </div>
      ))}
    </div>
  );
}

function ScrollingComparison({ reduceMotion }: { reduceMotion: boolean }) {
  const [index, setIndex] = useState(0);
  const item = COMPARISON_ITEMS[index];

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % COMPARISON_ITEMS.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  return (
    <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-[#0D0D0D]">
      <div className="grid grid-cols-2 border-b border-white/10 bg-[#111111]">
        <div className="flex items-center justify-center gap-2 border-r border-white/10 px-3 py-2.5">
          <XCircle size={14} className="text-rose-400" />
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-rose-300/90 sm:text-[11px]">
            Without Adigator IQ
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 px-3 py-2.5">
          <CheckCircle2 size={14} className="text-[#C8F04D]" />
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#D4F56A] sm:text-[11px]">
            With Adigator IQ
          </p>
        </div>
      </div>

      <div className="relative h-[88px] overflow-hidden sm:h-[96px]" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -18 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            className="absolute inset-0 grid grid-cols-2"
          >
            <div className="flex items-center border-r border-white/8 bg-rose-950/20 px-4 py-3 sm:px-5">
              <p className="text-sm font-semibold leading-snug text-rose-100/90 sm:text-[15px]">
                <span className="mr-1.5" aria-hidden>❌</span>
                {item.without}
              </p>
            </div>
            <div className="flex items-center bg-[#C8F04D]/5 px-4 py-3 sm:px-5">
              <p className="text-sm font-semibold leading-snug text-white sm:text-[15px]">
                <span className="mr-1.5" aria-hidden>✅</span>
                {item.with}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-center gap-1.5 border-t border-white/8 bg-[#111111]/80 px-3 py-2">
        {COMPARISON_ITEMS.map((_, dotIndex) => (
          <span
            key={dotIndex}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              dotIndex === index ? "w-5 bg-[#C8F04D]" : "w-1.5 bg-white/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function ValidationLayerDiagram({
  embedded = false,
  eyebrow = "",
  title = "Campaigns break in the handoff, not in the ad platform.",
  description = "",
  gapLabel = "No one validates whether everything actually aligns.",
}: {
  embedded?: boolean;
  eyebrow?: string;
  title?: string;
  description?: string;
  gapLabel?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <section
      className={
        embedded
          ? "mt-6 sm:mt-8"
          : "marketing-section marketing-section-compact mx-auto w-[min(1280px,92vw)]"
      }
    >
      <div className="mb-5 max-w-3xl sm:mb-6">
        {eyebrow ? (
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6B7280]">{eyebrow}</p>
        ) : null}
        <h2 className={`${eyebrow ? "mt-3" : ""} text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl`}>
          {title}
        </h2>
        {description ? (
          <p className="mt-3 text-base leading-relaxed text-[#5A5A55] sm:text-lg">
            {description}
          </p>
        ) : null}
      </div>

      <div className="relative overflow-hidden rounded-[28px] border border-[#2A2A2A] bg-[#0A0A0A] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.28)] sm:p-6 lg:p-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(200,240,77,0.08),transparent_55%)]" aria-hidden />

        <div className="relative space-y-5 sm:space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#0D0D0D] px-4 py-4 sm:px-5 sm:py-5">
            <p className="text-sm leading-relaxed text-white/75 sm:text-base">{BLACK_BOX_COPY}</p>
          </div>

          <HorizontalRail steps={PRE_HANDOFF} reduceMotion={!!reduceMotion} />
          <ScrollingComparison reduceMotion={!!reduceMotion} />
          <HorizontalRail steps={POST_HANDOFF} reduceMotion={!!reduceMotion} baseDelay={0.2} />
        </div>
      </div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-5 flex items-center justify-center gap-2.5 rounded-2xl border border-[#C8F04D]/30 bg-gradient-to-r from-[#F7FCE8] via-white to-[#F7FCE8] px-5 py-3.5 text-center sm:mt-6"
      >
        <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
        <p className="text-sm font-semibold text-[#0D0D0D] sm:text-base">
          Adigator IQ validates every layer before a single dollar of media is spent.
        </p>
      </motion.div>
    </section>
  );
}
