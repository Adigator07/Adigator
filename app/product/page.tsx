"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import PremiumPageShell from "@/app/components/sections/PremiumPageShell";
import CinematicCta from "@/app/components/ui/CinematicCta";
import GlassCard from "@/app/components/ui/GlassCard";
import PageSection from "@/app/components/ui/PageSection";
import SectionIntro from "@/app/components/ui/SectionIntro";
import { motionTokens, transitions } from "@/app/lib/motionTokens";

export default function ProductPage() {
  const overview = [
    "AI creative validation",
    "Real-time analysis",
    "Creative scoring",
    "Compliance checks",
    "Ad platform optimization",
    "Performance prediction",
    "Workflow automation",
  ];

  const featureCards = [
    {
      icon: "⚡",
      title: "Creative Validation Engine",
      subtitle: "Spec-ready in seconds",
      progress: "96%",
      points: ["Dimension and format checks", "Compression optimization", "Platform-safe outputs"],
    },
    {
      icon: "🎯",
      title: "Real-Time Analysis",
      subtitle: "Visual intelligence at upload",
      progress: "91%",
      points: ["Readability and hierarchy", "CTA prominence scoring", "Brand-safety detection"],
    },
    {
      icon: "📊",
      title: "Performance Forecasting",
      subtitle: "Pre-launch confidence model",
      progress: "88%",
      points: ["Predicted engagement index", "Variant benchmarking", "Channel fit recommendations"],
    },
    {
      icon: "⚖️",
      title: "Compliance Intelligence",
      subtitle: "Zero-surprise launches",
      progress: "98%",
      points: ["Policy and format checks", "Auto-fix recommendations", "Audit-ready launch reports"],
    },
  ];

  const workflow = [
    { step: "01", title: "Upload Creative", desc: "Add raw assets in standard ad formats." },
    { step: "02", title: "AI Analysis", desc: "Score composition, readability, and CTA strength." },
    { step: "03", title: "Platform Validation", desc: "Check specs and policy across destination channels." },
    { step: "04", title: "Optimization Suggestions", desc: "Receive concrete design and messaging actions." },
    { step: "05", title: "Launch Ready", desc: "Ship with compliance confidence and team alignment." },
  ];

  const enterpriseBenefits = [
    {
      stat: "6-20h",
      label: "Approval time reduced",
      detail: "Compress campaign review cycles from days to minutes with automation-first validation.",
    },
    {
      stat: "40-60%",
      label: "Fewer revision loops",
      detail: "Shared scores and visual feedback create alignment before stakeholders enter final review.",
    },
    {
      stat: "94%",
      label: "Pre-launch confidence",
      detail: "Standardized quality checks reduce launch risk and wasted media spend.",
    },
  ];

  return (
    <PremiumPageShell>
      <PageSection id="hero" className="pt-20 md:pt-28">
        <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transitions.hero}
          >
            <p className="badge">
              <span className="badge-dot" />
              Product Platform
            </p>
            <h1 className="font-display mt-7 text-4xl leading-[1.06] sm:text-5xl md:text-[5.4rem]">
              Creative intelligence
              <span className="block gradient-text">for every launch decision.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-400">
              Adigator combines validation, scoring, prediction, and workflow orchestration so teams move from asset upload to launch-ready confidence in minutes.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
              <Link href="/preview" className="btn-primary">
                Start Free Preview
                <span className="ml-1">→</span>
              </Link>
              <Link href="/about" className="btn-secondary">
                Our Philosophy
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...transitions.hero, delay: motionTokens.delay.medium }}
            className="relative mx-auto w-full max-w-140"
          >
            <GlassCard className="relative overflow-hidden border border-purple-400/30 bg-[#0b1230]/90 p-5 shadow-[0_0_60px_rgba(168,85,247,0.2)]">
              <div className="scanline" />
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-purple-300">Live Platform Readout</p>
                <p className="text-xs text-emerald-300">Realtime</p>
              </div>
              {[
                ["Validation", "96%", "from-purple-500 to-pink-500"],
                ["Compliance", "98%", "from-cyan-500 to-blue-500"],
                ["Performance Forecast", "88%", "from-emerald-400 to-teal-500"],
              ].map((row) => (
                <div key={row[0]} className="mb-3">
                  <div className="mb-1.5 flex justify-between text-xs text-gray-300">
                    <span>{row[0]}</span>
                    <span className="font-semibold text-white">{row[1]}</span>
                  </div>
                  <div className="bar-track">
                    <div className={`bar-fill bg-linear-to-r ${row[2]}`} style={{ "--w": row[1] } as React.CSSProperties} />
                  </div>
                </div>
              ))}
              <div className="mt-4 rounded-xl border border-purple-400/25 bg-purple-400/10 px-4 py-3">
                <p className="text-xs uppercase tracking-wider text-purple-200">Launch Readiness</p>
                <p className="font-display text-3xl text-purple-100">91%</p>
              </div>
            </GlassCard>

            <div className="absolute -right-6 -top-8 hidden rounded-xl border border-white/10 bg-[#0a1233]/90 px-4 py-3 text-xs text-gray-300 shadow-xl md:block">
              <p className="mb-2 font-semibold uppercase tracking-wider text-gray-400">Platform Checks</p>
              <p>Google Ads ✓</p>
              <p>Programmatic ✓</p>
              <p>Brand Safety ✓</p>
            </div>
          </motion.div>
        </div>
      </PageSection>

      <PageSection>
        <SectionIntro
          eyebrow="Product Overview"
          title="One system. From raw creative to launch-ready confidence."
          subtitle="A unified AI workflow for validation, insight, optimization, and enterprise deployment speed."
        />
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {overview.map((item) => (
            <div key={item} className="rounded-xl border border-white/10 bg-white/3 px-4 py-3 text-sm text-gray-200 backdrop-blur-md">
              {item}
            </div>
          ))}
        </div>
      </PageSection>

      <PageSection>
        <SectionIntro
          center
          eyebrow="Interactive Capabilities"
          title="Feature cards designed for decision speed"
          subtitle="Every module provides transparent quality signals with restrained, premium motion."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {featureCards.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ ...transitions.card, delay: idx * 0.07 }}
            >
              <GlassCard className="h-full border-white/12 bg-white/3 transition hover:border-purple-400/45 hover:shadow-[0_0_32px_rgba(168,85,247,0.16)]">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-3xl">{feature.icon}</p>
                    <h3 className="mt-2 text-xl font-semibold text-white">{feature.title}</h3>
                    <p className="mt-1 text-sm text-purple-300/80">{feature.subtitle}</p>
                  </div>
                  <span className="rounded-full border border-emerald-400/35 bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                    {feature.progress}
                  </span>
                </div>
                <div className="bar-track mb-4">
                  <div className="bar-fill bg-linear-to-r from-purple-500 to-cyan-400" style={{ "--w": feature.progress } as React.CSSProperties} />
                </div>
                <div className="space-y-2 text-sm text-gray-300">
                  {feature.points.map((point) => (
                    <p key={point} className="flex gap-2">
                      <span className="text-purple-300">•</span>
                      <span>{point}</span>
                    </p>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </PageSection>

      <PageSection>
        <SectionIntro
          center
          eyebrow="Workflow"
          title="Upload Creative → AI Analysis → Validation → Suggestions → Launch"
          subtitle="Built for fast-moving teams that need precision, compliance, and predictable output quality."
        />
        <div className="mt-12 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          {workflow.map((step, idx) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ ...transitions.card, delay: idx * 0.07 }}
              className="relative"
            >
              <div className="rounded-xl border border-white/10 bg-white/3 p-5 backdrop-blur-md">
                <p className="text-xs font-bold tracking-[0.2em] text-purple-300">{step.step}</p>
                <h4 className="mt-2 text-base font-semibold text-white">{step.title}</h4>
                <p className="mt-2 text-sm text-gray-400">{step.desc}</p>
              </div>
              {idx < workflow.length - 1 && <span className="pointer-events-none absolute -right-2 top-1/2 hidden -translate-y-1/2 text-xl text-purple-400/65 lg:block">→</span>}
            </motion.div>
          ))}
        </div>
      </PageSection>

      <PageSection>
        <SectionIntro
          eyebrow="Analytics Showcase"
          title="Dashboard-grade insight layers"
          subtitle="Scoring, compliance, and recommendations presented with enterprise-grade signal clarity."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <GlassCard className="border-white/10 bg-white/3">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-widest text-gray-400">Campaign Intelligence Panel</p>
              <p className="text-xs text-cyan-300">Updated now</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["Visual Clarity", "94", "from-purple-500 to-pink-500"],
                ["CTA Strength", "89", "from-cyan-500 to-blue-500"],
                ["Brand Recall", "78", "from-amber-400 to-orange-500"],
                ["Load Efficiency", "97", "from-emerald-400 to-teal-500"],
              ].map((metric) => (
                <div key={metric[0]} className="rounded-xl border border-white/8 bg-white/2 p-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-gray-300">{metric[0]}</span>
                    <span className="font-semibold text-white">{metric[1]}%</span>
                  </div>
                  <div className="bar-track">
                    <div className={`bar-fill bg-linear-to-r ${metric[2]}`} style={{ "--w": `${metric[1]}%` } as React.CSSProperties} />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="border-white/10 bg-white/3">
            <p className="text-sm font-semibold uppercase tracking-widest text-gray-400">AI Recommendations</p>
            <div className="mt-4 space-y-3">
              {[
                "Increase CTA contrast by 14% for mobile viewability.",
                "Shorten headline copy by 9 characters for above-fold fit.",
                "Move logo lockup 12px up for better brand recall.",
                "Export variant B for performance-first launch path.",
              ].map((tip) => (
                <div key={tip} className="rounded-lg border border-cyan-400/20 bg-cyan-500/5 p-3 text-sm text-gray-300">
                  {tip}
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </PageSection>

      <PageSection>
        <SectionIntro
          center
          eyebrow="Enterprise Benefits"
          title="Scale creative ops without scaling complexity"
          subtitle="Purpose-built for teams balancing campaign velocity, compliance, and creative quality."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {enterpriseBenefits.map((benefit, idx) => (
            <motion.div
              key={benefit.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ ...transitions.card, delay: idx * 0.08 }}
            >
              <GlassCard className="h-full border-white/10 bg-white/3">
                <p className="font-display text-5xl text-purple-200">{benefit.stat}</p>
                <p className="mt-2 text-sm uppercase tracking-wider text-purple-300">{benefit.label}</p>
                <p className="mt-4 text-sm leading-relaxed text-gray-400">{benefit.detail}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </PageSection>

      <PageSection>
        <CinematicCta />
      </PageSection>
    </PremiumPageShell>
  );
}
