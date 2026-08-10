"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

const STEPS = [
  "Campaign starts",
  "Creative created",
  "Landing page built",
  "Campaign configured",
  "Platform selected",
  "Adigator validates everything",
  "Campaign launches confidently",
];

export default function CampaignJourneyFlow() {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % STEPS.length);
    }, 2400);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#DEDDD5] bg-[#0D0D0D] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.12)] sm:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(200,240,77,0.1),transparent_55%)]" />
      {!reduceMotion ? (
        <div className="agi-journey-sweep pointer-events-none absolute inset-0 opacity-30" aria-hidden />
      ) : null}

      {/* Desktop horizontal flow */}
      <div className="relative hidden lg:block">
        <div className="relative mb-8">
          <div className="absolute left-[4%] right-[4%] top-1/2 h-px -translate-y-1/2 bg-white/10" />
          {!reduceMotion ? (
            <div className="agi-journey-pulse absolute left-[4%] top-1/2 h-0.5 w-[8%] -translate-y-1/2 rounded-full bg-gradient-to-r from-transparent via-[#C8F04D] to-transparent" />
          ) : null}
          <div className="relative flex items-stretch justify-between gap-2">
            {STEPS.map((step, i) => {
              const active = i === activeIndex;
              const passed = i < activeIndex;
              const isValidation = step === "Adigator validates everything";
              return (
                <div key={step} className="flex flex-1 flex-col items-center">
                  <div
                    className={`relative w-full overflow-hidden rounded-xl border px-2 py-3 text-center text-[11px] font-semibold leading-tight xl:text-xs ${
                      active ? "agi-journey-step-active" : ""
                    } ${
                      isValidation
                        ? "border-[#C8F04D]/50 bg-[#C8F04D]/15 text-[#C8F04D]"
                        : active
                          ? "border-white/30 bg-white/10 text-white"
                          : passed
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                            : "border-white/10 bg-white/5 text-white/50"
                    }`}
                  >
                    {isValidation && active && !reduceMotion ? (
                      <span className="agi-journey-shimmer pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,transparent,rgba(200,240,77,0.2),transparent)]" />
                    ) : null}
                    <span className="relative flex items-center justify-center gap-1">
                      {isValidation ? <Sparkles size={12} className="shrink-0" aria-hidden /> : null}
                      {step}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <motion.p
          key={`caption-${activeIndex}`}
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 text-center text-sm text-white/60"
        >
          <CheckCircle2 size={16} className="text-[#C8F04D]" />
          <span>
            Now at: <span className="font-semibold text-white/90">{STEPS[activeIndex]}</span>
          </span>
        </motion.p>
      </div>

      {/* Mobile vertical flow */}
      <div className="relative space-y-1 lg:hidden">
        {STEPS.map((step, i) => {
          const active = i === activeIndex;
          const passed = i < activeIndex;
          const isValidation = step === "Adigator validates everything";
          return (
            <div key={step} className="flex flex-col items-center">
              <div
                className={`w-full rounded-xl border px-4 py-3 text-center text-sm font-semibold ${
                  active ? "agi-journey-step-active" : ""
                } ${
                  isValidation
                    ? "border-[#C8F04D]/50 bg-[#C8F04D]/15 text-[#C8F04D]"
                    : active
                      ? "border-white/30 bg-white/10 text-white"
                      : passed
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                        : "border-white/10 bg-white/5 text-white/60"
                }`}
              >
                {step}
              </div>
              {i < STEPS.length - 1 ? (
                <div className={active && !reduceMotion ? "agi-journey-arrow" : "opacity-30"}>
                  <ArrowRight size={16} className="my-1 rotate-90 text-white/30" aria-hidden />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
