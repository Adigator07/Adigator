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
    description: "Track validation results for every task—never lose visibility into campaign readiness",
  },
] as const;

function statusStyles(status: "passed" | "warning") {
  if (status === "passed") {
    return { icon: "✅", valueClass: "text-emerald-400" };
  }
  return { icon: "⚠️", valueClass: "text-amber-400" };
}

function ValidationReportMockup({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className="mx-auto w-full max-w-[600px] rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md transition duration-300 hover:border-[#0ea5e9]/35 hover:shadow-[0_0_40px_rgba(14,165,233,0.12)] sm:p-8"
    >
      <h3 className="border-b border-white/10 pb-4 text-center text-xl font-bold text-white">
        {VALIDATION_REPORT_MOCK.title}
      </h3>

      <ul className="mt-2 divide-y divide-white/8">
        {VALIDATION_REPORT_MOCK.checks.map((row) => {
          const { icon, valueClass } = statusStyles(row.status);
          return (
            <li key={row.label} className="flex items-center justify-between gap-4 py-3">
              <span className="text-sm font-medium text-white/85">{row.label}</span>
              <span className={`flex shrink-0 items-center gap-1.5 text-sm font-semibold ${valueClass}`}>
                <span role="img" aria-hidden>
                  {icon}
                </span>
                {row.value}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-semibold text-white/80">Overall Status</span>
          <span className="flex items-center gap-2 text-sm font-bold text-emerald-400">
            <span role="img" aria-label="Ready">
              🟢
            </span>
            {VALIDATION_REPORT_MOCK.overallStatus}
          </span>
        </div>
      </div>

      <button
        type="button"
        className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#C8F04D] text-sm font-bold text-[#0D0D0D] transition hover:scale-[1.02] hover:shadow-[0_0_24px_rgba(200,240,77,0.35)] focus:outline-none focus:ring-2 focus:ring-[#C8F04D] focus:ring-offset-2 focus:ring-offset-[#0A0A0A]"
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
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md transition duration-300 hover:scale-[1.02] hover:border-[#C8F04D]/35 hover:shadow-[0_0_28px_rgba(200,240,77,0.1)] focus-within:ring-2 focus-within:ring-[#C8F04D]/50"
      tabIndex={0}
    >
      <span className="text-[40px] leading-none" role="img" aria-label={feature.ariaLabel}>
        {feature.icon}
      </span>
      <h3 className="mt-3 text-base font-semibold text-white">{feature.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/70">{feature.description}</p>
    </motion.article>
  );
}

export default function ValidationReportSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="marketing-section marketing-section-compact mx-auto w-[min(1280px,92vw)]">
      <div className="relative overflow-hidden rounded-[28px] border border-[#2A2A2A] bg-[#0A0A0A] px-5 py-10 sm:px-8 sm:py-12 lg:px-10 lg:py-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
          aria-hidden
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(167,139,250,0.08),transparent_55%)]" aria-hidden />

        <div className="relative">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              Know Exactly What Needs Attention Before Execution
            </h2>
            <p className="mt-3 text-base leading-relaxed text-white/70 sm:text-lg">
              Adigator doesn&apos;t just detect issues—it generates a structured validation report that tells your team
              what&apos;s ready, what&apos;s missing, and what needs to be fixed before execution.
            </p>
          </div>

          <div className="mt-10">
            <ValidationReportMockup reduceMotion={!!reduceMotion} />
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-4">
            {REPORT_FEATURES.map((feature, index) => (
              <ReportFeatureCard
                key={feature.id}
                feature={feature}
                index={index}
                reduceMotion={!!reduceMotion}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
