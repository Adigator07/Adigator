"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import PremiumPageShell from "@/app/components/sections/PremiumPageShell";
import CinematicCta from "@/app/components/ui/CinematicCta";
import GlassCard from "@/app/components/ui/GlassCard";
import PageSection from "@/app/components/ui/PageSection";
import SectionIntro from "@/app/components/ui/SectionIntro";
import { transitions } from "@/app/lib/motionTokens";

export default function AboutPage() {
  const timeline = [
    {
      year: "2024",
      title: "Problem Discovery",
      text: "Mapped creative operations friction across agency and in-house teams.",
    },
    {
      year: "2025",
      title: "Intelligence Layer",
      text: "Built automated validation, scoring, and recommendation systems.",
    },
    {
      year: "2026",
      title: "Platform Unification",
      text: "Connected workflow automation, compliance, and launch readiness in one product.",
    },
  ];

  const values = [
    { title: "Clarity", detail: "Signal over noise in every recommendation and workflow step." },
    { title: "Speed", detail: "High-velocity execution without sacrificing creative quality." },
    { title: "Trust", detail: "Transparent scoring and verifiable compliance output." },
    { title: "Scalability", detail: "Systems that support teams from startup to enterprise volume." },
    { title: "Innovation", detail: "Applied AI focused on practical outcomes, not novelty." },
  ];

  return (
    <PremiumPageShell>
      <PageSection className="pt-20 md:pt-28">
        <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
<<<<<<< HEAD
            transition={transitions.hero}
          >
            <p className="badge">
              <span className="badge-dot" />
              About Adigator
=======
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mx-auto max-w-4xl bg-linear-to-r from-white to-purple-300 bg-clip-text text-center text-4xl font-semibold leading-tight text-transparent md:text-6xl"
          >
            Built to solve a real problem
          </motion.h1>
          <p className="mx-auto mt-6 max-w-3xl text-center text-base leading-relaxed text-gray-400 md:text-lg">
            Adigator exists because modern ad teams deserve faster, more confident approval workflows.
          </p>
        </div>
      </section>

      {/* THE ORIGIN STORY */}
      <section className="landing-section relative z-10">
        <div className="landing-container rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <h2 className="bg-linear-to-r from-white to-blue-300 bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">
              How this started
            </h2>
            <p className="mt-6 max-w-3xl text-gray-400 leading-relaxed">
              We observed something consistent across advertising teams: smart, experienced professionals spending disproportionate time on manual, repetitive tasks.
>>>>>>> 355d8b5 (Updated analyzer and UI changes)
            </p>
            <h1 className="font-display mt-7 text-4xl leading-[1.06] sm:text-5xl md:text-[5.2rem]">
              Built for the future of
              <span className="block gradient-text">creative intelligence.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-gray-400">
              We build systems that remove operational friction from ad production, so teams can focus on performance, quality, and strategic creative decisions.
            </p>
          </motion.div>

<<<<<<< HEAD
          <GlassCard className="border border-white/12 bg-white/3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Why we exist</p>
            <p className="mt-4 text-base leading-relaxed text-gray-300">
              Modern marketing teams are constrained by manual review loops, fragmented tools, and delayed approvals. Adigator unifies validation, preview, scoring, and launch guidance into a single intelligence layer.
=======
      {/* THE INSIGHT */}
      <section className="landing-section relative z-10">
        <div className="landing-container rounded-2xl border border-white/10 bg-linear-to-br from-purple-500/10 to-pink-500/10 p-8 backdrop-blur-lg">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <h2 className="text-3xl font-semibold md:text-4xl">The insight</h2>
            <p className="mt-6 max-w-3xl text-gray-400 leading-relaxed">
              Modern validation, real environment previewing, and instant team collaboration are technically straightforward. They've just never been packaged together specifically for advertising workflows.
>>>>>>> 355d8b5 (Updated analyzer and UI changes)
            </p>
            <div className="mt-6 grid grid-cols-3 gap-2 text-center">
              {[
                ["18h", "Saved"],
                ["94%", "Confidence"],
                ["5x", "Faster QA"],
              ].map((item) => (
                <div key={item[1]} className="rounded-lg border border-white/10 bg-white/2 px-2 py-2">
                  <p className="font-display text-2xl sm:text-3xl text-purple-200">{item[0]}</p>
                  <p className="text-[10px] sm:text-xs uppercase tracking-wider text-gray-400">{item[1]}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </PageSection>

<<<<<<< HEAD
      <PageSection>
        <SectionIntro
          eyebrow="Mission"
          title="Modernizing creative operations for enterprise velocity"
          subtitle="Our mission is to remove decision friction, reduce production waste, and help teams ship campaigns with trusted AI-assisted clarity."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <GlassCard className="border-white/10 bg-white/3">
            <h3 className="text-xl font-semibold text-white">What we optimize</h3>
            <p className="mt-3 text-sm leading-relaxed text-gray-400">
              Creative validation speed, review consistency, stakeholder alignment, and launch readiness for every campaign cycle.
=======
      {/* VALUES SECTION */}
      <section className="landing-section relative z-10">
        <div className="landing-container">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="text-3xl font-semibold text-center md:text-4xl mb-12"
          >
            How we think about the problem
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Speed Matters",
                icon: "⚡",
                description: "Campaign velocity directly impacts performance. Approval delays compound. Every hour saved is an hour gained for strategy or optimization.",
              },
              {
                title: "Clarity > Confusion",
                icon: "🎯",
                description: "Stakeholders want clear, objective data—not subjective debates. Real previews and actionable scores eliminate guesswork.",
              },
              {
                title: "Teams Aren't the Problem",
                icon: "👥",
                description: "Smart teams with good processes still lose time to inefficient workflows. Better tools scale their effectiveness.",
              },
              {
                title: "Confidence is ROI",
                icon: "💎",
                description: "Confident teams make better decisions. They launch faster. They take smart risks. That compounds into better campaign performance.",
              },
              {
                title: "Simplicity is Powerful",
                icon: "✨",
                description: "Complex software solves complex problems. We solve simple ones: upload, validate, preview, launch. No bloat.",
              },
              {
                title: "Data Builds Trust",
                icon: "📊",
                description: "Scores, predictions, and previews create alignment across teams. Subjectivity dissolves. Decisions become defendable.",
              },
            ].map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.55, delay: i * 0.08, ease: "easeOut" }}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg hover:border-purple-500 transition-all duration-300"
              >
                <div className="text-3xl mb-3">{value.icon}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{value.title}</h3>
                <p className="text-sm text-gray-400">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* MISSION SECTION */}
      <section className="landing-section relative z-10">
        <div className="landing-container rounded-2xl border border-white/10 bg-linear-to-br from-blue-500/10 to-purple-500/10 p-8 md:p-12 backdrop-blur-lg">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="text-center"
          >
            <h2 className="text-4xl font-semibold mb-6">Our mission</h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-300 leading-relaxed">
              To eliminate approval friction and give advertising teams the confidence to launch campaigns faster, with full visibility and control.
>>>>>>> 355d8b5 (Updated analyzer and UI changes)
            </p>
          </GlassCard>
          <GlassCard className="border-white/10 bg-white/3">
            <h3 className="text-xl font-semibold text-white">How we deliver</h3>
            <p className="mt-3 text-sm leading-relaxed text-gray-400">
              Through a precision-first AI layer that combines scoring, compliance logic, and workflow automation into a cohesive platform.
            </p>
          </GlassCard>
        </div>
      </PageSection>

      <PageSection>
        <SectionIntro
          center
          eyebrow="Company Philosophy"
          title="Precision, speed, and scalable systems"
          subtitle="We treat creative operations as mission-critical infrastructure, not a collection of disconnected tools."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Precision",
              body: "Every insight must be specific, explainable, and directly actionable.",
            },
            {
              title: "Speed",
              body: "Execution pace is a strategic advantage. Friction is a cost center.",
            },
            {
              title: "Creative Intelligence",
              body: "AI should augment judgment, not replace creative thinking.",
            },
            {
              title: "Enterprise Workflows",
              body: "Systems must support governance, collaboration, and auditability.",
            },
            {
              title: "Scalable Operations",
              body: "The same workflow should hold from one campaign to thousands.",
            },
            {
              title: "Outcome Focus",
              body: "Real value is measured in faster launches and reduced production waste.",
            },
          ].map((item) => (
            <GlassCard key={item.title} className="border-white/10 bg-white/3">
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-400">{item.body}</p>
            </GlassCard>
          ))}
        </div>
      </PageSection>

<<<<<<< HEAD
      <PageSection>
        <SectionIntro
          eyebrow="Journey"
          title="An evolving platform timeline"
          subtitle="From identifying workflow pain to building an AI-native operational layer for launch teams."
        />
        <div className="mt-10 space-y-4">
          {timeline.map((item, idx) => (
            <motion.div
              key={item.year}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ ...transitions.card, delay: idx * 0.08 }}
              className="relative rounded-xl border border-white/10 bg-white/3 px-5 py-4 pl-16"
=======
      {/* CTA SECTION */}
      <section className="landing-section relative z-10 border-y border-white/10 bg-[#020617] text-center">
        <div className="landing-container">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="mx-auto max-w-3xl text-3xl font-semibold leading-tight md:text-5xl"
          >
            Ready to move faster?
          </motion.h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-400">
            Try Adigator free for 7 days. No credit card required.
          </p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.55, delay: 0.1, ease: "easeOut" }}
          >
            <Link
              href="/preview"
              className="mt-8 inline-flex rounded-xl bg-linear-to-r from-purple-500 to-pink-500 px-8 py-3 font-semibold text-white shadow-lg shadow-purple-500/30 transition-all duration-300 hover:scale-105"
>>>>>>> 355d8b5 (Updated analyzer and UI changes)
            >
              <span className="absolute left-5 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full border border-purple-400/40 bg-purple-400/10 text-center text-xs font-semibold leading-8 text-purple-200">
                {item.year.slice(-2)}
              </span>
              <h4 className="text-base font-semibold text-white">{item.title}</h4>
              <p className="mt-1 text-sm text-gray-400">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </PageSection>

      <PageSection>
        <SectionIntro
          center
          eyebrow="Team and Culture"
          title="A product culture built around craft and accountability"
          subtitle="We are designers, engineers, and operators focused on useful intelligence, clean systems, and measurable outcomes."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            ["Product Craft", "We obsess over detail, clarity, and decision quality in every interface."],
            ["Operator Mindset", "Every feature is grounded in real campaign workflow constraints."],
            ["Shipping Discipline", "We favor resilient systems, small iterations, and high standards."],
          ].map((item) => (
            <GlassCard key={item[0]} className="border-white/10 bg-white/3">
              <h3 className="text-lg font-semibold text-white">{item[0]}</h3>
              <p className="mt-3 text-sm text-gray-400">{item[1]}</p>
            </GlassCard>
          ))}
        </div>
      </PageSection>

      <PageSection>
        <SectionIntro
          eyebrow="Technology"
          title="The platform intelligence stack"
          subtitle="Purpose-built subsystems for analysis, automation, and launch governance."
        />
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            "AI analysis engine",
            "Workflow automation core",
            "Creative intelligence layer",
            "Real-time validation pipeline",
          ].map((tech) => (
            <GlassCard key={tech} className="border-white/10 bg-white/3 text-sm text-gray-300">
              {tech}
            </GlassCard>
          ))}
        </div>
      </PageSection>

      <PageSection>
        <SectionIntro
          center
          eyebrow="Values"
          title="What guides platform decisions"
          subtitle="Enterprise-ready principles that keep quality and velocity aligned."
        />
        <div className="mt-12 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {values.map((value) => (
            <div key={value.title} className="rounded-xl border border-white/10 bg-white/3 p-4 backdrop-blur-md">
              <p className="text-sm font-semibold uppercase tracking-wider text-purple-200">{value.title}</p>
              <p className="mt-2 text-sm text-gray-400">{value.detail}</p>
            </div>
          ))}
        </div>
      </PageSection>

      <PageSection>
        <CinematicCta />
      </PageSection>

      <PageSection className="pt-0">
        <div className="text-center text-sm text-gray-400">
          Want product details next? <Link href="/product" className="text-purple-300 hover:text-purple-200">Explore the platform architecture</Link>
        </div>
      </PageSection>
    </PremiumPageShell>
  );
}
