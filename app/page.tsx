"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import Header from "@/app/components/Header";

export default function Home() {
  const [activePreview, setActivePreview] = useState(0);
  const [isPreviewPaused, setIsPreviewPaused] = useState(false);

  const heroPreviewCards = [
    {
      id: "validation",
      title: "Instant Validation",
      subtitle: "All platform standards checked in seconds",
      content: (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Platform Compliance</p>
            <span className="rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">Ready</span>
          </div>
          <div className="mt-4 space-y-2 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Size: 300x250 ✓</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Format: JPEG ✓</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Compression: Optimized ✓</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>CTA Visible: Yes ✓</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "preview",
      title: "Real Environment Preview",
      subtitle: "See exactly how your ad performs before launch",
      content: (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-lg">
          <div className="mx-auto w-[180px] rounded-[24px] border border-white/10 bg-[#0b1224] p-3">
            <div className="h-2.5 w-14 rounded-full bg-white/15" />
            <div className="mt-3 rounded-lg border border-white/10 bg-gradient-to-r from-purple-500/25 to-pink-500/25 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-300">Your Creative</p>
              <div className="mt-2 h-16 rounded-md bg-white/10" />
              <button className="mt-3 w-full rounded-md bg-purple-500/80 px-2 py-1 text-[10px] font-semibold text-white">Call to Action</button>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "insights",
      title: "Actionable Insights",
      subtitle: "What will work. What won't. Why.",
      content: (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-lg">
          <div className="space-y-3">
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-300">CTA Visibility</span>
                <span className="text-xs font-bold text-emerald-400">92%</span>
              </div>
              <div className="mt-2 h-1 w-full rounded-full bg-white/10">
                <div className="h-full w-[92%] rounded-full bg-emerald-500" />
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-300">Text Readability</span>
                <span className="text-xs font-bold text-yellow-400">78%</span>
              </div>
              <div className="mt-2 h-1 w-full rounded-full bg-white/10">
                <div className="h-full w-[78%] rounded-full bg-yellow-500" />
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "comparison",
      title: "Creative Comparison",
      subtitle: "Identify top performers instantly",
      content: (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-lg">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-white/10 bg-white/5 p-2">
              <div className="h-14 rounded bg-white/10" />
              <p className="mt-2 text-[10px] text-gray-400">Version A</p>
              <p className="text-[9px] text-gray-500">71% score</p>
            </div>
            <div className="rounded-lg border border-purple-400/40 bg-purple-500/10 p-2">
              <div className="h-14 rounded bg-purple-400/20" />
              <p className="mt-2 text-[10px] font-semibold text-purple-300">Best</p>
              <p className="text-[9px] font-semibold text-purple-400">94% score</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-2">
              <div className="h-14 rounded bg-white/10" />
              <p className="mt-2 text-[10px] text-gray-400">Version C</p>
              <p className="text-[9px] text-gray-500">65% score</p>
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
    <main className="relative min-h-screen bg-[#020617] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-[-200px] h-[520px] w-[520px] rounded-full bg-purple-500/20 blur-[70px] md:blur-[150px]" />
        <div className="absolute right-[-140px] top-[20%] h-[420px] w-[420px] rounded-full bg-blue-500/20 blur-[70px] md:blur-[120px]" />
        <div className="absolute bottom-[-180px] left-1/2 hidden h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-pink-500/15 blur-[80px] md:block md:blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(147,51,234,0.14),transparent_32%),radial-gradient(circle_at_82%_24%,rgba(59,130,246,0.12),transparent_35%)]" />
      </div>

      {/* Header */}
      <Header />

      {/* HERO SECTION */}
      <section id="hero" className="landing-section relative z-10">
        <div className="landing-container grid w-full gap-10 md:grid-cols-[1.08fr_0.92fr]">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="w-fit rounded-full border border-white/15 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400 backdrop-blur-lg"
            >
              Ad Intelligence Platform
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              className="mt-6 max-w-2xl text-4xl font-semibold leading-[1.08] sm:text-5xl md:text-7xl"
            >
              Launch creatives
              <span className="block bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">with confidence.</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.25, ease: "easeOut" }}
              className="mt-7 max-w-xl text-lg leading-relaxed text-gray-400"
            >
              Eliminate approval delays and review bottlenecks. Validate, analyze, and preview creatives in minutes—not days. Move from extended workflows to confident, fast decisions.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.35, ease: "easeOut" }}
              className="mt-4 max-w-xl text-base text-purple-300/80"
            >
              Save 6–20 hours per campaign. Reduce back-and-forth across teams.
            </motion.p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/preview"
                className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-7 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition-all duration-300 hover:scale-105 sm:w-auto"
              >
                Start Free Preview
              </Link>
              <button className="w-full rounded-xl border border-white/20 px-7 py-3 text-sm font-semibold text-white transition-all duration-300 hover:border-white hover:bg-white/5 hover:scale-105 sm:w-auto">
                See How It Works
              </button>
            </div>
          </div>

          {/* Hero Preview Card */}
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}
            onMouseEnter={() => setIsPreviewPaused(true)}
            onMouseLeave={() => setIsPreviewPaused(false)}
            className="hero-card rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-black/30 backdrop-blur-lg transition-all duration-300 hover:scale-[1.02] hover:border-purple-500"
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Live Platform Demo</p>
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
        </div>
      </section>

      {/* PROBLEM SECTION */}
      <section className="landing-section relative z-10">
        <div className="landing-container w-full">
          <div className="grid gap-8 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg md:grid-cols-[0.95fr_1.05fr] md:p-8">
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className="text-3xl font-semibold leading-tight text-white md:text-4xl"
              >
                Creative workflows are slower than they should be
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.55, delay: 0.1, ease: "easeOut" }}
                className="mt-5 max-w-lg text-sm leading-relaxed text-gray-400 md:text-base"
              >
                Today's approval workflows introduce unnecessary friction:
              </motion.p>
              <motion.ul
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.55, delay: 0.15, ease: "easeOut" }}
                className="mt-6 space-y-3"
              >
                {[
                  "Manual validation takes hours",
                  "Multiple review cycles delay approvals",
                  "Cross-team coordination introduces gaps",
                  "Campaign launches depend on stakeholder availability",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-gray-400">
                    <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </motion.ul>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.55, delay: 0.2, ease: "easeOut" }}
              className="rounded-2xl border border-white/10 bg-gradient-to-br from-red-500/10 to-pink-500/10 p-6 backdrop-blur-lg"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-300">Reality Check</p>
              <p className="mt-4 text-lg font-semibold text-white">Most campaigns lose hours — sometimes days — before they go live.</p>
              <div className="mt-6 space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
                <div>
                  <p className="text-xs text-gray-400">Without optimization</p>
                  <p className="mt-2 text-2xl font-bold text-red-300">6–20 hours per campaign</p>
                  <p className="mt-1 text-xs text-gray-500">+ approval delays</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* VALUE SECTION */}
      <section className="landing-section relative z-10">
        <div className="landing-container w-full">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="mx-auto max-w-3xl text-center text-3xl font-semibold leading-tight text-white md:text-4xl"
          >
            From hours of work to minutes of clarity
          </motion.h2>

          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {/* Manual Process */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg md:p-8"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Manual Process Today</p>
              <div className="mt-6 space-y-4">
                {[
                  { task: "QA & validation", time: "1–3 hours" },
                  { task: "Internal reviews", time: "1–3 hours" },
                  { task: "Reporting & previews", time: "2–4 hours" },
                  { task: "Approval cycles", time: "Unpredictable delays" },
                ].map((item) => (
                  <div key={item.task} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3">
                    <span className="text-sm text-gray-400">{item.task}</span>
                    <span className="text-sm font-semibold text-red-300">{item.time}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                <p className="text-xs text-red-300/80">Total time</p>
                <p className="mt-2 text-3xl font-bold text-red-300">6–20+ hours</p>
              </div>
            </motion.div>

            {/* With Adigator */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.55, delay: 0.1, ease: "easeOut" }}
              className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/20 to-pink-500/20 p-6 backdrop-blur-lg md:p-8"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-300">With Adigator</p>
              <div className="mt-6 space-y-3">
                {[
                  "Upload your creatives",
                  "Analyze automatically in seconds",
                  "Preview in real environments",
                  "Share results with team",
                  "Launch with confidence",
                ].map((item, i) => (
                  <div key={item} className="flex items-center gap-3 rounded-lg border border-purple-400/30 bg-purple-500/10 p-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/30 text-xs font-semibold text-purple-300">
                      {i + 1}
                    </span>
                    <span className="text-sm text-purple-100">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                <p className="text-xs text-emerald-300/80">Total time</p>
                <p className="mt-2 text-3xl font-bold text-emerald-300">Minutes</p>
              </div>
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, delay: 0.2, ease: "easeOut" }}
            className="mx-auto mt-10 max-w-2xl text-center text-base text-gray-400"
          >
            Move from extended workflows to fast, confident decisions that launch campaigns on schedule.
          </motion.p>
        </div>
      </section>

      {/* WORKFLOW SECTION */}
      <section className="landing-section relative z-10">
        <div className="landing-container w-full">
          <div className="flex items-end justify-between gap-6">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="max-w-xl text-3xl font-semibold leading-tight text-white md:text-4xl"
            >
              A three-stage system your team can repeat every campaign
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.55, delay: 0.1, ease: "easeOut" }}
              className="hidden max-w-sm text-sm leading-relaxed text-gray-400 md:block"
            >
              Structured, repeatable. Each stage removes friction and accelerates approval velocity.
            </motion.p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                step: 1,
                title: "Validate Instantly",
                description: "Upload creatives. Instantly validate against all platform standards, sizes, and specifications.",
              },
              {
                step: 2,
                title: "Identify Winners",
                description: "Get actionable insights in seconds. See which creatives perform best before launch.",
              },
              {
                step: 3,
                title: "Present with Confidence",
                description: "Real preview environments and detailed reports. Share results with stakeholders instantly.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.55, delay: i * 0.12, ease: "easeOut" }}
                className="rounded-2xl border border-white/10 bg-white/5 p-7 shadow-2xl shadow-black/20 backdrop-blur-lg transition-all duration-300 hover:scale-[1.02] hover:border-purple-500"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">Step {item.step}</p>
                <h3 className="mt-4 text-2xl font-semibold text-white">{item.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-gray-400">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="landing-section relative z-10">
        <div className="landing-container w-full">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="text-3xl font-semibold leading-tight text-white md:text-4xl"
          >
            Built for teams that move fast
          </motion.h2>

          <div className="mt-10 grid gap-5 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg sm:grid-cols-2 lg:grid-cols-3 md:p-8">
            {[
              {
                title: "IAB ready in minutes",
                detail: "All standard banner sizes validated automatically.",
              },
              {
                title: "Mobile + desktop in one view",
                detail: "See real placements across devices before launch.",
              },
              {
                title: "Streamlined approvals",
                detail: "Share findings instantly. Eliminate approval delays.",
              },
              {
                title: "Reduce back-and-forth",
                detail: "Actionable insights mean fewer revision rounds.",
              },
              {
                title: "Instant creative comparison",
                detail: "Identify top performers before spending budget.",
              },
              {
                title: "Real-time collaboration",
                detail: "Share reports across teams instantly.",
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.55, delay: i * 0.08, ease: "easeOut" }}
                className="rounded-2xl border border-white/10 bg-[#0b1224]/80 px-5 py-6 backdrop-blur-lg transition-all duration-300 hover:scale-[1.02] hover:border-purple-500"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-white">{feature.title}</p>
                <p className="mt-3 text-sm leading-relaxed text-gray-400">{feature.detail}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS SECTION */}
      <section className="landing-section relative z-10">
        <div className="landing-container w-full">
          <div className="grid gap-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg md:grid-cols-[1.2fr_0.8fr] md:p-9">
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className="text-3xl font-semibold leading-tight text-white md:text-4xl"
              >
                For agencies and in-house teams running display campaigns
              </motion.h2>
              <div className="mt-8 grid gap-4">
                {[
                  "Launch campaigns on schedule — every time",
                  "Reduce approval delays and approval cycles",
                  "Make confident decisions with actionable data",
                ].map((item, i) => (
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

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.55, delay: 0.15, ease: "easeOut" }}
              className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f172a] to-[#1e1b4b] p-6 text-white shadow-2xl shadow-purple-900/20 backdrop-blur-lg transition-all duration-300 hover:scale-[1.02] hover:border-purple-500"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Feedback</p>
              <p className="mt-5 text-lg leading-relaxed">
                "We eliminated our entire manual QA process. Adigator became the pre-flight check for every campaign."
              </p>
              <p className="mt-8 text-sm font-semibold">Creative Director, Growth Agency</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="landing-section relative z-10 border-y border-white/10 bg-[#020617] text-center text-white">
        <div className="landing-container w-full">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="mx-auto max-w-3xl text-3xl font-semibold leading-tight md:text-5xl"
          >
            Stop spending hours reviewing creatives.
            <span className="block text-gray-400">Start launching with confidence.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.55, delay: 0.1, ease: "easeOut" }}
            className="mx-auto mt-6 max-w-2xl text-base text-gray-400"
          >
            Validate, preview, and finalize creatives in minutes — not days.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.55, delay: 0.2, ease: "easeOut" }}
          >
            <Link
              href="/preview"
              className="mt-10 inline-flex rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition-all duration-300 hover:scale-105"
            >
              Start Free Preview
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-6 text-center text-xs uppercase tracking-[0.14em] text-gray-500 md:px-10">
        © 2026 Adigator. Ad intelligence for modern teams.
      </footer>
    </main>
  );
}
