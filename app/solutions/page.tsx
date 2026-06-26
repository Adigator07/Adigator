"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  BarChart3,
  Briefcase,
  Check,
  CheckCircle2,
  FileText,
  Globe,
  Image,
  Link2,
  Monitor,
  Shield,
  Smartphone,
  Target,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  MARKETING_CTA,
  MARKETING_FOOTER_COLUMNS,
  MARKETING_PARTNER_BADGES,
} from "@/app/lib/siteNavigation";
import MarketingNav from "@/app/components/MarketingNav";
import ValidationLayerDiagram from "@/app/components/marketing/ValidationLayerDiagram";

const PROBLEMS_WE_SOLVE = [
  {
    title: "Campaign Validation",
    description:
      "No one checks whether campaign objective, creative, landing page, and messaging actually align before launch.",
    icon: Target,
  },
  {
    title: "Technical Validation",
    description:
      "Wrong sizes, unsupported formats, oversized files, and placement issues delay campaigns.",
    icon: Shield,
  },
  {
    title: "Creative QA",
    description: "Creative looks good. But is it right for this campaign?",
    icon: Image,
  },
  {
    title: "Platform Validation",
    description: "Meta, Google, and Programmatic all have different requirements.",
    icon: Monitor,
  },
  {
    title: "Landing Page Validation",
    description:
      "The creative promises one thing. The landing page says another. Users leave.",
    icon: Globe,
  },
  {
    title: "Operational Validation",
    description:
      "Campaign managers, creative teams, AdOps, and QA all assume someone else checked everything.",
    icon: Users,
  },
];

const CAMPAIGN_JOURNEY = [
  "Campaign starts",
  "Creative created",
  "Landing page built",
  "Campaign configured",
  "Platform selected",
  "Adigator validates everything",
  "Campaign launches confidently",
];

const OUTCOME_CARDS = [
  {
    title: "Prevent Campaign Errors",
    description: "Catch campaign issues before media spend begins.",
    icon: "✓",
  },
  {
    title: "Validate Creative Intent",
    description:
      "Ensure creatives support campaign objective, landing page, and messaging.",
    icon: "◎",
  },
  {
    title: "Validate Platform Requirements",
    description:
      "Automatically verify every creative against Meta, Google, and Programmatic requirements.",
    icon: "◈",
  },
  {
    title: "Launch With Confidence",
    description:
      "Know exactly which creatives are ready and which require attention before launch.",
    icon: "↗",
  },
];

const WORKFLOW_SOLUTIONS = [
  { title: "Campaign Validation", description: "Align brief, goal, creative, and landing page before anyone signs off." },
  { title: "Creative QA", description: "Structured review so creative teams stop guessing what still needs fixing." },
  { title: "Platform Validation", description: "Meta, Google, and Programmatic specs checked in one workflow." },
  { title: "Launch Readiness", description: "Clear go or no go signals before media budgets go live." },
  { title: "Preview Studio", description: "See creatives in realistic publisher environments before launch." },
  { title: "Enterprise Reporting", description: "Shareable validation reports for clients, QA, and leadership." },
];

const TEAM_SOLUTIONS = [
  { title: "Creative Teams", description: "Fewer revision loops. Clear feedback tied to campaign intent." },
  { title: "Campaign Managers", description: "One place to confirm everything aligns before handoff to AdOps." },
  { title: "Media Buyers", description: "Protect budgets from preventable rejections and misaligned placements." },
  { title: "Ad Operations", description: "Stop firefighting format issues on launch day." },
  { title: "QA Teams", description: "Standardized checks across creatives, URLs, and platform requirements." },
  { title: "Brand Teams", description: "Consistent validation standards across regions and channels." },
  { title: "Agency Operations", description: "Unified workflow across clients, teams, and approval stages." },
];

const PLATFORM_SOLUTIONS = [
  { title: "Meta Ads", description: "Feed, Story, Reels, and placement safe zones validated together." },
  { title: "Google Ads", description: "Display, RDA, and Demand Gen size and format requirements covered." },
  { title: "Programmatic", description: "RTB sizes, file weight, and inventory compatibility checked." },
  { title: "Display", description: "IAB standard sizes and viewability friendly assets." },
  { title: "Responsive Display", description: "Crop survival and asset group readiness for Google RDA." },
  { title: "Native", description: "Publisher native formats and in feed creative fit." },
];

const VALIDATES_GRID = [
  { label: "Campaign Brief", icon: Briefcase },
  { label: "Campaign Goal", icon: Target },
  { label: "Campaign Description", icon: FileText },
  { label: "Creative", icon: Image },
  { label: "Landing Page", icon: Globe },
  { label: "URL", icon: Link2 },
  { label: "UTM", icon: Zap },
  { label: "File Size", icon: Shield },
  { label: "Safe Zones", icon: Monitor },
  { label: "Placement Compatibility", icon: BarChart3 },
  { label: "Device Compatibility", icon: Smartphone },
  { label: "Inventory Compatibility", icon: FileText },
  { label: "Preview", icon: Monitor },
  { label: "Launch Readiness", icon: CheckCircle2 },
];

const INDUSTRY_SOLUTIONS = [
  {
    title: "Agencies",
    description: "Reduce revisions across creative, campaign management, and AdOps.",
    icon: "▣",
  },
  {
    title: "Brands",
    description: "Launch campaigns with confidence before media budgets start spending.",
    icon: "◇",
  },
  {
    title: "Outsourcing Teams",
    description: "Reduce QA effort and improve campaign consistency.",
    icon: "◌",
  },
  {
    title: "Enterprise Marketing",
    description: "Standardize campaign validation across teams and regions.",
    icon: "⬡",
  },
];

const WITHOUT_VALIDATION = [
  "Wrong placement",
  "Wrong URL",
  "Wrong objective",
  "Wrong landing page",
  "Wrong size",
];

const METRICS = [
  { value: "15+", label: "Campaign Components Validated" },
  { value: "3", label: "Platforms Supported" },
  { value: "40+", label: "Placement Types" },
  { value: "35+", label: "Creative Formats" },
  { value: "10+", label: "Validation Layers" },
  { value: "Unlimited", label: "Launch Readiness Reports" },
];

function SectionHeader({
  eyebrow,
  title,
  description,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  dark?: boolean;
}) {
  return (
    <div className="mb-10 max-w-3xl sm:mb-12">
      <p
        className={`text-sm font-semibold uppercase tracking-[0.18em] ${dark ? "text-[#9CA3AF]" : "text-[#6B7280]"}`}
      >
        {eyebrow}
      </p>
      <h2
        className={`mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl ${dark ? "text-white" : ""}`}
      >
        {title}
      </h2>
      {description ? (
        <p className={`mt-4 text-base leading-relaxed sm:text-lg ${dark ? "text-[#A3A3A3]" : "text-[#5A5A55]"}`}>
          {description}
        </p>
      ) : null}
    </div>
  );
}

function SolutionGrid({
  items,
}: {
  items: Array<{ title: string; description: string; icon?: string }>;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => (
        <motion.article
          key={item.title}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.04 }}
          className="saas-hover rounded-2xl border border-[#DEDDD5] bg-white p-6 shadow-[0_12px_24px_rgba(15,23,42,0.05)] sm:p-7"
        >
          {item.icon ? (
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#D8D7CF] bg-[#F8F8F4] text-lg font-bold">
              {item.icon}
            </div>
          ) : null}
          <h3 className="text-xl font-black leading-tight tracking-tight">{item.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-[#585852] sm:text-base">{item.description}</p>
        </motion.article>
      ))}
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

export default function SolutionsPage() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="marketing-page min-h-screen bg-[#F5F5F0] text-[#0D0D0D]">
      <MarketingNav activePath="/solutions" />

      <main className="pt-28">
        {/* 1. Hero */}
        <section className="marketing-section mx-auto w-[min(980px,92vw)] py-16 text-center sm:py-20 md:py-28">
          <span className="inline-flex rounded-full border border-[#D4D3CC] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#51514A]">
            Solutions
          </span>
          <h1 className="mx-auto mt-6 max-w-5xl text-[clamp(2rem,6vw,4.5rem)] font-black leading-[0.98] tracking-[-0.04em] sm:mt-8">
            Solutions Built for Modern Campaign Operations
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-[#5C5C56]">
            Every campaign involves multiple teams, platforms, creatives, landing pages, and technical requirements.
            Adigator helps agencies and brands validate every campaign before launch, reducing operational errors,
            unnecessary rework, and wasted media spend.
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

        {/* 2. Problems We Solve */}
        <section id="problems" className="marketing-section mx-auto w-[min(1280px,92vw)] py-12 sm:py-16 md:py-20">
          <SectionHeader
            eyebrow="The problems we solve"
            title="Operational problems every campaign team recognizes"
            description="These are not feature gaps. They are workflow failures that cost time, budget, and client trust."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PROBLEMS_WE_SOLVE.map((problem, i) => (
              <motion.article
                key={problem.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="saas-hover rounded-2xl border border-[#DEDDD5] bg-white p-6 shadow-[0_12px_24px_rgba(15,23,42,0.05)] sm:p-7"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#EEF0E7] text-[#0D0D0D]">
                  <problem.icon size={20} />
                </div>
                <h3 className="text-xl font-black leading-tight tracking-tight">{problem.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#585852] sm:text-base">{problem.description}</p>
              </motion.article>
            ))}
          </div>
        </section>

        {/* Campaign journey */}
        <section id="journey" className="border-y border-[#DEDDD5] bg-[#FAFAF7] py-16 sm:py-20">
          <div className="mx-auto w-[min(1280px,92vw)]">
            <SectionHeader
              eyebrow="The campaign journey"
              title="Where validation fits in your workflow"
              description="Most tools analyze creatives in isolation. Adigator validates the full campaign path from brief to launch."
            />
            <div className="mx-auto flex max-w-md flex-col items-center gap-2">
              {CAMPAIGN_JOURNEY.map((step, i) => (
                <div key={step} className="flex w-full flex-col items-center">
                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04 }}
                    className={`w-full rounded-xl border px-5 py-3.5 text-center text-sm font-semibold sm:text-base ${
                      step === "Adigator validates everything"
                        ? "border-[#C8F04D]/50 bg-[#C8F04D]/15 text-[#0D0D0D] shadow-[0_0_24px_rgba(200,240,77,0.2)]"
                        : "border-[#DEDDD5] bg-white text-[#0D0D0D]"
                    }`}
                  >
                    {step}
                  </motion.div>
                  {i < CAMPAIGN_JOURNEY.length - 1 ? (
                    <ArrowDown size={18} className="my-1.5 text-[#9CA3AF]" aria-hidden />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Problem-based outcome cards */}
        <section className="marketing-section mx-auto w-[min(1280px,92vw)] py-16 sm:py-20 md:py-24">
          <SectionHeader
            eyebrow="What you get"
            title="Solutions to operational problems, not another feature list"
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {OUTCOME_CARDS.map((card, i) => (
              <motion.article
                key={card.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="saas-hover rounded-3xl border border-[#DEDDD5] bg-white p-7 shadow-[0_12px_24px_rgba(15,23,42,0.05)]"
              >
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#D8D7CF] bg-[#F8F8F4] text-xl font-bold">
                  {card.icon}
                </div>
                <h3 className="text-2xl font-black leading-tight tracking-tight">{card.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-[#585852] sm:text-base">{card.description}</p>
              </motion.article>
            ))}
          </div>
        </section>

        {/* Solutions by Workflow */}
        <section id="workflow" className="bg-[#0D0D0D] py-16 text-white sm:py-20 md:py-24">
          <div className="mx-auto w-[min(1280px,92vw)]">
            <SectionHeader
              dark
              eyebrow="Solutions by workflow"
              title="Built around how campaigns actually move"
              description="Each workflow stage gets validation before it reaches the next handoff."
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {WORKFLOW_SOLUTIONS.map((item, i) => (
                <motion.article
                  key={item.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  className="saas-hover rounded-2xl border border-[#2A2A2A] bg-[#151515] p-6 sm:p-7"
                >
                  <h3 className="text-xl font-black leading-tight tracking-tight">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#A3A3A3] sm:text-base">{item.description}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* Solutions by Team */}
        <section id="team" className="marketing-section mx-auto w-[min(1280px,92vw)] py-16 sm:py-20 md:py-24">
          <SectionHeader
            eyebrow="Solutions by team"
            title="Every role in the campaign chain, covered"
            description="Creative, campaign management, media buying, AdOps, QA, brand, and agency operations all work from the same validation layer."
          />
          <SolutionGrid items={TEAM_SOLUTIONS} />
        </section>

        {/* Solutions by Platform */}
        <section id="platform" className="border-y border-[#DEDDD5] bg-[#FAFAF7] py-16 sm:py-20 md:py-24">
          <div className="mx-auto w-[min(1280px,92vw)]">
            <SectionHeader
              eyebrow="Solutions by platform"
              title="One campaign. Multiple platforms. One validation pass."
            />
            <SolutionGrid items={PLATFORM_SOLUTIONS} />
          </div>
        </section>

        {/* Why Teams Need This */}
        <ValidationLayerDiagram
          eyebrow="Why teams need this"
          title="Everyone assumes someone else validated the campaign."
          description="Without a dedicated validation layer, errors slip through every handoff. Adigator sits between campaign setup and launch."
          gapLabel="No validation"
        />

        {/* What Adigator Validates */}
        <section id="validates" className="marketing-section mx-auto w-[min(1280px,92vw)] py-16 sm:py-20 md:py-24">
          <SectionHeader
            eyebrow="Validation scope"
            title="What Adigator validates"
            description="One connected pass across every component that can break a campaign before launch."
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {VALIDATES_GRID.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="saas-hover flex flex-col items-center rounded-2xl border border-[#DEDDD5] bg-white p-5 text-center shadow-[0_8px_20px_rgba(15,23,42,0.04)]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EEF0E7] text-[#0D0D0D]">
                  <Icon size={20} />
                </div>
                <p className="mt-3 text-sm font-bold leading-snug">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Industry / Who it's for */}
        <section id="industry" className="bg-[#0D0D0D] py-16 text-white sm:py-20 md:py-24">
          <div className="mx-auto w-[min(1280px,92vw)]">
            <SectionHeader
              dark
              eyebrow="Who it's for"
              title="Built for teams who ship campaigns at scale"
              description="Not a list of verticals. Real operational reasons agencies and brands adopt Adigator."
            />
            <div className="grid gap-5 sm:grid-cols-2">
              {INDUSTRY_SOLUTIONS.map((item, i) => (
                <motion.article
                  key={item.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="saas-hover rounded-3xl border border-[#2D2D2D] bg-[#141414] p-8"
                >
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#3A3A3A] bg-[#1F1F1F] text-xl font-bold">
                    {item.icon}
                  </div>
                  <h3 className="text-2xl font-black leading-tight tracking-tight">{item.title}</h3>
                  <p className="mt-4 text-base leading-relaxed text-[#A8A8A8]">{item.description}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* Campaign Reality */}
        <section id="reality" className="marketing-section mx-auto w-[min(1280px,92vw)] py-16 sm:py-20 md:py-24">
          <SectionHeader
            eyebrow="Campaign reality"
            title="What happens when nobody validates before launch"
          />
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-3xl border border-[#DEDDD5] bg-white p-8 sm:p-10">
              <div className="flex flex-wrap gap-3">
                {["73 creatives", "4 platforms", "3 teams", "1 campaign"].map((tag) => (
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
                Without validation
              </p>
              <ul className="mt-4 space-y-3">
                {WITHOUT_VALIDATION.map((issue) => (
                  <li key={issue} className="flex items-center gap-3 text-base font-semibold text-[#0D0D0D]">
                    <span className="text-red-500">↓</span>
                    {issue}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-[#C8F04D]/40 bg-[#C8F04D]/10 p-8 sm:p-10">
              <div className="flex flex-wrap gap-3">
                {["73 creatives", "4 platforms", "3 teams", "1 campaign"].map((tag) => (
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
              <ul className="mt-4 space-y-4">
                <li className="flex items-center gap-3 text-xl font-black tracking-tight">
                  <span className="text-emerald-600">↓</span>
                  One validation report
                </li>
                <li className="flex items-center gap-3 text-lg font-semibold text-[#0D0D0D]">
                  <CheckCircle2 size={20} className="text-emerald-600" />
                  Everything checked before launch
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Why Adigator Exists */}
        <section id="why-exists" className="border-y border-[#DEDDD5] bg-[#FAFAF7] py-16 sm:py-20 md:py-24">
          <div className="mx-auto w-[min(780px,92vw)] text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6B7280]">Why Adigator exists</p>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Today&apos;s workflow focuses on launching campaigns. Not validating them.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#5A5A55]">
              Adigator introduces the missing validation layer between campaign setup and campaign launch. That is the
              difference between shipping ads and shipping campaigns that actually work.
            </p>
          </div>
        </section>

        {/* Metrics */}
        <section id="metrics" className="bg-[#0D0D0D] py-16 text-white sm:py-20 md:py-24">
          <div className="mx-auto w-[min(1280px,92vw)]">
            <SectionHeader dark eyebrow="Platform scale" title="Enterprise validation coverage" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {METRICS.map((metric, i) => (
                <motion.article
                  key={metric.label}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  className="saas-hover rounded-3xl border border-[#2D2D2D] bg-[#141414] p-8"
                >
                  <p className="text-4xl font-black leading-tight text-[#C8F04D] sm:text-5xl">{metric.value}</p>
                  <p className="mt-3 text-sm font-semibold text-[#A8A8A8] sm:text-base">{metric.label}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="marketing-section mx-auto w-[min(980px,92vw)] py-16 sm:py-20 md:py-28">
          <div className="saas-hover rounded-[32px] border border-[#DBDAD2] bg-white px-8 py-12 text-center shadow-[0_20px_50px_rgba(15,23,42,0.08)] sm:px-12 sm:py-16">
            <h2 className="mx-auto max-w-3xl text-[clamp(1.75rem,4vw,3rem)] font-black leading-tight tracking-tight">
              Every Campaign Deserves One Final Validation Before Launch.
            </h2>
            <ul className="mx-auto mt-8 flex max-w-lg flex-col gap-2 text-left sm:mx-auto sm:max-w-md">
              {[
                "Prevent campaign errors.",
                "Reduce rework.",
                "Protect media budgets.",
                "Launch with confidence.",
              ].map((line) => (
                <li key={line} className="flex items-center gap-3 text-base font-semibold text-[#3D3D38] sm:text-lg">
                  <Check size={18} className="shrink-0 text-emerald-600" />
                  {line}
                </li>
              ))}
            </ul>
            <Link
              href={MARKETING_CTA.href}
              className="marketing-btn-lime saas-hover mt-10 inline-flex rounded-full px-10 py-4 text-base font-bold"
            >
              {MARKETING_CTA.label}
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
