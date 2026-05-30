"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  MARKETING_CTA,
  MARKETING_FOOTER_COLUMNS,
  MARKETING_NAV_LINKS,
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
      title: "Performance & Budget Optimization",
      description: "Continuously reallocate spend toward high-performing creatives, channels, and audience segments.",
    },
    {
      icon: "◎",
      title: "Audience Targeting",
      description: "Find high-intent audience pockets and refine targeting with confidence across each campaign cycle.",
    },
    {
      icon: "✦",
      title: "Ad Creation",
      description: "Generate, score, and iterate high-impact ad creative variants without slowing your launch cadence.",
    },
    {
      icon: "◌",
      title: "Insights & Monitoring",
      description: "Monitor trend shifts and performance anomalies in real time before they impact results.",
    },
  ],
  team: [
    {
      icon: "Δ",
      title: "Performance Teams",
      description: "Turn media planning and optimization into a repeatable growth engine with cleaner decision loops.",
    },
    {
      icon: "◈",
      title: "Creative Teams",
      description: "Move from subjective review cycles to measurable creative impact backed by clear AI guidance.",
    },
    {
      icon: "▣",
      title: "Agencies",
      description: "Scale strategy and execution across clients while keeping quality high and delivery timelines tight.",
    },
  ],
  industry: [
    {
      icon: "◍",
      title: "Retail",
      description: "Maximize conversion and catalog performance with adaptive creatives built for seasonal demand.",
    },
    {
      icon: "◉",
      title: "Consumer Packaged Goods",
      description: "Elevate awareness and market share with message testing tuned for fast-moving inventory cycles.",
    },
    {
      icon: "✚",
      title: "Healthcare",
      description: "Deliver compliant, high-clarity campaigns that build trust and improve patient acquisition outcomes.",
    },
    {
      icon: "⬡",
      title: "Telecoms",
      description: "Reduce acquisition costs and improve retention with precise segmentation and plan-specific messaging.",
    },
  ],
};

const TAB_LABELS: Record<TabKey, string> = {
  "use-case": "By Use Case",
  team: "By Team",
  industry: "By Industry",
};

const RESULT_STATS = [
  { value: "69% RoAS improvement", brand: "Axiom" },
  { value: "41% lower CPI", brand: "Northstar" },
  { value: "28% CAC reduction", brand: "Helio" },
  { value: "34% faster launch velocity", brand: "Maven" },
];

const TESTIMONIALS = [
  {
    quote:
      "Adigator gave us a clearer path from strategy to execution. We launched better campaigns in half the time with stronger efficiency.",
    author: "Nora Patel",
    role: "VP, Performance Marketing",
    company: "Brightline",
  },
  {
    quote:
      "The platform helped our creative and media teams finally work from the same source of truth. Results became predictable.",
    author: "Daniel Cruz",
    role: "Head of Growth",
    company: "Axiom",
  },
  {
    quote:
      "We cut weeks of back-and-forth and turned experimentation into a weekly rhythm that consistently improved campaign output.",
    author: "Mina Shah",
    role: "Director, Digital Strategy",
    company: "Northstar",
  },
];

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
        <section className="mx-auto w-[min(980px,92vw)] py-32 text-center md:py-40">
          <span className="inline-flex rounded-full border border-[#D4D3CC] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#51514A]">
            Solutions
          </span>
          <h1 className="mx-auto mt-8 max-w-5xl text-[clamp(2.6rem,7vw,5.2rem)] font-black leading-[0.94] tracking-[-0.04em]">
            No matter your role or goal, Adigator adapts to your needs.
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-[#5C5C56]">
            Configure your operating model by use case, team, or industry and unlock an execution system built for the way you work.
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
                  <button className="mt-6 text-sm font-semibold text-[#141414]">Learn more →</button>
                </article>
              ))}
            </motion.div>
          </AnimatePresence>
        </section>

        <section id="industry" className="bg-[#0D0D0D] py-24 text-white">
          <div className="mx-auto w-[min(1280px,92vw)]">
            <p className="mb-8 text-sm uppercase tracking-[0.18em] text-[#A4A4A4]">Results</p>
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

        <section id="team" className="mx-auto w-[min(980px,92vw)] py-32 text-center">
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
              <p className="text-sm uppercase tracking-[0.18em] text-[#686861]">Agency Partners</p>
              <h3 className="mt-3 text-3xl font-black leading-tight tracking-tight md:text-4xl">
                Looking for a stellar marketing agency?
              </h3>
              <p className="mt-3 max-w-2xl text-sm text-[#5B5B55]">
                Connect with vetted partners that specialize in creative strategy, media planning, and end-to-end performance execution.
              </p>
            </div>
            <Link href="/preview-tool" className="saas-hover inline-flex items-center gap-2 rounded-full bg-[#0D0D0D] px-7 py-3 text-sm font-semibold text-white">
              Browse Partner Agencies →
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
