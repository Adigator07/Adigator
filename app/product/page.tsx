"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import MarketingNav from "@/app/components/MarketingNav";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Play,
  PlugZap,
  ShieldCheck,
  X,
} from "lucide-react";

import { MARKETING_CTA } from "@/app/lib/siteNavigation";

const HERO_LINKS = [
  { label: "Discover Platform", href: "#overview" },
  { label: "Ad Performance", href: "#prism" },
  { label: "Ad Creation", href: "#adroom" },
];

const OVERVIEW_NOTES = [
  "Analyze-creative orchestration API",
  "Deterministic strategic scoring",
  "Google / Meta / Programmatic size intelligence",
  "Goal and vertical alignment checks",
  "Contextual preview engine",
  "Adigator output formatting",
  "PPTX strategic report export",
];

const PERFORMANCE_BULLETS = [
  "Identify, understand and act - fast",
  "Automate spend and optimization to drive performance",
  "Simulate, report and plan across all channels",
  "Align and work collaboratively with incredible ease",
];

const CREATION_BULLETS = [
  "Professional-grade creative review without extra production overhead",
  "Pixel-perfect product and placement context using fallback creative samples",
  "Bold visuals and compelling copy checks inside a single workflow",
  "In tune with brand guidelines, platform specs, and audience context",
];

const LOGO_TICKER = [
  "GOOGLE ADS",
  "META ADS",
  "PROGRAMMATIC",
  "DV360",
  "THE TRADE DESK",
  "XANDR",
  "YAHOO DSP",
  "AMAZON DSP",
  "STACKADAPT",
  "BASIS",
];

const TESTIMONIALS = [
  {
    quote:
      "Adigator gave us a clearer path from strategy to execution. We launched better campaigns in half the time with stronger efficiency.",
    author: "Nora Patel",
    role: "VP, Performance Marketing",
    company: "Brightline",
  },
  {
    quote:
      "The platform helped our creative and media teams finally work from the same source of truth. Results became predictable.",
    author: "Daniel Cruz",
    role: "Head of Growth",
    company: "Axiom",
  },
  {
    quote:
      "We cut weeks of back-and-forth and turned experimentation into a weekly rhythm that consistently improved campaign output.",
    author: "Mina Shah",
    role: "Director, Digital Strategy",
    company: "Northstar",
  },
  {
    quote:
      "Previewing placements in realistic environments helped our team catch issues earlier and move into launch reviews with more confidence.",
    author: "Ava Chen",
    role: "Growth Lead",
    company: "Preview Studio Review",
  },
];

const BLOG_POSTS = [
  {
    tags: ["Ad Creative", "Analyze Creative"],
    title: "Inside the 10-layer advertising intelligence orchestrator",
    author: "Product Engineering",
    role: "Platform Team",
    date: "May 12, 2026",
    initials: "PE",
  },
  {
    tags: ["Preview Engine", "Creative QA"],
    title: "How contextual preview environments improve launch confidence",
    author: "Solutions Team",
    role: "Preview Studio",
    date: "May 8, 2026",
    initials: "ST",
  },
  {
    tags: ["Validation", "Programmatic"],
    title: "Why platform-size intelligence matters before spend goes live",
    author: "Validation Team",
    role: "Creative QA",
    date: "Apr 29, 2026",
    initials: "VT",
  },
];

const FOOTER_COLUMNS = [
  {
    title: "Products",
    items: [
      { label: "Platform Overview", href: "#overview" },
      { label: "Analyze Creative", href: "#prism" },
      { label: "Preview Studio", href: "#adroom" },
    ],
  },
  {
    title: "Solutions",
    items: [
      { label: "Solutions", href: "/solutions" },
      { label: "Preview Tool", href: "/preview-tool" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    title: "Knowledge Hub",
    items: [
      { label: "Blog", href: "#blog" },
      { label: "Peer Stories", href: "#testimonials" },
      { label: "Live Preview", href: "/preview" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About", href: "/about" },
      { label: "Login", href: "/login" },
      { label: "Book Demo", href: "/preview-tool" },
    ],
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: index * 0.08, ease: "easeOut" as any },
  }),
};

export default function ProductPage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const tickerItems = useMemo(() => [...LOGO_TICKER, ...LOGO_TICKER], []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveTestimonial((current) => (current + 1) % TESTIMONIALS.length);
    }, 5000);

    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsVideoOpen(false);
    };

    if (isVideoOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", onKeyDown);
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isVideoOpen]);

  const cycleTestimonial = (direction: number) => {
    setActiveTestimonial((current) => {
      const next = current + direction;
      if (next < 0) return TESTIMONIALS.length - 1;
      if (next >= TESTIMONIALS.length) return 0;
      return next;
    });
  };

  return (
    <div className="marketing-page min-h-screen bg-[#F5F5F0] text-[#0D0D0D]">
      <MarketingNav activePath="/product" />

      <main>
        <section className="px-4 pb-[120px] pt-36 sm:px-6 lg:px-8">
          <div className="mx-auto grid w-[min(1320px,92vw)] gap-14 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div>
              <motion.span
                custom={0}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="inline-flex rounded-full border border-[#D8D7CF] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#5B5B55]"
              >
                Products
              </motion.span>
              <motion.h1
                custom={1}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="mt-8 text-[clamp(4.1rem,8vw,5.8rem)] font-black leading-[0.94] tracking-[-0.055em]"
              >
                Advertising, optimized.
                <span className="block">Performance, maximized.</span>
              </motion.h1>
              <motion.p
                custom={2}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="mt-6 max-w-2xl text-lg leading-relaxed text-[#66665F]"
              >
                Leading your market starts with intelligent tools and deeper insights.
              </motion.p>
              <motion.div
                custom={3}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="mt-10 flex flex-wrap gap-3"
              >
                {HERO_LINKS.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="inline-flex items-center rounded-full border border-[#D7D6CE] bg-transparent px-5 py-3 text-sm font-semibold text-[#2E2E2A] transition duration-200 hover:scale-[1.02] hover:border-[#C8F04D] hover:bg-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="relative mx-auto w-full max-w-[560px]"
            >
              <div className="relative rounded-[32px] border border-[#DDDCD4] bg-white p-5 shadow-[0_18px_50px_rgba(15,15,15,0.05)]">
                <div className="absolute -left-4 top-10 rounded-full border border-[#D7D6CE] bg-[#0D0D0D] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white">
                  Product UI
                </div>
                <div className="absolute -right-4 bottom-14 rounded-full border border-[#D7D6CE] bg-[#C8F04D] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#0D0D0D]">
                  Live insights
                </div>
                <div className="rounded-[24px] border border-[#E5E4DC] bg-[#F0EFE8] p-4">
                  <div className="grid gap-4 md:grid-cols-[1.08fr_0.92fr] md:items-center rounded-[22px] bg-[#0D0D0D] p-4">
                    <Image
                      src="/Screenshot_2026-04-29_134437-removebg-preview.png"
                      alt="Adigator platform interface"
                      width={900}
                      height={900}
                      className="h-auto w-full rounded-[18px] object-contain"
                      priority
                    />
                    <div className="space-y-3 rounded-[20px] border border-white/10 bg-white/5 p-4 text-white">
                      {[
                        ["Analyze Creative", "10-layer decision pipeline"],
                        ["Preview Engine", "10 environment families"],
                        ["Export Layer", "Stakeholder-ready PPTX output"],
                      ].map((item) => (
                        <div key={item[0]} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-white/45">{item[0]}</p>
                          <p className="mt-1 text-sm font-semibold text-white">{item[1]}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="overview" className="bg-[#0D0D0D] px-4 py-[120px] text-white sm:px-6 lg:px-8">
          <div className="mx-auto w-[min(1320px,92vw)] text-center">
            <h2 className="text-[clamp(2.2rem,4vw,3rem)] font-black tracking-[-0.04em]">
              The complete, AI-powered advertising solution
            </h2>
            <p className="mt-6 text-[clamp(1.2rem,2.2vw,1.9rem)] font-semibold text-[#C8F04D]">
              10 analysis layers, 3 platform matrices, and 10 preview environments in one workflow.
            </p>

            <div className="mt-12 overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-4 shadow-[0_0_0_1px_rgba(200,240,77,0.08)]">
              <div className="grid gap-5 rounded-[28px] border border-white/10 bg-[#111111] p-5 lg:grid-cols-[1.32fr_0.68fr] lg:items-stretch">
                <div className="rounded-[24px] border border-white/10 bg-[#171717] p-4">
                  <Image
                    src="/Screenshot_2026-04-29_134437-removebg-preview.png"
                    alt="Adigator dashboard overview"
                    width={1200}
                    height={900}
                    className="h-[420px] w-full rounded-[20px] bg-[#0D0D0D] object-contain"
                  />
                </div>
                <div className="grid gap-4 text-left">
                  {OVERVIEW_NOTES.slice(0, 4).map((item) => (
                    <div key={item} className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                      <p className="text-sm leading-relaxed text-white/72">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="prism" className="px-4 py-[120px] sm:px-6 lg:px-8">
          <div className="mx-auto grid w-[min(1320px,92vw)] gap-14 lg:grid-cols-2 lg:items-center">
            <motion.div
              initial={{ opacity: 0, x: -36 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <button
                type="button"
                onClick={() => setIsVideoOpen(true)}
                className="group block w-full overflow-hidden rounded-[32px] border border-[#DAD9D1] bg-[#0D0D0D] p-4 text-left transition duration-200 hover:scale-[1.01] hover:shadow-[0_18px_44px_rgba(13,13,13,0.08)]"
              >
                <div className="relative overflow-hidden rounded-[26px] border border-white/10">
                  <video
                    src="/video.mp4"
                    muted
                    playsInline
                    loop
                    autoPlay
                    className="h-[420px] w-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,13,13,0.06),rgba(13,13,13,0.46))]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/92 text-[#0D0D0D] shadow-[0_10px_30px_rgba(0,0,0,0.2)] transition duration-200 group-hover:scale-105">
                      <Play className="h-8 w-8 fill-current" />
                    </span>
                  </div>
                </div>
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 36 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex rounded-full border border-[#D8D7CF] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#51514A]">
                Analyze Creative
              </span>
              <h2 className="mt-8 text-[clamp(2.5rem,4.8vw,4rem)] font-black leading-[1] tracking-[-0.05em]">
                Your AI-powered command center for campaign performance
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#66665F]">
                Adigator's advertising intelligence orchestrator evaluates creative assets through extraction, attention analysis,
                platform-fit checks, inventory-fit checks, business impact, and final decision scoring so teams move faster with clearer signals.
              </p>
              <div className="mt-8 space-y-4">
                {PERFORMANCE_BULLETS.map((item) => (
                  <div key={item} className="flex items-start gap-3 text-base text-[#30302C]">
                    <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#C8F04D] text-[#0D0D0D]">
                      <Check className="h-4 w-4" />
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/preview"
                className="mt-10 inline-flex items-center gap-2 rounded-full bg-[#0D0D0D] px-6 py-3 text-sm font-semibold text-white transition duration-200 hover:scale-[1.02] hover:shadow-[0_10px_24px_rgba(13,13,13,0.10)]"
              >
                Discover Analyze Creative
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </section>

        <section id="adroom" className="px-4 py-[120px] sm:px-6 lg:px-8">
          <div className="mx-auto grid w-[min(1320px,92vw)] gap-14 lg:grid-cols-2 lg:items-center">
            <motion.div
              initial={{ opacity: 0, x: -36 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.6 }}
              className="order-2 lg:order-1"
            >
              <span className="inline-flex rounded-full border border-[#D8D7CF] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#51514A]">
                Preview Studio
              </span>
              <h2 className="mt-8 text-[clamp(2.5rem,4.8vw,4rem)] font-black leading-[1] tracking-[-0.05em]">
                High-impact creativity at your fingertips
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#66665F]">
                Adigator's preview engine, environment templates, and fallback creative system generate polished,
                brand-tuned review surfaces so teams can evaluate placements in realistic context before launch.
              </p>
              <div className="mt-8 space-y-4">
                {CREATION_BULLETS.map((item) => (
                  <div key={item} className="flex items-start gap-3 text-base text-[#30302C]">
                    <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#C8F04D] text-[#0D0D0D]">
                      <Check className="h-4 w-4" />
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/preview-tool"
                className="mt-10 inline-flex items-center gap-2 rounded-full bg-[#0D0D0D] px-6 py-3 text-sm font-semibold text-white transition duration-200 hover:scale-[1.02] hover:shadow-[0_10px_24px_rgba(13,13,13,0.10)]"
              >
                Discover Preview Studio
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 36 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.6 }}
              className="order-1 lg:order-2"
            >
              <div className="relative min-h-[460px] rounded-[32px] border border-[#DAD9D1] bg-white p-6 shadow-[0_18px_50px_rgba(15,15,15,0.05)]">
                <div className="absolute left-8 top-8 w-[44%] rotate-[-7deg] overflow-hidden rounded-[24px] border border-[#E2E1D9] bg-white shadow-[0_18px_40px_rgba(15,15,15,0.08)]">
                  <Image src="/fallback-creatives/native-1080x1080/native-1.svg" alt="Creative sample 1" width={1080} height={1080} className="h-auto w-full" />
                </div>
                <div className="absolute right-8 top-12 w-[46%] rotate-[6deg] overflow-hidden rounded-[24px] border border-[#E2E1D9] bg-white shadow-[0_18px_40px_rgba(15,15,15,0.08)]">
                  <Image src="/fallback-creatives/inline-300x250/inline-1.svg" alt="Creative sample 2" width={300} height={250} className="h-auto w-full" />
                </div>
                <div className="absolute bottom-12 left-14 w-[52%] rotate-[4deg] overflow-hidden rounded-[24px] border border-[#E2E1D9] bg-white shadow-[0_18px_40px_rgba(15,15,15,0.08)]">
                  <Image src="/fallback-creatives/hero-970x250/hero-1.svg" alt="Creative sample 3" width={970} height={250} className="h-auto w-full" />
                </div>
                <div className="absolute bottom-8 right-10 w-[24%] rotate-[-6deg] overflow-hidden rounded-[24px] border border-[#E2E1D9] bg-white shadow-[0_18px_40px_rgba(15,15,15,0.08)]">
                  <Image src="/fallback-creatives/sidebar-160x600/side-1.svg" alt="Creative sample 4" width={160} height={600} className="h-auto w-full" />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="overflow-hidden px-4 py-[120px] sm:px-6 lg:px-8">
          <div className="mx-auto w-[min(1320px,92vw)] text-center">
            <p className="text-2xl font-bold tracking-tight text-[#1E1E1B]">Better ads, happier teams</p>
            <div className="mt-10 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
              <div className="product-logo-track flex min-w-max gap-5 py-3 hover:[animation-play-state:paused]">
                {tickerItems.map((logo, index) => (
                  <div
                    key={`${logo}-${index}`}
                    className="inline-flex h-16 min-w-[180px] items-center justify-center rounded-full border border-[#DEDDD5] bg-white px-8 text-sm font-semibold text-[#6A6A63] grayscale transition duration-200 hover:border-[#C8F04D] hover:text-[#141414] hover:grayscale-0"
                  >
                    {logo}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="testimonials" className="px-4 py-[120px] sm:px-6 lg:px-8">
          <div className="mx-auto w-[min(980px,92vw)] text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#73736D]">What our customers say</p>
            <div className="mt-10 rounded-[36px] border border-[#DEDDD5] bg-white px-8 py-14 shadow-[0_18px_50px_rgba(15,15,15,0.04)] sm:px-14">
              <p className="text-7xl font-black leading-none text-[#C8F04D]">&quot;</p>
              <div className="relative min-h-[190px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTestimonial}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -14 }}
                    transition={{ duration: 0.35 }}
                    className="absolute inset-0"
                  >
                    <p className="mx-auto max-w-4xl text-2xl italic leading-relaxed text-[#262622]">
                      {TESTIMONIALS[activeTestimonial].quote}
                    </p>
                    <p className="mt-8 text-base font-semibold text-[#0D0D0D]">{TESTIMONIALS[activeTestimonial].author}</p>
                    <p className="mt-1 text-sm text-[#74746E]">
                      {TESTIMONIALS[activeTestimonial].role}, {TESTIMONIALS[activeTestimonial].company}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="mt-10 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => cycleTestimonial(-1)}
                  aria-label="Previous testimonial"
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#DAD9D1] bg-[#F8F8F3] text-[#0D0D0D] transition duration-200 hover:scale-[1.02] hover:border-[#C8F04D]"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => cycleTestimonial(1)}
                  aria-label="Next testimonial"
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#DAD9D1] bg-[#F8F8F3] text-[#0D0D0D] transition duration-200 hover:scale-[1.02] hover:border-[#C8F04D]"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 flex items-center justify-center gap-2">
                {TESTIMONIALS.map((_, index) => (
                  <button
                    key={`dot-${index}`}
                    type="button"
                    aria-label={`Go to testimonial ${index + 1}`}
                    onClick={() => setActiveTestimonial(index)}
                    className={`h-2.5 rounded-full transition-all ${
                      index === activeTestimonial ? "w-8 bg-[#C8F04D]" : "w-2.5 bg-[#D6D5CD]"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-[120px] sm:px-6 lg:px-8">
          <div className="mx-auto grid w-[min(1320px,92vw)] gap-6 lg:grid-cols-2">
            {[
              {
                icon: PlugZap,
                title: "Plug in and perform",
                body: "Adigator works alongside your existing ad platforms, preview workflows, and downstream reporting systems so teams can move without rebuilding their stack.",
              },
              {
                icon: ShieldCheck,
                title: "Feel confident on compliance",
                body: "Adigator keeps creative validation, platform fit checks, and review outputs aligned with the specifications that matter before launch.",
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <article
                  key={card.title}
                  className="group rounded-[32px] border border-[#DDDCD4] bg-white p-8 transition duration-200 hover:-translate-y-1 hover:border-[#C8F04D] hover:shadow-[0_16px_36px_rgba(200,240,77,0.10)]"
                >
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0EFE8] text-[#0D0D0D]">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-6 text-3xl font-black tracking-tight">{card.title}</h3>
                  <p className="mt-4 max-w-xl text-base leading-relaxed text-[#66665F]">{card.body}</p>
                  <Link href="/preview-tool" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#0D0D0D]">
                    Learn more
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              );
            })}
          </div>
        </section>

        <section id="blog" className="px-4 py-[120px] sm:px-6 lg:px-8">
          <div className="mx-auto w-[min(1320px,92vw)]">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#73736D]">Blog</p>
              <Link href="/about" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0D0D0D]">
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              {BLOG_POSTS.map((post) => (
                <article
                  key={post.title}
                  className="group rounded-[30px] border border-[#DDDCD4] bg-white p-7 transition duration-200 hover:bg-[#F0EFE8] hover:shadow-[0_16px_34px_rgba(15,15,15,0.04)]"
                >
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex rounded-full border border-[#D8D7CF] bg-[#F8F8F3] px-3 py-1 text-xs font-semibold text-[#4E4E49]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="mt-6 text-2xl font-black leading-tight tracking-tight transition group-hover:underline">
                    {post.title}
                  </h3>
                  <div className="mt-8 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0D0D0D] text-sm font-bold text-white">
                      {post.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#0D0D0D]">
                        {post.author}
                        <span className="font-normal text-[#66665F]"> - {post.role}</span>
                      </p>
                      <p className="text-xs text-[#787872]">{post.date}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#0D0D0D] px-4 py-[120px] text-center text-white sm:px-6 lg:px-8">
          <div className="mx-auto w-[min(900px,92vw)]">
            <h2 className="text-[clamp(2.6rem,5vw,4.4rem)] font-black leading-[1] tracking-[-0.05em]">
              Maximize your impact
            </h2>
            <p className="mt-5 text-lg text-white/70">See how true AI can transform your business</p>
            <Link
              href="/preview-tool"
              className="mt-9 inline-flex items-center rounded-full bg-[#C8F04D] px-8 py-4 text-base font-semibold text-[#0D0D0D] transition duration-200 hover:scale-[1.02] hover:shadow-[0_16px_34px_rgba(200,240,77,0.18)]"
            >
              Book a Demo
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-[#0D0D0D] px-4 pb-10 pt-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid w-[min(1320px,92vw)] gap-10 border-t border-white/10 pt-12 md:grid-cols-[1.25fr_repeat(4,1fr)]">
          <div>
            <p className="text-2xl font-black tracking-tight">Adigator</p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
              AI-powered advertising intelligence for validation, preview, and launch-ready decision making.
            </p>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/55">{column.title}</p>
              <ul className="mt-4 space-y-3 text-sm text-white/70">
                {column.items.map((item) => (
                  <li key={`${column.title}-${item.label}`}>
                    <Link href={item.href} className="transition hover:text-white">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-10 flex w-[min(1320px,92vw)] flex-col gap-4 border-t border-white/10 pt-6 text-sm text-white/55 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <span>© 2026 Adigator</span>
            <Link href="/about" className="transition hover:text-white">
              Privacy Policy
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/75">
              Google Partner
            </span>
            <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/75">
              Meta Partner
            </span>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {isVideoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/72 px-4 backdrop-blur-sm"
            onClick={() => setIsVideoOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ duration: 0.3 }}
              className="relative w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-[#0D0D0D] p-4"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Close video"
                onClick={() => setIsVideoOpen(false)}
                className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
              <video src="/video.mp4" controls autoPlay playsInline className="h-auto max-h-[78vh] w-full rounded-[24px]" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .product-logo-track {
          animation: product-marquee 28s linear infinite;
        }

        @keyframes product-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @media (max-width: 1024px) {
          .product-logo-track {
            animation-duration: 22s;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .product-logo-track {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
