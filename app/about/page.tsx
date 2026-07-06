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
} from "lucide-react";
import { MARKETING_CTA } from "@/app/lib/siteNavigation";
import MarketingNav from "@/app/components/MarketingNav";
import MarketingFooter from "@/app/components/MarketingFooter";

const AboutWorkflowComparison = dynamic(
  () => import("@/app/components/marketing/AboutWorkflowComparison"),
  { ssr: false },
);
const AboutPlatformRoadmap = dynamic(
  () => import("@/app/components/marketing/AboutPlatformRoadmap"),
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

const CAMPAIGN_TEAM_PAIN_POINTS = [
  {
    title: "Creative Team",
    description: "Designs the creative and assumes the specifications are correct.",
    icon: Palette,
  },
  {
    title: "Campaign Manager",
    description: "Builds the campaign and assumes the creative is correct.",
    icon: Target,
  },
  {
    title: "Media Buyers",
    description: "Approve spend and assume everything above is aligned.",
    icon: Megaphone,
  },
  {
    title: "Ad Operations",
    description: "Launch the campaign and discover the problems.",
    icon: Briefcase,
  },
  {
    title: "QA Teams",
    description: "Review issues after the fact, when it is already too late.",
    icon: Shield,
  },
  {
    title: "Clients",
    description: "Notice performance problems and ask why nobody caught them earlier.",
    icon: Users,
  },
];

const BELIEFS = [
  "Campaign Quality Starts Before Execution",
  "Validation Is Better Than Rework",
  "Campaign Knowledge Should Never Be Lost",
  "Every Campaign Task Deserves Validation",
  "Technology Should Reduce Operational Complexity",
  "Enterprise Teams Need One Source of Truth",
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

export default function AboutPage() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="marketing-page min-h-screen bg-[#F5F5F0] text-[#0D0D0D]">
      <MarketingNav activePath="/about" />

      <main className="pt-28">
        {/* Hero */}
        <section className="marketing-section marketing-section-compact mx-auto w-[min(980px,92vw)]">
          <h1 className="mx-auto max-w-4xl text-center text-[clamp(2rem,5.5vw,4rem)] font-black leading-[1.02] tracking-[-0.04em]">
            We Built the Intelligence &amp; Validation Layer Behind Every Successful Campaign.
          </h1>

          <p className="mx-auto mt-7 max-w-3xl text-center text-lg leading-relaxed text-[#5C5C56] sm:text-xl">
            Campaigns move from client briefs to campaign setup through multiple teams, platforms, and tools.
            Adigator validates campaign intent, creatives, landing pages, URLs, platform requirements, and technical
            readiness before setup, helping teams reduce errors, prevent budget waste, and launch campaigns with
            confidence.
          </p>

          <div className="mt-10 flex justify-center">
            <Link href="/product" className="marketing-btn-lime saas-hover rounded-full px-8 py-4 text-base font-bold">
              Explore the Platform
            </Link>
          </div>
        </section>

        {/* Founder story */}
        <section id="why-i-built-adigator" className="marketing-section marketing-section-compact mx-auto w-[min(820px,92vw)]">
          <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-black leading-tight tracking-[-0.035em]">
            Why I Built Adigator
          </h1>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.55 }}
            className="mt-8 overflow-hidden rounded-[28px] border border-[#DEDDD5] bg-white shadow-[0_16px_48px_rgba(15,23,42,0.06)]"
          >
            <div className="border-b border-[#E8E7E0] bg-[#FAFAF7] px-6 py-8 sm:px-10 sm:py-10">
              <p className="text-lg leading-relaxed text-[#5A5A55] sm:text-xl">
                I worked across Ad Operations, Campaign Management, and Account Management.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
                {["Different teams.", "Different tools.", "One recurring problem."].map((line) => (
                  <p
                    key={line}
                    className="flex-1 rounded-xl border border-[#E8E7E0] bg-white px-4 py-3 text-center text-base font-bold text-[#0D0D0D] sm:text-lg"
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>

            <div className="px-6 py-8 sm:px-10 sm:py-10">
              <p className="text-lg leading-relaxed text-[#5A5A55] sm:text-xl">
                Campaigns kept reaching execution before anyone verified whether everything actually aligned.
              </p>

              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {["Wrong creatives.", "Landing pages that didn't match.", "Tracking issues.", "Late discoveries."].map(
                  (line) => (
                    <li
                      key={line}
                      className="flex items-center gap-3 rounded-xl border border-[#E8E7E0] bg-[#FAFAF7] px-4 py-3 text-base font-medium text-[#3D3D38]"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#C8F04D]" aria-hidden />
                      {line}
                    </li>
                  ),
                )}
              </ul>

              <div className="mt-8 space-y-2 border-t border-[#E8E7E0] pt-8">
                <p className="text-lg font-semibold text-[#0D0D0D]">Everyone worked hard.</p>
                <p className="text-lg font-semibold text-[#0D0D0D]">Nobody owned validation.</p>
              </div>
            </div>

            <div className="border-t border-[#C8F04D]/25 bg-gradient-to-r from-[#F7FCE8] via-white to-[#F7FCE8] px-6 py-8 sm:px-10 sm:py-10">
              <p className="text-xl font-black text-[#0D0D0D] sm:text-2xl">So I built Adigator.</p>
              <p className="mt-3 text-lg font-semibold leading-relaxed text-[#3D4A1A] sm:text-xl">
                One platform that validates every campaign task before execution.
              </p>
            </div>
          </motion.div>
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
            <SectionHeader title="Campaigns Didn't Fail Because of Creatives. They Failed Because Nothing Was Validated Together." />

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

        {/* Our Mission */}
        <section id="mission" className="marketing-section marketing-section-compact mx-auto w-[min(900px,92vw)]">
          <h2 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">Our Mission</h2>
          <div className="mt-6 space-y-5 text-lg leading-relaxed text-[#5A5A55] sm:text-xl">
            <p className="font-semibold text-[#0D0D0D]">
              To make campaign validation a standard part of every advertising workflow.
            </p>
            <p>
              We believe campaigns should never reach execution until every asset, requirement, and operational
              dependency has been validated.
            </p>
            <p>
              Just as software is tested before deployment, campaigns should be validated before execution.
            </p>
          </div>
        </section>

        {/* Our Vision */}
        <section id="vision" className="border-y border-[#DEDDD5] bg-[#FAFAF7] marketing-section-compact">
          <div className="mx-auto w-[min(900px,92vw)]">
            <h2 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">Our Vision</h2>
            <div className="mt-6 space-y-5 text-lg leading-relaxed text-[#5A5A55] sm:text-xl">
              <p className="font-semibold text-[#0D0D0D]">
                To become the intelligence and validation layer for digital advertising.
              </p>
              <p>
                We envision a future where every campaign task—from setup to creative updates, landing page changes,
                renewals, and optimizations—is validated, documented, and understood before execution.
              </p>
              <p>Campaign quality shouldn&apos;t depend on memory, spreadsheets, or manual reviews.</p>
              <p className="font-semibold text-[#0D0D0D]">It should be built into the workflow.</p>
            </div>
          </div>
        </section>

        {/* Without / With Adigator */}
        <AboutWorkflowComparison />

        {/* Campaign Reality */}
        <section id="reality" className="border-y border-[#DEDDD5] bg-[#FAFAF7] py-10 sm:py-12 md:py-14">
          <div className="mx-auto w-[min(1280px,92vw)]">
            <SectionHeader center title="Campaign Quality Is a Shared Responsibility. One Opportunity to Get It Right." />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CAMPAIGN_TEAM_PAIN_POINTS.map((team, i) => (
                <motion.article
                  key={team.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  className="saas-hover rounded-2xl border border-[#DEDDD5] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#F7FCE8] text-[#5A7A00]">
                    <team.icon size={20} />
                  </div>
                  <h3 className="text-lg font-black tracking-tight text-[#0D0D0D]">{team.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#5A5A55]">{team.description}</p>
                </motion.article>
              ))}
            </div>
            <p className="mx-auto mt-10 max-w-2xl text-center text-lg font-semibold text-[#0D0D0D]">
              Adigator is where all of these parts are validated together before launch.
            </p>
          </div>
        </section>

        {/* What We Believe */}
        <section id="beliefs" className="border-y border-[#DEDDD5] bg-[#FAFAF7] marketing-section-compact">
          <div className="mx-auto w-[min(1280px,92vw)]">
            <SectionHeader title="What We Believe" />
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

        {/* Advertising Changed */}
        <section className="marketing-section marketing-section-compact mx-auto w-[min(900px,92vw)]">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-black leading-[1.12] tracking-[-0.035em]">
              Advertising Changed. Validation Didn&apos;t.
            </h2>
            <div className="mt-6 space-y-5 text-lg leading-relaxed text-[#5A5A55] sm:text-xl">
              <p>
                Digital advertising has become faster, more collaborative, and significantly more complex. A single
                campaign now spans multiple platforms, creatives, landing pages, tracking requirements, approvals, and
                continuous updates.
              </p>
              <p>
                Yet many teams still rely on spreadsheets, email threads, and manual reviews to validate campaign
                changes.
              </p>
              <p>As campaign operations evolved, validation did not.</p>
              <p className="font-semibold text-[#0D0D0D]">
                Adigator was built to close that gap—helping teams validate every campaign task before execution.
              </p>
            </div>
          </motion.div>
        </section>

        {/* Where We Are Going */}
        <AboutPlatformRoadmap />

        {/* The Future of Campaign Operations */}
        <section className="marketing-section marketing-section-compact mx-auto w-[min(900px,92vw)]">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-black leading-[1.12] tracking-[-0.035em]">
              The Future of Campaign Operations
            </h2>
            <div className="mt-6 space-y-5 text-lg leading-relaxed text-[#5A5A55] sm:text-xl">
              <p>
                We believe campaign validation will become as fundamental to advertising as code reviews are to
                software development.
              </p>
              <p>
                Teams shouldn&apos;t have to rely on memory, spreadsheets, or last-minute QA to launch quality
                campaigns.
              </p>
              <p className="font-semibold text-[#0D0D0D]">
                Our goal is to make campaign validation an expected part of every campaign workflow—helping teams
                execute with confidence, preserve campaign knowledge, and reduce preventable operational mistakes.
              </p>
            </div>
          </motion.div>
        </section>

        {/* Final CTA */}
        <section className="bg-[#0D0D0D] py-10 text-white sm:py-12 md:py-14">
          <div className="mx-auto flex w-[min(1100px,92vw)] flex-col items-center text-center">
            <h2 className="text-[clamp(2.2rem,6vw,4.5rem)] font-black leading-tight tracking-tight">
              Every Campaign Deserves Confidence Before Execution.
            </h2>
            <p className="mt-4 max-w-xl text-base text-white/60">
              Validate every campaign task before execution—preserve campaign knowledge, reduce rework, and launch with
              confidence.
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

      <MarketingFooter />

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
