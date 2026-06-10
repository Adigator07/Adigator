// Programmatic Ads platform-specific analysis logic
// Display environment + attention efficiency driven (not intent/social-emotion led)

import { getCrossPlatformForbiddenReminder } from "./platformBrain";

export type ProgrammaticCampaignGoal = "awareness" | "consideration" | "conversion";

export type ProgrammaticSignalLevel = "low" | "moderate" | "high";

export interface ProgrammaticExtractionSignals {
  headline: string;
  cta: string;
  primary_message: string;
  visual_elements: string[];
  text_density: ProgrammaticSignalLevel;
  brand_presence: ProgrammaticSignalLevel;
  emotional_cues: string[];
  readability: ProgrammaticSignalLevel;
  hierarchy_observations: string;
  trust_markers: string[];
  urgency_signals: string[];
  creative_type_hint?: string;
}

export interface ProgrammaticEnvironmentInsight {
  module: string;
  finding: string;
}

export interface ProgrammaticAdsDynamicEval {
  campaign_goal_focus: string;
  purpose: string;
  detected_signals: string[];
  missing_signals: string[];
  avoided_elements_found: string[];
  metrics: Array<{ label: string; score: number }>;
  best_analyzer_questions: Array<{ question: string; response: string }>;
  vertical_specific_signals: string[];
  environment_modules: ProgrammaticEnvironmentInsight[];
}

export interface ProgrammaticGoalEvaluationContext {
  goal: string;
  vertical: string;
  audienceStage: string;
  ctaPressure: string;
  urgencyLevel: ProgrammaticSignalLevel;
  width: number;
  height: number;
  extraction: ProgrammaticExtractionSignals;
  bannerBlindnessRisk?: "low" | "medium" | "high";
  peripheralRecognition?: "strong" | "moderate" | "weak";
}

interface ProgrammaticGoalProfile {
  focus: string;
  purpose: string;
  signalsToDetect: string[];
  avoidElements: string[];
  metrics: string[];
  questions: string[];
  aiPriorities: string[];
}

export const PROGRAMMATIC_RULES = {
  mindset: "Display environment + attention efficiency — survive cluttered publisher pages in under 1 second.",
  core_modules: [
    "Banner blindness detection",
    "Viewability optimization",
    "Publisher environment compatibility",
    "Display readability",
    "Motion efficiency (video/HTML5)",
    "Ad fatigue risk",
  ],
};

export const PROGRAMMATIC_GOAL_PROFILES: Record<ProgrammaticCampaignGoal, ProgrammaticGoalProfile> = {
  awareness: {
    focus: "Brand exposure and recall across publisher ecosystems",
    purpose:
      "Maximize brand exposure and recall — instant readability, banner standout, viewability-safe layout, and one-message simplicity dominate over conversion pressure.",
    signalsToDetect: [
      "Brand visibility (logo size, placement, recognition speed)",
      "Instant readability (large type, short copy, low cognitive load)",
      "Display attention (contrast vs busy pages, first-second recognition)",
      "Viewability optimization (safe margins, focal point, responsive quality)",
      "Creative simplicity (one message, fast scan)",
    ],
    avoidElements: [
      "Hard conversion CTA pressure on cold display inventory",
      "Dense copy blocks that fail peripheral scan",
      "Cluttered multi-message layouts",
    ],
    metrics: [
      "Brand recall score",
      "Banner visibility score",
      "Viewability effectiveness",
      "Readability score",
      "Attention capture strength",
      "Display clarity",
    ],
    questions: [
      "Can users understand this within 1 second?",
      "Will this stand out on cluttered publisher pages?",
      "Is the brand instantly recognizable?",
    ],
    aiPriorities: [
      "brand recognition speed",
      "peripheral readability",
      "banner standout",
      "viewability-safe composition",
    ],
  },
  consideration: {
    focus: "Mid-funnel interest and evaluation",
    purpose:
      "Push users into deeper interest — clear benefit hierarchy, professional trust, contextual relevance, and soft Learn More motivation.",
    signalsToDetect: [
      "Information hierarchy (benefits, structured messaging)",
      "Professional trust (credibility, premium consistency)",
      "Contextual relevance to publisher environments",
      "Mid-funnel value proposition clarity",
      "Learn More / soft CTA visibility",
    ],
    avoidElements: [
      "Aggressive buy-now pressure before trust is built",
      "Vague benefits without product understanding",
      "Flashy social-style aesthetics on premium publishers",
    ],
    metrics: [
      "Interest generation score",
      "Information clarity",
      "Trustworthiness",
      "Product understanding",
      "Mid-funnel engagement quality",
      "Educational value",
    ],
    questions: [
      "Does this make users interested enough to explore?",
      "Are the benefits instantly understandable?",
      "Does this build trust gradually?",
    ],
    aiPriorities: [
      "benefit hierarchy",
      "trust signals",
      "product understanding",
      "soft CTA clarity",
    ],
  },
  conversion: {
    focus: "Direct action in banner environments",
    purpose:
      "Drive direct action efficiently — dominant CTA, offer visibility, low-distraction layout, and conversion-focused hierarchy for display inventory.",
    signalsToDetect: [
      "Conversion clarity (CTA visibility, clear action path)",
      "Offer visibility (discount, urgency, trial/demo)",
      "Performance layout (high-contrast CTA, focused product)",
      "Retargeting-ready product familiarity",
      "Immediate value communication",
    ],
    avoidElements: [
      "Weak or buried CTA in banner hierarchy",
      "Missing offer/incentive on conversion creative",
      "Extra messaging that competes with action path",
    ],
    metrics: [
      "CTA dominance score",
      "Offer visibility score",
      "Conversion readiness",
      "Click efficiency",
      "Action clarity",
      "Purchase motivation",
    ],
    questions: [
      "Would users immediately know what to do?",
      "Does the CTA dominate visually?",
      "Is the offer compelling enough for banner environments?",
    ],
    aiPriorities: [
      "CTA dominance",
      "offer visibility",
      "action clarity",
      "low-distraction hierarchy",
    ],
  },
};

export const PROGRAMMATIC_VERTICAL_SIGNALS: Record<string, { label: string; signals: string[]; tone: string }> = {
  healthcare: {
    label: "Healthcare",
    tone: "Clean, trustworthy, non-aggressive",
    signals: ["Compliance-safe visuals", "Medical credibility", "Calm professional design", "Informative clarity"],
  },
  banking: {
    label: "Banking / FinTech",
    tone: "Secure, premium, professional — avoid flashy social aesthetics",
    signals: ["Security feeling", "Financial trust", "Data/privacy confidence", "Premium professionalism"],
  },
  finance: {
    label: "Finance",
    tone: "Secure, premium, professional",
    signals: ["Financial trust", "Security cues", "Professional tone", "Compliance-safe layout"],
  },
  luxury: {
    label: "Luxury",
    tone: "High-end, editorial, premium publisher friendly",
    signals: ["Minimalism", "Premium spacing", "Sophisticated typography", "Elegant imagery"],
  },
  technology: {
    label: "Technology",
    tone: "Informative, efficient, professional",
    signals: ["Product explanation clarity", "UI visibility", "Enterprise trust", "Problem-solving message"],
  },
  ecommerce: {
    label: "E-commerce / Retail",
    tone: "Product-forward, catalog-ready",
    signals: ["Product focus", "Offer visibility", "Catalog-readiness", "Dynamic ad compatibility"],
  },
  travel: {
    label: "Travel",
    tone: "Aspirational, experience-led",
    signals: ["Aspirational imagery", "Destination clarity", "Escape psychology", "Experience storytelling"],
  },
  education: {
    label: "Education / EdTech",
    tone: "Professional, achievement-oriented",
    signals: ["Career growth messaging", "Learning clarity", "Professional trust", "Achievement psychology"],
  },
  gaming: {
    label: "Gaming",
    tone: "High energy, motion-friendly",
    signals: ["Motion intensity", "Action visibility", "Gameplay clarity", "Excitement pacing"],
  },
  entertainment: {
    label: "Entertainment / OTT",
    tone: "Cinematic, trailer-paced",
    signals: ["Cinematic visuals", "Trailer pacing", "Genre emotion", "Watch-now urgency"],
  },
};

const GOAL_ALIASES: Record<string, ProgrammaticCampaignGoal> = {
  conversions: "conversion",
  lead_generation: "consideration",
  leads: "consideration",
  traffic: "consideration",
  engagement: "awareness",
  retargeting: "conversion",
};

export function normalizeProgrammaticGoal(goal: string): ProgrammaticCampaignGoal {
  const cleaned = (goal || "").toLowerCase().trim().replace(/\s+/g, "_");
  if (cleaned in PROGRAMMATIC_GOAL_PROFILES) return cleaned as ProgrammaticCampaignGoal;
  if (cleaned in GOAL_ALIASES) return GOAL_ALIASES[cleaned];
  return "awareness";
}

function corpus(extraction: ProgrammaticExtractionSignals): string {
  return [
    extraction.headline,
    extraction.primary_message,
    extraction.cta,
    extraction.hierarchy_observations,
    extraction.visual_elements.join(" "),
    extraction.emotional_cues.join(" "),
    extraction.trust_markers.join(" "),
    extraction.urgency_signals.join(" "),
    extraction.creative_type_hint || "",
  ]
    .join(" ")
    .toLowerCase();
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function hasPattern(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

function scoreMetric(label: string, score: number): { label: string; score: number } {
  return { label, score: clampScore(score) };
}

export function buildProgrammaticEnvironmentModules(
  extraction: ProgrammaticExtractionSignals,
  ctx: {
    width: number;
    height: number;
    bannerBlindnessRisk: "low" | "medium" | "high";
    peripheralRecognition: "strong" | "moderate" | "weak";
  },
): ProgrammaticEnvironmentInsight[] {
  const text = corpus(extraction);
  const ratio = ctx.height > 0 ? ctx.width / ctx.height : 1;
  const modules: ProgrammaticEnvironmentInsight[] = [];

  if (ctx.bannerBlindnessRisk === "high") {
    modules.push({
      module: "Banner Blindness Detection",
      finding:
        "This creative risks banner blindness due to predictable layout structure, generic stock feel, or weak focal point.",
    });
  } else if (ctx.bannerBlindnessRisk === "medium") {
    modules.push({
      module: "Banner Blindness Detection",
      finding: "Partial banner-blindness risk — template-like structure may blend into saturated display inventory.",
    });
  } else {
    modules.push({
      module: "Banner Blindness Detection",
      finding: "Focal contrast and hierarchy reduce predictable banner-blindness patterns.",
    });
  }

  const cropRisk =
    ratio < 0.45 || ratio > 3.8 || extraction.text_density === "high" || extraction.brand_presence === "low";
  modules.push({
    module: "Viewability Optimization",
    finding: cropRisk
      ? "CTA or brand visibility may reduce on smaller inventory placements — improve safe margins and center focal point."
      : "Cropping safety and focal-point placement appear adequate for mixed display sizes.",
  });

  const vibrant = /\b(neon|flash|loud|party|meme|tiktok|instagram)\b/.test(text);
  const premiumConflict = vibrant && extraction.emotional_cues.length > 2;
  modules.push({
    module: "Publisher Environment Compatibility",
    finding: premiumConflict
      ? "Overly vibrant or social-style visuals may conflict with premium finance or news publisher environments."
      : "Tone appears compatible with news, premium, and neutral editorial placements.",
  });

  modules.push({
    module: "Display Readability",
    finding:
      extraction.readability === "low" || extraction.text_density === "high"
        ? "Messaging requires too much reading for display inventory — simplify for 1-second scan."
        : extraction.readability === "moderate"
          ? "Readability is acceptable but can be tightened for small-banner adaptability."
          : "Font hierarchy and copy density support fast message scanning.",
  });

  const isMotion =
    /\b(video|motion|animated|html5|animation|trailer)\b/.test(text) ||
    extraction.creative_type_hint?.toLowerCase().includes("animated");
  modules.push({
    module: "Motion Efficiency (Video/HTML5)",
    finding: isMotion
      ? extraction.brand_presence === "low"
        ? "Key branding may appear too late for skippable display — front-load logo and offer in first frame."
        : "Motion-capable asset — ensure first-frame communicates brand and action before skip."
      : "Static creative — motion efficiency N/A; prioritize first-glance static hierarchy instead.",
  });

  modules.push({
    module: "Ad Fatigue Risk",
    finding:
      ctx.bannerBlindnessRisk !== "low" || extraction.text_density === "high"
        ? "Static visual structure may fatigue quickly in retargeting rotations — plan creative variation."
        : "Layout has enough novelty to resist immediate fatigue in standard rotation.",
  });

  return modules;
}

function buildGoalMetrics(
  goal: ProgrammaticCampaignGoal,
  extraction: ProgrammaticExtractionSignals,
  ctx: {
    ctaPressure: string;
    urgencyLevel: ProgrammaticSignalLevel;
    bannerBlindnessRisk: "low" | "medium" | "high";
    peripheralRecognition: "strong" | "moderate" | "weak";
  },
): Array<{ label: string; score: number }> {
  const text = corpus(extraction);
  const profile = PROGRAMMATIC_GOAL_PROFILES[goal];

  const brandScore =
    extraction.brand_presence === "high" ? 88 : extraction.brand_presence === "moderate" ? 65 : 38;
  const readScore =
    extraction.readability === "high"
      ? 90
      : extraction.readability === "moderate"
        ? extraction.text_density === "low"
          ? 75
          : 58
        : 35;
  const visibilityScore =
    ctx.bannerBlindnessRisk === "low" ? 85 : ctx.bannerBlindnessRisk === "medium" ? 58 : 32;
  const viewabilityScore =
    extraction.text_density !== "high" && extraction.brand_presence !== "low" ? 80 : 48;
  const attentionScore =
    ctx.peripheralRecognition === "strong" ? 86 : ctx.peripheralRecognition === "moderate" ? 60 : 38;
  const clarityScore = (readScore + visibilityScore) / 2;

  const trustScore =
    extraction.trust_markers.length >= 2 ? 90 : extraction.trust_markers.length === 1 ? 72 : 45;
  const infoScore = extraction.headline?.trim() && extraction.primary_message?.trim() ? 78 : 48;
  const productScore = extraction.visual_elements.length > 0 ? 75 : 42;
  const interestScore = (trustScore + infoScore + productScore) / 3;

  const ctaScore = extraction.cta?.trim()
    ? ctx.ctaPressure === "aggressive"
      ? 90
      : ctx.ctaPressure === "moderate"
        ? 74
        : 55
    : 28;
  const offerScore = hasPattern(text, [/\b(\d+%|off|discount|sale|free|trial|demo|offer)\b/])
    ? 84
    : 40;
  const urgencyScore =
    extraction.urgency_signals.length > 0 || ctx.urgencyLevel === "high" ? 82 : 45;
  const conversionReady = (ctaScore + offerScore + attentionScore) / 3;

  const metricMap: Record<string, number> = {};

  switch (goal) {
    case "awareness":
      metricMap["Brand recall score"] = brandScore;
      metricMap["Banner visibility score"] = visibilityScore;
      metricMap["Viewability effectiveness"] = viewabilityScore;
      metricMap["Readability score"] = readScore;
      metricMap["Attention capture strength"] = attentionScore;
      metricMap["Display clarity"] = clarityScore;
      break;
    case "consideration":
      metricMap["Interest generation score"] = interestScore;
      metricMap["Information clarity"] = infoScore;
      metricMap["Trustworthiness"] = trustScore;
      metricMap["Product understanding"] = productScore;
      metricMap["Mid-funnel engagement quality"] = (interestScore + trustScore) / 2;
      metricMap["Educational value"] = readScore;
      break;
    case "conversion":
      metricMap["CTA dominance score"] = ctaScore;
      metricMap["Offer visibility score"] = offerScore;
      metricMap["Conversion readiness"] = conversionReady;
      metricMap["Click efficiency"] = (ctaScore + attentionScore) / 2;
      metricMap["Action clarity"] = ctaScore;
      metricMap["Purchase motivation"] = (offerScore + urgencyScore) / 2;
      break;
  }

  return profile.metrics.map((label) => scoreMetric(label, metricMap[label] ?? 50));
}

function detectGoalSignals(
  goal: ProgrammaticCampaignGoal,
  extraction: ProgrammaticExtractionSignals,
  ctx: {
    ctaPressure: string;
    bannerBlindnessRisk: "low" | "medium" | "high";
    peripheralRecognition: "strong" | "moderate" | "weak";
  },
): { detected: string[]; missing: string[]; avoided: string[] } {
  const text = corpus(extraction);
  const detected: string[] = [];
  const missing: string[] = [];
  const avoided: string[] = [];

  const add = (cond: boolean, signal: string, miss?: string) => {
    if (cond) detected.push(signal);
    else if (miss) missing.push(miss);
  };

  switch (goal) {
    case "awareness":
      add(extraction.brand_presence !== "low", "Brand logo/identity visible for recall", "Brand not instantly recognizable");
      add(extraction.readability !== "low", "Large readable typography / short messaging", "Instant readability below display standard");
      add(ctx.bannerBlindnessRisk !== "high", "Banner standout vs cluttered pages", "Weak contrast — may not stand out on busy publishers");
      add(extraction.text_density !== "high", "One-message focus with minimal clutter", "Too much copy for 1-second scan");
      add(ctx.peripheralRecognition !== "weak", "Clear focal point for viewability", "Unclear focal point hurts viewability");
      if (extraction.cta && /\b(buy|shop now|order)\b/i.test(extraction.cta)) {
        avoided.push("Hard conversion CTA on awareness display creative");
      }
      if (extraction.text_density === "high") avoided.push("High text density increases banner blindness");
      break;
    case "consideration":
      add(!!extraction.headline?.trim(), "Structured benefit headline", "Benefit hierarchy not clear");
      add(extraction.trust_markers.length > 0, "Credibility / trust signals present", "Professional trust markers missing");
      add(extraction.primary_message?.trim().length > 0, "Value proposition communicated", "Why choose this? not clear");
      add(
        hasPattern(text, [/\b(learn|explore|discover|more|see how)\b/]) || ctx.ctaPressure !== "aggressive",
        "Soft Learn More / exploration CTA fit",
        "Learn More CTA or soft exploration path weak",
      );
      if (ctx.ctaPressure === "aggressive") avoided.push("Aggressive buy-now tone before trust is established");
      if (/\b(neon|meme|tiktok)\b/.test(text)) avoided.push("Flashy social aesthetic on consideration display");
      break;
    case "conversion":
      add(!!extraction.cta?.trim(), "Strong CTA visible in hierarchy", "CTA not dominant for conversion");
      add(
        hasPattern(text, [/\b(\d+%|off|discount|sale|free|trial|demo|offer|urgent|limited)\b/]) ||
          extraction.urgency_signals.length > 0,
        "Offer / urgency visible",
        "Discount or incentive not visible",
      );
      add(extraction.visual_elements.length > 0, "Product-focused placement", "Product not clearly centered");
      add(extraction.text_density !== "high", "Low-distraction conversion layout", "Extra messaging competes with CTA");
      if (!extraction.cta?.trim()) avoided.push("Missing conversion CTA");
      if (!hasPattern(text, [/\b(offer|discount|sale|free|trial)\b/]) && extraction.urgency_signals.length === 0) {
        avoided.push("Offer not compelling for banner conversion environments");
      }
      break;
  }

  return { detected, missing, avoided };
}

function answerQuestion(
  question: string,
  goal: ProgrammaticCampaignGoal,
  extraction: ProgrammaticExtractionSignals,
  metrics: Array<{ label: string; score: number }>,
): string {
  const avg = metrics.length ? metrics.reduce((s, m) => s + m.score, 0) / metrics.length : 50;
  const tone = avg >= 70 ? "Yes — " : avg >= 45 ? "Partially — " : "Unlikely — ";

  if (question.includes("1 second") || question.includes("understand")) {
    return `${tone}${extraction.readability !== "low" && extraction.text_density !== "high" ? "copy and hierarchy decode within a fast display scan window." : "too much reading is required for programmatic inventory."}`;
  }
  if (question.includes("cluttered publisher")) {
    return `${tone}${extraction.brand_presence === "high" ? "contrast and brand block help standout on busy pages." : "weak focal contrast may be ignored in cluttered layouts."}`;
  }
  if (question.includes("instantly recognizable")) {
    return `${tone}${extraction.brand_presence === "high" ? "brand is identifiable at peripheral glance speed." : "brand anchors need strengthening for recall."}`;
  }
  if (question.includes("interested enough to explore")) {
    return `${tone}${extraction.trust_markers.length > 0 ? "trust and benefits support mid-funnel exploration." : "interest hooks need clearer benefit framing."}`;
  }
  if (question.includes("benefits instantly")) {
    return `${tone}${extraction.headline?.trim() ? "headline communicates a scannable benefit." : "benefits are not instantly scannable."}`;
  }
  if (question.includes("trust gradually")) {
    return `${tone}${extraction.trust_markers.length > 0 ? "credibility cues build evaluation confidence." : "add proof before asking for commitment."}`;
  }
  if (question.includes("know what to do")) {
    return `${tone}${extraction.cta?.trim() ? `CTA "${extraction.cta}" provides a clear action path.` : "action path is unclear in the banner."}`;
  }
  if (question.includes("CTA dominate")) {
    return `${tone}${extraction.cta?.trim() ? "CTA is present — verify visual dominance vs headline/product." : "CTA does not dominate the display hierarchy."}`;
  }
  if (question.includes("compelling enough")) {
    return `${tone}${extraction.urgency_signals.length > 0 || /\b(offer|discount|sale)\b/.test(corpus(extraction)) ? "offer/urgency supports banner conversion." : "offer needs stronger visibility for display CTR."}`;
  }

  return `${tone}alignment with ${PROGRAMMATIC_GOAL_PROFILES[goal].focus.toLowerCase()} is ${avg >= 70 ? "strong" : avg >= 45 ? "mixed" : "weak"}.`;
}

function detectVerticalSignals(vertical: string, extraction: ProgrammaticExtractionSignals): string[] {
  const profile = PROGRAMMATIC_VERTICAL_SIGNALS[vertical];
  if (!profile) return [];
  const text = corpus(extraction);
  return profile.signals.filter((signal) => {
    const token = signal.split(" ")[0]?.toLowerCase();
    return (token && text.includes(token)) || extraction.trust_markers.length > 0;
  });
}

/** Deterministic Programmatic Ads goal + display-environment evaluation. */
export function buildProgrammaticAdsDynamicEval(
  context: ProgrammaticGoalEvaluationContext,
): ProgrammaticAdsDynamicEval {
  const goal = normalizeProgrammaticGoal(context.goal);
  const profile = PROGRAMMATIC_GOAL_PROFILES[goal];
  const bannerBlindnessRisk = context.bannerBlindnessRisk ?? inferBannerBlindnessRisk(context.extraction);
  const peripheralRecognition =
    context.peripheralRecognition ?? inferPeripheralRecognition(context.extraction);

  const signalResult = detectGoalSignals(goal, context.extraction, {
    ctaPressure: context.ctaPressure,
    bannerBlindnessRisk,
    peripheralRecognition,
  });

  const metrics = buildGoalMetrics(goal, context.extraction, {
    ctaPressure: context.ctaPressure,
    urgencyLevel: context.urgencyLevel,
    bannerBlindnessRisk,
    peripheralRecognition,
  });

  const verticalKey = context.vertical in PROGRAMMATIC_VERTICAL_SIGNALS ? context.vertical : null;
  const verticalSignals = verticalKey ? detectVerticalSignals(verticalKey, context.extraction) : [];
  const verticalFallback = verticalKey
    ? PROGRAMMATIC_VERTICAL_SIGNALS[verticalKey].signals.slice(0, 3)
    : [];

  const environment_modules = buildProgrammaticEnvironmentModules(context.extraction, {
    width: context.width,
    height: context.height,
    bannerBlindnessRisk,
    peripheralRecognition,
  });

  return {
    campaign_goal_focus: profile.focus,
    purpose: profile.purpose,
    detected_signals: signalResult.detected.slice(0, 8),
    missing_signals: signalResult.missing.slice(0, 6),
    avoided_elements_found: signalResult.avoided.slice(0, 5),
    metrics,
    best_analyzer_questions: profile.questions.map((question) => ({
      question,
      response: answerQuestion(question, goal, context.extraction, metrics),
    })),
    vertical_specific_signals: verticalSignals.length > 0 ? verticalSignals : verticalFallback,
    environment_modules,
  };
}

function inferBannerBlindnessRisk(
  extraction: ProgrammaticExtractionSignals,
): "low" | "medium" | "high" {
  if (extraction.emotional_cues.length === 0 && extraction.text_density !== "low") return "high";
  if (extraction.text_density === "high" || extraction.readability === "low") return "medium";
  return "low";
}

function inferPeripheralRecognition(
  extraction: ProgrammaticExtractionSignals,
): "strong" | "moderate" | "weak" {
  if (extraction.hierarchy_observations.toLowerCase().includes("unclear") || extraction.readability === "low") {
    return "weak";
  }
  return extraction.headline?.trim() ? "strong" : "moderate";
}

/** Inject only the selected programmatic goal into the AI system prompt. */
export function buildProgrammaticGoalPromptSection(goal: string, vertical: string): string {
  const progGoal = normalizeProgrammaticGoal(goal);
  const profile = PROGRAMMATIC_GOAL_PROFILES[progGoal];
  const verticalBlock = PROGRAMMATIC_VERTICAL_SIGNALS[vertical];
  const verticalLines = verticalBlock
    ? verticalBlock.signals.map((s) => `- ${s} (${verticalBlock.tone})`).join("\n")
    : "- Apply display readability, viewability, and publisher-safe standards.";
  const forbidden = getCrossPlatformForbiddenReminder("programmatic");

  return `
## ACTIVE PROGRAMMATIC ADS CAMPAIGN GOAL (evaluate ONLY this goal)

Platform mindset: Programmatic = display environment + attention efficiency across mixed publisher inventory.
NOT intent-led like Google. NOT emotion/social-scroll like Meta.
**${forbidden}**

**Selected goal: ${progGoal}**
**Focus:** ${profile.focus}
**Purpose:** ${profile.purpose}

**Signals to detect:**
${profile.signalsToDetect.map((s) => `- ${s}`).join("\n")}

**Flag if present (avoided for this goal):**
${profile.avoidElements.map((s) => `- ${s}`).join("\n")}

**Score in programmatic_ads_dynamic_eval.metrics (0-100 each):**
${profile.metrics.map((m) => `- ${m}`).join("\n")}

**Answer in programmatic_ads_dynamic_eval.best_analyzer_questions:**
${profile.questions.map((q) => `- ${q}`).join("\n")}

**Also populate programmatic_ads_dynamic_eval.environment_modules with findings for:**
- Banner Blindness Detection
- Viewability Optimization
- Publisher Environment Compatibility
- Display Readability
- Motion Efficiency (Video/HTML5)
- Ad Fatigue Risk

**Vertical overlay (${vertical.replace(/_/g, " ")}):**
${verticalLines}
`.trim();
}

export function getProgrammaticGoalPriorities(goal: string): string[] {
  return PROGRAMMATIC_GOAL_PROFILES[normalizeProgrammaticGoal(goal)].aiPriorities;
}

export function buildProgrammaticGoalFitNote(
  goal: string,
  extraction: ProgrammaticExtractionSignals,
  bannerBlindnessRisk: "low" | "medium" | "high",
): string {
  const progGoal = normalizeProgrammaticGoal(goal);
  if (progGoal === "awareness") {
    return bannerBlindnessRisk === "high"
      ? "Awareness programmatic creative needs stronger brand block and 1-second readability to survive display clutter."
      : "Brand recall and display clarity align with awareness objectives across publisher ecosystems.";
  }
  if (progGoal === "consideration") {
    return extraction.trust_markers.length > 0
      ? "Trust and benefit hierarchy support mid-funnel evaluation in display environments."
      : "Consideration goal needs clearer benefits and credibility before soft conversion asks.";
  }
  return extraction.cta?.trim()
    ? "CTA and offer structure support direct conversion in banner inventory."
    : "Conversion programmatic creative needs a dominant CTA and visible offer for action clarity.";
}
