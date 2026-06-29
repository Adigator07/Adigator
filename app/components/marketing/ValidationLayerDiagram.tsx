"use client";

import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, ArrowDown, CheckCircle2 } from "lucide-react";

const WITHOUT_FLOW = [
  { label: "Client Brief" },
  { label: "Creative Team" },
  { label: "Campaign Manager" },
  { type: "gap" as const },
  { label: "Ad Operations" },
  { label: "Campaign Launch" },
];

const WITH_FLOW = [
  { label: "Client Brief" },
  { label: "Creative Team" },
  { label: "Campaign Manager" },
  { label: "Adigator Validation", highlight: true },
  { label: "Ad Operations" },
  { label: "Campaign Launch" },
];

function FlowColumn({
  title,
  items,
  reduceMotion,
  gapLabel,
}: {
  title: string;
  items: Array<{ label?: string; type?: "gap"; highlight?: boolean }>;
  reduceMotion: boolean;
  gapLabel: string;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <p className="mb-4 text-center text-xs font-bold uppercase tracking-[0.18em] text-[#6B7280] sm:text-sm">
        {title}
      </p>
      <div className="flex flex-col items-center gap-2">
        {items.map((item, i) => (
          <div key={item.type === "gap" ? "gap" : `${title}-${item.label}`} className="flex w-full max-w-[240px] flex-col items-center">
            {item.type === "gap" ? (
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-3 text-center text-xs font-bold text-amber-800 sm:text-sm"
              >
                <AlertTriangle size={16} className="shrink-0" />
                {gapLabel}
              </motion.div>
            ) : (
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={`w-full rounded-xl border px-4 py-3 text-center text-sm font-semibold sm:text-base ${
                  item.highlight
                    ? "border-[#C8F04D]/50 bg-[#C8F04D]/15 text-[#0D0D0D] shadow-[0_0_24px_rgba(200,240,77,0.2)]"
                    : "border-[#DEDDD5] bg-white text-[#0D0D0D]"
                }`}
              >
                {item.label}
              </motion.div>
            )}
            {i < items.length - 1 ? (
              <ArrowDown size={18} className="my-1 text-[#9CA3AF]" aria-hidden />
            ) : null}
          </div>
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
          ? "mt-8 sm:mt-10"
          : "marketing-section marketing-section-compact mx-auto w-[min(1280px,92vw)]"
      }
    >
      <div className="mb-6 max-w-3xl sm:mb-8">
        {eyebrow ? (
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6B7280]">{eyebrow}</p>
        ) : null}
        <h2 className={`${eyebrow ? "mt-3" : ""} text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl`}>
          {title}
        </h2>
        {description ? (
          <p className="mt-4 text-base leading-relaxed text-[#5A5A55] sm:text-lg">
            {description}
          </p>
        ) : null}
      </div>

      <div className="grid gap-8 rounded-3xl border border-[#DEDDD5] bg-[#FAFAF7] p-6 sm:gap-10 sm:p-8 md:grid-cols-2 lg:p-10">
        <FlowColumn title="Without Adigator" items={WITHOUT_FLOW} reduceMotion={!!reduceMotion} gapLabel={gapLabel} />
        <FlowColumn title="With Adigator" items={WITH_FLOW} reduceMotion={!!reduceMotion} gapLabel={gapLabel} />
      </div>

      <motion.p
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-8 flex items-center justify-center gap-2 text-center text-base font-semibold text-[#0D0D0D] sm:text-lg"
      >
        <CheckCircle2 size={20} className="text-emerald-600" />
        Adigator validates every layer before a single dollar of media is spent.
      </motion.p>
    </section>
  );
}
