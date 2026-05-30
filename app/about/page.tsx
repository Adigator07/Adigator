"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MARKETING_CTA,
  MARKETING_DEMO_VIDEO,
  MARKETING_FOOTER_COLUMNS,
  MARKETING_NAV_LINKS,
  MARKETING_PARTNER_BADGES,
} from "@/app/lib/siteNavigation";
import MarketingNav from "@/app/components/MarketingNav";

const VALUES = [
  {
    icon: "◌",
    title: "Deterministic reasoning",
    description:
      "Core scoring and alignment layers are deterministic so every recommendation can be traced and reviewed.",
  },
  {
    icon: "↗",
    title: "Platform realism",
    description:
      "Preview workflows simulate realistic publisher contexts instead of isolated ad mockups.",
  },
  {
    icon: "✦",
    title: "Operational output",
    description:
      "Analysis is designed to end in action: validation, preview decisions, and stakeholder-ready export files.",
  },
];

const STATS = [
  { value: "10", label: "analysis layers in orchestrator" },
  { value: "3", label: "platform intelligence matrices" },
  { value: "1", label: "adigator output contract" },
  { value: "10", label: "preview environment families" },
];

const PLATFORM_PILLARS = [
  {
    name: "Analyze Creative API",
    role: "Strategic Intelligence Core",
    detail: "Combines extraction, attention, platform/inventory alignment, and weighted scoring.",
  },
  {
    name: "Creative Validation Library",
    role: "Platform + Format Guardrails",
    detail: "Maps ad sizes and media types across Google Ads, Meta Ads, and Programmatic ecosystems.",
  },
  {
    name: "Preview Engine API",
    role: "Environment-Aware Simulation",
    detail: "Generates landing experiences, placement context, and deterministic slot outputs.",
  },
  {
    name: "Strategic Export Layer",
    role: "PPTX Reporting",
    detail: "Builds stakeholder-ready strategic decks from orchestrator contract fields.",
  },
];

const TIMELINE = [
  {
    year: "Phase 1",
    title: "Validation-first workflow",
    body: "The project began with creative format checks and ad-platform compatibility scoring.",
  },
  {
    year: "Phase 2",
    title: "Adigator analysis contract",
    body: "Strategic payloads were standardized with explicit campaign, goal, and vertical alignment fields.",
  },
  {
    year: "Phase 3",
    title: "Contextual preview engine",
    body: "Environment templates and slot intelligence enabled realistic preview review before launch.",
  },
  {
    year: "Phase 4",
    title: "Strategic export and reporting",
    body: "PPTX export workflows were added so teams can share analysis decisions across stakeholders.",
  },
];

const PROJECT_SURFACES = ["/", "/product", "/solutions", "/preview-tool", "/preview", "/dashboard"];

function Footer() {
  return (
    <footer className="border-t border-[#DDDCD4] bg-[#F5F5F0] py-20">
      <div className="mx-auto grid w-[min(1280px,92vw)] gap-12 md:grid-cols-5">
        <div className="md:col-span-2">
          <p className="text-2xl font-black tracking-tight">Adigator</p>
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 14);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="marketing-page min-h-screen bg-[#F5F5F0] text-[#0D0D0D]">
      <MarketingNav activePath="/about" />

      <main className="pt-28">
        <section className="mx-auto grid w-[min(1280px,92vw)] gap-12 py-32 md:grid-cols-2 md:items-center md:py-40">
          <div>
            <span className="inline-flex rounded-full border border-[#D4D3CC] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#51514A]">
              About The Project
            </span>
            <h1 className="mt-8 max-w-3xl text-[clamp(2.6rem,7vw,5.4rem)] font-black leading-[0.95] tracking-[-0.04em]">
              Built to unify analysis, validation, preview, and reporting.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-[#5C5C56]">
              Adigator is a practical intelligence platform for ad workflows. It combines the analyze-creative orchestrator,
              platform-size validation matrices, contextual preview generation, and strategic presentation export into one product surface.
            </p>
          </div>

          <div className="grid grid-cols-4 grid-rows-4 gap-3">
            <div className="saas-hover col-span-2 row-span-2 rounded-[24px] border border-[#DAD9D1] bg-[#0D0D0D] p-5 text-white">
              <p className="text-xs uppercase tracking-[0.14em] text-white/60">Core API</p>
              <p className="mt-3 text-2xl font-black">Analyze Creative</p>
              <p className="mt-3 text-sm text-white/70">Extraction → Platform Fit → Alignment → Weighted Decision Intelligence.</p>
            </div>
            <div className="saas-hover col-span-2 row-span-1 rounded-[20px] border border-[#DAD9D1] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[#5E5E58]">Validation</p>
              <p className="mt-2 text-sm font-semibold">Google, Meta, Programmatic size intelligence groups</p>
            </div>
            <div className="saas-hover col-span-1 row-span-2 rounded-[20px] border border-[#DAD9D1] bg-[#EEF0E7] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[#4E4E49]">Preview</p>
              <p className="mt-2 text-sm font-semibold">Environment-driven ad slots</p>
            </div>
            <div className="saas-hover col-span-1 row-span-1 rounded-[20px] border border-[#DAD9D1] bg-white" />
            <div className="saas-hover col-span-2 row-span-1 rounded-[20px] border border-[#DAD9D1] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[#5E5E58]">Reporting</p>
              <p className="mt-2 text-sm font-semibold">Strategic analysis exported to PPTX for stakeholder review</p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-[min(1280px,92vw)] py-24 md:py-32">
          <div className="grid gap-6 md:grid-cols-3">
            {VALUES.map((value) => (
              <article
                key={value.title}
                className="saas-hover rounded-3xl border border-[#DEDDD5] bg-white p-8 shadow-[0_12px_24px_rgba(15,23,42,0.05)]"
              >
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full border border-[#D9D8D0] bg-[#F8F8F4] text-2xl font-bold">
                  {value.icon}
                </div>
                <h3 className="text-2xl font-black tracking-tight">{value.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-[#585852]">{value.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-[#0D0D0D] py-24 text-white md:py-28">
          <div className="mx-auto grid w-[min(1280px,92vw)] gap-8 md:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="saas-hover rounded-3xl border border-[#2A2A2A] bg-[#151515] p-7">
                <p className="text-5xl font-black tracking-tight text-[#C8F04D]">{stat.value}</p>
                <p className="mt-3 text-sm uppercase tracking-[0.14em] text-[#A8A8A8]">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-[min(1280px,92vw)] py-24 md:py-32">
          <div className="mb-10">
            <p className="text-sm uppercase tracking-[0.18em] text-[#676760]">Platform Pillars</p>
            <h2 className="mt-3 text-5xl font-black tracking-tight">Built from modular workflow systems</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
            {PLATFORM_PILLARS.map((member) => (
              <article
                key={member.name}
                className="group saas-hover rounded-3xl border border-[#DEDDD5] bg-white p-6"
              >
                <p className="text-xl font-black tracking-tight">{member.name}</p>
                <p className="mt-1 text-sm font-semibold text-[#4C4C46]">{member.role}</p>
                <p className="mt-4 text-sm text-[#5E5E58]">
                  {member.detail}
                </p>
                <div className="mt-6 h-px bg-[#E2E1D9]" />
                <p className="mt-4 text-xs uppercase tracking-[0.14em] text-[#71716A]">
                  Production capability
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-[min(1100px,92vw)] py-24 md:py-32">
          <div className="mb-10 text-center">
            <p className="text-sm uppercase tracking-[0.18em] text-[#676760]">Company Story</p>
            <h2 className="mt-3 text-5xl font-black tracking-tight">Our timeline</h2>
          </div>

          <div className="relative mx-auto max-w-4xl">
            <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-[#D8D7CF] md:block" />
            <div className="space-y-8">
              {TIMELINE.map((item, idx) => {
                const right = idx % 2 === 1;
                return (
                  <motion.div
                    key={`${item.year}-${item.title}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.25 }}
                    transition={{ duration: 0.4, delay: idx * 0.08 }}
                    className={`relative flex ${right ? "md:justify-end" : "md:justify-start"}`}
                  >
                    <div className="saas-hover w-full rounded-2xl border border-[#DEDDD5] bg-white p-6 md:w-[46%]">
                      <span className="inline-flex rounded-full border border-[#D3D2CA] bg-[#F8F8F4] px-3 py-1 text-xs font-semibold tracking-[0.14em] text-[#50504B]">
                        {item.year}
                      </span>
                      <h3 className="mt-4 text-2xl font-black tracking-tight">{item.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-[#595952]">{item.body}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto w-[min(1280px,92vw)] py-8 pb-24 md:pb-32">
          <div className="saas-hover flex flex-col items-start gap-6 rounded-[28px] border border-[#DBDAD2] bg-white px-8 py-10 md:flex-row md:items-center md:justify-between md:px-12">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-[#686861]">Contribute</p>
              <h3 className="mt-3 text-4xl font-black leading-tight tracking-tight">Extend the Adigator workflow.</h3>
              <p className="mt-3 max-w-2xl text-sm text-[#5B5B55]">
                Build deeper analysis layers, richer preview environments, and stronger launch diagnostics for campaign teams.
              </p>
            </div>
            <Link href={MARKETING_DEMO_VIDEO.href} className="marketing-btn-dark saas-hover inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold">
              Open Preview Studio →
            </Link>
          </div>
        </section>

        <section className="mx-auto w-[min(1100px,92vw)] py-8 pb-24 text-center md:pb-32">
          <p className="text-sm uppercase tracking-[0.18em] text-[#66665F]">Project Surface Area</p>
          <div className="mt-8 grid grid-cols-2 gap-3 grayscale md:grid-cols-3 lg:grid-cols-6">
            {PROJECT_SURFACES.map((logo) => (
              <div
                key={logo}
                className="rounded-xl border border-[#D8D7CF] bg-white px-4 py-3 text-sm font-semibold text-[#50504B]"
              >
                {logo}
              </div>
            ))}
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
