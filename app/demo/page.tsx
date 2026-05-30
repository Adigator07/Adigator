"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import MarketingNav from "@/app/components/MarketingNav";
import { MARKETING_CTA, MARKETING_SIGN_IN } from "@/app/lib/siteNavigation";

const DEMO_POINTS = [
  {
    title: "How the app works",
    description: "Upload creatives, choose your platform and campaign goal, run AI analysis, preview ads in realistic environments, and export strategic reports.",
  },
  {
    title: "How to use the platform",
    description: "Step 1 configures your campaign. Step 2 uploads and validates creatives. Step 3 delivers risk-based analysis. Step 4 previews placements across Google, Meta, and Programmatic contexts.",
  },
  {
    title: "Why teams benefit",
    description: "Catch sizing, placement, and messaging issues before spend goes live. Align creative, media, and strategy teams around one source of truth.",
  },
  {
    title: "Why users stay satisfied",
    description: "Faster launch reviews, fewer rework cycles, and platform-native guidance that feels like working with a senior media strategist — not a generic checklist.",
  },
];

export default function DemoPage() {
  return (
    <div className="marketing-page min-h-screen bg-[#F5F5F0] text-[#0D0D0D]">
      <MarketingNav activePath="/demo" />

      <main className="mx-auto w-[min(1100px,92vw)] pt-32 pb-20">
        <section className="rounded-[28px] border border-[#DEDDD5] bg-white p-8 md:p-12 shadow-[0_25px_80px_rgba(15,23,42,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#666]">Product Walkthrough</p>
          <h1 className="mt-4 text-[clamp(2.2rem,5vw,3.8rem)] font-black leading-[0.95] tracking-[-0.04em]">
            See how Adigator works
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-[#5E5E58]">
            Watch the platform overview, then launch the interactive Preview Tool to experience the full workflow yourself.
          </p>

          <div className="mt-8 overflow-hidden rounded-2xl border border-[#E7E6DF] bg-[#0D0D0D]">
            <div className="relative aspect-video">
              <video
                className="h-full w-full object-cover"
                controls
                preload="metadata"
                poster=""
              >
                <source src="/video.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-[#0D0D0D] shadow-lg">
                  <Play size={28} className="ml-1" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {DEMO_POINTS.map((point) => (
              <article key={point.title} className="rounded-2xl border border-[#E7E6DF] bg-[#FAFAF8] p-5">
                <h2 className="text-lg font-bold text-[#0D0D0D]">{point.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[#5E5E58]">{point.description}</p>
              </article>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href={MARKETING_CTA.href} className="marketing-btn-lime rounded-full px-8 py-4 text-base font-semibold">
              Try Interactive Demo
            </Link>
            <Link href={MARKETING_SIGN_IN.href} className="marketing-btn-outline rounded-full px-8 py-4 text-base font-semibold">
              Sign In for Unlimited Access
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
