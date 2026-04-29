"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Header from "@/app/components/Header";

export default function AboutPage() {
  return (
    <main className="relative min-h-screen bg-[#020617] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-[-200px] h-[520px] w-[520px] rounded-full bg-purple-500/20 blur-[70px] md:blur-[150px]" />
        <div className="absolute right-[-140px] top-[20%] h-[420px] w-[420px] rounded-full bg-blue-500/20 blur-[70px] md:blur-[120px]" />
      </div>

      {/* Header */}
      <Header />

      {/* HERO SECTION */}
      <section className="landing-section relative z-10">
        <div className="landing-container">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mx-auto max-w-4xl bg-gradient-to-r from-white to-purple-300 bg-clip-text text-center text-4xl font-semibold leading-tight text-transparent md:text-6xl"
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
            <h2 className="bg-gradient-to-r from-white to-blue-300 bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">
              How this started
            </h2>
            <p className="mt-6 max-w-3xl text-gray-400 leading-relaxed">
              We observed something consistent across advertising teams: smart, experienced professionals spending disproportionate time on manual, repetitive tasks.
            </p>
            <p className="mt-4 max-w-3xl text-gray-400 leading-relaxed">
              Validating creatives against platform specs. Coordinating previews across teams. Gathering feedback. Running revisions. All before a single dollar was spent on media.
            </p>
            <p className="mt-4 max-w-3xl text-gray-400 leading-relaxed">
              The real constraint wasn't talent or strategy—it was workflow friction. Hours of process work that didn't add value to the actual creative or campaign performance.
            </p>
          </motion.div>
        </div>
      </section>

      {/* THE INSIGHT */}
      <section className="landing-section relative z-10">
        <div className="landing-container rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-8 backdrop-blur-lg">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <h2 className="text-3xl font-semibold md:text-4xl">The insight</h2>
            <p className="mt-6 max-w-3xl text-gray-400 leading-relaxed">
              Modern validation, real environment previewing, and instant team collaboration are technically straightforward. They've just never been packaged together specifically for advertising workflows.
            </p>
            <p className="mt-4 max-w-3xl text-gray-400 leading-relaxed">
              What if teams could compress those 6-20 hours into minutes? What if approval delays disappeared? What if every stakeholder could see exactly what they were approving, instantly?
            </p>
            <p className="mt-6 text-lg font-semibold text-purple-300">
              That's Adigator.
            </p>
          </motion.div>
        </div>
      </section>

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
        <div className="landing-container rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-8 md:p-12 backdrop-blur-lg">
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
            </p>
            <p className="mt-6 mx-auto max-w-2xl text-gray-400">
              We measure success by hours saved, approval cycles reduced, and campaigns launched on schedule.
            </p>
          </motion.div>
        </div>
      </section>

      {/* WHO WE SERVE */}
      <section className="landing-section relative z-10">
        <div className="landing-container">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="text-3xl font-semibold text-center md:text-4xl mb-12"
          >
            Built for teams running modern campaigns
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Agencies & Studios",
                use: "Multiple clients, high creative volume",
                needs: [
                  "Batch validate creatives quickly",
                  "Share client-ready previews instantly",
                  "Scale QA without scaling headcount",
                  "Reduce revision cycles across projects",
                ],
              },
              {
                title: "In-House Teams",
                use: "Single brand, consistent quality standards",
                needs: [
                  "Streamline internal approval workflows",
                  "Reduce back-and-forth between teams",
                  "Maintain brand compliance automatically",
                  "Launch on schedule, every time",
                ],
              },
              {
                title: "Performance Marketing",
                use: "Speed and data-driven decisions",
                needs: [
                  "Test and validate creatives quickly",
                  "Identify winning variations pre-launch",
                  "Reduce underperformer spend",
                  "Move from hypothesis to launch faster",
                ],
              },
              {
                title: "AdTech / Platforms",
                use: "Compliance and publisher requirements",
                needs: [
                  "Instant spec validation",
                  "Audit-ready compliance documentation",
                  "Real-time environment preview",
                  "Standards-based pre-flight checks",
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
                <h3 className="text-2xl font-semibold text-white mb-2">{segment.title}</h3>
                <p className="text-sm text-gray-500 mb-6">{segment.use}</p>
                <ul className="space-y-3">
                  {segment.needs.map((need) => (
                    <li key={need} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="text-purple-400 mt-0.5">✓</span>
                      <span>{need}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

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
              href="/preview-tool"
              className="mt-8 inline-flex rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-3 font-semibold text-white shadow-lg shadow-purple-500/30 transition-all duration-300 hover:scale-105"
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
