"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Zap, FileDown, Layers, ArrowRight, CheckCircle2,
         ShoppingCart, Newspaper, Gamepad2, Coffee, Laptop, GraduationCap, Film } from "lucide-react";

// ─── Animation helpers ────────────────────────────────────────
const fadeUp = {
  hidden:  { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 80, damping: 20 } },
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const scaleUp = {
  hidden:  { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring" as const, stiffness: 100, damping: 20 } },
};

function inView() { return { initial: "hidden", whileInView: "visible", viewport: { once: true, margin: "-80px" } }; }

// ─── Reusable Button ─────────────────────────────────────────
function CTA({ href, children, primary = true, className = "" }: any) {
  const base = "group relative inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-semibold rounded-full transition-all duration-300 overflow-hidden outline-none";
  const styles = primary
    ? "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-500 text-white shadow-[0_0_24px_rgba(168,85,247,0.35)] hover:shadow-[0_0_48px_rgba(168,85,247,0.6)] border border-white/10"
    : "bg-white/5 text-gray-200 border border-white/15 hover:bg-white/10 hover:border-white/25 backdrop-blur-md";
  return (
    <Link href={href ?? "#"} className="inline-block">
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={`${base} ${styles} ${className}`}>
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/0 via-white/15 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <span className="relative z-10 flex items-center gap-2">{children}</span>
      </motion.button>
    </Link>
  );
}

// ─── Feature card ────────────────────────────────────────────
const FEATURES = [
  { icon: Sparkles, title: "Smart Templates",  desc: "9 industry-specific templates — news, gaming, ecommerce, and more.", color: "text-violet-400" },
  { icon: FileDown, title: "PPT Export",       desc: "Export pixel-perfect PPTX files that match your preview exactly.",   color: "text-fuchsia-400" },
  { icon: Layers,   title: "Multi-Slide Mode", desc: "View all creatives at once or step through slides one by one.",       color: "text-orange-400" },
  { icon: Zap,      title: "Instant Preview",  desc: "Upload, validate, and preview ads in under 60 seconds.",             color: "text-cyan-400" },
];

// ─── How it works steps ───────────────────────────────────────
const HOW_STEPS = [
  { num: "01", title: "Choose Template",   desc: "Select from 9 professionally designed website templates." },
  { num: "02", title: "Customize Content", desc: "Upload your ad creatives and pick your view mode." },
  { num: "03", title: "Download PPTX",     desc: "Export a presentation-ready slide deck in one click." },
];

// ─── Template categories ──────────────────────────────────────
const TEMPLATE_CATS = [
  { icon: ShoppingCart, label: "Ecommerce",     color: "from-orange-500/25 to-orange-600/10 border-orange-500/25", text: "text-orange-400" },
  { icon: Newspaper,    label: "News",           color: "from-blue-500/25 to-blue-600/10 border-blue-500/25",       text: "text-blue-400" },
  { icon: Gamepad2,     label: "Gaming",         color: "from-green-500/25 to-green-600/10 border-green-500/25",   text: "text-green-400" },
  { icon: Coffee,       label: "Food & Recipe",  color: "from-yellow-500/25 to-yellow-600/10 border-yellow-500/25",text: "text-yellow-400" },
  { icon: Laptop,       label: "Technology",     color: "from-cyan-500/25 to-cyan-600/10 border-cyan-500/25",      text: "text-cyan-400" },
  { icon: GraduationCap,label: "Education",      color: "from-purple-500/25 to-purple-600/10 border-purple-500/25",text: "text-purple-400" },
  { icon: Film,         label: "Entertainment",  color: "from-pink-500/25 to-pink-600/10 border-pink-500/25",      text: "text-pink-400" },
];

// ─────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <main className="bg-[#030712] text-white min-h-screen selection:bg-fuchsia-500/30 overflow-x-hidden font-sans">

      {/* Ambient bg */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-violet-600/8 rounded-full blur-[100px]" />
      </div>

      {/* ── NAVBAR ───────────────────────────────────────────── */}
      <header className="relative z-50 flex justify-between items-center px-6 md:px-12 h-20 border-b border-white/5 bg-[#030712]/60 backdrop-blur-2xl">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="h-8 flex items-center">
          <img src="/logo.png" alt="Adigator" className="h-full w-auto object-contain scale-[2.83] origin-left" />
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
          className="hidden md:flex items-center gap-8 text-sm text-gray-400 font-medium">
          {["Features", "How It Works", "Templates"].map((label) => (
            <a key={label} href={`#${label.toLowerCase().replace(/ /g, "-")}`}
               className="hover:text-white transition-colors duration-200 cursor-pointer">{label}</a>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="flex items-center gap-3">
          <Link href="/login">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="px-5 py-2.5 border border-white/10 text-gray-200 rounded-xl hover:border-white/20 hover:text-white transition text-sm font-semibold backdrop-blur-md">
              Login
            </motion.button>
          </Link>
          <CTA href="/preview">Get Started</CTA>
        </motion.div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative z-10 text-center px-6 md:px-10 pt-32 pb-24 flex flex-col items-center min-h-[88vh] justify-center">
        <motion.div variants={stagger} initial="hidden" animate="visible" className="max-w-5xl mx-auto">

          <motion.div variants={fadeUp} className="mb-8 flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-300 text-xs font-medium tracking-wide backdrop-blur-sm cursor-pointer hover:bg-fuchsia-500/20 transition">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fuchsia-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-fuchsia-500" />
              </span>
              Introducing Adigator 2.0 — Slide-Based Preview
            </div>
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-extrabold leading-[1.08] tracking-tight text-white drop-shadow-2xl">
            Create High-Quality<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-orange-400">
              Creatives in Seconds
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-7 text-gray-400 max-w-2xl mx-auto text-base md:text-xl leading-relaxed font-light">
            Generate ads, posts, and designs instantly with smart templates. Preview in a real context, then export a perfect PPTX deck.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <CTA href="/preview" primary>Get Started <ArrowRight size={16} /></CTA>
            <CTA href="/preview" primary={false}>View Demo</CTA>
          </motion.div>

          {/* Hero visual */}
          <motion.div variants={scaleUp} className="mt-16 relative group rounded-3xl overflow-hidden border border-white/10 bg-[#0f172a] shadow-[0_0_100px_rgba(0,0,0,0.8)]">
            <div className="h-11 border-b border-white/5 bg-white/5 flex items-center px-5 gap-2">
              {["#ef4444","#eab308","#22c55e"].map((c) => <div key={c} className="w-3 h-3 rounded-full" style={{ background: c + "cc" }} />)}
              <div className="flex-1 mx-4 h-5 bg-white/5 rounded-md" />
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent z-10" />
              <video autoPlay muted loop playsInline className="w-full object-cover group-hover:scale-[1.02] transition-transform duration-700">
                <source src="/video.mp4" type="video/mp4" />
              </video>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section id="features" className="relative z-10 px-6 md:px-10 py-24 max-w-7xl mx-auto">
        <motion.div variants={stagger} {...inView()}>
          <motion.div variants={fadeUp} className="text-center mb-16">
            <p className="text-fuchsia-400 text-sm font-bold uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Everything you need to<br />preview ads like a pro</h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <motion.div key={f.title} variants={fadeUp}
                className="group p-7 rounded-3xl bg-white/4 border border-white/8 hover:border-white/15 hover:bg-white/7 transition-all duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <f.icon size={26} className={`${f.color} mb-4`} />
                <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section id="how-it-works" className="relative z-10 px-6 md:px-10 py-24">
        <motion.div variants={stagger} {...inView()} className="max-w-5xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <p className="text-violet-400 text-sm font-bold uppercase tracking-widest mb-3">How It Works</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">From upload to deck<br />in three steps</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {HOW_STEPS.map((s, i) => (
              <motion.div key={s.num} variants={fadeUp} className="relative">
                {i < HOW_STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-white/10 to-transparent -translate-y-1/2 z-0" />
                )}
                <div className="relative z-10 flex flex-col gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/30 to-fuchsia-600/20 border border-violet-500/30 flex items-center justify-center">
                    <span className="text-xl font-extrabold text-violet-400">{s.num}</span>
                  </div>
                  <h3 className="text-white font-bold text-xl">{s.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── TEMPLATES SHOWCASE ───────────────────────────────── */}
      <section id="templates" className="relative z-10 px-6 md:px-10 py-24">
        <motion.div variants={stagger} {...inView()} className="max-w-7xl mx-auto">
          <motion.div variants={fadeUp} className="text-center mb-12">
            <p className="text-cyan-400 text-sm font-bold uppercase tracking-widest mb-3">Templates</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Preview in any context</h2>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto text-sm md:text-base">
              7 industry-specific templates so your ads always look right at home.
            </p>
          </motion.div>

          <motion.div variants={stagger} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {TEMPLATE_CATS.map((cat) => (
              <motion.div key={cat.label} variants={fadeUp}>
                <Link href="/preview">
                  <motion.div whileHover={{ scale: 1.06, y: -4 }} whileTap={{ scale: 0.97 }}
                    className={`group rounded-2xl border bg-gradient-to-br ${cat.color} p-5 flex flex-col items-center gap-3 cursor-pointer transition-all hover:shadow-xl`}>
                    <div className="w-12 h-12 rounded-xl bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition">
                      <cat.icon size={22} className={cat.text} />
                    </div>
                    <span className="text-xs font-semibold text-white/70 group-hover:text-white transition text-center leading-tight">
                      {cat.label}
                    </span>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── VALUE SPLIT ──────────────────────────────────────── */}
      <section className="relative z-10 grid md:grid-cols-2 max-w-7xl mx-auto px-6 md:px-10 py-16 gap-6">
        {[
          { color: "violet", label: "For Advertisers", headline: "Stop guessing.\nStart knowing.", body: "See exactly how your creatives appear across real platforms — and launch with absolute confidence." },
          { color: "blue",   label: "For Agencies",    headline: "Impress clients\nbefore launch.",  body: "Create clean, client-ready preview decks in minutes. No manual mockups or guesswork required." },
        ].map((card) => (
          <motion.div key={card.label} variants={fadeUp} {...inView()}
            className={`group relative p-10 md:p-14 rounded-3xl bg-[#0f172a]/50 border border-white/6 hover:border-white/12 transition-colors duration-500 overflow-hidden`}>
            <div className={`absolute inset-0 bg-gradient-to-b from-${card.color}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            <p className={`text-${card.color}-400 text-sm font-bold uppercase tracking-wider mb-4`}>{card.label}</p>
            <h2 className="text-2xl md:text-4xl font-bold mb-5 leading-snug tracking-tight text-white whitespace-pre-line">{card.headline}</h2>
            <p className="text-gray-400 text-base leading-relaxed font-light">{card.body}</p>
          </motion.div>
        ))}
      </section>

      {/* ── SOCIAL PROOF ─────────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-10 py-16 max-w-7xl mx-auto">
        <motion.div variants={stagger} {...inView()} className="grid sm:grid-cols-3 gap-6">
          {[
            { stat: "9+",   label: "Industry Templates" },
            { stat: "7",    label: "Ad Formats Supported" },
            { stat: "100%", label: "Browser-based, no install" },
          ].map((item) => (
            <motion.div key={item.label} variants={scaleUp}
              className="text-center p-8 rounded-3xl bg-white/4 border border-white/8">
              <p className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">{item.stat}</p>
              <p className="text-gray-500 mt-2 text-sm">{item.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section className="relative z-10 px-6 md:px-10 py-32 text-center overflow-hidden">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-[700px] h-[350px] bg-violet-600/20 rounded-full blur-[100px] pointer-events-none" />
        <motion.div variants={stagger} {...inView()} className="relative z-10 max-w-3xl mx-auto">
          <motion.div variants={fadeUp} className="flex items-center justify-center gap-2 mb-6 text-purple-400">
            <CheckCircle2 size={18} /><span className="text-sm font-semibold">No credit card required</span>
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl md:text-6xl font-extrabold mb-8 tracking-tight text-white">
            Start Creating Now
          </motion.h2>
          <motion.p variants={fadeUp} className="text-gray-400 mb-10 text-base md:text-lg max-w-xl mx-auto">
            Join advertisers and agencies who preview smarter and export faster.
          </motion.p>
          <motion.div variants={fadeUp}>
            <CTA href="/preview" primary className="px-12 py-4 text-base shadow-[0_0_50px_rgba(168,85,247,0.45)]">
              Start free preview <ArrowRight size={18} />
            </CTA>
          </motion.div>
        </motion.div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="relative z-10 px-6 md:px-10 py-10 border-t border-white/5 bg-[#030712]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-sm">© 2026 Adigator. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-gray-600">
            {["Privacy", "Terms", "Contact"].map((l) => (
              <a key={l} href="#" className="hover:text-white transition">{l}</a>
            ))}
          </div>
        </div>
      </footer>

    </main>
  );
}