"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import { Check, X } from "lucide-react";
import { MARKETING_CTA } from "@/app/lib/siteNavigation";
import MarketingNav from "@/app/components/MarketingNav";
import MarketingFooter from "@/app/components/MarketingFooter";
import { IllustrationSkeleton } from "@/app/components/illustrations/IllustrationWrapper";
import { STORYSET_ILLUSTRATIONS } from "@/app/lib/storysetIllustrations";

const IllustrationWrapper = dynamic(
  () => import("@/app/components/illustrations/IllustrationWrapper"),
  { loading: () => <IllustrationSkeleton /> },
);
const CampaignValidationCheckpoint = dynamic(
  () => import("@/app/components/marketing/CampaignValidationCheckpoint"),
  { ssr: false },
);

const OPERATIONAL_RISKS = [
  {
    emoji: "🎯",
    title: "Campaign Alignment",
    risk: "Campaign objectives, creatives, landing pages, and messaging become misaligned during handoffs.",
    impact:
      "Teams launch campaigns that don't fully support the original campaign strategy, leading to unnecessary revisions and missed opportunities.",
    help: "Adigator validates campaign intent and ensures every asset aligns before execution.",
  },
  {
    emoji: "🖼️",
    title: "Creative Validation",
    risk: "Creatives meet design standards but don't always match campaign goals, placements, or platform specifications.",
    impact: "Creative revisions, campaign delays, and preventable media waste.",
    help: "Validate creative quality, messaging, safe zones, dimensions, and placement compatibility before execution.",
  },
  {
    emoji: "🌐",
    title: "Landing Page Validation",
    risk: "Landing pages don't match the creative, offer, messaging, or call-to-action.",
    impact: "Confusing user journeys, lower engagement, and unnecessary campaign rework.",
    help: "Verify messaging, destination URLs, CTAs, and campaign consistency before campaigns go live.",
  },
  {
    emoji: "⚙️",
    title: "Platform Validation",
    risk: "Every advertising platform has different creative specifications, formats, and technical requirements.",
    impact: "Creative rejections, failed uploads, and launch delays.",
    help: "Automatically validate assets against Google Ads, Meta Ads, and Programmatic platform requirements.",
  },
  {
    emoji: "🔗",
    title: "Tracking & URL Validation",
    risk: "Broken URLs, missing UTM parameters, and incorrect tracking often go unnoticed until campaigns are already running.",
    impact: "Lost attribution, reporting inaccuracies, and wasted advertising spend.",
    help: "Validate destination URLs, redirects, UTM parameters, and tracking before execution.",
  },
  {
    emoji: "👥",
    title: "Operational Validation",
    risk: "Creative teams, Campaign Managers, QA, and Ad Operations often assume someone else has verified the campaign.",
    impact: "Repeated back-and-forth, duplicated work, delayed launches, and preventable operational errors.",
    help: "Provide one centralized validation workflow that gives every team confidence before execution.",
  },
];

const CAMPAIGN_REALITY_TAGS = ["54 Creatives", "4 Campaigns", "6 URL/UTM Issues"];

const PLATFORM_CAPABILITIES = [
  {
    title: "Campaign Validation",
    description: "Validate campaign tasks against objective, messaging, landing pages, and technical requirements.",
  },
  {
    title: "Campaign Intelligence",
    description: "Surface validation insights, recurring issues, and operational patterns across campaigns.",
  },
  {
    title: "Campaign Memory",
    description: "Preserve every validation, change, and decision as part of the campaign record.",
  },
  {
    title: "Enterprise Workflow",
    description: "Standardize validation across teams, accounts, and regions.",
  },
  {
    title: "Live Preview",
    description: "Review creatives and landing experiences as they would appear before launch.",
  },
  {
    title: "Launch Readiness",
    description: "See exactly which campaign tasks are ready, blocked, or require follow-up.",
  },
];

const PLATFORM_SUMMARY = [
  { label: "Campaign Validation", status: "now" as const },
  { label: "Campaign Intelligence", status: "now" as const },
  { label: "Campaign Memory", status: "now" as const },
  { label: "Enterprise Workflow", status: "now" as const },
  { label: "Audience Intelligence (Coming Soon)", status: "soon" as const },
  { label: "Platform Integrations (Coming Soon)", status: "soon" as const },
];

const TEAM_SOLUTIONS = [
  { title: "Campaign Managers", description: "Validate campaign tasks before handoff and reduce avoidable rework." },
  { title: "Ad Operations", description: "Receive validated tasks instead of incomplete or inconsistent requests." },
  { title: "QA Teams", description: "Run standardized validation checks across every campaign task." },
  { title: "Creative Teams", description: "See how creatives connect to campaign objectives, landing pages, and URLs." },
  { title: "Media Buyers", description: "Protect budgets by catching preventable execution issues before spend." },
  { title: "Brand Teams", description: "Ensure brand standards and messaging stay consistent across campaigns." },
  { title: "Agencies", description: "Give clients one validation workflow and report they can rely on." },
  { title: "Enterprise Marketing", description: "Roll out campaign validation standards across markets and business units." },
];

const WITHOUT_ADIGATOR_FLOW = [
  "Campaign Brief",
  "Creative",
  "Landing Page",
  "URL",
  "Manual QA",
  "Issues Found After Setup",
  "Rework",
  "Delay",
] as const;

const WITH_ADIGATOR_FLOW = [
  "Campaign Brief",
  "Creative",
  "Landing Page",
  "URL",
  "Adigator",
  "Validation Report",
  "Ready",
] as const;

const VALIDATION_METRICS = [
  { label: "Campaign Brief Validation", soon: false },
  { label: "Creative Validation", soon: false },
  { label: "Landing Page Validation", soon: false },
  { label: "URL & Tracking Validation", soon: false },
  { label: "Platform Validation", soon: false },
  { label: "Technical QA", soon: false },
  { label: "Preview Generation", soon: false },
  { label: "Campaign Intelligence", soon: false },
  { label: "Campaign Memory", soon: false },
  { label: "Enterprise Workflow", soon: false },
  { label: "Validation Reports", soon: false },
  { label: "Audience Intelligence", soon: true },
];

const LIFECYCLE_TIMELINE = [
  "Campaign Created",
  "📋 Campaign Setup",
  "🖼️ Creative Addition",
  "🔄 Creative Swap",
  "🌐 Landing Page Update",
  "🔗 URL / UTM Update",
  "🎯 Audience Update (Soon)",
  "📅 Campaign Renewal",
  "🚀 Platform Migration",
  "📈 Campaign Optimization",
  "📁 Campaign Archived",
] as const;

const LIFECYCLE_STAGE_CARDS = [
  {
    emoji: "📋",
    title: "Campaign Setup",
    description:
      "Validate campaign objectives, creatives, landing pages, URLs, and platform requirements before setup begins.",
  },
  {
    emoji: "🖼️",
    title: "Creative Addition",
    description:
      "Ensure every newly added creative matches campaign intent, platform specifications, and landing page messaging.",
  },
  {
    emoji: "🔄",
    title: "Creative Swap",
    description:
      "Compare new creative versions, preserve validation history, and identify changes before execution.",
  },
  {
    emoji: "🌐",
    title: "Landing Page Update",
    description:
      "Confirm updated landing pages remain aligned with creatives, messaging, and campaign goals.",
  },
  {
    emoji: "🔗",
    title: "URL & Tracking Update",
    description:
      "Validate destination URLs, UTM parameters, redirects, and tracking before changes go live.",
  },
  {
    emoji: "🎯",
    title: "Audience Update (Coming Soon)",
    description:
      "Recommend and validate audience selection based on campaign objectives, platforms, DSPs, and trusted audience providers.",
  },
  {
    emoji: "📅",
    title: "Campaign Renewal",
    description:
      "Review existing campaign assets, landing pages, and validation history before extending campaign duration.",
  },
  {
    emoji: "🚀",
    title: "Platform Migration",
    description:
      "Verify assets, specifications, and compatibility when moving campaigns across advertising platforms.",
  },
  {
    emoji: "📈",
    title: "Campaign Optimization",
    description: "Validate optimization changes before they are applied to active campaigns.",
  },
];

const FEATURE_CARDS = [
  {
    title: "Protect Media Budget",
    description: "Prevent campaign mistakes before they consume media spend.",
  },
  {
    title: "Standardize Campaign Quality",
    description: "Every campaign follows the same validation process.",
  },
  {
    title: "Reduce Operational Complexity",
    description: "One validation workflow replaces disconnected reviews.",
  },
  {
    title: "Build Team Confidence",
    description: "Campaign managers, Creative, QA, and AdOps work from one validation report.",
  },
  {
    title: "Preserve Campaign Knowledge",
    description: "Every validation, update, and decision stays connected to the campaign.",
  },
  {
    title: "Scale Operations",
    description: "Validate thousands of campaign tasks consistently across teams.",
  },
];

function SectionHeader({ title, dark = false }: { title: string; dark?: boolean }) {
  return (
    <div className="mb-6 max-w-3xl sm:mb-8">
      <h2
        className={`text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl ${dark ? "text-white" : ""}`}
      >
        {title}
      </h2>
    </div>
  );
}

function ValidationComparison() {
  const reduceMotion = useReducedMotion();
  const [withoutIndex, setWithoutIndex] = useState(0);
  const [withIndex, setWithIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const interval = window.setInterval(() => {
      setWithoutIndex((prev) => (prev + 1) % WITHOUT_ADIGATOR_FLOW.length);
      setWithIndex((prev) => (prev + 1) % WITH_ADIGATOR_FLOW.length);
    }, 1800);
    return () => window.clearInterval(interval);
  }, [reduceMotion]);

  return (
    <>
      <div className="rounded-3xl border border-[#DEDDD5] bg-white p-8 sm:p-10">
        <IllustrationWrapper
          src={STORYSET_ILLUSTRATIONS.stressAmicoOverwhelmed}
          alt="Overwhelmed campaign manager facing launch pressure without pre-launch validation"
          className="mb-6"
          animation="fade-down"
          interactive={false}
        />
        <div className="flex flex-wrap gap-3">
          {CAMPAIGN_REALITY_TAGS.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[#DEDDD5] bg-[#FAFAF7] px-4 py-2 text-sm font-bold"
            >
              {tag}
            </span>
          ))}
        </div>
        <p className="mt-8 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-red-600">
          <X size={16} />
          Without Adigator
        </p>
        <AnimatedFlowPipeline
          items={WITHOUT_ADIGATOR_FLOW}
          activeIndex={withoutIndex}
          variant="without"
        />
      </div>

      <div className="rounded-3xl border border-[#C8F04D]/40 bg-[#C8F04D]/10 p-8 sm:p-10">
        <IllustrationWrapper
          src={STORYSET_ILLUSTRATIONS.confirmedBro}
          alt="Campaign confirmed and ready to launch with Adigator validation"
          className="mb-6"
          animation="fade-up"
          delay={0.1}
        />
        <div className="flex flex-wrap gap-3">
          {CAMPAIGN_REALITY_TAGS.map((tag) => (
            <span
              key={`with-${tag}`}
              className="rounded-full border border-[#C8F04D]/50 bg-white/80 px-4 py-2 text-sm font-bold"
            >
              {tag}
            </span>
          ))}
        </div>
        <p className="mt-8 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-emerald-700">
          <Check size={16} />
          With Adigator
        </p>
        <AnimatedFlowPipeline items={WITH_ADIGATOR_FLOW} activeIndex={withIndex} variant="with" />
      </div>
    </>
  );
}

function AnimatedFlowPipeline({
  items,
  activeIndex,
  variant,
}: {
  items: readonly string[];
  activeIndex: number;
  variant: "without" | "with";
}) {
  const isWithout = variant === "without";

  return (
    <div className="mt-6 flex flex-col items-center" aria-live="polite">
      {items.map((step, index) => {
        const isActive = index === activeIndex;
        const isPast = index < activeIndex;
        const showArrow = index < items.length - 1;

        return (
          <div key={step} className="flex w-full flex-col items-center">
            <motion.div
              animate={{
                scale: isActive ? 1.03 : 1,
                opacity: isActive ? 1 : isPast ? 0.55 : 0.75,
              }}
              transition={{ duration: 0.35, ease: "easeInOut" }}
              className={`w-full max-w-xs rounded-xl border px-5 py-3 text-center text-sm font-semibold sm:text-base ${
                isActive
                  ? isWithout
                    ? "border-red-300 bg-red-50 text-red-900 shadow-[0_8px_24px_rgba(239,68,68,0.15)]"
                    : "border-[#C8F04D] bg-white text-[#0D0D0D] shadow-[0_8px_24px_rgba(200,240,77,0.25)]"
                  : isWithout
                    ? "border-[#FECACA] bg-white text-[#7F1D1D]"
                    : "border-[#C8F04D]/40 bg-white/80 text-[#0D0D0D]"
              }`}
            >
              {step}
            </motion.div>
            {showArrow && (
              <motion.span
                animate={{ opacity: isActive || index + 1 === activeIndex ? 1 : 0.35 }}
                className={`my-1.5 text-lg font-bold ${isWithout ? "text-red-400" : "text-emerald-500"}`}
                aria-hidden
              >
                ↓
              </motion.span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function LifecycleTimeline() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % LIFECYCLE_TIMELINE.length);
    }, 1800);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  return (
    <div className="relative">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9CA3AF]">Campaign lifecycle</p>
      <div className="mt-6 flex flex-col items-center">
        {LIFECYCLE_TIMELINE.map((stage, index) => {
          const isActive = index === active;
          const isLast = index === LIFECYCLE_TIMELINE.length - 1;

          return (
            <div key={stage} className="flex w-full max-w-sm flex-col items-center">
              <motion.div
                animate={{
                  scale: isActive ? 1.04 : 1,
                  opacity: isActive ? 1 : 0.7,
                }}
                transition={{ duration: 0.35 }}
                className={`w-full rounded-xl border px-4 py-3 text-center text-sm font-semibold sm:text-base ${
                  isActive
                    ? "border-[#C8F04D] bg-[#C8F04D]/15 text-white shadow-[0_0_24px_rgba(200,240,77,0.2)]"
                    : "border-white/10 bg-black/30 text-[#E5E7EB]"
                }`}
              >
                {stage}
              </motion.div>
              {!isLast && (
                <div className="flex flex-col items-center py-1 text-[#6B7280]" aria-hidden>
                  <span className="h-3 w-px bg-white/20" />
                  <span className="text-xs">▼</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-6 border-t border-white/10 pt-6 text-center">
        <p className="text-sm font-semibold text-[#C8F04D] sm:text-base">
          ✅ Adigator validates every task before execution.
        </p>
      </div>
    </div>
  );
}

function AnimatedWorkflow() {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);

  const steps = useMemo(
    () => [
      "Campaign Setup",
      "Creative Addition",
      "Creative Swap",
      "Landing Page Update",
      "URL / UTM Change",
      "Campaign Renewal",
      "Adigator Validation",
      "Task Executed",
    ],
    [],
  );

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % steps.length);
    }, 2000);
    return () => window.clearInterval(id);
  }, [reduceMotion, steps.length]);

  return (
    <div className="mx-auto mt-8 flex max-w-md flex-col items-center" aria-live="polite">
      {steps.map((step, index) => {
        const isActive = index === activeIndex;
        const isValidation = step === "Adigator Validation";
        const isLast = index === steps.length - 1;

        return (
          <div key={step} className="flex w-full flex-col items-center">
            <motion.div
              animate={{
                scale: isActive ? 1.04 : 1,
                opacity: isActive ? 1 : 0.72,
              }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className={`w-full rounded-2xl border px-5 py-3.5 text-center text-sm font-bold sm:text-base ${
                isValidation
                  ? isActive
                    ? "border-[#C8F04D] bg-[#C8F04D]/20 text-[#0D0D0D] shadow-[0_0_32px_rgba(200,240,77,0.3)]"
                    : "border-[#C8F04D]/50 bg-[#C8F04D]/10 text-[#0D0D0D]"
                  : isActive
                    ? "border-[#0D0D0D] bg-white text-[#0D0D0D] shadow-[0_12px_32px_rgba(15,23,42,0.12)]"
                    : "border-[#DEDDD5] bg-white/80 text-[#4B4B45]"
              }`}
            >
              {step}
            </motion.div>
            {!isLast && (
              <motion.span
                animate={{ opacity: isActive || index + 1 === activeIndex ? 1 : 0.3 }}
                className="my-2 text-lg font-bold text-[#9CA3AF]"
                aria-hidden
              >
                ↓
              </motion.span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function SolutionsPage() {
  return (
    <div className="marketing-page min-h-screen bg-[#F5F5F0] text-[#0D0D0D]">
      <MarketingNav activePath="/solutions" />

      <main className="pt-28">
        {/* 1. Hero */}
        <section className="marketing-section marketing-section-compact mx-auto w-[min(980px,92vw)] text-center">
          <h1 className="mx-auto max-w-5xl text-[clamp(2rem,6vw,4.5rem)] font-black leading-[0.98] tracking-[-0.04em]">
            Every Campaign Has the Same Problem. Nobody Validates Before Launch.
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-[#5C5C56]">
            Adigator gives agencies and AdOps teams one validation pass over the campaign brief, creatives, landing
            page, URLs, and platform requirements before campaign setup begins.
          </p>
          <div className="mt-10 flex justify-center">
            <Link
              href={MARKETING_CTA.href}
              className="marketing-btn-lime saas-hover rounded-full px-8 py-4 text-base font-bold"
            >
              {MARKETING_CTA.label}
            </Link>
          </div>
        </section>

        {/* 2. Operational Risks We Eliminate */}
        <section id="problems" className="marketing-section marketing-section-compact mx-auto w-[min(1280px,92vw)]">
          <div className="max-w-3xl">
            <SectionHeader title="The Operational Risks We Eliminate" />
            <p className="text-base leading-relaxed text-[#5A5A55] sm:text-lg">
              Every campaign passes through multiple teams, platforms, and handoffs. Adigator identifies and validates
              the issues that commonly lead to delays, rework, and preventable campaign errors.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {OPERATIONAL_RISKS.map((item, i) => (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="saas-hover flex h-full flex-col rounded-3xl border border-[#DEDDD5] bg-[#FCFCF8] p-6 shadow-[0_14px_30px_rgba(15,23,42,0.06)] sm:p-7"
              >
                <h3 className="mb-4 text-lg font-black leading-tight tracking-tight text-[#111827] sm:text-xl">
                  {item.emoji} {item.title}
                </h3>
                <div className="space-y-4 text-sm leading-relaxed text-[#4B4B45] sm:text-[15px]">
                  <div className="rounded-xl border border-red-100 bg-red-50/50 px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#B91C1C]">🔴 Risk</p>
                    <p className="mt-1.5">{item.risk}</p>
                  </div>
                  <div className="rounded-xl border border-amber-100 bg-amber-50/50 px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#92400E]">
                      🟠 Business Impact
                    </p>
                    <p className="mt-1.5">{item.impact}</p>
                  </div>
                  <div className="rounded-xl border border-[#C8F04D]/60 bg-[#F5FBE5] px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#3F6212]">
                      🟢 How Adigator Helps
                    </p>
                    <p className="mt-1.5 font-semibold text-[#1E293B]">{item.help}</p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        {/* Six premium capability cards (replaces illustration section) */}
        <section className="border-y border-[#DEDDD5] bg-[#0D0D0D] marketing-section-compact">
          <div className="mx-auto w-[min(1280px,92vw)]">
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURE_CARDS.map((card, i) => (
                <motion.article
                  key={card.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="saas-hover relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/7 via-white/3 to-transparent p-6 text-white shadow-[0_18px_40px_rgba(15,23,42,0.65)] sm:p-7"
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(200,240,77,0.24),transparent_55%)]" />
                  <div className="relative">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9CA3AF]">Capability</p>
                    <h3 className="mt-2 text-xl font-black leading-tight tracking-tight sm:text-[1.35rem]">
                      {card.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#D1D5DB] sm:text-[15px]">{card.description}</p>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* Campaign journey */}
        <section id="journey" className="border-y border-[#DEDDD5] bg-[#FAFAF7] marketing-section-compact">
          <div className="mx-auto w-[min(1280px,92vw)]">
            <SectionHeader title="Where validation fits in your workflow" />
            <AnimatedWorkflow />
          </div>
        </section>

        {/* Platform capabilities – problem-based outcomes */}
        <section className="marketing-section marketing-section-compact mx-auto w-[min(1280px,92vw)]">
          <SectionHeader title="How Adigator Solves Campaign Operations" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PLATFORM_CAPABILITIES.map((card, i) => (
              <motion.article
                key={card.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="saas-hover rounded-3xl border border-[#DEDDD5] bg-white p-7 shadow-[0_12px_24px_rgba(15,23,42,0.05)]"
              >
                <h3 className="text-2xl font-black leading-tight tracking-tight">{card.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-[#585852] sm:text-base">{card.description}</p>
              </motion.article>
            ))}
          </div>
        </section>

        {/* Solutions by Workflow / Platform Summary */}
        <section id="workflow" className="bg-[#0D0D0D] py-10 text-white sm:py-12 md:py-14">
          <div className="mx-auto w-[min(1280px,92vw)]">
            <SectionHeader dark title="The Adigator Platform" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {PLATFORM_SUMMARY.map((item, i) => (
                <motion.article
                  key={item.label}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  className="saas-hover flex items-start gap-3 rounded-2xl border border-[#2A2A2A] bg-[#151515] p-6 sm:p-7"
                >
                  <span
                    className={`mt-1 inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-full text-sm ${
                      item.status === "now"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-[#C8F04D]/20 text-[#C8F04D]"
                    }`}
                  >
                    {item.status === "now" ? "✓" : "🚀"}
                  </span>
                  <div>
                    <h3 className="text-base font-black leading-tight tracking-tight sm:text-lg">{item.label}</h3>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* Solutions by Team — train loop */}
        <section id="team" className="marketing-section marketing-section-compact mx-auto w-[min(1280px,92vw)]">
          <SectionHeader title="Solutions for Every Campaign Team" />
          <div className="overflow-hidden py-2">
            <div className="ticker-track flex min-w-max gap-4">
              {[...TEAM_SOLUTIONS, ...TEAM_SOLUTIONS].map((item, idx) => (
                <article
                  key={`${item.title}-${idx}`}
                  className="saas-hover w-[280px] shrink-0 rounded-2xl border border-[#DEDDD5] bg-white p-6 shadow-[0_12px_24px_rgba(15,23,42,0.05)]"
                >
                  <h3 className="text-lg font-black leading-tight tracking-tight">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#585852]">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Campaign validation checkpoint */}
        <CampaignValidationCheckpoint />

        {/* Campaign lifecycle & industry context */}
        <section id="industry" className="bg-[#0D0D0D] py-10 text-white sm:py-12 md:py-14">
          <div className="mx-auto w-[min(1280px,92vw)]">
            <SectionHeader dark title="Campaign Validation Across the Entire Campaign Lifecycle" />
            <p className="max-w-3xl text-base leading-relaxed text-[#D1D5DB] sm:text-lg">
              Campaigns don't end after setup. They evolve through new tasks, creative updates, landing page changes,
              renewals, and optimizations. Adigator validates every campaign task before execution.
            </p>

            <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45 }}
                className="saas-hover relative overflow-hidden rounded-3xl border border-[#1F2937] bg-gradient-to-br from-[#020617] via-[#020617] to-[#0B1120] p-6 sm:p-8"
              >
                <div className="pointer-events-none absolute inset-x-[-30%] top-[-35%] h-64 rounded-full bg-[radial-gradient(circle_at_center,rgba(200,240,77,0.22),transparent_60%)]" />
                <LifecycleTimeline />
              </motion.div>

              <div className="grid gap-4 sm:grid-cols-2">
                {LIFECYCLE_STAGE_CARDS.map((stage, i) => (
                  <motion.article
                    key={stage.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04 }}
                    className="saas-hover rounded-2xl border border-[#2D2D2D] bg-[#141414] p-5 sm:p-6"
                  >
                    <h3 className="text-base font-black leading-tight tracking-tight text-white sm:text-lg">
                      {stage.emoji} {stage.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#A8A8A8]">{stage.description}</p>
                  </motion.article>
                ))}
              </div>
            </div>

            <div className="mt-10 rounded-2xl border border-[#1F2937] bg-gradient-to-r from-white/5 via-transparent to-white/5 px-6 py-6 text-center sm:px-8 sm:py-7">
              <p className="text-sm font-semibold text-[#E5E7EB] sm:text-base">
                <span className="block text-base font-black uppercase tracking-[0.16em] text-white sm:text-lg">
                  Every campaign evolves.
                </span>
                <span className="mt-2 block text-sm font-semibold text-[#E5E7EB] sm:text-base">
                  Every new task creates risk.
                </span>
                <span className="mt-1 block text-sm font-semibold text-[#C8F04D] sm:text-base">
                  Adigator validates every change before execution.
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* Campaign Reality */}
        <section id="reality" className="marketing-section marketing-section-compact mx-auto w-[min(1280px,92vw)]">
          <SectionHeader title="What happens when nobody validates before launch" />
          <div className="grid gap-8 lg:grid-cols-2">
            <ValidationComparison />
          </div>
        </section>

        {/* Metrics */}
        <section id="metrics" className="bg-[#0D0D0D] py-10 text-white sm:py-12 md:py-14">
          <div className="mx-auto w-[min(1280px,92vw)]">
            <SectionHeader dark title="Enterprise validation coverage" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {VALIDATION_METRICS.map((metric, i) => (
                <motion.article
                  key={metric.label}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  className="saas-hover flex items-center gap-3 rounded-3xl border border-[#2D2D2D] bg-[#141414] p-5 text-sm font-semibold text-[#E5E7EB] sm:text-base"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#111827] text-sm">
                    {metric.soon ? "🚀" : "✓"}
                  </span>
                  <span>
                    {metric.label}
                    {metric.soon ? " (Soon)" : ""}
                  </span>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="marketing-section marketing-section-compact mx-auto w-[min(980px,92vw)]">
          <div className="saas-hover rounded-[32px] border border-[#DBDAD2] bg-white px-8 py-10 text-center shadow-[0_20px_50px_rgba(15,23,42,0.08)] sm:px-12 sm:py-12">
            <h2 className="mx-auto max-w-3xl text-[clamp(1.75rem,4vw,3rem)] font-black leading-tight tracking-tight">
              Every Campaign Task Creates Risk. Every Task Deserves Validation.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#5A5A55] sm:text-lg">
              Explore how Adigator helps campaign teams solve operational challenges—from campaign alignment and
              technical validation to workflow standardization and launch readiness.
            </p>
            <Link
              href={MARKETING_CTA.href}
              className="marketing-btn-lime saas-hover mt-10 inline-flex rounded-full px-10 py-4 text-base font-bold"
            >
              {MARKETING_CTA.label}
            </Link>
          </div>
        </section>
      </main>

      <MarketingFooter />

      <style jsx global>{`
        .saas-hover {
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
        }

        .saas-hover:hover {
          transform: translateY(-3px);
          box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.42), 0 16px 34px rgba(15, 23, 42, 0.12);
        }

        .ticker-track {
          animation: ticker-move 26s linear infinite;
        }

        @keyframes ticker-move {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
