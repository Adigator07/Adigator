"use client";

import { useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { GeneratedEnvironment, SlotType } from "@/app/lib/preview-engine/types";

interface ThemeConfig {
  brand: string;
  heroGradient: string;
  primaryButton: string;
  surface: string;
  border: string;
  muted: string;
  navItems?: string[];
  accent?: string;
}

interface Props {
  theme: ThemeConfig;
  content: GeneratedEnvironment;
  slotType: SlotType;
  creativeUrl: string;
  creativeSize: string;
  device: "desktop" | "tablet" | "mobile";
}

type PlacementKey =
  | "header-banner"
  | "top-leaderboard"
  | "sidebar-sticky"
  | "inline-article"
  | "native-feed";

const SLOT_DIMENSIONS: Record<PlacementKey, { width: number; height: number }> = {
  "header-banner": { width: 728, height: 90 },
  "top-leaderboard": { width: 970, height: 250 },
  "sidebar-sticky": { width: 160, height: 600 },
  "inline-article": { width: 300, height: 250 },
  "native-feed": { width: 1080, height: 1080 },
};

const FALLBACK_CREATIVES = {
  banner728x90: [
    "/fallback-creatives/banner-728x90/promo-1.svg",
    "/fallback-creatives/banner-728x90/promo-2.svg",
  ],
  inline300x250: [
    "/fallback-creatives/inline-300x250/inline-1.svg",
    "/fallback-creatives/inline-300x250/inline-2.svg",
  ],
  sidebar160x600: [
    "/fallback-creatives/sidebar-160x600/side-1.svg",
    "/fallback-creatives/sidebar-160x600/side-2.svg",
  ],
  hero970x250: [
    "/fallback-creatives/hero-970x250/hero-1.svg",
    "/fallback-creatives/hero-970x250/hero-2.svg",
  ],
  mobile320x50: [
    "/fallback-creatives/mobile-320x50/mobile-1.svg",
    "/fallback-creatives/mobile-320x50/mobile-2.svg",
  ],
  native1080x1080: [
    "/fallback-creatives/native-1080x1080/native-1.svg",
    "/fallback-creatives/native-1080x1080/native-2.svg",
  ],
};

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickFallbackFromPool(pool: string[], seed: string): string {
  if (pool.length === 0) return "";
  const index = hashSeed(seed) % pool.length;
  return pool[index];
}

function pickPlacement(creativeSize: string, slotType: SlotType): PlacementKey {
  switch (creativeSize) {
    case "160x600":
    case "300x600":
      return "sidebar-sticky";
    case "300x250":
    case "336x280":
      return "inline-article";
    case "728x90":
    case "468x60":
    case "320x50":
    case "320x100":
      return "header-banner";
    case "970x250":
      return "top-leaderboard";
    case "1080x1080":
      return "native-feed";
    default:
      if (slotType === "sidebar") return "sidebar-sticky";
      if (slotType === "leaderboard") return "top-leaderboard";
      if (slotType === "banner") return "header-banner";
      if (slotType === "feed-card" || slotType === "native-recommendation") return "native-feed";
      return "inline-article";
  }
}

function WebsiteAdSlot({
  slot,
  activePlacement,
  creativeUrl,
  creativeSize,
  fallbackSrc,
  className,
  fit = "contain",
}: {
  slot: PlacementKey;
  activePlacement: PlacementKey;
  creativeUrl: string;
  creativeSize: string;
  fallbackSrc: string;
  className?: string;
  fit?: "cover" | "contain";
}) {
  const targetSize = SLOT_DIMENSIONS[slot];
  const isUsingUserCreative = slot === activePlacement && Boolean(creativeUrl);
  const renderSrc = isUsingUserCreative ? creativeUrl : fallbackSrc;

  return (
    <div
      className={className}
      style={{
        width: "100%",
        maxWidth: `${targetSize.width}px`,
      }}
    >
      <div
        className="flex items-center justify-center overflow-hidden bg-slate-900/20"
        style={{
          width: "100%",
          aspectRatio: `${targetSize.width} / ${targetSize.height}`,
        }}
      >
        <AnimatePresence mode="wait">
          {renderSrc ? (
            <motion.img
              key={`${renderSrc}-${slot}`}
              src={renderSrc}
              alt="Sponsored creative"
              className="max-h-full max-w-full"
              style={{ objectFit: isUsingUserCreative ? "contain" : "cover" }}
              initial={{ opacity: 0.45 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0.45 }}
              transition={{ duration: 0.22 }}
            />
          ) : (
            <motion.div
              key={`fallback-${slot}`}
              className="h-full w-full bg-slate-800/20"
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0.4 }}
              transition={{ duration: 0.22 }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function LandingPageTemplate({ theme, content, slotType, creativeUrl, creativeSize, device }: Props) {
  const isMobile = device === "mobile";
  const landing = content.landingPage;

  const headline = landing?.hero.headline || content.contextBlocks.find((block) => block.type === "headline")?.text || content.pageTitle;
  const primaryBody =
    landing?.hero.subheadline ||
    content.contextBlocks.find((block) => block.type === "body")?.text ||
    "A complete conversion landing page environment with realistic placements.";

  const bulletItems =
    landing?.hero.supportingBullets?.slice(0, 3) ||
    content.contextBlocks.filter((block) => block.type === "list-item").slice(0, 3).map((block) => block.text);

  const statItems =
    landing?.hero.trustIndicators?.slice(0, 3) ||
    content.contextBlocks.filter((block) => block.type === "stat").slice(0, 3).map((block) => block.text);

  const features = landing?.valueProposition.features?.slice(0, 6) || [];
  const testimonials = landing?.socialProof.testimonials?.slice(0, 3) || [];
  const navItems = theme.navItems || ["Overview", "Features", "Proof", "Pricing"];
  const footerLinks = landing?.footer.navigationLinks || navItems;
  const accent = theme.accent || "text-emerald-300";

  const activePlacement = pickPlacement(creativeSize, slotType);

  const fallbackByPlacement = useMemo(() => {
    const seedBase = `${content.publisherName || theme.brand}-${device}`;
    return {
      "header-banner": pickFallbackFromPool(device === "mobile" ? FALLBACK_CREATIVES.mobile320x50 : FALLBACK_CREATIVES.banner728x90, `${seedBase}-header-banner`),
      "top-leaderboard": pickFallbackFromPool(FALLBACK_CREATIVES.hero970x250, `${seedBase}-top-leaderboard`),
      "sidebar-sticky": pickFallbackFromPool(FALLBACK_CREATIVES.sidebar160x600, `${seedBase}-sidebar-sticky`),
      "inline-article": pickFallbackFromPool(FALLBACK_CREATIVES.inline300x250, `${seedBase}-inline-article`),
      "native-feed": pickFallbackFromPool(FALLBACK_CREATIVES.native1080x1080, `${seedBase}-native-feed`),
    } as Record<PlacementKey, string>;
  }, [content.publisherName, theme.brand, device]);

  useEffect(() => {
    const preloadList = [
      ...FALLBACK_CREATIVES.banner728x90,
      ...FALLBACK_CREATIVES.inline300x250,
      ...FALLBACK_CREATIVES.sidebar160x600,
      ...FALLBACK_CREATIVES.hero970x250,
      ...FALLBACK_CREATIVES.mobile320x50,
      ...FALLBACK_CREATIVES.native1080x1080,
    ];

    preloadList.forEach((src) => {
      const image = new Image();
      image.src = src;
    });
  }, []);

  return (
    <article className={`min-h-[1400px] ${theme.surface} text-white`}>
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/92 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <div className="text-xl font-black tracking-tight">{content.publisherName || theme.brand}</div>
          {!isMobile && (
            <nav className="flex items-center gap-6 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
              {navItems.map((item) => (
                <a key={item} href="#" className="transition hover:text-white">
                  {item}
                </a>
              ))}
            </nav>
          )}
          <button className={`rounded-xl px-4 py-2 text-xs font-bold transition ${theme.primaryButton}`}>Get Started</button>
        </div>

        <div className="mx-auto max-w-6xl px-5 pb-4 md:px-8">
          <WebsiteAdSlot
            slot="header-banner"
            activePlacement={activePlacement}
            creativeUrl={creativeUrl}
            creativeSize={creativeSize}
            fallbackSrc={fallbackByPlacement["header-banner"]}
            fit="contain"
            className="mx-auto"
          />
        </div>
      </header>

      <section className="border-b border-white/10 px-5 py-5 md:px-8">
        <div className="mx-auto max-w-6xl">
          <WebsiteAdSlot
            slot="top-leaderboard"
            activePlacement={activePlacement}
            creativeUrl={creativeUrl}
            creativeSize={creativeSize}
            fallbackSrc={fallbackByPlacement["top-leaderboard"]}
            fit="contain"
            className="mx-auto"
          />
        </div>
      </section>

      <section className={`bg-gradient-to-br ${theme.heroGradient} px-5 py-10 md:px-8 md:py-14`}>
        <div className={`mx-auto max-w-6xl ${isMobile ? "" : "grid grid-cols-[1.15fr_0.85fr] gap-8"}`}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">Live Website Experience</p>
            <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">{headline || "Built for real campaign performance"}</h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-100/90 md:text-2xl">{primaryBody}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {(bulletItems.length > 0 ? bulletItems : ["Higher intent traffic", "Fast-loading placements", "Context-aware creatives"]).map((item, index) => (
                <span key={`${item}-${index}`} className="rounded-full bg-white/12 px-3 py-1.5 text-xs font-medium text-slate-100">
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <button className={`rounded-xl px-6 py-3 text-sm font-bold ${theme.primaryButton}`}>
                {landing?.hero.primaryCta || "Learn More"}
              </button>
              <button className="rounded-xl border border-white/20 bg-white/8 px-6 py-3 text-sm font-semibold transition hover:bg-white/15">
                {landing?.hero.secondaryCta || "View Demo"}
              </button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 md:mt-0">
            {(statItems.length > 0 ? statItems : ["4.8/5 rating", "2.3x CTR lift", "Trusted by growth teams"]).map((item, index) => (
              <div key={`${item}-${index}`} className="rounded-2xl bg-black/20 px-4 py-3 backdrop-blur-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-300">Metric {index + 1}</p>
                <p className="mt-1 text-lg font-bold text-white">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-8 md:px-8 md:py-10">
        <div className={`mx-auto max-w-6xl ${isMobile ? "space-y-7" : "grid grid-cols-[minmax(0,1fr)_220px] gap-7"}`}>
          <main className="space-y-8">
            <article className="space-y-5 rounded-2xl bg-white/5 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Feature article</p>
              <h2 className="text-3xl font-black leading-tight text-white md:text-4xl">Why contextual preview drives smarter campaign launches</h2>
              <p className="text-base leading-relaxed text-slate-200/90">
                Teams ship faster when preview environments mimic real publisher behavior. This template renders natural page rhythm,
                supporting content, and real decision moments where creative competes for attention.
              </p>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="h-44 rounded-xl bg-gradient-to-br from-orange-500/30 via-rose-500/20 to-slate-900/30" />
                <div className="h-44 rounded-xl bg-gradient-to-br from-cyan-500/30 via-blue-500/20 to-slate-900/30" />
              </div>

              <p className="text-base leading-relaxed text-slate-200/90">
                Placement quality improves when the creative appears where users naturally pause. In-article placements are especially
                effective for educational intent, while sticky side rail placements keep conversion prompts visible without disrupting flow.
              </p>

              <WebsiteAdSlot
                slot="inline-article"
                activePlacement={activePlacement}
                creativeUrl={creativeUrl}
                creativeSize={creativeSize}
                fallbackSrc={fallbackByPlacement["inline-article"]}
                fit="contain"
                className="mx-auto"
              />

              <p className="text-base leading-relaxed text-slate-200/90">
                This simulation preserves spacing, typography, and interaction patterns so the creative feels integrated into the content
                journey instead of pasted on top of it.
              </p>
            </article>

            <section>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Product feed</p>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {(features.length > 0
                  ? features
                  : [
                      { title: "High-intent layouts", description: "Built for natural conversion flow.", iconIdea: "layout" },
                      { title: "Placement control", description: "Inject creatives in realistic positions.", iconIdea: "placement" },
                      { title: "Review velocity", description: "Faster feedback without context loss.", iconIdea: "speed" },
                    ])
                  .slice(0, 3)
                  .map((feature, index) => (
                    <article key={`${feature.title}-${index}`} className="rounded-2xl bg-white/5 p-4 transition hover:bg-white/10">
                      <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${accent}`}>{feature.iconIdea}</p>
                      <h3 className="mt-2 text-lg font-semibold text-white">{feature.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-300">{feature.description}</p>
                      <button className="mt-4 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20">Read more</button>
                    </article>
                  ))}
              </div>
            </section>

            <section>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Native social feed slot</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <article className="rounded-2xl bg-white/5 p-4">
                  <p className="text-sm font-semibold text-white">Community momentum</p>
                  <p className="mt-2 text-sm text-slate-300">Share campaign-ready assets with teams before launch and collect aligned approval quickly.</p>
                </article>

                <WebsiteAdSlot
                  slot="native-feed"
                  activePlacement={activePlacement}
                  creativeUrl={creativeUrl}
                  creativeSize={creativeSize}
                  fallbackSrc={fallbackByPlacement["native-feed"]}
                  fit="contain"
                  className="mx-auto"
                />
              </div>
            </section>
          </main>

          {!isMobile && (
            <aside className="space-y-4">
              <div className="sticky top-6 space-y-4">
                <WebsiteAdSlot
                  slot="sidebar-sticky"
                  activePlacement={activePlacement}
                  creativeUrl={creativeUrl}
                  creativeSize={creativeSize}
                  fallbackSrc={fallbackByPlacement["sidebar-sticky"]}
                  fit="contain"
                  className="mx-auto"
                />

                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Live comments</p>
                  <div className="mt-3 space-y-2">
                    {(testimonials.length > 0
                      ? testimonials
                      : [
                          { quote: "Feels like a real publisher preview.", name: "Maya", role: "Growth Lead" },
                          { quote: "Placement context is much clearer now.", name: "Noah", role: "Media Strategist" },
                          { quote: "Creative decisions are faster with this view.", name: "Iris", role: "Performance Manager" },
                        ])
                      .slice(0, 3)
                      .map((item, index) => (
                        <div key={`${item.name}-${index}`} className="rounded-xl bg-black/20 p-3">
                          <p className="text-xs text-white">{item.quote}</p>
                          <p className="mt-1 text-[11px] text-slate-400">{item.name} · {item.role}</p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>
      </section>

      <footer className="border-t border-white/10 bg-black/20 px-5 py-7 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">{content.publisherName || theme.brand}</p>
            <p className="text-xs text-slate-400">{landing?.footer.companyDescription || "Live creative simulation for launch teams."}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
            {footerLinks.map((item) => (
              <a key={item} href="#" className="transition hover:text-white">
                {item}
              </a>
            ))}
          </div>
          <p className="text-xs text-slate-500">{landing?.footer.legalMessaging || "Secure. Verified. Conversion-ready."}</p>
        </div>
      </footer>
    </article>
  );
}