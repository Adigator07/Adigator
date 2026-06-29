"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, Check } from "lucide-react";

const FLOW_STEPS_BEFORE = ["Client Brief", "Creative Team", "Campaign Manager"] as const;

const VALIDATION_CHECKS = [
  "Campaign Objective",
  "Creative Messaging",
  "Landing Page",
  "Destination URL",
  "UTM Parameters",
  "Platform Requirements",
  "Placement Compatibility",
  "Technical QA",
  "Brand & Vertical Alignment",
] as const;

const FLOW_STEPS_AFTER = ["Ad Operations", "Campaign Setup", "Launch"] as const;

function FlowNode({ label, reduceMotion }: { label: string; reduceMotion: boolean }) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      className="w-full max-w-xs rounded-xl border border-[#DEDDD5] bg-white px-5 py-3.5 text-center text-xs font-bold uppercase tracking-[0.14em] text-[#0D0D0D] sm:text-sm"
    >
      {label}
    </motion.div>
  );
}

function FlowArrow() {
  return (
    <div className="flex flex-col items-center py-1.5">
      <ArrowDown size={18} className="text-[#9CA3AF]" aria-hidden />
    </div>
  );
}

export default function CampaignValidationCheckpoint() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="marketing-section marketing-section-compact mx-auto w-[min(1280px,92vw)]">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
          Every campaign passes through multiple teams. Validation should too.
        </h2>
        <p className="mt-5 text-base leading-relaxed text-[#5A5A55] sm:text-lg">
          Adigator becomes the final checkpoint before campaign setup, validating every campaign input before media
          spend begins.
        </p>
      </div>

      <div className="mx-auto mt-12 flex max-w-md flex-col items-center">
        {FLOW_STEPS_BEFORE.map((step) => (
          <div key={step} className="flex w-full flex-col items-center">
            <FlowNode label={step} reduceMotion={!!reduceMotion} />
            <FlowArrow />
          </div>
        ))}

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#C8F04D]/50 bg-[#C8F04D]/10 shadow-[0_0_32px_rgba(200,240,77,0.15)]"
        >
          <div className="border-b border-[#C8F04D]/30 bg-[#C8F04D]/20 px-4 py-3 text-center">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#0D0D0D] sm:text-sm">
              Adigator Validation
            </p>
          </div>
          <ul className="grid gap-2.5 px-4 py-5 sm:grid-cols-2 sm:gap-3 sm:px-5 sm:py-6">
            {VALIDATION_CHECKS.map((item, i) => (
              <motion.li
                key={item}
                initial={reduceMotion ? false : { opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="flex items-start gap-2 text-sm font-semibold text-[#0D0D0D]"
              >
                <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden />
                <span>{item}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <FlowArrow />

        {FLOW_STEPS_AFTER.map((step, i) => (
          <div key={step} className="flex w-full flex-col items-center">
            <FlowNode label={step} reduceMotion={!!reduceMotion} />
            {i < FLOW_STEPS_AFTER.length - 1 ? <FlowArrow /> : null}
          </div>
        ))}
      </div>

      <motion.p
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mx-auto mt-10 max-w-3xl text-center text-lg font-black leading-snug tracking-tight text-[#0D0D0D] sm:text-xl"
      >
        Because fixing campaigns before setup is faster and far less expensive than fixing them after launch.
      </motion.p>
    </section>
  );
}
