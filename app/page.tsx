"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  MARKETING_DEMO_VIDEO,
  MARKETING_FOOTER_COLUMNS,
  MARKETING_PARTNER_BADGES,
} from "@/app/lib/siteNavigation";
import MarketingNav from "@/app/components/MarketingNav";
import HeroLiveCards from "@/app/components/marketing/HeroLiveCards";
import PipelineCoreEngine from "@/app/components/marketing/PipelineCoreEngine";

const ROTATING_WORDS = ["analysis", "validation", "preview", "reporting"];

const FEATURES = [
  {
    title: "AI creative intelligence",
    description:
      "A 10-layer analysis engine scores every asset for attention, platform fit, inventory alignment, and business impact — so teams launch with confidence, not guesswork.",
    icon: "↗",
  },
  {
    title: "Cross-platform compliance",
    description:
      "Instantly validate dimensions, file sizes, and placement rules across Google Ads, Meta Ads, and Programmatic inventory before a single dollar is spent.",
    icon: "✦",
  },
  {
    title: "Real-world preview studio",
    description:
      "See ads in realistic publisher environments — news articles, blogs, native display, and more — so stakeholders approve what audiences will actually see.",
    icon: "◉",
  },
];

const LOGOS = [
  "GOOGLE ADS",
  "META ADS",
  "PROGRAMMATIC DSP",
  "PREVIEW STUDIO",
  "CREATIVE ANALYSIS",
  "PPTX EXPORT",
  "TEAM WORKSPACES",
  "ORG DASHBOARDS",
];

const WORKFLOW_MODULES = [
  {
    brand: "Upload & Validate",
    stat: "Step 1–2",
    tagline: "Set campaign objectives, upload creatives, and catch format issues before they reach the ad platform.",
    tag: "Validate",
  },
  {
    brand: "Strategic Analysis",
    stat: "10 layers",
    tagline: "Deep scoring on goals, vertical fit, attention, and launch readiness in one deterministic pipeline.",
    tag: "Analyze",
  },
  {
    brand: "Contextual Preview",
    stat: "Live slots",
    tagline: "Preview placements in publisher templates — not isolated mockups — for faster stakeholder sign-off.",
    tag: "Preview",
  },
  {
    brand: "Export & Report",
    stat: "PPTX ready",
    tagline: "Turn analysis into presentation-ready decks your clients and leadership can act on immediately.",
    tag: "Deliver",
  },
];

const INSIGHTS = [
  {
    tag: "For Agencies",
    title: "Stop losing hours to back-and-forth creative reviews",
    author: "Workflow",
    date: "Creative ops",
  },
  {
    tag: "For Brands",
    title: "Launch on Google, Meta, and DSP with one validation layer",
    author: "Platforms",
    date: "Multi-channel",
  },
  {
    tag: "For Teams",
    title: "From upload to approved preview in a single connected workflow",
    author: "Collaboration",
    date: "End-to-end",
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
    () => ["The", "creative", "intelligence", "platform", "for"],
    []
  );
  const moduleCards = useMemo(() => [...WORKFLOW_MODULES, ...WORKFLOW_MODULES], []);

  return (
    <div className="marketing-page min-h-screen scroll-smooth bg-[#F5F5F0] text-[#0D0D0D]">
      <MarketingNav activePath="/" />

      <main className="pt-28">
        <section className="marketing-section mx-auto w-[min(1280px,92vw)] py-16 sm:py-20 md:py-28">
          <div className="max-w-5xl">
            <h1 className="text-[clamp(2.25rem,7vw,6rem)] font-black leading-[0.95] tracking-[-0.04em]">
              <div className="flex flex-wrap gap-x-3 gap-y-2 sm:gap-x-4">
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
                <span className="relative inline-block min-w-0 text-[#111827] sm:min-w-[200px]">
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
              className="mt-6 max-w-2xl text-base leading-relaxed text-[#5A5A55] sm:mt-8 sm:text-lg md:text-xl"
            >
              Adigator helps advertisers, agencies, and marketing teams analyze creatives, validate platform compliance,
              preview ads in real environments, and deliver strategic reports — all in one premium workflow.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mt-10 flex flex-wrap gap-4"
            >
              <Link href={MARKETING_DEMO_VIDEO.href} className="marketing-btn-outline saas-hover rounded-full px-8 py-4 text-base font-semibold">
                Watch Demo
              </Link>
            </motion.div>
          </div>

          <HeroLiveCards />
        </section>

        <section className="marketing-section mx-auto w-[min(1280px,92vw)] py-16 sm:py-20 md:py-24">
          <div className="grid gap-5 sm:gap-6 md:grid-cols-3">
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                className="saas-hover rounded-2xl border border-[#DEDDD5] bg-white p-6 shadow-[0_12px_24px_rgba(15,23,42,0.05)] sm:rounded-3xl sm:p-8"
              >
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF0E7] text-xl font-bold">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-black tracking-tight sm:text-2xl">{feature.title}</h3>
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

        <section className="bg-[#0D0D0D] py-16 text-white sm:py-20 md:py-24">
          <div className="mx-auto w-[min(1280px,92vw)]">
            <div className="mb-8 flex flex-col gap-4 lg:mb-10 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[#9CA3AF]">How it works</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">One workflow. Every stage of creative QA.</h2>
              </div>
              <p className="max-w-sm text-sm text-[#A3A3A3] lg:text-right">From campaign setup to stakeholder-ready output — validate, analyze, preview, and report without switching tools.</p>
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

        <section className="marketing-section mx-auto w-[min(1280px,92vw)] py-16 sm:py-20 md:py-24">
          <div className="mb-8 max-w-3xl sm:mb-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6B7280]">End-to-End Pipeline</p>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:mt-4 sm:text-4xl lg:text-5xl">
              The intelligent core of your creative workflow
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#5A5A55] sm:mt-5 sm:text-lg">
              Every creative moves through one connected engine — from campaign setup and validation to AI analysis,
              contextual preview, team collaboration, and deployment-ready reports.
            </p>
          </div>

          <PipelineCoreEngine />
        </section>

        <section className="marketing-section mx-auto grid w-[min(1280px,92vw)] gap-10 py-16 sm:gap-12 sm:py-20 md:grid-cols-2 md:items-center md:py-24 lg:gap-16">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6B7280]">Why Adigator</p>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:mt-4 sm:text-4xl lg:text-5xl">
              Fix the creative bottlenecks that slow every campaign
            </h2>
            <ul className="mt-6 space-y-3 text-base text-[#4B4B45] sm:mt-8 sm:space-y-4 sm:text-lg">
              {[
                "Catch dimension, file-size, and placement errors before ads go live on any platform",
                "Preview creatives in realistic publisher contexts — not flat mockups in a slide deck",
                "Export strategic analysis to PPTX so clients and leadership approve faster",
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

          <div className="saas-hover relative overflow-hidden rounded-2xl border border-[#DEDDD5] bg-[#0D0D0D] p-6 shadow-[0_25px_70px_rgba(15,23,42,0.12)] sm:rounded-[32px] sm:p-8">
            <motion.div
              className="pointer-events-none absolute inset-0"
              animate={
                reduceMotion
                  ? undefined
                  : {
                      background: [
                        "radial-gradient(circle at 30% 20%, rgba(168,85,247,0.2), transparent 55%)",
                        "radial-gradient(circle at 70% 60%, rgba(200,240,77,0.15), transparent 55%)",
                        "radial-gradient(circle at 40% 80%, rgba(168,85,247,0.18), transparent 55%)",
                      ],
                    }
              }
              transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
            />
            <div className="relative space-y-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-400/80">Upload once. Launch with certainty.</p>
              <p className="text-2xl font-black leading-tight text-white sm:text-3xl">
                Creatives flow through validation, intelligence, and approval — automatically.
              </p>
              <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
                {[
                  { step: "01", text: "Define campaign objectives & platform scope" },
                  { step: "02", text: "Validate assets against Google, Meta & DSP rules" },
                  { step: "03", text: "Run 10-layer AI analysis & preview in context" },
                  { step: "04", text: "Export PPTX & deploy with team sign-off" },
                ].map((item, i) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 text-sm text-white/70"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-violet-500/30 bg-violet-500/10 text-[10px] font-bold text-violet-300">
                      {item.step}
                    </span>
                    {item.text}
                  </motion.div>
                ))}
              </div>
              <Link
                href="/preview-tool?demo=1&step=1"
                className="inline-flex items-center gap-2 rounded-full bg-[#C8F04D] px-6 py-3 text-sm font-bold text-[#0D0D0D] transition hover:brightness-105"
              >
                Start the pipeline →
              </Link>
            </div>
          </div>
        </section>

        <section className="marketing-section mx-auto w-[min(1280px,92vw)] py-16 sm:py-20 md:py-24">
          <div className="mb-8 sm:mb-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6B7280]">Built for modern teams</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">Who wins with Adigator</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {INSIGHTS.map((post) => (
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

        <section className="py-16 text-white sm:py-20 md:py-24 bg-[#0D0D0D]">
          <div className="mx-auto flex w-[min(1100px,92vw)] flex-col items-center text-center">
            <h2 className="text-[clamp(2.2rem,6vw,4.5rem)] font-black leading-tight tracking-tight">
              Ready to transform your creative workflow?
            </h2>
            <p className="mt-5 max-w-xl text-base text-white/60">
              See how Adigator validates, analyzes, and previews your ads — then walk away with a report your team can act on today.
            </p>
            <Link href="/preview-tool" className="saas-hover mt-8 rounded-full bg-[#C8F04D] px-9 py-4 text-base font-bold text-[#0D0D0D]">
              Try Preview Studio
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#DDDCD4] bg-[#F5F5F0] py-20">
        <div className="mx-auto grid w-[min(1280px,92vw)] gap-12 md:grid-cols-5">
          <div className="md:col-span-2">
            <p className="text-2xl font-black tracking-tight">Adigator</p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#66665F]">
              Creative intelligence for advertisers, agencies, and organizations who refuse to launch blind.
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

      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }

        .hero-live-card {
          transition: transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease;
        }

        .hero-live-card:hover {
          transform: translateY(-5px);
          border-color: rgba(200, 240, 77, 0.25);
          box-shadow: 0 28px 70px rgba(0, 0, 0, 0.45), 0 0 50px rgba(200, 240, 77, 0.08);
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-live-card:hover {
            transform: none;
          }
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

        @keyframes pipeline-march {
          to { stroke-dashoffset: -4; }
        }

        .pipeline-line-active {
          animation: pipeline-march 1s linear infinite;
        }

        .pipeline-core-engine {
          transition: transform 0.28s ease, box-shadow 0.28s ease;
        }

        .pipeline-core-engine:hover {
          box-shadow: 0 36px 90px rgba(0, 0, 0, 0.5), 0 0 60px rgba(168, 85, 247, 0.12);
        }

        @media (prefers-reduced-motion: reduce) {
          .pipeline-line-active {
            animation: none;
          }
        }

        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}



