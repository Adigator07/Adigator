"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

export default function Home() {
  const [activePreview, setActivePreview] = useState(0);
  const [isPreviewPaused, setIsPreviewPaused] = useState(false);

  const workflow = [
    {
      title: "Upload & Validate",
      description: "Upload your creatives and quickly check format, size, and platform readiness.",
    },
    {
      title: "Analyze & Decide",
      description: "Review quality insights and decide which ads should move forward first.",
    },
    {
      title: "Preview & Present",
      description: "Preview placements across devices and share launch-ready creatives with your team.",
    },
  ];

  const outcomes = [
    "Reduce wasted ad spend",
    "Eliminate manual screenshot workflows",
    "Improve campaign launch confidence",
  ];

  const heroPreviewCards = [
    {
      id: "readiness",
      title: "Launch Readiness Score",
      subtitle: "82/100 - Ready for campaign launch",
      content: (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Launch Readiness Score</p>
            <span className="rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">+18%</span>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
          </div>
          <p className="mt-3 text-xs text-gray-400">Ready for Google Ads and programmatic launch checks.</p>
        </div>
      ),
    },
    {
      id: "mobile-preview",
      title: "Mobile Preview",
      subtitle: "Low visibility - CTA below fold",
      content: (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-lg">
          <div className="mx-auto w-[180px] rounded-[24px] border border-white/10 bg-[#0b1224] p-3">
            <div className="h-2.5 w-14 rounded-full bg-white/15" />
            <div className="mt-3 rounded-lg border border-white/10 bg-gradient-to-r from-purple-500/25 to-pink-500/25 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-300">Ad Creative</p>
              <div className="mt-2 h-16 rounded-md bg-white/10" />
              <button className="mt-3 w-full rounded-md bg-purple-500/80 px-2 py-1 text-[10px] font-semibold text-white">Shop Now</button>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "desktop-placement",
      title: "Desktop Placement",
      subtitle: "300x250 high-visibility zone",
      content: (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-lg">
          <div className="rounded-xl border border-white/10 bg-[#0b1224] p-3">
            <div className="flex gap-2">
              <div className="h-2 w-2 rounded-full bg-white/30" />
              <div className="h-2 w-2 rounded-full bg-white/20" />
              <div className="h-2 w-2 rounded-full bg-white/10" />
            </div>
            <div className="mt-3 grid grid-cols-[1fr_220px] gap-3">
              <div className="h-24 rounded-lg bg-white/10" />
              <div className="rounded-lg border border-purple-400/40 bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-300">300x250 Placement</p>
                <div className="mt-2 h-12 rounded bg-white/10" />
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "creative-comparison",
      title: "Creative Comparison",
      subtitle: "Variant B selected - best performer (+32% visibility)",
      content: (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-lg">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-white/10 bg-white/5 p-2">
              <div className="h-14 rounded bg-white/10" />
              <p className="mt-2 text-[10px] text-gray-400">Variant A</p>
            </div>
            <div className="rounded-lg border border-purple-400/40 bg-purple-500/10 p-2">
              <div className="h-14 rounded bg-purple-400/20" />
              <p className="mt-2 text-[10px] font-semibold text-purple-300">Best Performer</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-2">
              <div className="h-14 rounded bg-white/10" />
              <p className="mt-2 text-[10px] text-gray-400">Variant C</p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  useEffect(() => {
    if (isPreviewPaused) return;

    const interval = setInterval(() => {
      setActivePreview((prev) => (prev + 1) % heroPreviewCards.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [heroPreviewCards.length, isPreviewPaused]);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#020617] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-[-200px] h-[520px] w-[520px] rounded-full bg-purple-500/20 blur-[150px]" />
        <div className="absolute right-[-140px] top-[20%] h-[420px] w-[420px] rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute bottom-[-180px] left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-pink-500/15 blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(147,51,234,0.14),transparent_32%),radial-gradient(circle_at_82%_24%,rgba(59,130,246,0.12),transparent_35%)]" />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-7 md:px-10">
        <h1 className="text-lg font-semibold tracking-[0.22em] uppercase">Adigator</h1>
        <nav className="hidden items-center gap-8 text-sm md:flex">
          <span className="cursor-pointer text-gray-400 transition hover:text-white">Platform</span>
          <span className="cursor-pointer text-gray-400 transition hover:text-white">Customers</span>
          <span className="cursor-pointer text-gray-400 transition hover:text-white">Pricing</span>
        </nav>
        <Link href="/login" className="rounded-xl border border-white/20 bg-white/5 px-5 py-2 text-sm font-medium text-white backdrop-blur-lg transition-all duration-300 hover:border-white hover:bg-white/10">
          Login
        </Link>
      </header>

      <section className="relative z-10 mx-auto grid w-full max-w-6xl gap-10 px-6 pb-24 pt-12 md:grid-cols-[1.08fr_0.92fr] md:px-10 md:pt-16">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="w-fit rounded-full border border-white/15 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400 backdrop-blur-lg"
          >
            Ad Preview Platform
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="mt-6 max-w-2xl text-5xl font-semibold leading-[1.08] md:text-7xl"
          >
            Know your ad works.
            <span className="block bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">Before you spend.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.25, ease: "easeOut" }}
            className="mt-7 max-w-xl text-lg leading-relaxed text-gray-400"
          >
            Preview, validate, and finalize your display creatives across Google Ads and programmatic platforms before launching your campaign.
          </motion.p>

          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            {[
              "Google Ads + Programmatic",
              "IAB Standard Sizes",
              "Mobile & Desktop Preview",
            ].map((badge) => (
              <span key={badge} className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-400 backdrop-blur-lg">
                {badge}
              </span>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.42, ease: "easeOut" }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Link
              href="/preview"
              className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition-all duration-300 hover:scale-105"
            >
              Start Free Preview
            </Link>
            <button className="rounded-xl border border-white/20 px-7 py-3 text-sm font-semibold text-white transition-all duration-300 hover:border-white hover:bg-white/5 hover:scale-105">
              Watch 90s Walkthrough
            </button>
          </motion.div>

          <p className="mt-4 text-sm text-gray-400">Reduce wasted ad spend before launch</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.25, ease: "easeOut" }}
          onMouseEnter={() => setIsPreviewPaused(true)}
          onMouseLeave={() => setIsPreviewPaused(false)}
          className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/30 backdrop-blur-lg transition-all duration-300 hover:scale-[1.02] hover:border-purple-500"
        >
          <div className="mb-4 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Live Preview Simulation</p>
            <p className="text-xs text-gray-400">{activePreview + 1}/{heroPreviewCards.length}</p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={heroPreviewCards[activePreview].id}
              initial={{ opacity: 0, x: 40, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="space-y-3"
            >
              <div className="px-1">
                <h4 className="text-sm font-semibold text-white">{heroPreviewCards[activePreview].title}</h4>
                <p className="mt-1 text-xs leading-relaxed text-gray-400">{heroPreviewCards[activePreview].subtitle}</p>
              </div>
              {heroPreviewCards[activePreview].content}
            </motion.div>
          </AnimatePresence>

          <div className="mt-4 flex items-center justify-center gap-2">
            {heroPreviewCards.map((card, index) => (
              <button
                key={card.id}
                type="button"
                onClick={() => setActivePreview(index)}
                className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                  index === activePreview
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_0_14px_rgba(168,85,247,0.65)]"
                    : "bg-white/25 hover:bg-white/40"
                }`}
                aria-label={`Show ${card.title}`}
              />
            ))}
          </div>
        </motion.div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-24 md:px-10">
        <div className="grid gap-8 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg md:grid-cols-[0.95fr_1.05fr] md:p-8">
          <div>
            <h3 className="text-3xl font-semibold leading-tight text-white md:text-4xl">See your ads before they go live</h3>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-gray-400 md:text-base">
              Drop your creative, select environment, and instantly preview your ads in real placements.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0b1224]/80 p-4 backdrop-blur-lg">
            <div className="h-[220px] rounded-xl border border-dashed border-white/20 bg-gradient-to-br from-purple-500/10 to-blue-500/10 p-4">
              <div className="flex h-full flex-col items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 text-sm text-gray-400">
                <p className="text-center text-sm font-medium text-white">Upload {"->"} Analyze {"->"} Preview {"->"} Export</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2 text-[11px]">
                  <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1">Creative Upload</span>
                  <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1">AI Checks</span>
                  <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1">Placement Preview</span>
                  <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1">Export Report</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-24 md:px-10">
        <div className="grid gap-8 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg md:grid-cols-[0.9fr_1.1fr] md:p-8">
          <div>
            <h3 className="text-3xl font-semibold leading-tight text-white md:text-4xl">See exactly why a creative will fail</h3>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-gray-400 md:text-base">
              Get actionable insights before spending budget.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0b1224]/80 p-4 backdrop-blur-lg">
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
              <video
                className="h-[220px] w-full object-cover md:h-[260px]"
                src="/video.mp4"
                autoPlay
                loop
                muted
                playsInline
              />
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-24 md:px-10">
        <div className="grid gap-5 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg md:grid-cols-3 md:p-8">
          {[
            { title: "Supports all IAB banner sizes", detail: "Launch with standard dimensions already validated." },
            { title: "Works across mobile & desktop", detail: "Check creative behavior across major device layouts." },
            { title: "Real website preview environments", detail: "See placements in context before campaign activation." },
          ].map((feature) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="rounded-2xl border border-white/10 bg-[#0b1224]/80 px-5 py-6 backdrop-blur-lg transition-all duration-300 hover:scale-[1.02] hover:border-purple-500"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white">{feature.title}</p>
              <p className="mt-3 text-sm leading-relaxed text-gray-400">{feature.detail}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-24 md:px-10">
        <div className="flex items-end justify-between gap-6">
          <h3 className="max-w-xl text-3xl font-semibold leading-tight text-white md:text-4xl">
            A three-stage system your team can repeat every campaign.
          </h3>
          <p className="hidden max-w-sm text-sm leading-relaxed text-gray-400 md:block">
            Structured, not rigid. Each stage is optimized for speed while preserving strategic quality.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {workflow.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.55, delay: i * 0.12, ease: "easeOut" }}
              className="rounded-2xl border border-white/10 bg-white/5 p-7 shadow-2xl shadow-black/20 backdrop-blur-lg transition-all duration-300 hover:scale-[1.02] hover:border-purple-500"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">Step {i + 1}</p>
              <h4 className="mt-4 text-2xl font-semibold text-white">{step.title}</h4>
              <p className="mt-4 text-sm leading-relaxed text-gray-400">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-28 md:px-10">
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg md:p-8">
          <h3 className="text-3xl font-semibold leading-tight text-white md:text-4xl">Know which creatives to launch</h3>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              "Top creatives automatically identified",
              "Weak creatives flagged",
              "Device compatibility insights",
            ].map((point, i) => (
              <motion.div
                key={point}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.45, delay: i * 0.1, ease: "easeOut" }}
                className="rounded-2xl border border-white/10 bg-[#0b1224]/80 px-5 py-4 text-sm text-gray-400 transition-all duration-300 hover:scale-[1.02] hover:border-purple-500"
              >
                {point}
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg md:grid-cols-[1.2fr_0.8fr] md:p-9">
          <div>
            <h3 className="text-3xl font-semibold leading-tight text-white md:text-4xl">Built for advertisers and agencies running display campaigns</h3>
            <div className="mt-8 grid gap-4">
              {outcomes.map((item, i) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.45, delay: i * 0.12, ease: "easeOut" }}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-gray-400 backdrop-blur-lg transition-all duration-300 hover:scale-[1.02] hover:border-purple-500"
                >
                  {item}
                </motion.div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] p-6 text-white shadow-2xl shadow-purple-900/20 backdrop-blur-lg transition-all duration-300 hover:scale-[1.02] hover:border-purple-500">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Case Highlight</p>
            <p className="mt-5 text-lg leading-relaxed">
              "We moved from subjective design debates to objective launch decisions. Adigator became our pre-flight checklist for every major campaign."
            </p>
            <p className="mt-8 text-sm font-semibold">Creative Director, Growth Agency</p>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-y border-white/10 bg-[#020617] px-6 py-20 text-center text-white md:px-10">
        <motion.h3
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="mx-auto max-w-3xl text-3xl font-semibold leading-tight md:text-5xl"
        >
          Your next campaign deserves a smarter start
        </motion.h3>
        <p className="mx-auto mt-5 max-w-2xl text-base text-gray-400">
          Stop guessing. Validate, preview, and launch creatives with confidence.
        </p>
        <Link
          href="/preview"
          className="mt-10 inline-flex rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition-all duration-300 hover:scale-105"
        >
          Start Free Preview
        </Link>
      </section>

      <footer className="relative z-10 px-6 py-6 text-center text-xs uppercase tracking-[0.14em] text-gray-500 md:px-10">
        © 2026 Adigator. Creative intelligence for modern media teams.
      </footer>
    </main>
  );
}