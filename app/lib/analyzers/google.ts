// Google Ads platform-specific analysis logic
// Intent-driven — NOT Meta (emotion/social) or Programmatic (banner clutter) logic

import type { AnalyzerContext, AnalyzerExtraction } from "./types";
import { getCrossPlatformForbiddenReminder } from "./platformBrain";

export type GoogleCampaignGoal =
  | "awareness"
  | "traffic"
  | "conversion"
  | "lead_generation"
  | "engagement"
  | "app_installs"
  | "retargeting";

interface GoogleGoalProfile {
  focus: string;
  purpose: string;
  signalsToDetect: string[];
  avoidElements: string[];
  metrics: string[];
  questions: string[];
}

export const GOOGLE_GOAL_PROFILES: Record<GoogleCampaignGoal, GoogleGoalProfile> = {
  awareness: {
    focus: "Brand recall for high-intent display/search contexts",
    purpose: "Maximize brand exposure with clear logo, colors, and memorable message — soft CTA acceptable.",
    signalsToDetect: ["Logo prominence", "Brand colors", "Memorable tagline", "Emotional appeal", "Visual simplicity"],
    avoidElements: ["Aggressive conversion CTA", "Cluttered product detail", "Heavy text blocks"],
    metrics: ["Brand visibility", "Message clarity", "Visual memorability", "Hook strength"],
    questions: ["Will users remember this brand?", "Does the creative create curiosity?", "Is branding instantly visible?"],
  },
  conversion: {
    focus: "Purchase/signup action clarity",
    purpose: "Drive conversion with dominant CTA, offer visibility, product focus, urgency, and trust.",
    signalsToDetect: ["CTA strength", "Offer/price visibility", "Product focus", "Urgency/FOMO", "Trust indicators"],
    avoidElements: ["Weak CTA", "Ambiguous offer", "Missing price/product"],
    metrics: ["CTA strength", "Offer clarity", "Conversion intent", "Urgency fit"],
    questions: ["Is the user motivated to buy now?", "Is the offer clear?", "Does the CTA stand out?"],
  },
  traffic: {
    focus: "Click intent and destination clarity",
    purpose: "Drive qualified clicks with strong headline, clean layout, and click-oriented CTA.",
    signalsToDetect: ["Headline clarity", "Click intent", "Clean layout", "Destination relevance"],
    avoidElements: ["Vague headline", "Buried CTA", "Cluttered hierarchy"],
    metrics: ["Headline power", "Click intent", "Layout clarity"],
    questions: ["Is there a strong reason to click?", "Is the destination obvious?"],
  },
  app_installs: {
    focus: "App value and install CTA",
    purpose: "Show app UI, store badge, app name, and download CTA with core use case in few words.",
    signalsToDetect: ["App store badge", "App UI mockup", "Clear app name", "Download/install CTA"],
    avoidElements: ["Lifestyle without app context", "Missing app UI"],
    metrics: ["App clarity", "CTA visibility", "Use-case communication"],
    questions: ["Is the app's core value clear?", "Is the download CTA prominent?"],
  },
  lead_generation: {
    focus: "Trust-first lead capture",
    purpose: "Lead with trust signals, benefit, then low-friction CTA (Get Quote, Book Demo).",
    signalsToDetect: ["Trust signals", "Form/demo reference", "Professional tone", "Benefit clarity"],
    avoidElements: ["Aggressive sales without trust", "Missing lead incentive"],
    metrics: ["Trust score", "CTA clarity", "Value communication"],
    questions: ["Does this look trustworthy?", "Is the lead incentive clear?"],
  },
  engagement: {
    focus: "Interaction and curiosity",
    purpose: "Provoke reaction with interesting visual, curiosity-gap copy, or interactive feel.",
    signalsToDetect: ["Curiosity-gap copy", "Interesting visual", "Interactive feel"],
    avoidElements: ["Boring static layout", "Hard sell without hook"],
    metrics: ["Visual interest", "Curiosity strength", "Engagement potential"],
    questions: ["Does this provoke a reaction?", "Is it visually arresting?"],
  },
  retargeting: {
    focus: "Return intent reinforcement",
    purpose: "Show previously viewed product, personalized message, discount, and urgency.",
    signalsToDetect: ["Product reminder", "Personalized copy", "Discount/urgency"],
    avoidElements: ["Generic awareness messaging", "No offer"],
    metrics: ["Recognition", "Urgency", "Offer strength"],
    questions: ["Does this remind the user of their intent?", "Is the urgency compelling?"],
  },
};

const GOAL_ALIASES: Record<string, GoogleCampaignGoal> = {
  conversions: "conversion",
  leads: "lead_generation",
  lead: "lead_generation",
};

export function normalizeGoogleGoal(goal: string): GoogleCampaignGoal {
  const cleaned = (goal || "").toLowerCase().trim().replace(/\s+/g, "_");
  if (cleaned in GOOGLE_GOAL_PROFILES) return cleaned as GoogleCampaignGoal;
  if (cleaned in GOAL_ALIASES) return GOAL_ALIASES[cleaned];
  return "awareness";
}

/** Inject only the selected Google goal into the AI system prompt. */
export function buildGoogleGoalPromptSection(goal: string, vertical: string): string {
  const googleGoal = normalizeGoogleGoal(goal);
  const profile = GOOGLE_GOAL_PROFILES[googleGoal];
  const forbidden = getCrossPlatformForbiddenReminder("google_ads");

  return `
## ACTIVE GOOGLE ADS CAMPAIGN GOAL (evaluate ONLY this goal)

Platform mindset: Google Ads = intent-driven, search-behavior, conversion clarity. NOT Meta. NOT Programmatic.

**Selected goal: ${googleGoal.replace(/_/g, " ")}**
**Focus:** ${profile.focus}
**Purpose:** ${profile.purpose}
**${forbidden}**

**Signals to detect:**
${profile.signalsToDetect.map((s) => `- ${s}`).join("\n")}

**Flag if present:**
${profile.avoidElements.map((s) => `- ${s}`).join("\n")}

**Score in google_ads_dynamic_eval.metrics (0-100):**
${profile.metrics.map((m) => `- ${m}`).join("\n")}

**Answer in google_ads_dynamic_eval.best_analyzer_questions:**
${profile.questions.map((q) => `- ${q}`).join("\n")}

**Vertical:** ${vertical.replace(/_/g, " ")} — apply Google-relevant trust, offer, and clarity signals for this industry.
`.trim();
}

// --- Platform Intelligence Injection ---
export const GOOGLE_RULES = {
  priority_metrics: [
    "CTR (click-through rate)",
    "Banner readability under 3 seconds",
    "CTA visibility at 300x250 size",
    "Conversion intent signals",
    "Text-to-image ratio (under 20%)",
    "Quality Score relevance",
    "Engagement interaction intent",
    "Retargeting discount/urgency prominence",
  ],
  format_requirements: [
    "Must work at 300x250, 728x90, 160x600, 320x50 sizes",
    "Logo must be identifiable at smallest format",
    "CTA must be visible without hover at all sizes",
    "Headline and CTA text must be legible at 12px equivalent",
    "Avoid text-heavy designs that fail Google display policy",
  ],
  failure_patterns: [
    "CTA buried in lower third with low contrast",
    "Logo too small to recognize in banner format",
    "Text-heavy layout that fails Google 20% text rule",
    "No urgency signal for conversion-goal campaigns",
    "Visually cluttered composition that drops CTR",
  ],
  winning_patterns: [
    "Single dominant focal element with clean negative space",
    "High-contrast CTA button placed in natural reading endpoint",
    "Brand color used as background for instant brand recall",
    "Value proposition visible in first line of headline",
    "Price or offer shown prominently for conversion campaigns",
  ],
  goal_intelligence: {
    awareness: "Maximize brand recall — logo size, brand colors, and memorable visual over CTA strength",
    traffic: "Balance curiosity-gap headline with clear CTA — directional language performs well",
    conversion: "Lead with offer, price, or urgency — CTA must be the most visually dominant element after the product",
    leads: "Trust signals first (logos, testimonials), then benefit, then low-friction CTA like 'Get Free Quote'",
    app_install: "Show app UI screenshot, use platform badge, highlight the core use case in 5 words or fewer",
    engagement: "Use an interesting visual, interactive feel, or curiosity-gap copy to provoke a reaction",
    retargeting: "Show the previously viewed product, personalized messaging, and strong urgency/discount",
  },
};

export const GOOGLE_VERTICAL_BENCHMARKS = {
  ecommerce: { avg_ctr: "0.35%", top_signal: "Product image + price + urgency CTA" },
  technology: { avg_ctr: "0.28%", top_signal: "Feature benefit headline + free trial CTA" },
  real_estate: { avg_ctr: "0.22%", top_signal: "Property photo + location + contact CTA" },
  finance: { avg_ctr: "0.19%", top_signal: "Trust signal + specific offer + compliance-safe CTA" },
  fashion: { avg_ctr: "0.31%", top_signal: "Lifestyle image + product highlight + discount CTA" },
  travel: { avg_ctr: "0.41%", top_signal: "Destination imagery + price point + urgency" },
  restaurant: { avg_ctr: "0.38%", top_signal: "Food photography + offer + location signal" },
};

export function analyzeGoogleDisplay(extraction: AnalyzerExtraction, context: AnalyzerContext) {
  // Dynamic, contextual Google Ads analysis
  const { normalized, attention, goal, audienceStage, ctaPressure, urgencyLevel } = context;
  const size = `${normalized.width}x${normalized.height}`;
  const assetRatio = normalized.width > 0 && normalized.height > 0 ? (normalized.width / normalized.height).toFixed(2) : 'N/A';
  const hasStrongCTA = extraction.cta && extraction.cta.length > 0 && ctaPressure !== 'soft';
  const isReadable = extraction.readability !== 'low' && extraction.text_density !== 'high';
  const brandClear = extraction.brand_presence === 'high';
  const visualImpact = extraction.emotional_cues.length > 0 ? 'Strong' : 'Neutral';
  const hierarchy = extraction.hierarchy_observations || '';

  // Human-like summary
  const summary = [
    `Google Ads Creative Analysis:`,
    `- Asset size: ${size} (ratio: ${assetRatio})`,
    `- Headline: ${extraction.headline || 'None'}`,
    `- CTA: ${extraction.cta || 'None'} (${hasStrongCTA ? 'Strong' : 'Weak'})`,
    `- Brand presence: ${extraction.brand_presence}`,
    `- Readability: ${extraction.readability}`,
    `- Text density: ${extraction.text_density}`,
    `- Visual impact: ${visualImpact}`,
    `- Hierarchy: ${hierarchy}`,
    `- Attention path: ${attention.first_focus} → ${attention.friction_points.join(' / ') || 'No major friction'} → CTA`,
    `- Audience stage: ${audienceStage}, Goal: ${goal}`,
    `- Urgency: ${urgencyLevel}, CTA Pressure: ${ctaPressure}`
  ].join('\n');

  // Platform fit and risks
  const risks = [];
  if (!isReadable) risks.push('Low readability or high text density may reduce scan speed and CTR.');
  if (!hasStrongCTA) risks.push('CTA is weak or missing for conversion/traffic goals.');
  if (!brandClear) risks.push('Brand presence is not strong—logo or colors may be unclear.');
  if (extraction.text_density === 'high') risks.push('High text density can suppress performance in Google Display.');

  return {
    summary,
    signals: extraction,
    attention,
    asset: { size, assetRatio },
    cta: extraction.cta,
    brand: extraction.brand_presence,
    visualImpact,
    hierarchy,
    risks,
    recommendations: [
      ...(isReadable ? [] : ['Increase text contrast and reduce copy blocks for better scan speed.']),
      ...(!hasStrongCTA ? ['Add a clear, action-oriented CTA for your campaign goal.'] : []),
      ...(!brandClear ? ['Strengthen brand logo/identity for instant recognition.'] : []),
      ...(extraction.text_density === 'high' ? ['Reduce text density for better display performance.'] : [])
    ]
  };
}
