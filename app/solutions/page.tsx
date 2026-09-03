"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { MARKETING_CTA } from "@/app/lib/siteNavigation";
import MarketingNav from "@/app/components/MarketingNav";
import MarketingFooter from "@/app/components/MarketingFooter";
import {
  FadeIn,
  FinalCtaBand,
  MarketingCard,
  SectionHeader,
  SoftBand,
  WorkflowSteps,
} from "@/app/components/marketing/MarketingSection";

const CampaignValidationCheckpoint = dynamic(
  () => import("@/app/components/marketing/CampaignValidationCheckpoint"),
  { ssr: false },
);

const OPERATIONAL_RISKS = [
  {
    title: "Broken handoffs",
    body: "Creative, planning, and AdOps each hold partial truth. Defects appear only after trafficking starts.",
  },
  {
    title: "Destination failures",
    body: "Wrong or broken URLs turn paid traffic into wasted spend within minutes of going live.",
  },
  {
    title: "Offer and CTA drift",
    body: "Creative claims diverge from landing experiences after swaps, promotions, or page updates.",
  },
  {
    title: "Spec rejects at the worst time",
    body: "Dimension, weight, and placement issues become last minute remakes instead of early checks.",
  },
  {
    title: "Renewals that reintroduce defects",
    body: "Last flight's package is reused without confirming freshness, tracking, or compliance.",
  },
  {
    title: "No shared readiness signal",
    body: "Teams argue in threads and decks because there is no clear pass or fail for execution.",
  },
];

const VALIDATION_WORKFLOW = [
  { label: "Establish campaign context", detail: "Brief, objective, vertical, offer, and platform context." },
  { label: "Validate alignment", detail: "Creative, messaging, offers, and landing continuity." },
  { label: "Validate technical readiness", detail: "Specs, URLs, UTMs, placements, and tracking." },
  { label: "Check the operational task", detail: "Setup, swap, update, renewal, or handoff." },
  { label: "Release with a readiness record", detail: "Shared signal for AdOps and stakeholders." },
];

const PLATFORM_OUTCOMES = [
  {
    title: "Validation before launch",
    body: "Catch preventable mismatches before media systems ever see the package.",
  },
  {
    title: "Task level checks",
    body: "Revalidate what live campaign changes can break, without restarting the whole program.",
  },
  {
    title: "Coverage across channels",
    body: "Meta, Google, and programmatic constraints evaluated in the same operational language.",
  },
  {
    title: "Clear readiness records",
    body: "Give client teams and partners a shared record of what passed and what still blocks.",
  },
];

const LIFECYCLE = [
  { stage: "Setup", detail: "Validate the full package before trafficking." },
  { stage: "Launch", detail: "Release only when readiness clears." },
  { stage: "Optimize", detail: "Check swaps, page updates, and audience changes." },
  { stage: "Renew", detail: "Re-check freshness and inherited assumptions." },
  { stage: "Handoff", detail: "Package a clean execution state for AdOps and vendors." },
];

const COVERAGE = [
  "Campaign brief and objective continuity",
  "Creative messaging and offer alignment",
  "Landing page continuity",
  "URL health and destination integrity",
  "UTM and tracking prerequisites",
  "Platform specs and placement fit",
  "Creative swaps and version deltas",
  "Renewal freshness and compliance cues",
  "Agency and enterprise handoff readiness",
];

export default function SolutionsPage() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="marketing-page min-h-screen bg-[#F5F5F0] text-[#0D0D0D]">
      <MarketingNav activePath="/solutions" />

      <main className="pt-28">
        <section className="marketing-section marketing-section-compact mx-auto w-[min(1100px,92vw)]">
          <FadeIn>
            <h1 className="text-[clamp(2.25rem,5.5vw,4rem)] font-black leading-[1.05] tracking-[-0.04em]">
              How Adigator IQ solves campaign operation problems
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#5A5A55] sm:text-xl">
              Adigator IQ sits between campaign work and execution. It gives teams a validation check so preventable
              errors never become live spend.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={MARKETING_CTA.href} className="marketing-btn-lime rounded-full px-7 py-3.5 text-sm font-bold">
                {MARKETING_CTA.label}
              </Link>
              <Link
                href="/operational-scenarios"
                className="marketing-btn-outline rounded-full px-7 py-3.5 text-sm font-semibold"
              >
                View operational scenarios
              </Link>
            </div>
          </FadeIn>
        </section>

        <section id="risks" className="marketing-section marketing-section-compact mx-auto w-[min(1100px,92vw)]">
          <SectionHeader
            title="The failures we stop before execution"
            description="These are the recurring campaign operation failures that drain budget, time, and client trust."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {OPERATIONAL_RISKS.map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.04}>
                <MarketingCard className="h-full">
                  <h3 className="text-lg font-black tracking-tight">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#5A5A55]">{item.body}</p>
                </MarketingCard>
              </FadeIn>
            ))}
          </div>
        </section>

        <SoftBand dark className="marketing-section-compact">
          <div className="mx-auto grid w-[min(1100px,92vw)] gap-10 lg:grid-cols-2 lg:items-start">
            <SectionHeader
              dark
              title="A repeatable check for every campaign task"
              description="Adigator IQ does not replace your teams. It gives them a shared sequence before anything ships."
            />
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
              <WorkflowSteps steps={VALIDATION_WORKFLOW} dark />
            </div>
          </div>
        </SoftBand>

        <section id="platform" className="marketing-section marketing-section-compact mx-auto w-[min(1100px,92vw)]">
          <SectionHeader
            title="What changes in day to day operations"
            description="Concrete outcomes for the people who build, approve, and traffic campaigns."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {PLATFORM_OUTCOMES.map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.05}>
                <MarketingCard className="h-full">
                  <h3 className="text-xl font-black tracking-tight">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#5A5A55]">{item.body}</p>
                </MarketingCard>
              </FadeIn>
            ))}
          </div>
        </section>

        <SoftBand className="marketing-section-compact">
          <div className="mx-auto w-[min(1100px,92vw)]">
            <SectionHeader
              title="Validation across the full campaign lifecycle"
              description="Setup is only the beginning. Real operations continue through optimization, renewal, and handoff."
            />
            <div className="mt-8 grid gap-3 sm:grid-cols-5">
              {LIFECYCLE.map((item, index) => (
                <motion.div
                  key={item.stage}
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-2xl border border-[#DEDDD5] bg-white p-4 text-center shadow-[0_8px_20px_rgba(15,23,42,0.04)]"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8A8A82]">
                    0{index + 1}
                  </p>
                  <p className="mt-2 text-base font-black tracking-tight">{item.stage}</p>
                  <p className="mt-2 text-xs leading-relaxed text-[#5A5A55]">{item.detail}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </SoftBand>

        <section className="marketing-section marketing-section-compact mx-auto w-[min(1100px,92vw)]">
          <CampaignValidationCheckpoint />
        </section>

        <section id="coverage" className="bg-[#0D0D0D] py-14 text-white sm:py-16">
          <div className="mx-auto w-[min(1100px,92vw)]">
            <SectionHeader
              dark
              title="What gets checked before execution"
              description="A practical coverage set for campaign operations, not a vanity feature list."
            />
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {COVERAGE.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm font-semibold text-white/85"
                >
                  {item}
                </div>
              ))}
            </div>
            <p className="mt-8 text-sm text-white/55">
              Prefer failure pattern detail? Browse the{" "}
              <Link href="/campaign-error-library" className="font-semibold text-[#C8F04D] hover:underline">
                Campaign Error Library
              </Link>
              . Prefer process depth? Read the{" "}
              <Link href="/methodology" className="font-semibold text-[#C8F04D] hover:underline">
                Validation Methodology
              </Link>
              .
            </p>
          </div>
        </section>

        <FinalCtaBand
          title="Add the check before your next campaign task"
          description="Stop treating launch quality as a last minute scramble. Make validation a normal step in the workflow."
          href={MARKETING_CTA.href}
          label={MARKETING_CTA.label}
        />
      </main>

      <MarketingFooter />
    </div>
  );
}
