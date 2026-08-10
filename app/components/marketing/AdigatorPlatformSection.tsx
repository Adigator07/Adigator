"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  Clock3,
  Network,
  Plug,
  Radio,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type ModuleStatus = "available" | "coming-soon";

type PlatformModule = {
  id: string;
  icon: LucideIcon;
  iconClass: string;
  name: string;
  description: string;
  status: ModuleStatus;
  badge: string;
  partners?: string[];
  highlights?: string[];
};

const PLATFORM_MODULES: PlatformModule[] = [
  {
    id: "campaign-validation",
    icon: ShieldCheck,
    iconClass: "text-[#5A7A00] bg-[#F7FCE8]",
    name: "Campaign Validation",
    description:
      "Validate campaign briefs, creatives, landing pages, URLs, tracking, and platform requirements before every campaign task is executed.",
    status: "available",
    badge: "Available",
    highlights: ["Brief", "Creative", "Landing page", "URL", "Tracking", "Platform"],
  },
  {
    id: "campaign-intelligence",
    icon: Brain,
    iconClass: "text-violet-600 bg-violet-100",
    name: "Campaign Intelligence",
    description:
      "Understand campaign objectives, messaging, creatives, landing pages, and campaign relationships to validate every task with context.",
    status: "available",
    badge: "Available",
    highlights: ["Objectives", "Messaging", "Creative match", "Relationships"],
  },
  {
    id: "campaign-memory",
    icon: Clock3,
    iconClass: "text-amber-600 bg-amber-100",
    name: "Campaign Memory",
    description:
      "Maintain a complete history of campaign tasks, validations, approvals, and changes throughout the campaign lifecycle.",
    status: "available",
    badge: "Available",
    highlights: ["Task history", "Approvals", "Change log", "Audit trail"],
  },
  {
    id: "enterprise-workflow",
    icon: Network,
    iconClass: "text-cyan-600 bg-cyan-100",
    name: "Enterprise Workflow",
    description:
      "Standardize validation across Campaign Management, Creative, QA, and Ad Operations with structured workflows and approvals.",
    status: "available",
    badge: "Available",
    highlights: ["Campaign Mgmt", "Creative", "QA", "Ad Operations"],
  },
  {
    id: "audience-intelligence",
    icon: Target,
    iconClass: "text-fuchsia-600 bg-fuchsia-100",
    name: "Audience Intelligence",
    description:
      "Recommend the most relevant audiences based on campaign objectives, platforms, DSPs, and audience partners.",
    status: "coming-soon",
    badge: "Coming Soon",
    partners: ["Google Ads", "Meta", "DV360", "The Trade Desk", "Amazon DSP", "Data Partners"],
  },
  {
    id: "integrations-apis",
    icon: Plug,
    iconClass: "text-purple-600 bg-purple-100",
    name: "Integrations & APIs",
    description:
      "Connect Adigator with your campaign operations ecosystem through APIs and integrations.",
    status: "coming-soon",
    badge: "Coming Soon",
    partners: ["Google Ads", "Meta", "DV360", "CM360", "HubSpot", "Salesforce"],
  },
];

const SCROLL_INTERVAL_MS = 3800;

function ShowcaseModuleCard({ module }: { module: PlatformModule }) {
  const Icon = module.icon;
  const isComingSoon = module.status === "coming-soon";

  return (
    <article className="flex min-h-[280px] flex-col rounded-[22px] border border-[#E8E7E0] bg-white p-5 text-[#0D0D0D] shadow-[0_12px_32px_rgba(15,23,42,0.08)] sm:min-h-[300px] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${module.iconClass}`}>
          <Icon size={22} strokeWidth={1.75} aria-hidden />
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
            isComingSoon
              ? "border-amber-200 bg-amber-50 text-amber-700"
              : "border-[#C8F04D]/40 bg-[#F7FCE8] text-[#5A7A00]"
          }`}
        >
          {isComingSoon ? "🚀 Coming Soon" : "✓ Available"}
        </span>
      </div>

      <h3 className="mt-4 text-lg font-bold tracking-tight text-[#0D0D0D] sm:text-xl">{module.name}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-[#5A5A55]">{module.description}</p>

      {module.highlights ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {module.highlights.map((item) => (
            <span
              key={item}
              className="rounded-full border border-[#E8E7E0] bg-[#FAFAF7] px-2.5 py-1 text-[10px] font-medium text-[#5A5A55]"
            >
              {item}
            </span>
          ))}
        </div>
      ) : null}

      {module.partners ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {module.partners.map((partner) => (
            <span
              key={partner}
              className="rounded-md border border-[#E8E7E0] bg-[#FAFAF7] px-2 py-1 text-[9px] font-semibold uppercase tracking-wide text-[#8A8A82]"
            >
              {partner}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function PlatformModuleShowcase({ reduceMotion }: { reduceMotion: boolean }) {
  const [index, setIndex] = useState(0);
  const module = PLATFORM_MODULES[index];

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % PLATFORM_MODULES.length);
    }, SCROLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  return (
    <div className="relative w-full">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[min(100%,420px)] w-[min(92%,480px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(200,240,77,0.22)_0%,rgba(200,240,77,0.06)_45%,transparent_72%)]"
        aria-hidden
      />

      <div className="relative overflow-hidden rounded-[28px] border border-[#DEDDD5] bg-white shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
        <div className="relative border-b border-[#E8E7E0] bg-[#FAFAF7] px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-[#5A7A00]" aria-hidden />
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6B7280]">
                Modules
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              <span className="relative flex h-2 w-2">
                {!reduceMotion ? (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                ) : null}
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Live
            </span>
          </div>
        </div>

        <div className="relative h-[320px] overflow-hidden bg-white sm:h-[340px]" aria-live="polite">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 bg-gradient-to-b from-white to-transparent"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-white to-transparent"
            aria-hidden
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={module.id}
              initial={reduceMotion ? false : { opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -36 }}
              transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0 px-4 py-5 sm:px-5 sm:py-6"
            >
              <ShowcaseModuleCard module={module} />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative border-t border-[#E8E7E0] bg-[#FAFAF7] px-4 py-3 sm:px-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 font-mono text-[11px] text-[#8A8A82]">
              <Radio size={12} className="shrink-0 text-[#5A7A00]" aria-hidden />
              <span className="truncate">adigator.platform / {module.id}</span>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {PLATFORM_MODULES.map((item, dotIndex) => (
                <span
                  key={item.id}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    dotIndex === index ? "w-5 bg-[#C8F04D]" : "w-1.5 bg-[#DEDDD5]"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdigatorPlatformSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="marketing-section marketing-section-compact mt-10 sm:mt-12 lg:mt-14">
      <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-10 lg:gap-12">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6 }}
          className="min-w-0"
        >
          <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-black leading-[1.12] tracking-[-0.035em]">
            The Adigator Platform
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#5A5A55] sm:text-xl">
            Validate every campaign task, keep campaign knowledge in one place, and help teams execute with
            confidence.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {PLATFORM_MODULES.map((item) => (
              <span
                key={item.id}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  item.status === "available"
                    ? "border-[#C8F04D]/25 bg-[#F7FCE8] text-[#3D4A1A]"
                    : "border-[#DEDDD5] bg-white text-[#8A8A82]"
                }`}
              >
                {item.name}
              </span>
            ))}
          </div>

          <p className="mt-8 text-base font-semibold leading-relaxed text-[#0D0D0D] sm:text-lg">
            One platform. Every campaign task. Clear readiness before you spend.
          </p>

          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/product"
              className="marketing-btn-lime saas-hover inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-bold"
            >
              Explore the Platform
              <ArrowRight size={16} aria-hidden />
            </Link>
            <Link
              href="/product"
              className="marketing-btn-outline saas-hover rounded-full px-7 py-3.5 text-base font-semibold"
            >
              Learn More
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.65, delay: 0.1 }}
          className="relative flex min-w-0 items-center justify-center py-2 lg:py-0"
        >
          <PlatformModuleShowcase reduceMotion={!!reduceMotion} />
        </motion.div>
      </div>
    </section>
  );
}
