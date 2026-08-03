"use client";

import Link from "next/link";
import { ArrowRight, Brain, Eye, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function IntelligencePage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#08111f] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.16),transparent_38%)]" />
      <div className="relative mx-auto max-w-5xl px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-4xl border border-white/10 bg-white/5 p-8 shadow-[0_24px_80px_-40px_rgba(14,116,144,0.55)] backdrop-blur-xl"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-300/85">Ad Intelligence</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white">Open analysis where the workflow already works best</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-white/65">
            Ad Intelligence is powered inside Campaign Intelligence Studio. Use the direct launch paths below to jump straight into campaign analysis or preview review without hitting a dead route.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Campaign Setup",
                detail: "Start or update a campaign, advertiser, objective, brief, and landing page context.",
                href: "/preview-tool?step=campaign-setup",
                icon: Sparkles,
                cta: "Start setup",
              },
              {
                title: "Campaign Intelligence",
                detail: "Go directly to the analysis stage for strategic scoring, context alignment, and recommendations.",
                href: "/preview-tool?step=campaign-intelligence",
                icon: Brain,
                cta: "Open intelligence",
              },
              {
                title: "Preview Studio",
                detail: "Review placements, environments, and safe-zone behavior after analysis is complete.",
                href: "/preview-tool?step=preview-studio",
                icon: Eye,
                cta: "Open previews",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.title} href={item.href} className="group rounded-2xl border border-white/10 bg-[#0c182b] p-5 transition hover:border-sky-300/35 hover:bg-[#10203a]">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300">
                    <Icon size={20} />
                  </div>
                  <h2 className="mt-4 text-lg font-bold text-white">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-white/60">{item.detail}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-sky-300 transition group-hover:text-sky-200">
                    {item.cta} <ArrowRight size={15} />
                  </span>
                </Link>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}