"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Train } from "lucide-react";

const ROADMAP_MILESTONES = [
  "Campaign Validation",
  "Campaign Intelligence",
  "Campaign Memory",
  "Enterprise Workflow",
  "Audience Intelligence",
  "Operational Intelligence",
] as const;

const STOP_MS = 2800;

export default function AboutPlatformRoadmap() {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % ROADMAP_MILESTONES.length);
    }, STOP_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const progress =
    ROADMAP_MILESTONES.length <= 1 ? 0 : activeIndex / (ROADMAP_MILESTONES.length - 1);

  return (
    <section className="marketing-section marketing-section-compact mx-auto w-[min(1280px,92vw)]">
      <div className="relative overflow-hidden rounded-[28px] border border-[#2A2A2A] bg-[#0A0A0A] px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(200,240,77,0.1),transparent_55%)]"
          aria-hidden
        />

        <div className="relative">
          <h2 className="text-center text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            Where We Are Going
          </h2>

          {/* Desktop horizontal track */}
          <div className="relative mt-12 hidden lg:block">
            <div className="absolute left-[4%] right-[4%] top-[22px] h-1 rounded-full bg-white/10" />
            <motion.div
              className="absolute left-[4%] top-[22px] h-1 rounded-full bg-gradient-to-r from-[#C8F04D]/40 via-[#C8F04D] to-[#C8F04D]/40"
              animate={{ width: `${progress * 92}%` }}
              transition={{ duration: reduceMotion ? 0 : 0.65, ease: "easeInOut" }}
            />

            <motion.div
              className="absolute top-0 z-10 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full border border-[#C8F04D]/50 bg-[#1A1A1A] shadow-[0_0_24px_rgba(200,240,77,0.35)]"
              animate={{ left: `${4 + progress * 92}%` }}
              transition={{ duration: reduceMotion ? 0 : 0.65, ease: "easeInOut" }}
              aria-hidden
            >
              <Train size={18} className="text-[#C8F04D]" />
            </motion.div>

            <div className="grid grid-cols-6 gap-3 pt-14">
              {ROADMAP_MILESTONES.map((milestone, index) => {
                const isActive = index === activeIndex;
                const isPast = index < activeIndex;
                return (
                  <motion.div
                    key={milestone}
                    animate={{
                      scale: isActive && !reduceMotion ? 1.04 : 1,
                      opacity: isActive || isPast ? 1 : 0.55,
                    }}
                    transition={{ duration: 0.35 }}
                    className="flex flex-col items-center text-center"
                  >
                    <div
                      className={`mb-3 flex h-3 w-3 rounded-full border-2 transition-colors ${
                        isActive
                          ? "border-[#C8F04D] bg-[#C8F04D] shadow-[0_0_12px_rgba(200,240,77,0.6)]"
                          : isPast
                            ? "border-[#C8F04D]/60 bg-[#C8F04D]/40"
                            : "border-white/25 bg-[#111111]"
                      }`}
                    />
                    <p
                      className={`text-xs font-bold leading-snug tracking-tight sm:text-sm ${
                        isActive ? "text-[#C8F04D]" : "text-white/70"
                      }`}
                    >
                      {milestone}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Mobile / tablet vertical track */}
          <div className="relative mt-10 lg:hidden">
            <div className="absolute bottom-4 left-[18px] top-4 w-1 rounded-full bg-white/10" />
            <motion.div
              className="absolute left-[18px] top-4 w-1 rounded-full bg-gradient-to-b from-[#C8F04D]/40 via-[#C8F04D] to-[#C8F04D]/40"
              animate={{ height: `${progress * 100}%` }}
              transition={{ duration: reduceMotion ? 0 : 0.65, ease: "easeInOut" }}
            />

            <div className="space-y-6 pl-12">
              {ROADMAP_MILESTONES.map((milestone, index) => {
                const isActive = index === activeIndex;
                return (
                  <motion.div
                    key={milestone}
                    animate={{ opacity: isActive ? 1 : 0.5, x: isActive && !reduceMotion ? 4 : 0 }}
                    transition={{ duration: 0.35 }}
                    className={`relative rounded-xl border px-4 py-3 ${
                      isActive
                        ? "border-[#C8F04D]/40 bg-[#C8F04D]/10"
                        : "border-white/10 bg-[#141414]"
                    }`}
                  >
                    <div
                      className={`absolute -left-[30px] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 ${
                        isActive ? "border-[#C8F04D] bg-[#C8F04D]" : "border-white/25 bg-[#111111]"
                      }`}
                    />
                    <p className={`text-sm font-bold ${isActive ? "text-[#C8F04D]" : "text-white/75"}`}>
                      {milestone}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 rounded-2xl border border-[#C8F04D]/30 bg-gradient-to-r from-[#1A1A1A] via-[#141414] to-[#1A1A1A] px-6 py-8 text-center sm:mt-14 sm:px-10 sm:py-10"
          >
            <p className="text-xl font-black leading-snug tracking-tight text-white sm:text-2xl lg:text-3xl">
              Every Campaign Deserves Confidence Before Execution.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
