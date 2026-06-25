"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MARKETING_FOOTER_COLUMNS,
  MARKETING_PARTNER_BADGES,
} from "@/app/lib/siteNavigation";
import MarketingNav from "@/app/components/MarketingNav";

const VALUES = [
  {
    icon: "◌",
    title: "Clarity over chaos",
    description:
      "Advertising teams drown in scattered files, screenshots, and subjective feedback. Adigator replaces that noise with structured analysis everyone can trust.",
  },
  {
    icon: "↗",
    title: "Preview what audiences see",
    description:
      "A creative approved in isolation is not a creative approved in context. Our preview studio places ads inside real publisher environments for honest review.",
  },
  {
    icon: "✦",
    title: "Built for scale",
    description:
      "From solo marketers to multi-team organizations, Adigator grows with you — personal dashboards, org workspaces, and platform-wide administration.",
  },
];

const STATS = [
  { value: "10", label: "layers of creative analysis" },
  { value: "3", label: "major ad platforms supported" },
  { value: "4", label: "step end-to-end workflow" },
  { value: "∞", label: "teams per organization" },
];

const PLATFORM_PILLARS = [
  {
    name: "Preview Studio",
    role: "Campaign setup to launch",
    detail: "Define objectives, upload creatives, validate formats, run analysis, preview placements, and export reports — the complete creative QA cycle.",
  },
  {
    name: "Creative Validation Engine",
    role: "Platform compliance, automated",
    detail: "Size matrices, file-weight checks, and placement rules for Google Ads, Meta Ads, and Programmatic — flagged before you go live.",
  },
  {
    name: "AI Analysis Orchestrator",
    role: "Strategic intelligence layer",
    detail: "Ten scoring layers evaluate attention, goal alignment, vertical fit, inventory compatibility, and launch readiness in one deterministic flow.",
  },
  {
    name: "Organization Platform",
    role: "Teams, permissions, visibility",
    detail: "Super admins oversee all organizations. Org admins manage teams and members. Users focus on their own creatives and activity.",
  },
];

const TIMELINE = [
  {
    year: "The problem",
    title: "Creative review was broken",
    body: "Teams juggled spreadsheets, email chains, and static mockups. Platform rejections, missed specs, and slow approvals cost time and budget on every campaign.",
  },
  {
    year: "The insight",
    title: "Validation and preview belong together",
    body: "We saw that checking dimensions alone wasn't enough — stakeholders need to see ads in context and understand why a creative is ready or not.",
  },
  {
    year: "The platform",
    title: "Adigator was built",
    body: "A unified workflow emerged: campaign objectives, upload and validate, deep AI analysis, contextual preview, and strategic PPTX export — one product, one pipeline.",
  },
  {
    year: "Today",
    title: "Built for organizations",
    body: "Multi-tenant workspaces, team management, communications, and tiered dashboards now support advertisers, agencies, and enterprise marketing orgs at scale.",
  },
];

const PLATFORM_SURFACES = [
  { label: "Landing", href: "/" },
  { label: "Solutions", href: "/solutions" },
  { label: "Preview Studio", href: "/preview-tool" },
  { label: "Live Preview", href: "/preview" },
  { label: "User Dashboard", href: "/dashboard" },
  { label: "Org Console", href: "/dashboard/organization" },
];

function Footer() {
  return (
    <footer className="border-t border-[#DDDCD4] bg-[#F5F5F0] py-20">
      <div className="mx-auto grid w-[min(1280px,92vw)] gap-12 md:grid-cols-5">
        <div className="md:col-span-2">
          <p className="text-2xl font-black tracking-tight">Adigator</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#66665F]">
            Creative intelligence for the teams who ship advertising at scale.
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
        <section className="marketing-section mx-auto grid w-[min(1280px,92vw)] gap-10 py-16 sm:gap-12 sm:py-20 md:grid-cols-2 md:items-center md:py-28 lg:gap-12">
          <div>
            <span className="inline-flex rounded-full border border-[#D4D3CC] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#51514A]">
              About Adigator
            </span>
            <h1 className="mt-6 max-w-3xl text-[clamp(2rem,6vw,5.4rem)] font-black leading-[0.95] tracking-[-0.04em] sm:mt-8">
              We built the platform we wished existed for creative teams.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-[#5C5C56]">
              Adigator is a creative intelligence platform for advertisers, agencies, and marketing organizations.
              We unify validation, AI-powered analysis, contextual preview, and strategic reporting — so teams
              stop guessing and start launching with confidence.
            </p>
          </div>

          <div className="grid grid-cols-4 grid-rows-4 gap-3">
            <div className="saas-hover col-span-2 row-span-2 rounded-[24px] border border-[#DAD9D1] bg-[#0D0D0D] p-5 text-white">
              <p className="text-xs uppercase tracking-[0.14em] text-white/60">Our mission</p>
              <p className="mt-3 text-2xl font-black">Launch better ads, faster</p>
              <p className="mt-3 text-sm text-white/70">Every creative deserves a fair review — validated against platform rules, analyzed for impact, and previewed in the world it will live in.</p>
            </div>
            <div className="saas-hover col-span-2 row-span-1 rounded-[20px] border border-[#DAD9D1] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[#5E5E58]">Who we serve</p>
              <p className="mt-2 text-sm font-semibold">Advertisers, agencies, brand teams, and enterprise marketing organizations</p>
            </div>
            <div className="saas-hover col-span-1 row-span-2 rounded-[20px] border border-[#DAD9D1] bg-[#EEF0E7] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[#4E4E49]">Preview</p>
              <p className="mt-2 text-sm font-semibold">Real publisher environments, not flat mockups</p>
            </div>
            <div className="saas-hover col-span-1 row-span-1 rounded-[20px] border border-[#DAD9D1] bg-white" />
            <div className="saas-hover col-span-2 row-span-1 rounded-[20px] border border-[#DAD9D1] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[#5E5E58]">Output</p>
              <p className="mt-2 text-sm font-semibold">Strategic PPTX reports ready for client and leadership review</p>
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
            <p className="text-sm uppercase tracking-[0.18em] text-[#676760]">What powers Adigator</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">Four pillars. One connected workflow.</h2>
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
                  Core capability
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-[min(1100px,92vw)] py-24 md:py-32">
          <div className="mb-10 text-center">
            <p className="text-sm uppercase tracking-[0.18em] text-[#676760]">Our story</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">From frustration to platform</h2>
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
              <p className="text-sm uppercase tracking-[0.18em] text-[#686861]">Experience it</p>
              <h3 className="mt-3 text-4xl font-black leading-tight tracking-tight">See what better creative workflow feels like.</h3>
              <p className="mt-3 max-w-2xl text-sm text-[#5B5B55]">
                Open Preview Studio and walk through a real campaign — validate creatives, run analysis,
                preview in context, and export a report. No sales call required.
              </p>
            </div>
            <Link href="/preview-tool?demo=1&step=1" className="marketing-btn-dark saas-hover inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold">
              Try Preview Studio →
            </Link>
          </div>
        </section>

        <section className="mx-auto w-[min(1100px,92vw)] py-8 pb-24 text-center md:pb-32">
          <p className="text-sm uppercase tracking-[0.18em] text-[#66665F]">Explore the platform</p>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {PLATFORM_SURFACES.map((surface) => (
              <Link
                key={surface.href}
                href={surface.href}
                className="saas-hover rounded-xl border border-[#D8D7CF] bg-white px-4 py-3 text-sm font-semibold text-[#50504B] hover:text-[#0D0D0D]"
              >
                {surface.label}
              </Link>
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
