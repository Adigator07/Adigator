"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Header from "@/app/components/Header";


export default function ProductPage() {
  const features = [
    {
      icon: "⚡",
      title: "Instant Validation",
      subtitle: "Platform-Ready in Seconds",
      description: "Upload creatives and get instant checks against all Google Ads and programmatic platform standards.",
      roi: "Save 1–3 hours per campaign on manual validation",
      details: [
        "Automatic size & format compliance checks",
        "File compression optimization",
        "Platform specification verification",
        "Instant compliance reports",
      ],
    },
    {
      icon: "🎯",
      title: "Real Environment Preview",
      subtitle: "See Your Ads Where They Live",
      description: "Preview creatives in real website environments across mobile and desktop layouts before launch.",
      roi: "Eliminate screenshot workflows and manual previews",
      details: [
        "Mobile & desktop responsive preview",
        "Real ad placements (300x250, 728x90, etc.)",
        "Device-specific rendering",
        "Interactive preview controls",
      ],
    },
    {
      icon: "📊",
      title: "Actionable Insights",
      subtitle: "Data-Driven Decision Making",
      description: "Get visual quality scores, CTA visibility analysis, and creative performance predictions.",
      roi: "Reduce revisions by 40–60% with clear, actionable feedback",
      details: [
        "CTA visibility & readability scoring",
        "Design composition analysis",
        "Performance predictions",
        "Detailed improvement recommendations",
      ],
    },
    {
      icon: "⚖️",
      title: "Creative Comparison",
      subtitle: "Identify Winners Instantly",
      description: "Compare multiple creative variations side-by-side and identify top performers before launch.",
      roi: "Launch best-performing creatives first, reducing underperformer spend",
      details: [
        "Multi-creative side-by-side comparison",
        "Performance scoring per variant",
        "Instant winner identification",
        "Batch analysis support",
      ],
    },
    {
      icon: "🔄",
      title: "Streamlined Approvals",
      subtitle: "Faster Sign-Offs",
      description: "Share detailed reports and previews with stakeholders instantly. No more email chains or unclear feedback.",
      roi: "Reduce approval cycles from days to hours",
      details: [
        "Shareable preview links",
        "Exportable reports",
        "Team collaboration features",
        "Quick stakeholder sharing",
      ],
    },
    {
      icon: "✅",
      title: "Launch-Ready Reports",
      subtitle: "Everything in One Place",
      description: "Export comprehensive pre-flight reports with validation, previews, and performance insights.",
      roi: "Document compliance and quality for audit trails",
      details: [
        "PDF export with full analysis",
        "Compliance documentation",
        "Performance predictions",
        "Team sign-off tracking",
      ],
    },
  ];

  const workflow = [
    {
      number: "01",
      title: "Upload Creatives",
      description: "Drop your ads in any format. Support for PNG, JPEG, GIF, and more.",
      icon: "📤",
    },
    {
      number: "02",
      title: "Select Platform",
      description: "Choose your target: Google Ads, Programmatic, or Both.",
      icon: "🎯",
    },
    {
      number: "03",
      title: "Get Insights",
      description: "Instant validation, quality scoring, and performance predictions.",
      icon: "💡",
    },
    {
      number: "04",
      title: "Preview & Share",
      description: "Real environment previews and instant team collaboration.",
      icon: "👥",
    },
    {
      number: "05",
      title: "Launch Confident",
      description: "Export reports and launch with full compliance confidence.",
      icon: "🚀",
    },
  ];

  return (
    <main className="relative min-h-screen bg-[#020617] text-white">
      {/* Background Gradients */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-[-200px] h-[520px] w-[520px] rounded-full bg-purple-500/20 blur-[70px] md:blur-[150px]" />
        <div className="absolute right-[-140px] top-[20%] h-[420px] w-[420px] rounded-full bg-blue-500/20 blur-[70px] md:blur-[120px]" />
      </div>

      {/* Header */}
      <Header />

      {/* HERO SECTION */}
      <section className="landing-section relative z-10">
        <div className="landing-container w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <p className="rounded-full border border-white/15 bg-white/5 px-4 py-1 w-fit text-xs font-semibold uppercase tracking-[0.18em] text-gray-400 backdrop-blur-lg">
              Product Overview
            </p>
            <h1 className="mt-6 text-5xl md:text-6xl font-semibold leading-tight">
              Built to accelerate approvals
              <span className="block bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                and launch faster
              </span>
            </h1>
            <p className="mt-6 text-lg text-gray-400 max-w-2xl">
              Every feature is designed to eliminate workflow friction, reduce approval cycles, and get campaigns live on time.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="landing-section relative z-10">
        <div className="landing-container w-full">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="text-4xl font-semibold text-center mb-16"
          >
            Core Capabilities
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.55, delay: i * 0.08, ease: "easeOut" }}
                className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-8 backdrop-blur-lg hover:border-purple-500 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-4xl mb-3 block">{feature.icon}</span>
                    <h3 className="text-2xl font-semibold text-white">{feature.title}</h3>
                    <p className="text-sm text-purple-300/80 mt-1">{feature.subtitle}</p>
                  </div>
                </div>

                <p className="text-gray-400 text-sm mb-6">{feature.description}</p>

                <div className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-3 mb-6">
                  <p className="text-sm font-semibold text-purple-300">{feature.roi}</p>
                </div>

                <div className="space-y-2">
                  {feature.details.map((detail) => (
                    <div key={detail} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="text-purple-400 mt-0.5">✓</span>
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* WORKFLOW SECTION */}
      <section className="landing-section relative z-10">
        <div className="landing-container w-full">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-semibold">The Adigator Workflow</h2>
            <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
              Five simple steps from creative to confident launch
            </p>
          </motion.div>

          <div className="grid md:grid-cols-5 gap-4">
            {workflow.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.55, delay: i * 0.1, ease: "easeOut" }}
                className="relative"
              >
                <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-lg">
                  <div className="text-3xl mb-4">{step.icon}</div>
                  <p className="text-sm font-semibold text-purple-400 mb-2">{step.number}</p>
                  <h4 className="font-semibold text-white mb-2">{step.title}</h4>
                  <p className="text-xs text-gray-400">{step.description}</p>
                </div>

                {i < workflow.length - 1 && (
                  <div className="hidden md:block absolute -right-2 top-1/2 -translate-y-1/2 text-gray-600 text-2xl">
                    →
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI SECTION */}
      <section className="landing-section relative z-10">
        <div className="landing-container w-full">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-8 md:p-12 backdrop-blur-lg">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="max-w-3xl"
            >
              <h2 className="text-4xl font-semibold mb-8">Measurable Impact</h2>

              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    metric: "6–20 hours",
                    description: "Time saved per campaign",
                  },
                  {
                    metric: "40–60%",
                    description: "Fewer revision cycles",
                  },
                  {
                    metric: "Days → Hours",
                    description: "Approval cycle reduction",
                  },
                ].map((item) => (
                  <div key={item.metric} className="border-l-2 border-purple-400 pl-6">
                    <p className="text-3xl md:text-4xl font-bold text-purple-300 mb-2">{item.metric}</p>
                    <p className="text-gray-400">{item.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-10 p-6 rounded-lg border border-white/10 bg-white/5">
                <p className="text-sm text-gray-300">
                  For an agency running 50 campaigns/month: <span className="font-semibold text-white">Save 300–1000 hours annually</span>. That's 7–25 full-time FTE weeks freed up for strategy, creative optimization, or client work.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* IDEAL FOR SECTION */}
      <section className="landing-section relative z-10">
        <div className="landing-container w-full">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl font-semibold mb-4">Built for Your Team</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Whether you're an agency, in-house team, or freelancer, Adigator scales to your workflow.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Agencies",
                use: "Multiple clients, high volume",
                benefits: [
                  "Batch process creatives",
                  "Share instant previews with clients",
                  "Reduce manual QA overhead",
                  "Scale creative review",
                ],
              },
              {
                title: "In-House Teams",
                use: "Single brand, consistent quality",
                benefits: [
                  "Streamline internal approvals",
                  "Reduce back-and-forth with stakeholders",
                  "Maintain brand compliance",
                  "Launch on schedule",
                ],
              },
              {
                title: "Freelancers",
                use: "Multiple projects, fast turnaround",
                benefits: [
                  "Deliver professional previews",
                  "Client-ready reports",
                  "Reduce revision requests",
                  "Faster project completion",
                ],
              },
            ].map((segment, i) => (
              <motion.div
                key={segment.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.55, delay: i * 0.1, ease: "easeOut" }}
                className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg hover:border-purple-500 transition-all duration-300"
              >
                <h3 className="text-2xl font-semibold mb-2">{segment.title}</h3>
                <p className="text-sm text-gray-400 mb-6">{segment.use}</p>
                <ul className="space-y-3">
                  {segment.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="text-purple-400 mt-0.5">✓</span>
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="landing-section relative z-10 border-y border-white/10">
        <div className="landing-container w-full text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <h2 className="text-4xl font-semibold mb-4">See It In Action</h2>
            <p className="text-gray-400 max-w-2xl mx-auto mb-8">
              Try Adigator free for 7 days. No credit card required.
            </p>
            <Link
              href="/preview"
              className="inline-flex rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-3 font-semibold text-white shadow-lg shadow-purple-500/30 transition-all duration-300 hover:scale-105"
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
