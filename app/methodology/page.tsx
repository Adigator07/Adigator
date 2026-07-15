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
import { METHODOLOGY_LAYERS, METHODOLOGY_WHY } from "@/app/lib/marketing/methodologyContent";

export default function MethodologyPage() {
  return (
    <div className="marketing-page min-h-screen bg-[#F5F5F0] text-[#0D0D0D]">
      <MarketingNav activePath="/methodology" />

      <main className="pt-28">
        <section className="marketing-section marketing-section-compact mx-auto w-[min(1100px,92vw)]">
          <FadeIn>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8A8A82]">
              Documentation
            </p>
            <h1 className="mt-4 text-[clamp(2.25rem,5.5vw,4rem)] font-black leading-[1.05] tracking-[-0.04em]">
              Campaign Validation Methodology
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#5A5A55] sm:text-xl">
              Adigator&apos;s five-layer framework turns campaign operations into a repeatable validation system,
              from intelligence and alignment to technical checks, task gates, and institutional memory.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={MARKETING_CTA.href} className="marketing-btn-lime rounded-full px-7 py-3.5 text-sm font-bold">
                {MARKETING_CTA.label}
              </Link>
              <Link
                href="/operational-scenarios"
                className="marketing-btn-outline rounded-full px-7 py-3.5 text-sm font-semibold"
              >
                See operational scenarios
              </Link>
            </div>
          </FadeIn>
        </section>

        <SoftBand className="marketing-section-compact">
          <div className="mx-auto w-[min(1100px,92vw)]">
            <SectionHeader
              eyebrow="Foundation"
              title="Why we built this"
              description="Campaign quality collapses where tools, teams, and handoffs do not share a single source of truth."
            />
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {METHODOLOGY_WHY.map((item, i) => (
                <FadeIn key={item.title} delay={i * 0.06}>
                  <MarketingCard className="h-full">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8A8A82]">0{i + 1}</p>
                    <h3 className="mt-3 text-xl font-black tracking-tight">{item.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#5A5A55]">{item.body}</p>
                  </MarketingCard>
                </FadeIn>
              ))}
            </div>
          </div>
        </SoftBand>

        <section className="marketing-section marketing-section-compact mx-auto w-[min(1100px,92vw)]">
          <SectionHeader
            eyebrow="Framework"
            title="Five layers of campaign validation"
            description="Each layer has a clear purpose, a workflow, and an operational output your teams can act on."
          />

          <div className="mt-10 space-y-6">
            {METHODOLOGY_LAYERS.map((layer, index) => (
              <FadeIn key={layer.id} delay={Math.min(index * 0.04, 0.2)}>
                <article className="overflow-hidden rounded-[28px] border border-[#DEDDD5] bg-white shadow-[0_12px_32px_rgba(15,23,42,0.04)]">
                  <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
                    <div className="border-b border-[#DEDDD5] p-6 sm:p-8 lg:border-b-0 lg:border-r">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#0D0D0D] text-sm font-bold text-[#C8F04D]">
                          {layer.number}
                        </span>
                        <div>
                          <h3 className="text-2xl font-black tracking-tight">{layer.title}</h3>
                          <p className="mt-1 text-sm font-medium text-[#6B7280]">{layer.subtitle}</p>
                        </div>
                      </div>
                      <p className="mt-5 text-base leading-relaxed text-[#5A5A55]">{layer.description}</p>
                      <div className="mt-6 rounded-2xl border border-[#E8E6DF] bg-[#FAFAF7] p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A8A82]">Output</p>
                        <p className="mt-2 text-sm font-semibold leading-relaxed text-[#0D0D0D]">{layer.output}</p>
                      </div>
                    </div>
                    <div className="bg-[#0A0A0A] p-6 text-white sm:p-8">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Workflow</p>
                      <WorkflowSteps steps={[...layer.workflow]} dark />
                    </div>
                  </div>
                </article>
              </FadeIn>
            ))}
          </div>
        </section>

        <SoftBand dark className="py-14 sm:py-16">
          <div className="mx-auto w-[min(1100px,92vw)]">
            <SectionHeader
              dark
              eyebrow="System view"
              title="Validation is a pipeline, not a checklist"
              description="Intelligence informs alignment. Alignment informs technical gates. Operational tasks keep the bar live. Memory makes the next cycle faster."
            />
            <div className="mt-10 flex flex-wrap gap-3">
              {METHODOLOGY_LAYERS.map((layer) => (
                <div
                  key={layer.id}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/85"
                >
                  {layer.number} · {layer.title}
                </div>
              ))}
            </div>
          </div>
        </SoftBand>

        <FinalCtaBand
          title="Put the methodology to work"
          description="Validate your next campaign with the same layered system Adigator uses in production."
          href={MARKETING_CTA.href}
          label={MARKETING_CTA.label}
        />
      </main>

      <MarketingFooter />
    </div>
  );
}
