"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Download } from "lucide-react";

const VALIDATION_REPORT_MOCK = {
  title: "Campaign Readiness Report",
  checks: [
    { label: "Campaign Brief", status: "passed" as const, value: "Passed" },
    { label: "Adgroup Goal", status: "passed" as const, value: "Aligned" },
    { label: "Creative Quality/Messaging", status: "warning" as const, value: "3 Issues" },
    { label: "Landing Page", status: "passed" as const, value: "Passed" },
    { label: "URL Validation", status: "passed" as const, value: "Passed" },
    { label: "Tracking & UTM", status: "warning" as const, value: "Missing UTM" },
    { label: "Platform Requirements", status: "passed" as const, value: "Passed" },
  ],
  overallStatus: "READY AFTER FIXING 2 ITEMS",
};

const REPORT_FEATURES = [
  {
    id: "downloadable-report",
    icon: "📄",
    ariaLabel: "Document",
    title: "Downloadable Validation Report",
    description: "Export comprehensive reports with findings, severity, and recommendations",
  },
  {
    id: "actionable-recommendations",
    icon: "📝",
    ariaLabel: "Memo",
    title: "Actionable Recommendations",
    description: "Clear, prioritized steps for your creative and AdOps teams to resolve issues",
  },
  {
    id: "share-team",
    icon: "👥",
    ariaLabel: "Team",
    title: "Share with Your Team",
    description: "Instantly share reports with creative and AdOps stakeholders for faster execution",
  },
  {
    id: "validation-history",
    icon: "📚",
    ariaLabel: "Books",
    title: "Validation History",
    description: "Track validation results for every task so you never lose visibility into campaign readiness",
  },
] as const;

function statusStyles(status: "passed" | "warning") {
  if (status === "passed") {
    return { icon: "✅", valueClass: "text-emerald-700" };
  }
  return { icon: "⚠️", valueClass: "text-amber-700" };
}

function ValidationReportMockup({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className="relative w-full rounded-2xl border border-[#DEDDD5] bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.08)] transition duration-300 hover:border-[#C8F04D]/40 hover:shadow-[0_16px_40px_rgba(15,23,42,0.1)] sm:rounded-[24px] sm:p-6"
    >
      <h3 className="border-b border-[#E8E7E0] pb-3 text-center text-lg font-bold text-[#0D0D0D] sm:text-xl">
        {VALIDATION_REPORT_MOCK.title}
      </h3>

      <ul className="mt-1 divide-y divide-[#E8E7E0]">
        {VALIDATION_REPORT_MOCK.checks.map((row) => {
          const { icon, valueClass } = statusStyles(row.status);
          return (
            <li key={row.label} className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-xs font-medium text-[#0D0D0D] sm:text-sm">{row.label}</span>
              <span className={`flex shrink-0 items-center gap-1.5 text-xs font-semibold sm:text-sm ${valueClass}`}>
                <span role="img" aria-hidden>
                  {icon}
                </span>
                {row.value}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-[#0D0D0D] sm:text-sm">Overall Status</span>
          <span className="flex items-center gap-2 text-xs font-bold text-emerald-700 sm:text-sm">
            <span role="img" aria-label="Ready">
              🟢
            </span>
            {VALIDATION_REPORT_MOCK.overallStatus}
          </span>
        </div>
      </div>

      <button
        type="button"
        className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#C8F04D] text-sm font-bold text-[#0D0D0D] transition hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(200,240,77,0.35)] focus:outline-none focus:ring-2 focus:ring-[#C8F04D] focus:ring-offset-2 focus:ring-offset-white sm:h-11"
        aria-label="Download sample validation report"
      >
        <Download size={18} aria-hidden />
        Download Report
      </button>
    </motion.div>
  );
}

function ReportFeatureCard({
  feature,
  index,
  reduceMotion,
}: {
  feature: (typeof REPORT_FEATURES)[number];
  index: number;
  reduceMotion: boolean;
}) {
  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ delay: index * 0.08, duration: 0.45 }}
      whileHover={reduceMotion ? undefined : { y: -4, scale: 1.02 }}
      className="group relative flex flex-col overflow-hidden rounded-[20px] border border-[#2A2A2A] bg-[#111111] p-5 text-white shadow-[0_12px_32px_rgba(0,0,0,0.25)] transition duration-300 hover:border-[#C8F04D]/35 hover:shadow-[0_16px_40px_rgba(0,0,0,0.35)] focus-within:ring-2 focus-within:ring-[#C8F04D]/50 sm:rounded-[22px] sm:p-6"
      tabIndex={0}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_0%_0%,rgba(200,240,77,0.06),transparent_55%)] opacity-0 transition duration-300 group-hover:opacity-100"
        aria-hidden
      />
      <span className="relative text-[36px] leading-none sm:text-[40px]" role="img" aria-label={feature.ariaLabel}>
        {feature.icon}
      </span>
      <h3 className="relative mt-3 text-base font-bold tracking-tight">{feature.title}</h3>
      <p className="relative mt-2 flex-1 text-sm leading-relaxed text-white/65">{feature.description}</p>
    </motion.article>
  );
}

export default function ValidationReportSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="marketing-section marketing-section-compact mx-auto w-[min(1280px,92vw)]">
      <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2 md:gap-10 lg:items-center lg:gap-12">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6 }}
          className="min-w-0"
        >
          <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-black leading-[1.12] tracking-[-0.035em]">
            Know what needs attention before you execute
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#5A5A55] sm:text-xl">
            Adigator doesn&apos;t just detect issues. It generates a structured validation report that tells your team
            what&apos;s ready, what&apos;s missing, and what needs to be fixed before execution.
          </p>

          <div className="relative mt-8">
            <ValidationReportMockup reduceMotion={!!reduceMotion} />
          </div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.65, delay: 0.1 }}
          className="relative flex min-w-0 items-center justify-center py-2 lg:py-0"
        >
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-[min(100%,420px)] w-[min(92%,480px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(200,240,77,0.18)_0%,rgba(200,240,77,0.05)_45%,transparent_72%)]"
            aria-hidden
          />

          <div className="relative grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4">
            {REPORT_FEATURES.map((feature, index) => (
              <ReportFeatureCard
                key={feature.id}
                feature={feature}
                index={index}
                reduceMotion={!!reduceMotion}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
