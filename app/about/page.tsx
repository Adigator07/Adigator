"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  Briefcase,
  Check,
  CheckCircle2,
  Megaphone,
  Palette,
  Shield,
  Target,
  Users,
  X,
} from "lucide-react";
import {
  MARKETING_CTA,
  MARKETING_FOOTER_COLUMNS,
  MARKETING_PARTNER_BADGES,
} from "@/app/lib/siteNavigation";
import MarketingNav from "@/app/components/MarketingNav";
import { IllustrationSkeleton } from "@/app/components/illustrations/IllustrationWrapper";
import { STORYSET_ILLUSTRATIONS } from "@/app/lib/storysetIllustrations";

const IllustrationWrapper = dynamic(
  () => import("@/app/components/illustrations/IllustrationWrapper"),
  { loading: () => <IllustrationSkeleton /> },
);
const ValidationLayerDiagram = dynamic(
  () => import("@/app/components/marketing/ValidationLayerDiagram"),
  { ssr: false },
);

const BEFORE_ADIGATOR_FLOW = [
  "Client sends brief",
  "Creative team designs ads",
  "Campaign manager builds campaign",
  "AdOps launches campaign",
  "Performance problems appear",
  "Everyone blames the creative",
];

const CAMPAIGN_TEAMS = [
  { title: "Creative Team", icon: Palette },
  { title: "Campaign Managers", icon: Target },
  { title: "Media Buyers", icon: Megaphone },
  { title: "Ad Operations", icon: Briefcase },
  { title: "QA Teams", icon: Shield },
  { title: "Clients", icon: Users },
];

const BELIEFS = [
  "Campaign quality starts before launch.",
  "Small operational mistakes become expensive.",
  "Better validation creates better campaigns.",
  "Every campaign deserves one final review.",
  "Technology should reduce operational complexity, not add to it.",
];

const TIMELINE_2025 = [
  "Observed recurring campaign failures across advertising operations.",
  "Identified a missing validation layer.",
  "Built internal validation workflows.",
  "Created Adigator Creative Studio.",
  "Expanding into Campaign Operations Quality Management.",
];

const FOUR_PILLARS = [
  {
    title: "Campaign Validation",
    description:
      "Align campaign objective, creatives, landing pages, and messaging before anyone signs off.",
    icon: Target,
  },
  {
    title: "Platform Validation",
    description: "Meta, Google, and Programmatic technical compatibility checked in one pass.",
    icon: Shield,
  },
  {
    title: "Creative Validation",
    description: "Creative quality, placement compatibility, and launch readiness validated together.",
    icon: Palette,
  },
  {
    title: "Operational Quality",
    description: "Reduce manual review, standardize validation, and support enterprise workflows.",
    icon: Briefcase,
  },
];

const DIFFERENTIATORS = [
  { others: "Analyze creatives", adigator: "Validates the campaign" },
  { others: "Review images", adigator: "Reviews campaign intent" },
  { others: "Show previews", adigator: "Explains launch risks" },
  { others: "Focus on AI", adigator: "Focuses on operational quality" },
];

const WHO_WE_BUILD_FOR = [
  "Agency Operations",
  "Campaign Managers",
  "Creative Teams",
  "QA Teams",
  "Media Buyers",
  "Brands",
  "Enterprise Marketing",
  "Outsourcing Teams",
];

const VISION_ROADMAP = [
  { phase: "Today", label: "Creative Validation" },
  { phase: "Next", label: "Campaign Validation" },
  { phase: "Next", label: "Operational Quality Management" },
  { phase: "Future", label: "Campaign Intelligence Platform" },
];

function SectionHeader({
  title,
  dark = false,
  center = false,
}: {
  title: string;
  dark?: boolean;
  center?: boolean;
}) {
  return (
    <div className={`mb-6 max-w-3xl sm:mb-8 ${center ? "mx-auto text-center" : ""}`}>
      <h2
        className={`text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl ${dark ? "text-white" : ""}`}
      >
        {title}
      </h2>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#DDDCD4] bg-[#F5F5F0] py-20">
      <div className="mx-auto grid w-[min(1280px,92vw)] gap-12 md:grid-cols-5">
        <div className="md:col-span-2">
          <p className="text-2xl font-black tracking-tight">Adigator</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#66665F]">
            The pre launch campaign validation layer for agencies and brands who refuse to waste media spend on
            preventable errors.
          </p>
          <p className="mt-6 text-sm text-[#66665F]">© 2026 Adigator. All rights reserved.</p>
        </div>

        {MARKETING_FOOTER_COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#55554F]">{col.title}</p>
            <ul className="mt-4 space-y-3 text-sm text-[#4D4D47]">
              {col.items.map((item) => (
                <li key={`${col.title}-${item.label}-${item.href}`}>
                  <Link href={item.href} className="cursor-pointer hover:text-[#0D0D0D]">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-12 flex w-[min(1280px,92vw)] items-center justify-end gap-3">
        {MARKETING_PARTNER_BADGES.map((badge) => (
          <span
            key={badge}
            className="inline-flex rounded-full border border-[#D5D4CB] bg-white px-3 py-1 text-xs font-semibold text-[#4B4B47]"
          >
            {badge}
          </span>
        ))}
      </div>
    </footer>
  );
}

export default function AboutPage() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="marketing-page min-h-screen bg-[#F5F5F0] text-[#0D0D0D]">
      <MarketingNav activePath="/about" />

      <main className="pt-28">
        {/* Hero */}
        <section className="marketing-section marketing-section-compact mx-auto w-[min(980px,92vw)]">
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-[#5C5C56] sm:text-xl">
            Advertising has become faster than its quality control. Campaigns move from client brief to launch through
            multiple teams, platforms, and tools. Along the way, small mismatches between campaign intent, creatives,
            landing pages, platform requirements, and technical setup often go unnoticed until budgets are already being
            spent. Adigator was built to close that gap.
          </p>

          <h1 className="mx-auto mt-10 max-w-4xl text-center text-[clamp(2rem,5.5vw,4rem)] font-black leading-[1.02] tracking-[-0.04em]">
            We Didn&apos;t Build Another AI Tool.
            <br />
            <span className="text-[#2D2D27]">We Built the Validation Layer Campaigns Were Missing.</span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-center text-lg leading-relaxed text-[#5C5C56]">
            Every campaign passes through multiple teams before launch. Yet no one validates whether campaign intent,
            creatives, landing pages, platform requirements, and technical setup actually align. Adigator was built to
            solve that gap.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/product" className="marketing-btn-outline saas-hover rounded-full px-8 py-4 text-base font-semibold">
              See Product
            </Link>
            <Link href={MARKETING_CTA.href} className="marketing-btn-lime saas-hover rounded-full px-8 py-4 text-base font-bold">
              {MARKETING_CTA.label}
            </Link>
          </div>
        </section>

        {/* Why We Started Adigator */}
        <section id="why-we-started" className="relative overflow-hidden border-y border-[#DEDDD5] bg-[#FAFAF7] marketing-section-compact">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(200,240,77,0.08),transparent_50%),radial-gradient(ellipse_at_80%_80%,rgba(15,23,42,0.04),transparent_45%)]" />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -left-24 top-1/4 h-64 w-64 rounded-full bg-[#C8F04D]/10 blur-3xl"
            animate={reduceMotion ? undefined : { x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative mx-auto w-[min(1280px,92vw)]">
            <SectionHeader title="The creative wasn't always the problem" />

            <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
              <div>
                <p className="mb-4 text-center text-xs font-bold uppercase tracking-[0.18em] text-[#6B7280] lg:text-left">
                  Before Adigator
                </p>
                <div className="mx-auto flex max-w-sm flex-col items-center gap-0 lg:mx-0 lg:max-w-none lg:items-stretch">
                  {BEFORE_ADIGATOR_FLOW.map((step, i) => {
                    const isBlameStep = step === "Everyone blames the creative";
                    return (
                      <div key={step} className="flex w-full flex-col items-center lg:items-stretch">
                        <motion.div
                          initial={reduceMotion ? false : { opacity: 0, x: -24 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true, margin: "-40px" }}
                          transition={{ delay: i * 0.07, duration: 0.45, ease: "easeOut" }}
                          whileHover={reduceMotion ? undefined : { scale: 1.02, y: -2 }}
                          className={`relative w-full overflow-hidden rounded-xl border px-5 py-3.5 text-center text-sm font-semibold shadow-sm sm:text-base ${
                            isBlameStep
                              ? "border-red-200 bg-red-50 text-red-800"
                              : "border-[#DEDDD5] bg-white text-[#0D0D0D]"
                          }`}
                        >
                          {!reduceMotion && !isBlameStep ? (
                            <motion.span
                              className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                              animate={{ x: ["-120%", "320%"] }}
                              transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 3 + i * 0.4, ease: "easeInOut" }}
                            />
                          ) : null}
                          {isBlameStep && !reduceMotion ? (
                            <motion.span
                              className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-red-300/60"
                              animate={{ opacity: [0.3, 0.85, 0.3] }}
                              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                            />
                          ) : null}
                          <span className="relative">{step}</span>
                        </motion.div>
                        {i < BEFORE_ADIGATOR_FLOW.length - 1 ? (
                          <motion.div
                            initial={reduceMotion ? false : { opacity: 0, scaleY: 0 }}
                            whileInView={{ opacity: 1, scaleY: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.07 + 0.15, duration: 0.35 }}
                            className="flex flex-col items-center py-1.5"
                          >
                            <motion.span
                              animate={reduceMotion ? undefined : { y: [0, 4, 0] }}
                              transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                            >
                              <ArrowDown size={18} className="text-[#9CA3AF]" aria-hidden />
                            </motion.span>
                          </motion.div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="relative mx-auto mt-8 max-w-sm overflow-hidden rounded-2xl border border-amber-300/60 bg-gradient-to-br from-amber-50 via-white to-amber-50/80 p-6 text-center shadow-[0_16px_40px_rgba(245,158,11,0.12)] lg:mx-0 lg:max-w-none lg:text-left"
                >
                  {!reduceMotion ? (
                    <motion.div
                      className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-200/30 blur-2xl"
                      animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    />
                  ) : null}
                  <p className="relative text-sm font-bold uppercase tracking-[0.14em] text-amber-800">But often</p>
                  <p className="relative mt-3 text-lg font-black leading-snug text-[#0D0D0D]">
                    The creative wasn&apos;t the problem.
                  </p>
                  <p className="relative mt-2 text-base font-semibold text-amber-900">
                    The campaign was never validated.
                  </p>
                </motion.div>
              </div>

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className="relative flex flex-col justify-center overflow-hidden rounded-3xl border border-[#DEDDD5] bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)] sm:p-10"
              >
                {!reduceMotion ? (
                  <motion.div
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(200,240,77,0.06)_45%,transparent_70%)]"
                    animate={{ backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    style={{ backgroundSize: "200% 200%" }}
                  />
                ) : null}
                <p className="relative text-sm font-bold uppercase tracking-[0.18em] text-[#6B7280]">
                  That&apos;s why we built Adigator
                </p>
                <h3 className="relative mt-4 text-2xl font-black leading-tight tracking-tight sm:text-3xl">
                  The final validation layer before launch
                </h3>
                <ul className="relative mt-8 space-y-4">
                  {[
                    "Adigator doesn't replace your creative team.",
                    "It doesn't replace campaign managers.",
                    "It doesn't replace AdOps.",
                    "It becomes the final validation layer before launch.",
                  ].map((line, i) => (
                    <motion.li
                      key={line}
                      initial={reduceMotion ? false : { opacity: 0, x: 12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
                      className="flex items-start gap-3 text-base leading-relaxed text-[#3D3D38]"
                    >
                      <motion.span
                        initial={reduceMotion ? false : { scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 + i * 0.08, type: "spring", stiffness: 260, damping: 18 }}
                      >
                        <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" />
                      </motion.span>
                      {line}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Campaign Validation Gap */}
        <ValidationLayerDiagram
          title="Traditional workflows launch campaigns. They don't validate them."
          gapLabel="No validation"
        />

        {/* Campaign Reality */}
        <section id="reality" className="bg-[#0D0D0D] py-10 text-white sm:py-12 md:py-14">
          <div className="mx-auto w-[min(1280px,92vw)]">
            <SectionHeader dark center title="One campaign. Multiple teams. One opportunity to get it right." />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CAMPAIGN_TEAMS.map((team, i) => (
                <motion.article
                  key={team.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  className="saas-hover rounded-2xl border border-[#2A2A2A] bg-[#151515] p-6"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#1F1F1F] text-[#C8F04D]">
                    <team.icon size={20} />
                  </div>
                  <h3 className="text-lg font-black tracking-tight">{team.title}</h3>
                  <p className="mt-2 text-sm text-[#A3A3A3]">Completes its part of the workflow.</p>
                </motion.article>
              ))}
            </div>
            <p className="mx-auto mt-10 max-w-2xl text-center text-lg font-semibold text-[#D4D4D4]">
              Adigator is where those parts get validated together, before launch.
            </p>
          </div>
        </section>

        {/* Our Mission */}
        <section id="mission" className="marketing-section marketing-section-compact mx-auto w-[min(1280px,92vw)]">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                To make campaign validation a standard part of every advertising workflow.
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#5A5A55] lg:mx-0">
                Just as developers don&apos;t deploy code without testing, campaigns shouldn&apos;t launch without
                validation.
              </p>
            </div>
            <IllustrationWrapper
              src={STORYSET_ILLUSTRATIONS.teamGoalsRafiki}
              alt="Team united around shared campaign validation goals"
            />
          </div>
        </section>

        {/* Our Technology */}
        <section id="technology" className="border-y border-[#DEDDD5] bg-[#0D0D0D] marketing-section-compact">
          <div className="mx-auto grid w-[min(1280px,92vw)] items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <IllustrationWrapper
              src={STORYSET_ILLUSTRATIONS.nextStepsBro}
              alt="Next steps in Adigator AI validation technology infrastructure"
              className="order-2 lg:order-1"
            />
            <div className="order-1 text-center lg:order-2 lg:text-left">
              <h2 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                Technology built for campaign validation at scale
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#A3A3A3] lg:mx-0">
                An AI powered pipeline that connects creative analysis, platform requirements, URL validation, and
                launch readiness into one operational layer.
              </p>
            </div>
          </div>
        </section>

        {/* What We Believe */}
        <section id="beliefs" className="border-y border-[#DEDDD5] bg-[#FAFAF7] marketing-section-compact">
          <div className="mx-auto w-[min(1280px,92vw)]">
            <SectionHeader title="Principles that guide how we build" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {BELIEFS.map((belief, i) => (
                <motion.div
                  key={belief}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  className="saas-hover flex items-start gap-4 rounded-2xl border border-[#DEDDD5] bg-white p-6"
                >
                  <Check size={18} className="mt-0.5 shrink-0 text-emerald-600" />
                  <p className="text-base font-semibold leading-relaxed text-[#0D0D0D]">{belief}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section id="timeline" className="marketing-section marketing-section-compact mx-auto w-[min(1280px,92vw)]">
          <SectionHeader title="How Adigator came to be" />
          <div className="mx-auto max-w-lg">
            <div className="mb-6 inline-flex rounded-full border border-[#DEDDD5] bg-white px-5 py-2 text-sm font-black tracking-tight">
              2025
            </div>
            <div className="flex flex-col gap-2">
              {TIMELINE_2025.map((step, i) => (
                <div key={step} className="flex flex-col items-center">
                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="w-full rounded-xl border border-[#DEDDD5] bg-white px-5 py-4 text-center text-sm font-semibold leading-relaxed sm:text-base"
                  >
                    {step}
                  </motion.div>
                  {i < TIMELINE_2025.length - 1 ? (
                    <ArrowDown size={18} className="my-1.5 text-[#9CA3AF]" aria-hidden />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Four Pillars */}
        <section id="pillars" className="bg-[#0D0D0D] py-10 text-white sm:py-12 md:py-14">
          <div className="mx-auto w-[min(1280px,92vw)]">
            <SectionHeader dark title="What Adigator validates at every stage" />
            <div className="grid gap-5 sm:grid-cols-2">
              {FOUR_PILLARS.map((pillar, i) => (
                <motion.article
                  key={pillar.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="saas-hover rounded-3xl border border-[#2D2D2D] bg-[#141414] p-8"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#1F1F1F] text-[#C8F04D]">
                    <pillar.icon size={22} />
                  </div>
                  <h3 className="text-2xl font-black tracking-tight">{pillar.title}</h3>
                  <p className="mt-4 text-base leading-relaxed text-[#A8A8A8]">{pillar.description}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* What Makes Adigator Different */}
        <section id="different" className="marketing-section marketing-section-compact mx-auto w-[min(1280px,92vw)]">
          <SectionHeader title="We validate campaigns, not just creatives" />
          <div className="grid gap-5 sm:grid-cols-2">
            {DIFFERENTIATORS.map((item, i) => (
              <motion.article
                key={item.others}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="saas-hover overflow-hidden rounded-2xl border border-[#DEDDD5] bg-white"
              >
                <div className="flex items-center gap-3 border-b border-[#ECEAE3] bg-[#FAFAF7] px-6 py-4">
                  <X size={16} className="shrink-0 text-[#9CA3AF]" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9CA3AF]">Others</p>
                    <p className="text-base font-semibold text-[#6B7280]">{item.others}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-6 py-5">
                  <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Adigator</p>
                    <p className="text-lg font-black tracking-tight">{item.adigator}</p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        {/* Who We Build For */}
        <section id="who" className="border-y border-[#DEDDD5] bg-[#FAFAF7] marketing-section-compact">
          <div className="mx-auto w-[min(1280px,92vw)] text-center">
            <SectionHeader center title="Built for teams who ship campaigns at scale" />
            <div className="flex flex-wrap justify-center gap-3">
              {WHO_WE_BUILD_FOR.map((audience) => (
                <span
                  key={audience}
                  className="rounded-full border border-[#DEDDD5] bg-white px-5 py-2.5 text-sm font-bold text-[#0D0D0D]"
                >
                  {audience}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Where We're Going */}
        <section id="vision" className="marketing-section marketing-section-compact mx-auto w-[min(1280px,92vw)]">
          <SectionHeader title="From creative validation to campaign operations quality" />
          <div className="mx-auto flex max-w-md flex-col items-center gap-2">
            {VISION_ROADMAP.map((step, i) => (
              <div key={step.label} className="flex w-full flex-col items-center">
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className={`w-full rounded-xl border px-5 py-4 text-center ${
                    i === VISION_ROADMAP.length - 1
                      ? "border-[#C8F04D]/50 bg-[#C8F04D]/10"
                      : "border-[#DEDDD5] bg-white"
                  }`}
                >
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6B7280]">{step.phase}</p>
                  <p className="mt-1 text-base font-black tracking-tight sm:text-lg">{step.label}</p>
                </motion.div>
                {i < VISION_ROADMAP.length - 1 ? (
                  <ArrowDown size={18} className="my-1.5 text-[#9CA3AF]" aria-hidden />
                ) : null}
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="marketing-section marketing-section-compact mx-auto w-[min(980px,92vw)]">
          <div className="saas-hover rounded-[32px] border border-[#DBDAD2] bg-white px-8 py-10 text-center shadow-[0_20px_50px_rgba(15,23,42,0.08)] sm:px-12 sm:py-12">
            <h2 className="mx-auto max-w-3xl text-[clamp(1.75rem,4vw,3rem)] font-black leading-tight tracking-tight">
              Every Campaign Deserves One Final Validation Before Launch.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#5A5A55]">
              Whether you&apos;re launching five creatives or five thousand campaigns, Adigator helps your team validate
              with confidence.
            </p>
            <Link
              href={MARKETING_CTA.href}
              className="marketing-btn-lime saas-hover mt-10 inline-flex rounded-full px-10 py-4 text-base font-bold"
            >
              Book a Demo
            </Link>
          </div>
        </section>
      </main>

      <Footer />

      <style jsx global>{`
        .saas-hover {
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
        }

        .saas-hover:hover {
          transform: translateY(-3px);
          box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.42), 0 16px 34px rgba(15, 23, 42, 0.12);
        }
      `}</style>
    </div>
  );
}
