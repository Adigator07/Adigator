"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  MARKETING_FOOTER_COLUMNS,
  MARKETING_PARTNER_BADGES,
} from "@/app/lib/siteNavigation";
import MarketingNav from "@/app/components/MarketingNav";

type TabKey = "use-case" | "team" | "industry";

type SolutionCard = {
  icon: string;
  title: string;
  description: string;
};

const SOLUTIONS: Record<TabKey, SolutionCard[]> = {
  "use-case": [
    {
      icon: "↗",
      title: "Pre-Launch Validation",
      description:
        "Catch wrong dimensions, oversized files, and incompatible formats across Google, Meta, and Programmatic before budget is wasted on rejected ads.",
    },
    {
      icon: "◎",
      title: "Creative QA & Approval",
      description:
        "Replace endless email threads and screenshot chains with structured analysis, contextual previews, and shareable reports stakeholders actually understand.",
    },
    {
      icon: "✦",
      title: "Multi-Platform Scaling",
      description:
        "Adapt one creative set across channels with platform-specific intelligence — size matrices, placement rules, and inventory fit built in.",
    },
    {
      icon: "◌",
      title: "Strategic Reporting",
      description:
        "Turn raw creative performance signals into presentation-ready PPTX decks for client reviews, leadership updates, and campaign retrospectives.",
    },
  ],
  team: [
    {
      icon: "Δ",
      title: "Performance Marketing Teams",
      description:
        "Launch faster with validated creatives and clear go/no-go signals. Spend less time firefighting platform rejections and more time optimizing.",
    },
    {
      icon: "◈",
      title: "Creative & Design Teams",
      description:
        "Get objective feedback on attention, alignment, and format fit — so revisions are data-informed, not subjective opinion loops.",
    },
    {
      icon: "▣",
      title: "Agencies & Servicing Teams",
      description:
        "Manage multiple clients with organization workspaces, team permissions, and a unified review workflow from upload to client sign-off.",
    },
    {
      icon: "◇",
      title: "Brand & In-House Teams",
      description:
        "Keep creative standards consistent across regions and channels with one platform for validation, preview, and strategic documentation.",
    },
  ],
  industry: [
    {
      icon: "◍",
      title: "Retail & E-commerce",
      description:
        "Validate product creatives across seasonal campaigns, catalog ads, and high-velocity promotional bursts without compliance surprises.",
    },
    {
      icon: "◉",
      title: "Healthcare & Pharma",
      description:
        "Review ad clarity, messaging alignment, and placement context with the rigor regulated industries demand — before ads reach live inventory.",
    },
    {
      icon: "✚",
      title: "Financial Services",
      description:
        "Ensure creative assets meet platform specs and brand guidelines across trust-sensitive campaigns with auditable analysis output.",
    },
    {
      icon: "⬡",
      title: "Media & Entertainment",
      description:
        "Preview high-impact visuals in realistic publisher environments and accelerate approval cycles for launch-day deadlines.",
    },
  ],
};

const TAB_LABELS: Record<TabKey, string> = {
  "use-case": "By Use Case",
  team: "By Team",
  industry: "By Industry",
};

const RESULT_STATS = [
  { value: "10-layer analysis", brand: "Deep creative scoring" },
  { value: "3 ad platforms", brand: "Google · Meta · Programmatic" },
  { value: "Real publisher previews", brand: "Contextual Preview Studio" },
  { value: "PPTX export", brand: "Stakeholder-ready reports" },
];

const TESTIMONIALS = [
  {
    quote:
      "We used to lose a full day to format issues and revision rounds. Adigator catches problems upfront and gives our clients previews they can actually sign off on.",
    author: "Sarah Chen",
    role: "Director of Media Operations",
    company: "Horizon Media Group",
  },
  {
    quote:
      "Finally, creative and performance teams work from the same analysis. No more debating whether an ad is 'ready' — the platform tells us, clearly.",
    author: "Marcus Webb",
    role: "Head of Performance",
    company: "Brandscale Agency",
  },
  {
    quote:
      "The preview studio changed how we present to clients. Seeing ads in a real article layout beats any static mockup we've ever shipped.",
    author: "Priya Nair",
    role: "Creative Strategy Lead",
    company: "Northline Digital",
  },
];

function Footer() {
  return (
    <footer className="border-t border-[#DDDCD4] bg-[#F5F5F0] py-20">
      <div className="mx-auto grid w-[min(1280px,92vw)] gap-12 md:grid-cols-5">
        <div className="md:col-span-2">
          <p className="text-2xl font-black tracking-tight">Adigator</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#66665F]">
            Creative intelligence for teams who validate, preview, and launch with confidence.
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
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("use-case");
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  const statsViewportRef = useRef<HTMLDivElement>(null);
  const statsTrackRef = useRef<HTMLDivElement>(null);
  const [statsDragLimit, setStatsDragLimit] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 14);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const computeDragLimit = () => {
      if (!statsViewportRef.current || !statsTrackRef.current) return;
      const viewport = statsViewportRef.current.offsetWidth;
      const track = statsTrackRef.current.scrollWidth;
      setStatsDragLimit(Math.max(0, track - viewport));
    };

    computeDragLimit();
    window.addEventListener("resize", computeDragLimit);
    return () => window.removeEventListener("resize", computeDragLimit);
  }, []);

  const activeCards = useMemo(() => SOLUTIONS[activeTab], [activeTab]);
  const testimonial = TESTIMONIALS[testimonialIndex];

  const nextTestimonial = () => {
    setTestimonialIndex((prev) => (prev + 1) % TESTIMONIALS.length);
  };

  const prevTestimonial = () => {
    setTestimonialIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  return (
    <div className="marketing-page min-h-screen bg-[#F5F5F0] text-[#0D0D0D]">
      <MarketingNav activePath="/solutions" />

      <main className="pt-28">
        <section className="marketing-section mx-auto w-[min(980px,92vw)] py-16 text-center sm:py-20 md:py-28">
          <span className="inline-flex rounded-full border border-[#D4D3CC] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#51514A]">
            Solutions
          </span>
          <h1 className="mx-auto mt-6 max-w-5xl text-[clamp(2rem,6vw,5.2rem)] font-black leading-[0.94] tracking-[-0.04em] sm:mt-8">
            One platform for every team that ships ads.
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-[#5C5C56]">
            Whether you validate creatives, manage client campaigns, or lead an in-house org —
            Adigator adapts to how your team works and eliminates the friction between creative and launch.
          </p>
        </section>

        <section id="use-case" className="mx-auto w-[min(1280px,92vw)] py-12 md:py-20">
          <div className="mb-10 grid gap-3 md:grid-cols-3">
            {(Object.keys(TAB_LABELS) as TabKey[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`saas-hover rounded-full border px-6 py-4 text-sm font-semibold transition ${
                  activeTab === tab
                    ? "border-[#0D0D0D] bg-[#0D0D0D] text-white"
                    : "border-[#D8D7D0] bg-white text-[#2B2B27]"
                }`}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.25 }}
              className="grid gap-6 md:grid-cols-2 xl:grid-cols-4"
            >
              {activeCards.map((card) => (
                <article
                  key={card.title}
                  className="saas-hover rounded-3xl border border-[#DEDDD5] bg-white p-7 shadow-[0_12px_24px_rgba(15,23,42,0.05)]"
                >
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#D8D7CF] bg-[#F8F8F4] text-xl font-bold">
                    {card.icon}
                  </div>
                  <h3 className="text-2xl font-black leading-tight tracking-tight">{card.title}</h3>
                  <p className="mt-4 min-h-16 text-sm leading-relaxed text-[#585852]">{card.description}</p>
                  <Link href="/preview-tool" className="mt-6 inline-block text-sm font-semibold text-[#141414] hover:underline">
                    Explore Preview Studio →
                  </Link>
                </article>
              ))}
            </motion.div>
          </AnimatePresence>
        </section>

        <section id="industry" className="bg-[#0D0D0D] py-24 text-white">
          <div className="mx-auto w-[min(1280px,92vw)]">
            <p className="mb-8 text-sm uppercase tracking-[0.18em] text-[#A4A4A4]">Platform capabilities</p>
            <div ref={statsViewportRef} className="overflow-hidden">
              <motion.div
                ref={statsTrackRef}
                drag="x"
                dragConstraints={{ left: -statsDragLimit, right: 0 }}
                className="flex gap-4"
              >
                {RESULT_STATS.map((stat) => (
                  <article
                    key={stat.value}
                    className="saas-hover w-[310px] shrink-0 rounded-3xl border border-[#2D2D2D] bg-[#141414] p-6"
                  >
                    <p className="text-4xl font-black leading-tight">{stat.value}</p>
                    <p className="mt-4 text-sm text-[#A8A8A8]">{stat.brand}</p>
                  </article>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        <section id="team" className="marketing-section mx-auto w-[min(980px,92vw)] py-16 text-center sm:py-20 md:py-24">
          <p className="text-sm uppercase tracking-[0.18em] text-[#6A6A63]">What customers say</p>
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={testimonial.quote}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="mx-auto mt-8 max-w-4xl text-[clamp(1.6rem,3.6vw,2.75rem)] font-black leading-[1.2] tracking-tight"
            >
              “{testimonial.quote}”
            </motion.blockquote>
          </AnimatePresence>

          <p className="mt-10 text-base font-semibold">{testimonial.author}</p>
          <p className="mt-1 text-sm text-[#60605B]">
            {testimonial.role}, {testimonial.company}
          </p>

          <div className="mt-10 flex items-center justify-center gap-3">
            <button
              onClick={prevTestimonial}
              className="saas-hover inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#D7D6CE] bg-white text-lg font-bold"
              aria-label="Previous testimonial"
            >
              ←
            </button>
            <button
              onClick={nextTestimonial}
              className="saas-hover inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#D7D6CE] bg-white text-lg font-bold"
              aria-label="Next testimonial"
            >
              →
            </button>
          </div>
        </section>

        <section className="mx-auto w-[min(1280px,92vw)] py-8 pb-32">
          <div className="saas-hover flex flex-col items-start gap-6 rounded-[28px] border border-[#DBDAD2] bg-white px-8 py-10 md:flex-row md:items-center md:justify-between md:px-12">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-[#686861]">Get started</p>
              <h3 className="mt-3 text-3xl font-black leading-tight tracking-tight md:text-4xl">
                See Adigator in action
              </h3>
              <p className="mt-3 max-w-2xl text-sm text-[#5B5B55]">
                Walk through the full workflow — set campaign objectives, upload creatives, run analysis,
                preview in context, and export a strategic report. No setup required.
              </p>
            </div>
            <Link href="/preview-tool?demo=1&step=1" className="saas-hover inline-flex items-center gap-2 rounded-full bg-[#0D0D0D] px-7 py-3 text-sm font-semibold text-white">
              Launch Preview Studio →
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
