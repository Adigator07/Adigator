"use client";

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
  WorkflowSteps,
} from "@/app/components/marketing/MarketingSection";
import { OPERATIONAL_SCENARIOS } from "@/app/lib/marketing/scenariosContent";

export default function OperationalScenariosPage() {
  return (
    <div className="marketing-page min-h-screen bg-[#F5F5F0] text-[#0D0D0D]">
      <MarketingNav activePath="/operational-scenarios" />

      <main className="pt-28">
        <section className="marketing-section marketing-section-compact mx-auto w-[min(1100px,92vw)]">
          <FadeIn>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8A8A82]">
              Workflow examples
            </p>
            <h1 className="mt-4 text-[clamp(2.25rem,5.5vw,4rem)] font-black leading-[1.05] tracking-[-0.04em]">
              Operational Scenarios
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#5A5A55] sm:text-xl">
              Real-world campaign validation workflows, not case studies. Each scenario shows the problem, the risk,
              how Adigator helps, and the operational outcome.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={MARKETING_CTA.href} className="marketing-btn-lime rounded-full px-7 py-3.5 text-sm font-bold">
                {MARKETING_CTA.label}
              </Link>
              <Link
                href="/campaign-error-library"
                className="marketing-btn-outline rounded-full px-7 py-3.5 text-sm font-semibold"
              >
                Browse error library
              </Link>
            </div>
          </FadeIn>
        </section>

        <SoftBand className="py-8">
          <div className="mx-auto flex w-[min(1100px,92vw)] flex-wrap gap-2">
            {["Campaign Validation Scenarios", "Workflow Examples", "Real-World Campaign Workflows"].map((label) => (
              <span
                key={label}
                className="rounded-full border border-[#DEDDD5] bg-white px-4 py-2 text-xs font-semibold text-[#3D3D38]"
              >
                {label}
              </span>
            ))}
          </div>
        </SoftBand>

        <section className="marketing-section marketing-section-compact mx-auto w-[min(1100px,92vw)] space-y-8">
          <SectionHeader
            eyebrow="Library"
            title="Campaign validation scenarios"
            description="Use these as operational references for launch, optimization, handoff, and enterprise delivery."
          />

          {OPERATIONAL_SCENARIOS.map((item, index) => (
            <FadeIn key={item.id} delay={Math.min(index * 0.03, 0.18)}>
              <article
                id={item.id}
                className="scroll-mt-28 overflow-hidden rounded-[28px] border border-[#DEDDD5] bg-white shadow-[0_12px_32px_rgba(15,23,42,0.04)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E6DF] px-6 py-5 sm:px-8">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A8A82]">
                      {item.category}
                    </p>
                    <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{item.title}</h2>
                  </div>
                  <span className="rounded-full border border-[#DEDDD5] bg-[#FAFAF7] px-3 py-1.5 text-xs font-semibold text-[#5A5A55]">
                    {item.timeline}
                  </span>
                </div>

                <div className="grid gap-0 lg:grid-cols-2">
                  <div className="space-y-5 border-b border-[#E8E6DF] p-6 sm:p-8 lg:border-b-0 lg:border-r">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8A8A82]">Scenario</p>
                      <p className="mt-2 text-sm leading-relaxed text-[#3D3D38]">{item.scenario}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8A8A82]">Problem</p>
                      <p className="mt-2 text-sm leading-relaxed text-[#3D3D38]">{item.problem}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8A8A82]">Risk</p>
                      <p className="mt-2 text-sm leading-relaxed text-[#3D3D38]">{item.risk}</p>
                    </div>
                  </div>

                  <div className="bg-[#0A0A0A] p-6 text-white sm:p-8">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
                      How Adigator helps
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-white/75">{item.howAdigatorHelps}</p>
                    <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">Outcome</p>
                    <p className="mt-2 text-sm font-semibold leading-relaxed text-[#C8F04D]">{item.outcome}</p>
                    <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">Workflow</p>
                    <WorkflowSteps
                      dark
                      steps={item.workflow.map((label) => ({ label }))}
                    />
                  </div>
                </div>
              </article>
            </FadeIn>
          ))}
        </section>

        <SoftBand className="marketing-section-compact">
          <div className="mx-auto grid w-[min(1100px,92vw)] gap-4 sm:grid-cols-3">
            {[
              { title: "Setup to traffic", body: "Validate once before AdOps executes." },
              { title: "Change without chaos", body: "Treat swaps and updates as gated tasks." },
              { title: "Scale the standard", body: "Agency and enterprise pods share one readiness language." },
            ].map((card, i) => (
              <FadeIn key={card.title} delay={i * 0.05}>
                <MarketingCard className="h-full">
                  <h3 className="text-lg font-black tracking-tight">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#5A5A55]">{card.body}</p>
                </MarketingCard>
              </FadeIn>
            ))}
          </div>
        </SoftBand>

        <FinalCtaBand
          title="Run your next workflow with a gate"
          description="Whether you are launching, swapping, renewing, or handing off, validate before execution."
          href={MARKETING_CTA.href}
          label={MARKETING_CTA.label}
        />
      </main>

      <MarketingFooter />
    </div>
  );
}
