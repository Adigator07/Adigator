"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  MARKETING_CTA,
  MARKETING_DEMO_VIDEO,
  MARKETING_FOOTER_COLUMNS,
  MARKETING_NAV_LINKS,
  MARKETING_PARTNER_BADGES,
  MARKETING_SIGN_IN,
} from "@/app/lib/siteNavigation";
import MarketingNav from "@/app/components/MarketingNav";

const ROTATING_WORDS = ["analysis", "validation", "preview", "optimization"];

const FEATURES = [
  {
    title: "10-layer analysis orchestrator",
    description: "Run extraction, attention, platform-fit, inventory-fit, business impact, and strategic scoring in one deterministic flow.",
    icon: "↗",
  },
  {
    title: "Cross-platform validation intelligence",
    description: "Validate creative dimensions, placement fit, and auction readiness for Google Ads, Meta Ads, and Programmatic.",
    icon: "✦",
  },
  {
    title: "Contextual preview engine",
    description: "Generate environment-aware landing and placement previews so teams review ads inside realistic publisher contexts.",
    icon: "◉",
  },
];

const LOGOS = [
  "ANALYZE-CREATIVE API",
  "PREVIEW-ENGINE API",
  "GOOGLE ADS MATRIX",
  "META ADS MATRIX",
  "PROGRAMMATIC MATRIX",
  "ADIGATOR ANALYSIS",
  "PPTX EXPORT",
  "DASHBOARD",
];

const CASE_STUDIES = [
  { brand: "Advertising Intelligence Orchestrator", stat: "10 analysis layers", tagline: "Deterministic flow from extraction to final decision intelligence.", tag: "API" },
  { brand: "Adigator Contract", stat: "Structured output", tagline: "Standardized observable output for every analyzed creative.", tag: "Scoring" },
  { brand: "Platform Size Intelligence", stat: "3 platform matrices", tagline: "Google Ads, Meta Ads, and Programmatic support with tiered size groups.", tag: "Validation" },
  { brand: "Preview + Export Workflow", stat: "Context to deck", tagline: "Preview in realistic environments and export strategic reports to PPTX.", tag: "Operations" },
];

const BLOGS = [
  {
    tag: "System",
    title: "Inside the analyze-creative orchestrator and strategic scoring contract",
    author: "Product Engineering",
    date: "May 12, 2026",
  },
  {
    tag: "Validation",
    title: "How platform size intelligence maps creatives to Google, Meta, and DSP inventory",
    author: "Platform Team",
    date: "May 8, 2026",
  },
  {
    tag: "Workflow",
    title: "From contextual preview to strategic PPTX export in one review cycle",
    author: "Solutions Team",
    date: "Apr 29, 2026",
  },
];

export default function HomePage() {
  const reduceMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 14);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const heroWords = useMemo(
    () => ["Welcome", "to", "the", "AI", "era", "of"],
    []
  );
  const moduleCards = useMemo(() => [...CASE_STUDIES, ...CASE_STUDIES], []);

  return (
    <div className="marketing-page min-h-screen scroll-smooth bg-[#F5F5F0] text-[#0D0D0D]">
      <MarketingNav activePath="/" />

      <main className="pt-28">
        <section className="mx-auto w-[min(1280px,92vw)] py-32 md:py-36">
          <div className="max-w-5xl">
            <h1 className="text-[clamp(3.2rem,8vw,6rem)] font-black leading-[0.95] tracking-[-0.04em]">
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {heroWords.map((word, idx) => (
                  <motion.span
                    key={word}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: idx * 0.08 }}
                  >
                    {word}
                  </motion.span>
                ))}
                <span className="relative inline-block min-w-[260px] text-[#111827]">
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={ROTATING_WORDS[wordIndex]}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -18 }}
                      transition={{ duration: 0.35 }}
                      className="inline-block"
                    >
                      {ROTATING_WORDS[wordIndex]}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </div>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55 }}
              className="mt-8 max-w-2xl text-xl leading-relaxed text-[#5A5A55]"
            >
              Built on your real Adigator stack: orchestrated creative analysis, platform-size validation, contextual preview generation, and strategic export workflows.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mt-10 flex flex-wrap gap-4"
            >
              <Link href={MARKETING_SIGN_IN.href} className="marketing-btn-dark saas-hover rounded-full px-8 py-4 text-base font-semibold">
                Sign In
              </Link>
              <Link href={MARKETING_DEMO_VIDEO.href} className="marketing-btn-outline saas-hover rounded-full px-8 py-4 text-base font-semibold">
                Watch Demo
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.85 }}
            className="saas-hover mt-16 rounded-[28px] border border-[#DDDCD4] bg-white p-8 shadow-[0_25px_80px_rgba(15,23,42,0.08)]"
          >
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-[#E7E6DF] bg-[#F8F8F4] p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#666]">Analysis Flow</p>
                <p className="mt-3 text-3xl font-black">10 layers</p>
                <p className="mt-2 text-sm text-[#5E5E58]">Deterministic intelligence pipeline in the analyze-creative API.</p>
              </div>
              <div className="rounded-2xl border border-[#E7E6DF] bg-[#F8F8F4] p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#666]">Platform Coverage</p>
                <p className="mt-3 text-3xl font-black">3 matrices</p>
                <p className="mt-2 text-sm text-[#5E5E58]">Google Ads, Meta Ads, and Programmatic compatibility intelligence.</p>
              </div>
              <div className="rounded-2xl border border-[#E7E6DF] bg-[#F8F8F4] p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#666]">Adigator Output</p>
                <p className="mt-3 text-3xl font-black">Signal dense</p>
                <p className="mt-2 text-sm text-[#5E5E58]">Structured observable signals for launch decisioning.</p>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="mx-auto w-[min(1280px,92vw)] py-32">
          <div className="grid gap-6 md:grid-cols-3">
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                className="saas-hover rounded-3xl border border-[#DEDDD5] bg-white p-8 shadow-[0_12px_24px_rgba(15,23,42,0.05)]"
              >
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF0E7] text-xl font-bold">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-black tracking-tight">{feature.title}</h3>
                <p className="mt-4 text-base leading-relaxed text-[#5B5B55]">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="overflow-hidden border-y border-[#DCDACF] bg-[#ECECE6] py-6">
          <div className="ticker-track flex min-w-max gap-10">
            {[...LOGOS, ...LOGOS].map((logo, idx) => (
              <div
                key={`${logo}-${idx}`}
                className="flex h-12 min-w-[140px] items-center justify-center rounded-full border border-[#D3D2CA] bg-white px-6 text-sm font-semibold tracking-[0.16em] text-[#363636]"
              >
                {logo}
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#0D0D0D] py-32 text-white">
          <div className="mx-auto w-[min(1280px,92vw)]">
            <div className="mb-10 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[#9CA3AF]">Platform Modules</p>
                <h2 className="mt-3 text-5xl font-black tracking-tight">Core workflows, one operating layer</h2>
              </div>
              <p className="max-w-sm text-sm text-[#A3A3A3]">Live module stream: each card exits left while a new card enters from the right in a continuous loop.</p>
            </div>

            <div className="roller-coaster-shell overflow-hidden px-1">
              <div className={reduceMotion ? "flex gap-5" : "modules-track flex w-max gap-5 pr-5"}>
                {moduleCards.map((card, idx) => (
                  <article
                    key={`${card.brand}-${idx}`}
                    className="saas-hover relative w-[290px] shrink-0 overflow-hidden rounded-3xl border border-[#2A2A2A] bg-[#151515] p-6 md:w-[320px] lg:w-[340px]"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 20% 10%, rgba(200,240,77,0.18), transparent 42%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.08), transparent 46%)",
                    }}
                  >
                    <span className="inline-flex rounded-full border border-[#3A3A3A] bg-[#1F1F1F] px-3 py-1 text-xs font-semibold text-[#D4D4D4]">
                      {card.tag}
                    </span>
                    <p className="mt-6 text-lg text-[#B8B8B8]">{card.brand}</p>
                    <p className="mt-2 text-4xl font-black leading-tight">{card.stat}</p>
                    <p className="mt-3 text-sm text-[#A1A1A1]">{card.tagline}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-[min(1280px,92vw)] gap-16 py-32 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6B7280]">AI Engine</p>
            <h2 className="mt-4 text-5xl font-black leading-tight tracking-tight">
              The intelligence layer behind every campaign decision
            </h2>
            <ul className="mt-8 space-y-4 text-lg text-[#4B4B45]">
              {[
                "Goal and vertical alignment scoring with explicit mismatch reporting",
                "Preview-engine generation with deterministic environment and slot selection",
                "Strategic recommendations and PPTX export for stakeholder-ready reporting",
              ]
                .map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#DDE7B7] text-sm font-bold text-[#0D0D0D]">
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
            </ul>
          </div>

          <div className="saas-hover relative h-[380px] rounded-[32px] border border-[#DEDDD5] bg-white p-6 shadow-[0_25px_70px_rgba(15,23,42,0.08)]">
            <motion.div
              className="absolute inset-8 rounded-[26px]"
              animate={{
                background: [
                  "radial-gradient(circle at 25% 30%, rgba(200,240,77,0.35), rgba(13,13,13,0.08), transparent 65%)",
                  "radial-gradient(circle at 65% 55%, rgba(200,240,77,0.35), rgba(13,13,13,0.08), transparent 65%)",
                  "radial-gradient(circle at 35% 70%, rgba(200,240,77,0.35), rgba(13,13,13,0.08), transparent 65%)",
                ],
              }}
              transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
            />
            <div className="relative flex h-full flex-col justify-between rounded-2xl border border-[#DAD9D1] bg-[#F8F8F4] p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#63635E]">Live Decisioning</p>
              <p className="text-3xl font-black leading-tight">From upload to strategic report in one pipeline</p>
              <div className="rounded-2xl border border-[#DAD9D1] bg-white p-4 text-sm text-[#5A5A56]">
                Creative diagnostics, platform fit checks, inventory compatibility checks, and presentation export are fused into one recommendation stream.
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-[min(1280px,92vw)] py-32">
          <div className="mb-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6B7280]">Platform Notes</p>
            <h2 className="mt-3 text-5xl font-black tracking-tight">Implementation insights</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {BLOGS.map((post) => (
              <article
                key={post.title}
                className="saas-hover rounded-3xl border border-[#DEDDD5] bg-white p-7 shadow-[0_12px_24px_rgba(15,23,42,0.05)]"
              >
                <span className="inline-flex rounded-full border border-[#D2D1C8] bg-[#F8F8F4] px-3 py-1 text-xs font-semibold text-[#4E4E49]">
                  {post.tag}
                </span>
                <h3 className="mt-5 text-2xl font-black leading-tight tracking-tight">{post.title}</h3>
                <div className="mt-7 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#0D0D0D]" />
                  <div>
                    <p className="text-sm font-semibold">{post.author}</p>
                    <p className="text-xs text-[#6A6A64]">{post.date}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-[#0D0D0D] py-32 text-white">
          <div className="mx-auto flex w-[min(1100px,92vw)] flex-col items-center text-center">
            <h2 className="text-[clamp(2.2rem,6vw,4.5rem)] font-black leading-tight tracking-tight">
              Build, validate, preview, and present in one Adigator workflow
            </h2>
            <Link href="/preview-tool" className="saas-hover mt-8 rounded-full bg-[#C8F04D] px-9 py-4 text-base font-bold text-[#0D0D0D]">
              Get a Demo
            </Link>
          </div>
        </section>
      </main>

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

      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }

        .ticker-track {
          animation: marquee 28s linear infinite;
        }

        .saas-hover {
          transition: transform 0.22s ease, box-shadow 0.22s ease, background-color 0.22s ease;
        }

        .saas-hover:hover {
          transform: translateY(-3px);
          box-shadow: 0 0 0 1px rgba(148, 163, 184, 0.45), 0 16px 42px rgba(15, 23, 42, 0.14), 0 0 40px rgba(200, 240, 77, 0.17);
        }

        .roller-coaster-shell {
          will-change: transform;
        }

        .modules-track {
          animation: marquee 28s linear infinite;
          will-change: transform;
        }

        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

      `}</style>
    </div>
  );
}



