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
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % STEPS.length;
        if (next === 0) setPulseKey((k) => k + 1);
        return next;
      });
    }, 2000);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#DEDDD5] bg-[#0D0D0D] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.12)] sm:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(200,240,77,0.1),transparent_55%)]" />
      {!reduceMotion ? (
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-30"
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
          style={{
            backgroundImage:
              "linear-gradient(90deg, transparent 0%, rgba(200,240,77,0.08) 25%, transparent 50%, rgba(200,240,77,0.06) 75%, transparent 100%)",
            backgroundSize: "200% 100%",
          }}
        />
      ) : null}

      {/* Desktop horizontal flow */}
      <div className="relative hidden lg:block">
        <div className="relative mb-8">
          <div className="absolute left-[4%] right-[4%] top-1/2 h-px -translate-y-1/2 bg-white/10" />
          {!reduceMotion ? (
            <motion.div
              key={pulseKey}
              className="absolute left-[4%] top-1/2 h-0.5 w-[8%] -translate-y-1/2 rounded-full bg-gradient-to-r from-transparent via-[#C8F04D] to-transparent"
              initial={{ x: "0%" }}
              animate={{ x: "1000%" }}
              transition={{ duration: STEPS.length * 2, repeat: Infinity, ease: "linear" }}
            />
          ) : null}
          <div className="relative flex items-stretch justify-between gap-2">
            {STEPS.map((step, i) => {
              const active = i === activeIndex;
              const passed = i < activeIndex;
              const isValidation = step === "Adigator validates everything";
              return (
                <div key={step} className="flex flex-1 flex-col items-center">
                  <motion.div
                    layout
                    animate={
                      active && !reduceMotion
                        ? {
                            scale: [1, 1.05, 1],
                            boxShadow: [
                              "0 0 0 rgba(200,240,77,0)",
                              isValidation ? "0 0 32px rgba(200,240,77,0.45)" : "0 0 20px rgba(255,255,255,0.15)",
                              "0 0 0 rgba(200,240,77,0)",
                            ],
                          }
                        : { scale: 1 }
                    }
                    transition={{ duration: 1.4, repeat: active ? Infinity : 0, ease: "easeInOut" }}
                    className={`relative w-full overflow-hidden rounded-xl border px-2 py-3 text-center text-[11px] font-semibold leading-tight xl:text-xs ${
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
                      <motion.span
                        className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,transparent,rgba(200,240,77,0.2),transparent)]"
                        animate={{ x: ["-120%", "220%"] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                      />
                    ) : null}
                    <span className="relative flex items-center justify-center gap-1">
                      {isValidation ? <Sparkles size={12} className="shrink-0" aria-hidden /> : null}
                      {step}
                    </span>
                  </motion.div>
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
              <motion.div
                animate={
                  active && !reduceMotion
                    ? { scale: [1, 1.02, 1], borderColor: isValidation ? "rgba(200,240,77,0.7)" : "rgba(255,255,255,0.35)" }
                    : { scale: 1 }
                }
                transition={{ duration: 1.2, repeat: active ? Infinity : 0 }}
                className={`w-full rounded-xl border px-4 py-3 text-center text-sm font-semibold ${
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
              </motion.div>
              {i < STEPS.length - 1 ? (
                <motion.div
                  animate={active && !reduceMotion ? { opacity: [0.3, 1, 0.3] } : { opacity: 0.3 }}
                  transition={{ duration: 1, repeat: active ? Infinity : 0 }}
                >
                  <ArrowRight size={16} className="my-1 rotate-90 text-white/30" aria-hidden />
                </motion.div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
