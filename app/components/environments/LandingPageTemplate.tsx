"use client";

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

function AdFrame({
  creativeUrl,
  creativeSize,
  label,
  maxWidth = 960,
  fit = "contain",
  minHeight = 120,
}: {
  creativeUrl: string;
  creativeSize: string;
  label: string;
  maxWidth?: number;
  fit?: "contain" | "cover";
  minHeight?: number;
}) {
  const [w, h] = creativeSize.split("x").map(Number);
  const safeW = w || 300;
  const safeH = h || 250;
  const renderW = Math.min(safeW, maxWidth);
  const scale = renderW / safeW;
  const renderH = Math.max(minHeight, Math.round(safeH * scale));

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-wider text-slate-400">{label}</span>
        <span className="text-[10px] text-slate-400 bg-slate-900/70 px-1.5 py-0.5 rounded font-mono">{creativeSize}</span>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-700/40 bg-white/95" style={{ width: renderW, maxWidth: "100%", height: renderH }}>
        <img src={creativeUrl} alt="Creative" style={{ width: "100%", height: "100%", objectFit: fit, display: "block" }} />
      </div>
    </div>
  );
}

export default function LandingPageTemplate({ theme, content, slotType, creativeUrl, creativeSize, device }: Props) {
  const isMobile = device === "mobile";
  const landing = content.landingPage;
  const headline = landing?.hero.headline || content.contextBlocks.find((b) => b.type === "headline")?.text || content.pageTitle || "Performance landing page";
  const primaryBody = landing?.hero.subheadline || content.contextBlocks.filter((b) => b.type === "body")[0]?.text || "Turn contextual traffic into measurable outcomes with a focused conversion journey.";
  const statItems = (landing?.hero.trustIndicators || content.contextBlocks.filter((b) => b.type === "stat").map((b) => b.text)).slice(0, 3);
  const bulletItems = landing?.hero.supportingBullets || content.contextBlocks.filter((b) => b.type === "list-item").slice(0, 3).map((b) => b.text);
  const features = landing?.valueProposition.features || [];
  const testimonials = landing?.socialProof.testimonials || [];
  const howItWorks = landing?.howItWorks || [];
  const benefits = landing?.benefits || [];
  const navItems = theme.navItems || ["Overview", "Features", "Proof", "Pricing"];
  const footerLinks = landing?.footer.navigationLinks || navItems;
  const accent = theme.accent || "text-emerald-400";
  const slotInHero = slotType === "banner" || slotType === "leaderboard" || slotType === "sticky" || slotType === "interstitial";
  const slotInSideRail = slotType === "sidebar";
  const slotInlineCard = slotType === "inline" || slotType === "native-recommendation" || slotType === "feed-card";
  const slotFeatureCard = slotType === "product-tile" || slotType === "dashboard-module";

  return (
    <div className={`min-h-screen rounded-xl border ${theme.border} ${theme.surface} text-white overflow-hidden shadow-xl`}>
      <header className="px-5 md:px-8 py-4 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="text-lg font-black tracking-tight">{content.publisherName || theme.brand}</div>
          {!isMobile && (
            <nav className="flex items-center gap-5 text-xs text-slate-300 font-semibold uppercase tracking-wider">
              {navItems.map((item) => <span key={item}>{item}</span>)}
            </nav>
          )}
          <button className={`px-4 py-2 rounded-lg text-xs font-bold ${theme.primaryButton}`}>Get Started</button>
        </div>
      </header>

      {slotInHero && slotType !== "interstitial" && (
        <div className="px-5 md:px-8 py-4 border-b border-white/10">
          <div className="max-w-6xl mx-auto flex justify-center">
            <AdFrame creativeUrl={creativeUrl} creativeSize={creativeSize} label="Live placement" fit="contain" minHeight={90} />
          </div>
        </div>
      )}

      {slotType === "interstitial" && (
        <div className="px-5 md:px-8 pt-5">
          <div className="max-w-6xl mx-auto rounded-2xl border border-white/15 bg-black/20 p-4">
            <AdFrame creativeUrl={creativeUrl} creativeSize={creativeSize} label="Hero takeover" maxWidth={1100} />
          </div>
        </div>
      )}

      <section className={`px-5 md:px-8 py-8 md:py-12 bg-gradient-to-br ${theme.heroGradient}`}>
        <div className={`max-w-6xl mx-auto ${isMobile ? "" : "grid grid-cols-[1.1fr_0.9fr] gap-8 items-center"}`}>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300 font-semibold mb-3">Live Website Experience</p>
            <h1 className="text-3xl md:text-5xl font-black leading-tight">{headline}</h1>
            <p className="text-slate-200 mt-4 text-sm md:text-base leading-relaxed">{primaryBody}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {(bulletItems.length ? bulletItems : ["High-conversion messaging", "Clear UX hierarchy", "Commercial landing structure"]).slice(0, 3).map((item, idx) => (
                <span key={`${item}-${idx}`} className="px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs text-slate-200">
                  {item}
                </span>
              ))}
            </div>
            <div className="flex gap-3 mt-5 flex-wrap">
              <button className={`px-5 py-2.5 rounded-lg text-sm font-bold ${theme.primaryButton}`}>{landing?.hero.primaryCta || "Launch Campaign"}</button>
              <button className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-white/20 bg-white/5 hover:bg-white/10 transition">{landing?.hero.secondaryCta || "View Demo"}</button>
            </div>
          </div>
          {!slotInSideRail && !slotFeatureCard && (
            <div className="mt-6 md:mt-0">
              <div className="rounded-2xl border border-white/15 bg-black/20 p-4">
                <AdFrame creativeUrl={creativeUrl} creativeSize={creativeSize} label="Hero placement" maxWidth={680} fit="contain" minHeight={220} />
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="px-5 md:px-8 py-8">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-4">
          {(statItems.length > 0 ? statItems : ["Trusted by growth teams", "Proven conversion structure", "Built for live campaigns"]).slice(0, 3).map((item, idx) => (
            <div key={`${item}-${idx}`} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-400">Metric {idx + 1}</p>
              <p className="text-lg font-black mt-1">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {features.length > 0 && (
        <section className="px-5 md:px-8 pb-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between gap-4 mb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">Value Proposition</p>
                <h2 className="text-2xl font-black mt-2">{landing?.valueProposition.sectionTitle}</h2>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {features.slice(0, 6).map((feature, idx) => (
                <div key={`${feature.title}-${idx}`} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className={`text-xs uppercase tracking-wider ${accent}`}>{feature.iconIdea}</p>
                  <p className="text-lg font-bold mt-3">{feature.title}</p>
                  <p className="text-sm text-slate-300 mt-2 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="px-5 md:px-8 pb-10">
        <div className={`max-w-6xl mx-auto ${isMobile ? "" : "grid grid-cols-[1fr_320px] gap-6"}`}>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-black">{landing?.offerPromotion.headline || "Why this page feels real"}</h2>
            <p className={`mt-3 text-sm leading-relaxed ${theme.muted}`}>{landing?.offerPromotion.explanation || primaryBody}</p>
            {landing?.offerPromotion.urgency && <p className="mt-3 text-sm text-amber-300 font-semibold">{landing.offerPromotion.urgency}</p>}
            <ul className="mt-4 space-y-2 text-sm text-slate-200">
              {(benefits.length > 0 ? benefits : [
                { text: "Single clear value proposition above the fold." },
                { text: "Focused CTA with low-friction decision path." },
                { text: "Proof-driven blocks to reduce bounce and hesitation." },
              ]).slice(0, 4).map((item, idx) => (
                <li key={`${typeof item === "string" ? item : item.text}-${idx}`} className="flex items-start gap-2">
                  <span className={`${accent} mt-0.5`}>+</span>
                  <span>{typeof item === "string" ? item : item.text}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 grid md:grid-cols-3 gap-3">
              {(howItWorks.length > 0 ? howItWorks : [
                { title: "Connect the promise", description: "Match the landing promise to the ad message." },
                { title: "Build trust", description: "Surface proof and clarity before hesitation." },
                { title: "Drive action", description: "Lead users to one strong CTA." },
              ]).slice(0, 3).map((item, idx) => (
                <div key={`${item.title}-${idx}`} className="rounded-xl border border-white/10 bg-black/15 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Step {idx + 1}</p>
                  <p className="text-sm font-semibold text-white mt-1">{item.title}</p>
                  <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                </div>
              ))}
            </div>

            {slotInlineCard && (
              <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-3">
                <AdFrame creativeUrl={creativeUrl} creativeSize={creativeSize} label="Inline module" fit="contain" />
              </div>
            )}

            {slotFeatureCard && (
              <div className="mt-5 grid md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs uppercase tracking-wider text-slate-400">Feature card</p>
                  <p className="text-sm mt-2">High-intent users can act immediately from this conversion card.</p>
                </div>
                <div className="rounded-xl border border-white/15 bg-black/25 p-3">
                  <AdFrame creativeUrl={creativeUrl} creativeSize={creativeSize} label="Feature creative" maxWidth={460} fit="contain" />
                </div>
              </div>
            )}
          </div>

          {!isMobile && (
            <aside className="space-y-4">
              {slotInSideRail && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <AdFrame creativeUrl={creativeUrl} creativeSize={creativeSize} label="Sidebar placement" maxWidth={300} fit="contain" minHeight={250} />
                </div>
              )}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-wider text-slate-400">Social Proof</p>
                <div className="mt-3 space-y-2 text-sm">
                  {(testimonials.length > 0 ? testimonials : [
                    { quote: "Great fit for live campaign previews.", name: "Jordan Lee", role: "Growth Manager" },
                    { quote: "Much more commercial and believable.", name: "Sara Khan", role: "Creative Strategist" },
                    { quote: "The CTA hierarchy feels production-ready.", name: "Daniel Park", role: "Performance Lead" },
                  ]).slice(0, 3).map((item, idx) => (
                    <div key={`${item.name}-${idx}`} className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                      <p className="text-sm text-white">{item.quote}</p>
                      <p className="text-[11px] text-slate-400 mt-1">{item.name} • {item.role}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-wider text-slate-400">Trust Summary</p>
                <div className="mt-3 space-y-2">
                  <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                    <p className="text-sm text-white font-medium">{landing?.socialProof.ratingSummary || "4.8/5 landing page quality score"}</p>
                  </div>
                  <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                    <p className="text-sm text-white font-medium">{landing?.socialProof.trustStatement || "Designed to feel native inside real commercial experiences."}</p>
                  </div>
                  <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                    <p className="text-sm text-white font-medium">{landing?.offerPromotion.ctaText || landing?.finalConversion.ctaText || "Get Started"}</p>
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>
      </section>

      <section className="px-5 md:px-8 pb-10">
        <div className="max-w-6xl mx-auto rounded-2xl border border-white/10 bg-black/20 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-semibold">Final Conversion</p>
            <h3 className="text-2xl font-black mt-2">{landing?.finalConversion.headline || "Ready to convert more visitors?"}</h3>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl">{landing?.finalConversion.valueStatement || "Use a live commercial landing structure with stronger proof and clearer calls to action."}</p>
          </div>
          <button className={`px-5 py-3 rounded-lg text-sm font-bold ${theme.primaryButton}`}>{landing?.finalConversion.ctaText || landing?.hero.primaryCta || "Get Started"}</button>
        </div>
      </section>

      <footer className="px-5 md:px-8 py-6 border-t border-white/10 bg-black/15">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-white">{content.publisherName || theme.brand}</p>
            <p className="text-xs text-slate-400 mt-1">{landing?.footer.companyDescription || "Commercial landing experiences built for conversion performance."}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-300 font-semibold uppercase tracking-wider">
            {footerLinks.map((item) => <span key={item}>{item}</span>)}
          </div>
          <div className="text-xs text-slate-500">{landing?.footer.legalMessaging || "Secure. Trusted. Conversion-ready."}</div>
        </div>
      </footer>
    </div>
  );
}
