"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function AboutPage() {
  return (
    <main className="relative min-h-screen bg-[#020617] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-[-200px] h-[520px] w-[520px] rounded-full bg-purple-500/20 blur-[70px] md:blur-[150px]" />
        <div className="absolute right-[-140px] top-[20%] h-[420px] w-[420px] rounded-full bg-blue-500/20 blur-[70px] md:blur-[120px]" />
      </div>

      <header className="relative z-20 border-b border-white/10 bg-[#020617]/80 backdrop-blur-xl">
        <div className="landing-container flex items-center justify-between py-6">
          <Link href="/" className="text-lg font-semibold tracking-[0.22em] uppercase">Adigator</Link>
          <nav className="hidden items-center gap-6 text-sm text-gray-400 md:flex">
            <Link href="/product" className="hover:text-white transition">Product</Link>
            <Link href="/about" className="text-white">About</Link>
            <Link href="/login" className="hover:text-white transition">Login</Link>
          </nav>
        </div>
      </header>

      <section className="landing-section relative z-10">
        <div className="landing-container">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mx-auto max-w-4xl bg-gradient-to-r from-white to-purple-300 bg-clip-text text-center text-4xl font-semibold leading-tight text-transparent md:text-6xl"
          >
            Why Adigator exists
          </motion.h1>
          <p className="mx-auto mt-6 max-w-3xl text-center text-base leading-relaxed text-gray-400 md:text-lg">
            Most ad campaigns fail before they even launch - not because of targeting, but because of weak creatives.
          </p>
        </div>
      </section>

      <section className="landing-section relative z-10">
        <div className="landing-container rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg">
          <h2 className="bg-gradient-to-r from-white to-blue-300 bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">The problem</h2>
          <p className="mt-4 max-w-3xl text-gray-400">
            Teams spend hours reviewing creatives, taking screenshots, and guessing performance before launch.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              "No way to preview ads in real environments",
              "Manual screenshot workflows",
              "No clear validation before spending budget",
              "Weak creatives go live unnoticed",
            ].map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-[#0b1224]/80 p-4 text-sm text-gray-300">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section relative z-10">
        <div className="landing-container rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg">
          <h2 className="bg-gradient-to-r from-white to-purple-300 bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">We built Adigator to fix this</h2>
          <p className="mt-4 max-w-3xl text-gray-400">
            Adigator helps advertisers and agencies preview, validate, and analyze display creatives before launching campaigns.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              "Upload and validate creatives instantly",
              "Analyze performance readiness",
              "Preview ads in real website placements",
              "Make confident launch decisions",
            ].map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-[#0b1224]/80 p-5 text-sm text-gray-300">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section relative z-10">
        <div className="landing-container rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg">
          <h2 className="bg-gradient-to-r from-white to-pink-300 bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">Our mission</h2>
          <p className="mt-4 max-w-3xl text-gray-400">
            To help teams launch better campaigns by making creative decisions clear, fast, and data-driven.
          </p>
        </div>
      </section>

      <section className="landing-section relative z-10">
        <div className="landing-container rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-lg">
          <h2 className="bg-gradient-to-r from-white to-blue-300 bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">Who Adigator is for</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              "Performance marketers",
              "Media buyers",
              "Agencies managing multiple creatives",
              "AdOps teams",
            ].map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-[#0b1224]/80 p-4 text-sm text-gray-300">
                {item}
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-gray-400">
            Built for modern advertising teams working with Google Ads and programmatic platforms.
          </p>
        </div>
      </section>

      <section className="landing-section relative z-10 border-y border-white/10 bg-[#020617] text-center">
        <div className="landing-container">
          <h2 className="mx-auto max-w-3xl bg-gradient-to-r from-white to-purple-300 bg-clip-text text-3xl font-semibold leading-tight text-transparent md:text-5xl">
            Start your next campaign with clarity
          </h2>
          <Link
            href="/preview-tool"
            className="mt-8 inline-flex w-full justify-center rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition-all duration-300 hover:scale-105 sm:w-auto"
          >
            Start Free Preview
          </Link>
        </div>
      </section>
    </main>
  );
}
