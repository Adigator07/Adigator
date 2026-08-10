"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MARKETING_CTA } from "@/app/lib/siteNavigation";
import MarketingNav from "@/app/components/MarketingNav";
import MarketingFooter from "@/app/components/MarketingFooter";
import {
  FadeIn,
  FinalCtaBand,
  MarketingCard,
  SectionHeader,
} from "@/app/components/marketing/MarketingSection";
import { CAMPAIGN_ERRORS } from "@/app/lib/marketing/errorLibraryContent";

export default function CampaignErrorLibraryPage() {
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const tags = useMemo(() => {
    const set = new Set<string>();
    CAMPAIGN_ERRORS.forEach((error) => error.tags.forEach((tag) => set.add(tag)));
    return Array.from(set).sort();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CAMPAIGN_ERRORS.filter((error) => {
      const matchesTag = !activeTag || error.tags.includes(activeTag);
      if (!matchesTag) return false;
      if (!q) return true;
      const haystack = [
        error.title,
        error.scenario,
        error.businessImpact,
        error.detectionLogic,
        error.recommendedAction,
        ...error.tags,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [activeTag, query]);

  return (
    <div className="marketing-page min-h-screen bg-[#F5F5F0] text-[#0D0D0D]">
      <MarketingNav activePath="/campaign-error-library" />

      <main className="pt-28">
        <section className="marketing-section marketing-section-compact mx-auto w-[min(1100px,92vw)]">
          <FadeIn>
            <h1 className="text-[clamp(2.25rem,5.5vw,4rem)] font-black leading-[1.05] tracking-[-0.04em]">
              Campaign Error Library
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#5A5A55] sm:text-xl">
              A searchable reference of preventable campaign failures: what they look like, why they hurt, how to
              detect them, and what to do next.
            </p>
          </FadeIn>

          <div className="mt-10 rounded-[24px] border border-[#DEDDD5] bg-white p-4 shadow-[0_12px_32px_rgba(15,23,42,0.04)] sm:p-5">
            <label className="sr-only" htmlFor="error-search">
              Search campaign errors
            </label>
            <input
              id="error-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search errors, impacts, detection logic…"
              className="w-full rounded-xl border border-[#E8E6DF] bg-[#FAFAF7] px-4 py-3 text-sm outline-none transition focus:border-[#0D0D0D]/30 focus:bg-white focus:ring-2 focus:ring-[#0D0D0D]/10"
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveTag(null)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  !activeTag
                    ? "bg-[#0D0D0D] text-white"
                    : "border border-[#DEDDD5] bg-white text-[#5A5A55] hover:text-[#0D0D0D]"
                }`}
              >
                All
              </button>
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTag((prev) => (prev === tag ? null : tag))}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    activeTag === tag
                      ? "bg-[#0D0D0D] text-white"
                      : "border border-[#DEDDD5] bg-white text-[#5A5A55] hover:text-[#0D0D0D]"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="marketing-section marketing-section-compact mx-auto w-[min(1100px,92vw)]">
          <SectionHeader
            title={`${filtered.length} error${filtered.length === 1 ? "" : "s"}`}
            description="Each card covers scenario, business impact, detection logic, and recommended action."
          />

          {filtered.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-[#DEDDD5] bg-white/70 px-6 py-12 text-center">
              <p className="text-base font-semibold">No matching errors</p>
              <p className="mt-2 text-sm text-[#5A5A55]">Clear filters or try a broader search term.</p>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {filtered.map((error, index) => (
                <FadeIn key={error.id} delay={Math.min(index * 0.03, 0.18)}>
                  <MarketingCard className="flex h-full flex-col">
                    <div className="flex flex-wrap gap-2">
                      {error.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-[#EEF0E7] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#3D3D38]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h2 className="mt-4 text-xl font-black tracking-tight sm:text-2xl">{error.title}</h2>

                    <div className="mt-5 space-y-4 text-sm leading-relaxed">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8A8A82]">Scenario</p>
                        <p className="mt-1.5 text-[#3D3D38]">{error.scenario}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8A8A82]">
                          Business impact
                        </p>
                        <p className="mt-1.5 text-[#3D3D38]">{error.businessImpact}</p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8A8A82]">
                          Detection logic
                        </p>
                        <p className="mt-1.5 text-[#3D3D38]">{error.detectionLogic}</p>
                      </div>
                      <div className="rounded-2xl border border-[#E8E6DF] bg-[#FAFAF7] p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8A8A82]">
                          Recommended action
                        </p>
                        <p className="mt-1.5 font-medium text-[#0D0D0D]">{error.recommendedAction}</p>
                      </div>
                    </div>
                  </MarketingCard>
                </FadeIn>
              ))}
            </div>
          )}

          <p className="mt-10 text-center text-sm text-[#5A5A55]">
            Prefer workflow context?{" "}
            <Link href="/operational-scenarios" className="font-semibold text-[#0D0D0D] underline-offset-2 hover:underline">
              Explore operational scenarios
            </Link>
            {" · "}
            <Link href="/methodology" className="font-semibold text-[#0D0D0D] underline-offset-2 hover:underline">
              Read the methodology
            </Link>
          </p>
        </section>

        <FinalCtaBand
          title="Catch these errors before spend"
          description="Adigator turns known failure patterns into checks before launch, so your team fixes issues while they are still cheap."
          href={MARKETING_CTA.href}
          label={MARKETING_CTA.label}
        />
      </main>

      <MarketingFooter />
    </div>
  );
}
