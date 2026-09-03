"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { MARKETING_CTA } from "@/app/lib/siteNavigation";
import MarketingNav from "@/app/components/MarketingNav";
import MarketingFooter from "@/app/components/MarketingFooter";
import {
  FadeIn,
  FinalCtaBand,
  MarketingCard,
  SectionHeader,
  SoftBand,
} from "@/app/components/marketing/MarketingSection";

const AboutPlatformRoadmap = dynamic(
  () => import("@/app/components/marketing/AboutPlatformRoadmap"),
  { ssr: false },
);
const AdigatorPlatformSection = dynamic(
  () => import("@/app/components/marketing/AdigatorPlatformSection"),
  { ssr: false },
);

const BELIEFS = [
  {
    title: "Campaigns need a shared source of truth",
    body: "If intent, creative, destination, and tracking are not grounded in one shared context, quality becomes accidental.",
  },
  {
    title: "Validation belongs before spend",
    body: "The cheapest moment to catch a mismatch is before AdOps executes, not after media is live.",
  },
  {
    title: "Operations deserve a system",
    body: "Launches, swaps, renewals, and handoffs are workflows. They should have clear checks, not tribal knowledge.",
  },
  {
    title: "Memory compounds quality",
    body: "Every validated decision should make the next campaign cycle clearer and faster.",
  },
];

const SOURCE_OF_TRUTH = [
  {
    title: "One campaign context layer",
    body: "Brief, objective, offer, and platform context become the reference every check points back to.",
  },
  {
    title: "One readiness language",
    body: "Creative, planning, and AdOps stop debating different checklists and share a single readiness signal.",
  },
  {
    title: "One operational trail",
    body: "What was validated, what changed, and what failed remains visible across renewals and swaps.",
  },
];

export default function AboutPage() {
  return (
    <div className="marketing-page min-h-screen bg-[#F5F5F0] text-[#0D0D0D]">
      <MarketingNav activePath="/about" />

      <main className="pt-28">
        <section className="marketing-section marketing-section-compact mx-auto w-[min(1100px,92vw)]">
            <FadeIn>
              <h1 className="text-[clamp(2.25rem,5.5vw,4rem)] font-black leading-[1.05] tracking-[-0.04em]">
                We are building the validation layer campaign operations never had.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#5A5A55] sm:text-xl">
                Adigator IQ helps agencies, brands, and AdOps teams check advertising campaigns before media spend
                begins. That includes creatives, landing pages, and campaign setup across Google Ads, Meta Ads, and
                programmatic channels.
              </p>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#5A5A55] sm:text-lg">
                Optional Google Ads access uses Google OAuth. Users authorize Adigator IQ to access their own Google Ads
                accounts (or accounts they administer).{" "}
                <Link href="/google-ads-oauth" className="font-semibold text-[#0D0D0D] underline underline-offset-2">
                  Connect Google Ads
                </Link>
                .
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={MARKETING_CTA.href} className="marketing-btn-lime rounded-full px-7 py-3.5 text-sm font-bold">
                  {MARKETING_CTA.label}
                </Link>
                <Link href="/methodology" className="marketing-btn-outline rounded-full px-7 py-3.5 text-sm font-semibold">
                  Read our methodology
                </Link>
              </div>
            </FadeIn>
        </section>

        <SoftBand className="marketing-section-compact">
          <div className="mx-auto grid w-[min(1100px,92vw)] gap-8 lg:grid-cols-2">
            <FadeIn>
              <SectionHeader
                title="Our mission"
                description="Help every campaign task get validated before execution. We catch misalignment across brief, creative, destination, and platform requirements before spend begins."
              />
            </FadeIn>
            <FadeIn delay={0.08}>
              <SectionHeader
                title="Our vision"
                description="A world where launch quality is managed with shared readiness signals, the same way other teams rely on a system of record."
              />
            </FadeIn>
          </div>
        </SoftBand>

        <section id="belief" className="marketing-section marketing-section-compact mx-auto w-[min(1100px,92vw)]">
          <SectionHeader
            title="What we believe about campaign quality"
            description="These ideas shape the product, the methodology, and how we talk about day to day campaign work."
          />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {BELIEFS.map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.05}>
                <MarketingCard className="h-full">
                  <h3 className="text-xl font-black tracking-tight">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#5A5A55]">{item.body}</p>
                </MarketingCard>
              </FadeIn>
            ))}
          </div>
        </section>

        <SoftBand dark className="marketing-section-compact">
          <div className="mx-auto w-[min(900px,92vw)]">
            <FadeIn>
              <h2 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-black leading-[1.12] tracking-[-0.035em] text-white">
                Built from the cost of preventable mistakes
              </h2>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-white/70 sm:text-lg">
                <p>
                  Adigator IQ began with a pattern that kept repeating inside campaign operations: talented teams, strong
                  creatives, and still painful launches. The failures were rarely mysterious. They were seams:
                  handoffs, outdated links, mismatched offers, late technical rejects.
                </p>
                <p>
                  Manual QA could not keep pace with how campaigns actually change: creative swaps while ads are live,
                  landing page updates, vendor trafficking, and renewals that quietly carry last flight&apos;s
                  defects forward. The industry needed a validation system, not another checklist buried in a deck.
                </p>
                <p>
                  That is the company we are building: an operational source of truth that helps teams validate before
                  they execute, and remember what they already learned.
                </p>
              </div>
            </FadeIn>
          </div>
        </SoftBand>

        <section className="marketing-section marketing-section-compact mx-auto w-[min(1100px,92vw)]">
          <SectionHeader
            title="Why campaigns need a source of truth"
            description="Without a shared operational reference, every team validates a different slice of reality."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {SOURCE_OF_TRUTH.map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.06}>
                <MarketingCard className="h-full">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8A8A82]">0{i + 1}</p>
                  <h3 className="mt-3 text-lg font-black tracking-tight">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#5A5A55]">{item.body}</p>
                </MarketingCard>
              </FadeIn>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-[#5A5A55]">
            Explore how this shows up in practice in our{" "}
            <Link href="/operational-scenarios" className="font-semibold text-[#0D0D0D] underline-offset-2 hover:underline">
              operational scenarios
            </Link>{" "}
            and{" "}
            <Link href="/campaign-error-library" className="font-semibold text-[#0D0D0D] underline-offset-2 hover:underline">
              campaign error library
            </Link>
            .
          </p>
        </section>

        <section className="border-y border-[#DEDDD5] bg-[#FAFAF7] marketing-section-compact">
          <div className="mx-auto w-[min(1280px,92vw)]">
            <SectionHeader
              title="The Adigator IQ platform"
              description="Validation designed for campaign operations across channels, tasks, and team handoffs."
            />
            <div className="mt-8">
              <AdigatorPlatformSection />
            </div>
          </div>
        </section>

        <AboutPlatformRoadmap />

        <SoftBand className="marketing-section-compact">
          <div className="mx-auto w-[min(900px,92vw)] text-center">
            <SectionHeader
              center
              title="Where we are headed"
              description="We are extending validation into memory, deeper enterprise workflows, and richer audience intelligence, without losing the operational core."
            />
          </div>
        </SoftBand>

        <FinalCtaBand
          title="Join the teams raising the launch bar"
          description="Whether you run agency pods or enterprise markets, Adigator IQ helps you validate before spend."
          href={MARKETING_CTA.href}
          label={MARKETING_CTA.label}
        />
      </main>

      <MarketingFooter />
    </div>
  );
}
