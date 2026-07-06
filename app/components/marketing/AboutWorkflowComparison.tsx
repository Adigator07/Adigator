"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";

const COMPARISON_ITEMS = [
  { without: "Multiple email threads to resolve issues", with: "One centralized validation workflow" },
  { without: "Repeated back-and-forth between teams", with: "Validate once, execute with confidence" },
  { without: "Campaign managers discover issues during setup", with: "Issues identified before execution" },
  { without: "Manual QA checklists and inconsistent reviews", with: "Standardized validation across every campaign task" },
  { without: "Creative, landing page, and tracking mismatches", with: "Assets stay aligned with campaign requirements" },
  { without: "Delayed campaign execution", with: "Faster campaign readiness" },
  { without: "Preventable operational mistakes", with: "Consistent campaign quality" },
];

export default function AboutWorkflowComparison() {
  const reduceMotion = useReducedMotion();
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
    <section className="marketing-section marketing-section-compact mx-auto w-[min(1280px,92vw)]">
      <div className="mb-6 max-w-3xl sm:mb-8">
        <h2 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
          Traditional workflows launch campaigns. They don&apos;t validate them.
        </h2>
      </div>

      <div className="relative overflow-hidden rounded-[28px] border border-[#2A2A2A] bg-[#0A0A0A] shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
          aria-hidden
        />

        <div className="grid grid-cols-2 border-b border-white/10 bg-[#111111]">
          <div className="flex items-center justify-center gap-2 border-r border-white/10 px-3 py-3 sm:px-5">
            <XCircle size={14} className="text-rose-400" />
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-rose-300/90 sm:text-[11px]">
              Without Adigator
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 px-3 py-3 sm:px-5">
            <CheckCircle2 size={14} className="text-[#C8F04D]" />
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#D4F56A] sm:text-[11px]">
              With Adigator
            </p>
          </div>
        </div>

        <div className="relative h-[96px] overflow-hidden sm:h-[104px]" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -18 }}
              transition={{ duration: 0.45, ease: "easeInOut" }}
              className="absolute inset-0 grid grid-cols-2"
            >
              <div className="flex items-center border-r border-white/8 bg-rose-950/20 px-4 py-4 sm:px-6">
                <p className="text-sm font-semibold leading-snug text-rose-100/90 sm:text-[15px]">{item.without}</p>
              </div>
              <div className="flex items-center bg-[#C8F04D]/5 px-4 py-4 sm:px-6">
                <p className="text-sm font-semibold leading-snug text-white sm:text-[15px]">{item.with}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-center gap-1.5 border-t border-white/8 bg-[#111111]/80 px-3 py-2.5">
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
    </section>
  );
}
