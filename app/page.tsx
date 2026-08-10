"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Activity,
  BarChart3,
  Briefcase,
  Check,
  Flag,
  Globe,
  Image,
  Link2,
  Megaphone,
  MessageSquare,
  Monitor,
  Shield,
  Smartphone,
  Target,
  Users,
  Zap,
} from "lucide-react";
import {
  MARKETING_CTA,
  MARKETING_DEMO_VIDEO,
} from "@/app/lib/siteNavigation";
import MarketingNav from "@/app/components/MarketingNav";
import MarketingFooter from "@/app/components/MarketingFooter";
import { IllustrationSkeleton } from "@/app/components/illustrations/IllustrationWrapper";
import { STORYSET_ILLUSTRATIONS } from "@/app/lib/storysetIllustrations";
import {
  GoogleAdsIcon,
  MetaIcon,
  TradeDeskIcon,
} from "@/app/components/brand/PlatformBrandIcons";

const IllustrationWrapper = dynamic(
  () => import("@/app/components/illustrations/IllustrationWrapper"),
  { loading: () => <IllustrationSkeleton /> },
);
const HeroPreviewShowcase = dynamic(() => import("@/app/components/marketing/HeroPreviewShowcase"), {
  ssr: false,
  loading: () => <div className="min-h-105 animate-pulse rounded-[28px] bg-[#111111]/80" aria-hidden />,
});
const ValidationLayerDiagram = dynamic(
  () => import("@/app/components/marketing/ValidationLayerDiagram"),
  { ssr: false },
);
const HeroLiveCards = dynamic(() => import("@/app/components/marketing/HeroLiveCards"), {
  ssr: false,
  loading: () => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-hidden>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="min-h-65 animate-pulse rounded-[20px] bg-[#111111]" />
      ))}
    </div>
  ),
});
const PipelineCoreEngine = dynamic(() => import("@/app/components/marketing/PipelineCoreEngine"), {
  ssr: false,
  loading: () => <div className="min-h-105 animate-pulse rounded-3xl bg-[#111111]/80" aria-hidden />,
});
const CampaignTaskValidationSection = dynamic(
  () => import("@/app/components/marketing/CampaignTaskValidationSection"),
  { ssr: false },
);
const ValidationReportSection = dynamic(
  () => import("@/app/components/marketing/ValidationReportSection"),
  { ssr: false },
);
const AdigatorPlatformSection = dynamic(
  () => import("@/app/components/marketing/AdigatorPlatformSection"),
  { ssr: false },
);

const TICKER_BENEFITS = [
  "Campaign Validation",
  "Creative Validation",
  "Landing Page Match",
  "URL Validation",
  "UTM Detection",
  "Safe Zone Checks",
  "Placement Compatibility",
  "Device Compatibility",
  "File Size Validation",
  "Story and Reels Compatibility",
  "Platform Coverage",
  "Launch Readiness",
  "Technical QA",
  "Creative Preview",
  "PPTX Reports",
  "Google Ads",
  "Meta Ads",
  "Programmatic",
];

const HERO_PILLS = ["AI-ready validation", "Human-in-the-loop", "Launch faster"];

const WHY_CAMPAIGNS_FAIL = [
  {
    title: "Handoffs hide the truth",
    body: "Brief, creative, landing page, and tracking live in different tools, so nobody sees the full picture until launch day.",
  },
  {
    title: "Assets pass alone and fail together",
    body: "A creative can look perfect and still contradict the offer, destination, or objective.",
  },
  {
    title: "Technical blockers show up late",
    body: "Wrong sizes, broken URLs, and missing UTMs become emergencies only after trafficking begins.",
  },
  {
    title: "Swaps and renewals skip re-validation",
    body: "Mid-flight changes inherit yesterday's assumptions and quietly reintroduce known failures.",
  },
  {
    title: "Manual QA does not scale",
    body: "Checklists drift by team, market, and deadline. Enterprise operations need a system, not folklore.",
  },
  {
    title: "Spend starts before readiness is proven",
    body: "Once media is live, every mismatch becomes wasted budget, escalation, or both.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "Step 1",
    title: "Capture campaign intelligence",
    items: ["Campaign Goal", "Ad Group Objective", "Vertical", "Offer Context", "Landing Page", "Platform"],
    tag: "Intelligence",
  },
  {
    step: "Step 2",
    title: "Validate the package",
    items: ["Creative Alignment", "Landing Continuity", "Sizes & Formats", "URLs", "UTMs & Tracking"],
    tag: "Validate",
  },
  {
    step: "Step 3",
    title: "Gate every operational task",
    items: ["Setup", "Creative Swap", "Landing Update", "Renewal", "Handoff"],
    tag: "Operate",
  },
  {
    step: "Step 4",
    title: "Ship launch-ready",
    items: ["Preview", "Readiness Report", "PPTX Export", "Execution Confidence"],
    tag: "Launch",
  },
];

const UNDERSTANDS_ITEMS = [
  { label: "Campaign Brief", icon: Briefcase },
  { label: "Campaign Goal", icon: Flag },
  { label: "Creative Intent", icon: Image },
  { label: "Messaging Alignment", icon: MessageSquare },
  { label: "Landing Experience", icon: Globe },
  { label: "Destination URLs", icon: Link2 },
  { label: "UTM Structure", icon: Target },
  { label: "Tracking Readiness", icon: Activity },
  { label: "Technical QA", icon: Shield },
  { label: "Safe Zones", icon: Monitor },
  { label: "Platform Specs", icon: BarChart3 },
  { label: "Placements", icon: Zap },
  { label: "Device Fit", icon: Smartphone },
  { label: "Operational Tasks", icon: Megaphone },
  { label: "Audience (Coming Soon)", icon: Users },
];

const PLATFORMS = [
  {
    name: "Meta Ads",
    desc: "Feed, Story, Reels, and safe-zone validation before trafficking.",
    accent: "from-[#0081FB]/20 to-[#66b3ff]/20",
    renderIcon: () => <MetaIcon className="h-5 w-5" />,
  },
  {
    name: "Google Ads",
    desc: "Display, RDA, and Demand Gen requirements in one readiness pass.",
    accent: "from-[#4285f4]/20 to-[#34a853]/20",
    renderIcon: () => <GoogleAdsIcon className="h-5 w-5" />,
  },
  {
    name: "Programmatic Display",
    desc: "RTB sizes, file weight, and placement compatibility.",
    accent: "from-[#111111]/15 to-[#E01933]/20",
    renderIcon: () => <TradeDeskIcon className="h-5 w-5" />,
  },
  {
    name: "Responsive Display",
    desc: "Ratio and asset-set checks for Google Responsive Display Ads.",
    accent: "from-[#0ea5e9]/20 to-[#14b8a6]/20",
    renderIcon: () => <Monitor size={20} />,
  },
  {
    name: "Cross-device placements",
    desc: "Desktop, mobile, and tablet fit across the package.",
    accent: "from-[#f59e0b]/20 to-[#ef4444]/20",
    renderIcon: () => <Smartphone size={20} />,
  },
];

const OPERATIONAL_VALUE = [
  {
    title: "One readiness signal",
    description:
      "Replace fragmented QA threads with a shared campaign readiness report your creative, planning, and AdOps teams can trust.",
  },
  {
    title: "Validate the change, not just the launch",
    description:
      "Treat swaps, landing updates, renewals, and handoffs as first-class validation events so quality does not reset mid-flight.",
  },
  {
    title: "Prevent the expensive failures",
    description:
      "Wrong destinations, expired offers, and spec rejects are cheap to catch before spend, and expensive afterward.",
  },
];

const BUILT_FOR = [
  "Agency Operations",
  "Campaign Managers",
  "Creative Teams",
  "Ad Operations",
  "QA Teams",
  "Media Buyers",
  "Brand Teams",
  "Outsourcing Partners",
  "Enterprise Marketing",
];

const TEAM_OUTCOMES = [
  "Standardize pre-launch validation across pods",
  "Reduce rework between creative and AdOps",
  "Catch destination and tracking issues early",
  "Shorten QA cycles without lowering the bar",
  "Protect client trust with auditable readiness",
  "Keep renewals and swaps from inheriting defects",
  "Scale quality without adding headcount folklore",
];

const WORKFLOW_STEPS = [
  "Anchor validation in campaign intelligence, not isolated assets.",
  "Align creative, offer, and landing experience before trafficking.",
  "Confirm platform specs, URLs, and tracking integrity.",
  "Gate mid-flight tasks the same way you gate launches.",
  "Leave a readiness trail your next renewal can reuse.",
];

export default function HomePage() {
  const reduceMotion = useReducedMotion();
  const howItWorksCards = [...HOW_IT_WORKS, ...HOW_IT_WORKS];
  const slideOffset = (direction: "left" | "right", intensity: "sm" | "md" | "lg" = "md") => {
    const valueByIntensity: Record<"sm" | "md" | "lg", string> = {
      sm: "clamp(10px,2vw,18px)",
      md: "clamp(14px,2.8vw,26px)",
      lg: "clamp(18px,3.6vw,34px)",
    };
    const value = valueByIntensity[intensity];
    return direction === "left" ? `-${value}` : value;
  };

  return (
    <div className="marketing-page relative min-h-screen overflow-hidden scroll-smooth bg-[#EEF2F4] text-[#0D0D0D]">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden [contain:strict]" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(255,255,255,0.9),transparent_55%),linear-gradient(180deg,#F4F7F8_0%,#E8EEF2_45%,#F1F5F7_100%)]" />
        <div className="agi-smoke-fog opacity-45" />
        <div className="agi-light-cycle opacity-35" />
      </div>
      <MarketingNav activePath="/" />

      <main className="relative z-10 pt-28">
        {/* Hero */}
        <section className="marketing-section marketing-section-compact mx-auto w-[min(1280px,92vw)]">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, x: slideOffset("left", "lg") }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-[36px] border border-white/50 bg-white/80 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.08)] sm:p-8 lg:p-10"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.55),transparent_45%)]" />

            <div className="relative z-10 grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-10 lg:gap-12">
              <div className="min-w-0">
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, x: slideOffset("left", "md") }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.6, delay: reduceMotion ? 0 : 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="mb-6 inline-flex flex-wrap gap-2"
                >
                  {HERO_PILLS.map((pill) => (
                    <span key={pill} className="hero-floating-pill rounded-full border border-black/10 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#4B5563] backdrop-blur">
                      {pill}
                    </span>
                  ))}
                </motion.div>

                <motion.h1
                  initial={reduceMotion ? false : { opacity: 0, x: slideOffset("left", "lg") }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.7, delay: reduceMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="text-[clamp(2rem,4.5vw,3.25rem)] font-black leading-[1.08] tracking-[-0.035em]"
                >
                  Catch Campaign Mistakes Before Media Spend Begins
                </motion.h1>

                <motion.p
                  initial={reduceMotion ? false : { opacity: 0, x: slideOffset("left", "md") }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.7, delay: reduceMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-6 max-w-2xl text-lg leading-relaxed text-[#5A5A55] sm:text-xl"
                >
                  The operational validation layer for modern AdOps. Catch misalignment across brief, creative,
                  landing page, URLs, and platform requirements before media spend begins.
                </motion.p>

                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, x: slideOffset("left", "sm") }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.7, delay: reduceMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-8 flex flex-wrap gap-4"
                >
                  <Link
                    href={MARKETING_CTA.href}
                    className="marketing-btn-lime saas-hover rounded-full px-8 py-4 text-base font-bold"
                  >
                    {MARKETING_CTA.label}
                  </Link>
                  <Link
                    href={MARKETING_DEMO_VIDEO.href}
                    className="marketing-btn-outline saas-hover rounded-full px-8 py-4 text-base font-semibold"
                  >
                    {MARKETING_DEMO_VIDEO.label}
                  </Link>
                </motion.div>

                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, x: slideOffset("left", "sm") }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.7, delay: reduceMotion ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-8 flex flex-wrap gap-3 text-sm text-[#4B5563]"
                >
                  <span className="rounded-full border border-black/10 bg-white/70 px-3 py-2 backdrop-blur">Pre-launch confidence</span>
                  <span className="rounded-full border border-black/10 bg-white/70 px-3 py-2 backdrop-blur">Cross-channel readiness</span>
                  <span className="rounded-full border border-black/10 bg-white/70 px-3 py-2 backdrop-blur">Fast handoffs</span>
                </motion.div>
              </div>

              <div className="relative flex min-w-0 items-center justify-center py-4 lg:py-0 lg:pl-6">
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, x: slideOffset("right", "lg"), scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ duration: reduceMotion ? 0 : 0.8, delay: reduceMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="hero-floating-card bottom-[10%] right-[2%] hidden rounded-2xl border border-black/10 bg-[#111111]/90 p-4 text-white shadow-[0_24px_70px_rgba(15,23,42,0.2)] lg:block"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-white/60">Runtime</p>
                  <p className="mt-2 text-base font-semibold">Live readiness</p>
                  <p className="mt-1 text-sm text-white/75">Warnings surface before spend starts.</p>
                </motion.div>

                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className={`relative w-full ${reduceMotion ? "" : "agi-hero-float"}`}
                >
                  <div
                    className="pointer-events-none absolute left-1/2 top-1/2 h-[min(100%,500px)] w-[min(92%,560px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(200,240,77,0.22)_0%,rgba(200,240,77,0.06)_45%,transparent_72%)]"
                    aria-hidden
                  />
                  <IllustrationWrapper
                    src={STORYSET_ILLUSTRATIONS.digitalTransformationBro}
                    alt="Digital transformation and campaign intelligence platform"
                    className="relative z-10 mx-auto w-full max-w-[min(100%,520px)] sm:max-w-136 lg:max-w-152 xl:max-w-2xl"
                    animation="fade-up"
                    delay={0.15}
                    priority
                  />
                </motion.div>
              </div>
            </div>
          </motion.div>

          <div className="mt-8 lg:mt-10">
            <HeroPreviewShowcase className="mx-auto max-w-2xl" />
          </div>

          <ValidationLayerDiagram embedded />
          <AdigatorPlatformSection />
          <HeroLiveCards />
        </section>

        {/* Trusted by + ticker (dark) */}
        <section className="relative overflow-hidden border-y border-[#1A1A1A] bg-[#0A0A0A] py-8 shadow-[inset_0_8px_32px_rgba(0,0,0,0.45)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.04),transparent_70%)]" />
          <p className="relative text-center text-lg font-black tracking-tight text-white sm:text-xl">
            Trusted by modern AdOps teams
          </p>
          <div className="ticker-track-dark relative mt-6 overflow-hidden py-1">
            <div className="ticker-track flex min-w-max gap-3">
              {[...TICKER_BENEFITS, ...TICKER_BENEFITS].map((item, idx) => (
                <div
                  key={`${item}-${idx}`}
                  className="ticker-pill flex h-10 min-w-max items-center gap-2 rounded-full border px-4 text-sm font-semibold"
                >
                  <Check size={14} className="text-[#C8F04D]" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Operational failure modes */}
        <section className="marketing-section marketing-section-compact mx-auto w-[min(1280px,92vw)]">
          <div className="mb-6 max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8A8A82]">
              Operational reality
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Where campaign operations break
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-[#5A5A55]">
              Most failures are not creative talent problems. They are system problems: seams, assumptions, and
              missing gates between teams.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {WHY_CAMPAIGNS_FAIL.map((item, i) => (
              <motion.article
                key={item.title}
                initial={reduceMotion ? false : { opacity: 0, x: i % 2 === 0 ? slideOffset("left", "md") : slideOffset("right", "md") }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2, margin: "80px 0px" }}
                transition={{ delay: i * 0.06 }}
                className="saas-hover rounded-2xl border border-[#DEDDD5] bg-white p-6 shadow-[0_12px_24px_rgba(15,23,42,0.05)] sm:p-7"
              >
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#8A8A82]">0{i + 1}</span>
                <p className="mt-3 text-lg font-bold leading-snug tracking-tight">{item.title}</p>
                <p className="mt-3 text-sm leading-relaxed text-[#5A5A55]">{item.body}</p>
              </motion.article>
            ))}
          </div>

          <p className="mt-8 text-center text-xl font-black tracking-tight sm:text-2xl">
            Validate the system before you fund the spend.
          </p>
        </section>

        {/* How it works */}
        <section className="bg-[#0D0D0D] py-10 text-white sm:py-12 md:py-14">
          <div className="mx-auto w-[min(1280px,92vw)]">
            <div className="mb-6 lg:mb-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
                Validation workflow
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                From intelligence to execution confidence
              </h2>
            </div>

            <div className="roller-coaster-shell overflow-hidden px-1">
              <div className={reduceMotion ? "flex gap-5" : "modules-track flex w-max gap-5 pr-5"}>
                {howItWorksCards.map((card, idx) => (
                  <article
                    key={`${card.step}-${idx}`}
                    className="saas-hover relative w-72.5 shrink-0 overflow-hidden rounded-3xl border border-[#2A2A2A] bg-[#151515] p-6 md:w-[320px] lg:w-85"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 20% 10%, rgba(200,240,77,0.18), transparent 42%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.08), transparent 46%)",
                    }}
                  >
                    <span className="inline-flex rounded-full border border-[#3A3A3A] bg-[#1F1F1F] px-3 py-1 text-xs font-semibold text-[#D4D4D4]">
                      {card.tag}
                    </span>
                    <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-[#C8F04D]/80">{card.step}</p>
                    <p className="mt-2 text-2xl font-black leading-tight">{card.title}</p>
                    <ul className="mt-4 space-y-1.5 text-sm text-[#A1A1A1]">
                      {card.items.map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <span className="text-[#C8F04D]/60">·</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* What Adigator understands */}
        <section className="marketing-section marketing-section-compact mx-auto w-[min(1280px,92vw)]">
          <div className="mb-6 max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8A8A82]">
              Campaign intelligence
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              What Adigator understands
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-[#5A5A55]">
              Validation only works when the system understands campaign intent, then checks every asset and task
              against that truth.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {UNDERSTANDS_ITEMS.map(({ label, icon: Icon }) => (
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

        <CampaignTaskValidationSection />

        {/* Platform coverage */}
        <section className="border-y border-[#DEDDD5] bg-[radial-gradient(circle_at_top_left,rgba(66,133,244,0.09),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(200,240,77,0.12),transparent_24%),#FAFAF7] marketing-section-compact">
          <div className="mx-auto w-[min(1280px,92vw)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8A8A82]">
              The Adigator platform
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Built for the channels you already run
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#5A5A55]">
              Specs, placements, and creative constraints differ by channel. Adigator validates against the
              environments your campaigns actually traffic into.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {PLATFORMS.map((platform, i) => (
                <motion.article
                  key={platform.name}
                  initial={reduceMotion ? false : { opacity: 0, x: i % 2 === 0 ? slideOffset("left", "md") : slideOffset("right", "md") }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.2, margin: "80px 0px" }}
                  transition={{ delay: i * 0.05, duration: 0.35 }}
                  whileHover={{ y: -6, scale: 1.01, rotate: -0.5 }}
                  className="platform-card group relative overflow-hidden rounded-3xl border border-[#DEDDD5] bg-white/90 p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur"
                >
                  <div className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${platform.accent}`} />
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E8E6DF] bg-white text-[#0D0D0D] shadow-sm transition-transform duration-300 group-hover:scale-110">
                    {platform.renderIcon()}
                  </div>
                  <h3 className="mt-3 text-base font-black tracking-tight">{platform.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#5B5B55]">{platform.desc}</p>
                  <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#0D0D0D] opacity-70 transition-opacity duration-300 group-hover:opacity-100">
                    <span>View readiness flow</span>
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </div>
                </motion.article>
              ))}
            </div>
            <p className="mt-6 text-center text-sm font-semibold text-[#6B7280] sm:text-base">
              More platform-specific validations coming soon
            </p>
          </div>
        </section>

        {/* Real campaign workflow + pipeline */}
        <section className="marketing-section marketing-section-compact mx-auto w-[min(1280px,92vw)]">
          <div className="mb-6 max-w-3xl">
            <h2 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Your Campaign Journey, Validated End-to-End
            </h2>
          </div>

          <PipelineCoreEngine />
        </section>

        <ValidationReportSection />

        {/* Features */}
        <section className="marketing-section marketing-section-compact mx-auto w-[min(1280px,92vw)]">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <IllustrationWrapper
              src={STORYSET_ILLUSTRATIONS.analysisAmico}
              alt="Campaign analysis and analytics dashboard insights"
              className="order-2 w-full lg:order-1"
              animation="fade-right"
            />
            <div className="order-1 lg:order-2">
          <div className="mb-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8A8A82]">
              Operational outcomes
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              Built for operational teams
            </h2>
          </div>

          <div className="grid gap-5 sm:gap-6">
            {OPERATIONAL_VALUE.map((feature, i) => (
              <motion.article
                key={feature.title}
                initial={reduceMotion ? false : { opacity: 0, x: i % 2 === 0 ? slideOffset("left", "md") : slideOffset("right", "md") }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2, margin: "80px 0px" }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                whileHover={{ y: -6, scale: 1.01 }}
                className="saas-hover rounded-3xl border border-[#DEDDD5] bg-white/90 p-6 shadow-[0_18px_36px_rgba(15,23,42,0.05)] sm:p-8"
              >
                <h3 className="text-xl font-black tracking-tight sm:text-2xl">{feature.title}</h3>
                <p className="mt-4 text-base leading-relaxed text-[#5B5B55]">{feature.description}</p>
              </motion.article>
            ))}
          </div>
            </div>
          </div>
        </section>

        {/* Workflow CTA block */}
        <section className="marketing-section marketing-section-compact mx-auto grid w-[min(1280px,92vw)] gap-8 md:grid-cols-2 md:items-center lg:gap-12">
          <div>
            <h2 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Stop Paying for Preventable Campaign Errors
            </h2>
            <ul className="mt-6 space-y-3 text-base text-[#4B4B45] sm:mt-8 sm:space-y-4 sm:text-lg">
              {WORKFLOW_STEPS.map((item) => (
                <motion.li
                  key={item}
                  initial={reduceMotion ? false : { opacity: 0, x: slideOffset("left", "sm") }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.2, margin: "80px 0px" }}
                  transition={{ duration: 0.4 }}
                  whileHover={{ x: 4, scale: 1.01 }}
                  className="flex items-start gap-3 rounded-[18px] border border-[#DEDDD5] bg-white/80 p-3 shadow-[0_10px_24px_rgba(15,23,42,0.04)]"
                >
                  <span className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#DDE7B7] text-sm font-bold text-[#0D0D0D]">
                    ✓
                  </span>
                  <span>{item}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          <div className="saas-hover relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,#0f172a_0%,#111827_45%,#0b1220_100%)] p-6 shadow-[0_25px_70px_rgba(15,23,42,0.12)] sm:p-8">
            <div className="relative space-y-6">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-cyan-400/15 blur-3xl" />
              <div className="absolute -bottom-8 left-0 h-28 w-28 rounded-full bg-lime-300/15 blur-3xl" />
              <p className="relative text-2xl font-black leading-tight text-white sm:text-3xl">
                Validate Once. Execute With Confidence.
              </p>
            </div>
          </div>
        </section>

        {/* Built for + Agency benefits */}
        <section className="border-t border-[#DEDDD5] bg-[#FAFAF7] marketing-section-compact">
          <div className="mx-auto w-[min(1280px,92vw)]">
            <div className="grid gap-10 lg:grid-cols-2">
              <div>
                <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Who runs on Adigator</h2>
                <div className="mt-6 flex flex-wrap gap-2">
                  {BUILT_FOR.map((role) => (
                    <span
                      key={role}
                      className="inline-flex items-center gap-2 rounded-full border border-[#DEDDD5] bg-white px-4 py-2 text-sm font-semibold shadow-[0_8px_20px_rgba(15,23,42,0.04)]"
                    >
                      <Users size={14} className="text-[#6B7280]" />
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-3xl font-black tracking-tight sm:text-4xl">What operational teams unlock</h2>
                <ul className="mt-6 space-y-3">
                  {TEAM_OUTCOMES.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-3 text-base font-semibold text-[#0D0D0D] sm:text-lg">
                      <span className="text-[#C8F04D]">✓</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-[#0D0D0D] py-10 text-white sm:py-12 md:py-14">
          <div className="mx-auto flex w-[min(1100px,92vw)] flex-col items-center text-center">
            <h2 className="text-[clamp(2.2rem,6vw,4.5rem)] font-black leading-tight tracking-tight">
              Validate before you spend.
            </h2>
            <p className="mt-4 max-w-xl text-base text-white/60">
              Give AdOps a readiness gate, not another after-the-fact escalation.
            </p>
            <Link
              href={MARKETING_CTA.href}
              className="saas-hover mt-8 rounded-full bg-[#C8F04D] px-9 py-4 text-base font-bold text-[#0D0D0D]"
            >
              {MARKETING_CTA.label}
            </Link>
          </div>
        </section>
      </main>

      <MarketingFooter
        description="The pre launch campaign validation platform for agencies, brands, and AdOps teams who validate before spend, not after complaints."
      />

      <style jsx global>{`
        .hero-live-card {
          transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
        }

        .hero-live-card:hover {
          transform: translateY(-5px);
          border-color: rgba(200, 240, 77, 0.25);
          box-shadow: 0 28px 70px rgba(0, 0, 0, 0.45), 0 0 50px rgba(200, 240, 77, 0.08);
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-live-card:hover {
            transform: none;
          }
        }

        .ticker-track {
          animation: marquee 32s linear infinite;
        }

        .saas-hover {
          transition: transform 0.22s ease, box-shadow 0.22s ease, background-color 0.22s ease;
        }

        .saas-hover:hover {
          transform: translateY(-3px);
          box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.45), 0 16px 42px rgba(15, 23, 42, 0.14),
            0 0 40px rgba(200, 240, 77, 0.17);
        }

        .roller-coaster-shell {
          will-change: transform;
        }

        .modules-track {
          animation: marquee 32s linear infinite;
          will-change: transform;
        }

        @keyframes marquee {
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
