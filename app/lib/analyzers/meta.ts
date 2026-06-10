// Meta Ads platform-specific analysis logic
// Emotion + Attention + Behavior-based (unlike Google Ads which is intent-based)

import { getCrossPlatformForbiddenReminder } from "./platformBrain";

export type MetaCampaignGoal =
  | "awareness"
  | "traffic"
  | "conversion"
  | "lead_generation"
  | "engagement"
  | "app_installs"
  | "retargeting";

export type MetaSignalLevel = "low" | "moderate" | "high";

export interface MetaExtractionSignals {
  headline: string;
  cta: string;
  primary_message: string;
  visual_elements: string[];
  text_density: MetaSignalLevel;
  brand_presence: MetaSignalLevel;
  emotional_cues: string[];
  readability: MetaSignalLevel;
  hierarchy_observations: string;
  trust_markers: string[];
  urgency_signals: string[];
  creative_type_hint?: string;
}

export interface MetaAdsDynamicEval {
  campaign_goal_focus: string;
  purpose: string;
  detected_signals: string[];
  missing_signals: string[];
  avoided_elements_found: string[];
  metrics: Array<{ label: string; score: number }>;
  best_analyzer_questions: Array<{ question: string; response: string }>;
  vertical_specific_signals: string[];
}

export interface MetaGoalEvaluationContext {
  goal: string;
  vertical: string;
  audienceStage: string;
  ctaPressure: string;
  urgencyLevel: MetaSignalLevel;
  width: number;
  height: number;
  extraction: MetaExtractionSignals;
  thumbStopStrength?: "strong" | "moderate" | "weak";
  socialNativeStatus?: "authentic" | "mixed" | "banner_like";
}

interface MetaGoalProfile {
  focus: string;
  purpose: string;
  signalsToDetect: string[];
  avoidElements: string[];
  metrics: string[];
  questions: string[];
  aiPriorities: string[];
}

export const META_RULES = {
  core_evaluation_axes: [
    "Scroll-stop power (thumb-stop strength)",
    "Emotional pull (first-frame emotion)",
    "Social-native feel (organic vs. banner ad)",
    "Thumb-stop power (message lands in <2s without sound)",
    "Mobile-first composition (vertical/square optimized)",
  ],
  psychology_questions: [
    "Will users stop scrolling?",
    "Will this create emotional reaction?",
    "Does this feel native to Instagram/Facebook?",
    "Will users engage naturally?",
  ],
  format_requirements: [
    "Vertical (9:16) or square (1:1) formats preferred",
    "Critical content must avoid top/bottom 15% safe zone for Stories/Reels",
    "Text overlay must be minimal — heavy text hurts delivery",
    "First frame must be scroll-stopping without sound",
    "Brand should appear within first 1-3 seconds",
  ],
  failure_patterns: [
    "Looks like a banner ad, not native social content",
    "Heavy text overlay that suppresses Meta delivery",
    "No emotional hook in first frame",
    "Desktop-composition on mobile-first platform",
    "Generic stock imagery with no human relatability",
  ],
};

export const META_GOAL_PROFILES: Record<MetaCampaignGoal, MetaGoalProfile> = {
  awareness: {
    focus: "Brand recall while scrolling",
    purpose: "Make users remember the brand while scrolling — scroll-stop, emotional hook, and visual identity dominate over hard CTA.",
    signalsToDetect: [
      "Scroll-stop power (contrast, faces, motion cues, first-frame hook)",
      "Brand shown early with consistent visual identity",
      "Emotional trigger (happiness, curiosity, inspiration, excitement)",
      "Social-native / organic Instagram feel",
      "Hook in first 1–3 seconds with minimal reading effort",
    ],
    avoidElements: [
      "Hard CTA pressure for cold discovery audiences",
      "Overly corporate / banner-ad layout",
      "Heavy text overlay",
    ],
    metrics: [
      "Thumb-stop score",
      "Emotional impact score",
      "Brand recall score",
      "Scroll interruption score",
      "Visual memorability",
      "Reels compatibility",
    ],
    questions: [
      "Would users stop scrolling?",
      "Will users remember this brand later?",
      "Does it emotionally attract users quickly?",
    ],
    aiPriorities: ["scroll interruption", "brand recall speed", "emotional first frame", "reels-safe composition"],
  },
  conversion: {
    focus: "Impulse purchase / signup action",
    purpose: "Push users to buy, sign up, or act instantly — desire, offer clarity, social proof, and CTA dominance drive the evaluation.",
    signalsToDetect: [
      "Purchase psychology (aspiration, desirability, before/after)",
      "CTA button emphasis (Shop Now, Order Now)",
      "Social proof (reviews, UGC, influencer trust)",
      "Offer clarity (discount, sale urgency, limited time)",
      "Product centered in real-life usage with minimal distraction",
    ],
    avoidElements: [
      "Vague product shots without offer",
      "Missing price or discount visibility",
      "No social proof on conversion creative",
      "Soft CTA on action-stage campaign",
    ],
    metrics: [
      "Purchase intent score",
      "Offer attractiveness",
      "CTA dominance",
      "Visual persuasion score",
      "Shopping urgency",
      "Social proof strength",
    ],
    questions: [
      "Would users buy impulsively?",
      "Does this create desire immediately?",
      "Is the offer impossible to ignore?",
    ],
    aiPriorities: ["product desirability", "CTA visibility", "offer clarity", "social proof", "urgency"],
  },
  traffic: {
    focus: "Curiosity-driven clicks",
    purpose: "Drive clicks from curiosity — teaser psychology, thumb-stopping headlines, and viral-native feel matter more than hard sell.",
    signalsToDetect: [
      "Curiosity gap / teaser messaging",
      "Thumb-stopping headline (bold, emotional, fast-read)",
      "Click motivation (FOMO, information gap)",
      "Native social / viral content feel",
    ],
    avoidElements: [
      "Dry corporate headlines",
      "Low visual energy",
      "Banner-ad composition",
    ],
    metrics: [
      "Curiosity score",
      "Click probability",
      "Headline power",
      "Thumb-stop rate",
      "Link curiosity strength",
    ],
    questions: [
      "Would users tap to know more?",
      "Does this create curiosity?",
      "Does it feel clickable?",
    ],
    aiPriorities: ["curiosity gap", "headline power", "thumb-stop", "native social feel"],
  },
  app_installs: {
    focus: "Instant install motivation",
    purpose: "Get users to install the app — mobile-first layout, visible app UI, lifestyle use-case, and Reels-style energy.",
    signalsToDetect: [
      "Vertical-friendly / phone mockup composition",
      "App UI clearly visible",
      "Real-life problem-solving scenario",
      "Quick benefit communication",
      "Dynamic / Reels-style movement cues",
    ],
    avoidElements: [
      "Desktop-style composition",
      "No app UI visible",
      "Generic lifestyle without app context",
    ],
    metrics: [
      "Install intent",
      "Mobile optimization",
      "App UI clarity",
      "Feature understanding",
      "App desirability",
    ],
    questions: [
      "Would users install instantly?",
      "Does the app look useful?",
      "Does it feel modern and easy?",
    ],
    aiPriorities: ["app UI visibility", "mobile-first format", "ease-of-use feel", "feature clarity"],
  },
  lead_generation: {
    focus: "Trustworthy form motivation",
    purpose: "Collect leads — trust, empathy, valuable lead magnet, and low-friction signup feel outweigh aggressive closing.",
    signalsToDetect: [
      "Trust building (faces, testimonials, professional tone)",
      "Lead magnet (consultation, ebook, demo, trial)",
      "Low-friction signup messaging",
      "Emotional pain point resonance",
    ],
    avoidElements: [
      "Cold corporate tone without empathy",
      "No trust signals",
      "Pushy close without value offer",
    ],
    metrics: [
      "Trust score",
      "Form motivation",
      "Lead magnet strength",
      "Emotional persuasion",
      "Signup confidence",
    ],
    questions: [
      "Would users submit their details?",
      "Does this feel trustworthy?",
      "Is the offer valuable enough?",
    ],
    aiPriorities: ["trust signals", "lead magnet clarity", "low friction", "empathy"],
  },
  engagement: {
    focus: "Social interaction and sharing",
    purpose: "Increase likes, comments, shares, and saves — relatability, humor, viral format, and comment triggers are primary.",
    signalsToDetect: [
      "Relatable / humorous / storytelling hook",
      "Viral or meme / Reels-trend aesthetic",
      "Strong human emotion (surprise, motivation, funny)",
      "Comment triggers (questions, polls, tag-a-friend)",
    ],
    avoidElements: [
      "Boring static promotional imagery",
      "Hard-sell tone that kills engagement",
      "No emotional hook",
    ],
    metrics: [
      "Shareability score",
      "Viral probability",
      "Emotional engagement",
      "Comment potential",
      "Save-worthy value",
    ],
    questions: [
      "Would people comment on this?",
      "Would users share this to friends?",
      "Does this feel social-native?",
    ],
    aiPriorities: ["shareability", "comment triggers", "viral format", "relatability"],
  },
  retargeting: {
    focus: "Warm audience re-engagement",
    purpose: "Bring back warm audiences — familiarity, personalization, urgency, and trust reinforcement reconnect previous intent.",
    signalsToDetect: [
      "Product / cart / recently-viewed reminder",
      "Urgency (ending soon, low stock, limited time)",
      "Personalized messaging cues",
      "Trust reinforcement (reviews, ratings, guarantees)",
    ],
    avoidElements: [
      "Cold generic awareness messaging",
      "No personalization or product reminder",
      "Missing urgency for hot audiences",
    ],
    metrics: [
      "Re-engagement strength",
      "Return intent",
      "Urgency effectiveness",
      "Familiarity score",
      "Conversion reminder quality",
    ],
    questions: [
      "Does this reconnect emotionally?",
      "Would previous visitors return?",
      "Does it create urgency to act now?",
    ],
    aiPriorities: ["familiarity", "urgency", "personalization", "trust reinforcement"],
  },
};

export const META_VERTICAL_SIGNALS: Record<string, { label: string; signals: string[] }> = {
  healthcare: {
    label: "Healthcare",
    signals: ["Trustworthiness", "Human empathy", "Calm clinical design", "Hope/recovery emotion", "Compliance-safe visuals"],
  },
  fashion: {
    label: "Fashion",
    signals: ["Lifestyle aspiration", "Trend appeal", "Influencer feel", "Instagrammable aesthetic", "Premium styling"],
  },
  technology: {
    label: "Technology",
    signals: ["Productivity visuals", "UI clarity", "Problem-solving message", "Modern tech feel", "Innovation trust"],
  },
  food: {
    label: "Restaurants / Food",
    signals: ["Craving triggers", "Food close-ups", "Taste visualization", "Delivery urgency", "Freshness appeal"],
  },
  luxury: {
    label: "Luxury",
    signals: ["Minimal elegance", "Premium typography", "High-end visuals", "Exclusivity emotion", "Sophisticated aesthetics"],
  },
  travel: {
    label: "Travel",
    signals: ["Escape emotion", "Adventure feeling", "Wanderlust psychology", "Scenic beauty", "Experience storytelling"],
  },
  gaming: {
    label: "Gaming",
    signals: ["Energy intensity", "Action visuals", "Competitive excitement", "Motion-heavy editing", "Gamer culture feel"],
  },
  entertainment: {
    label: "Entertainment / OTT",
    signals: ["Cinematic storytelling", "Drama intensity", "Emotional suspense", "Celebrity attraction", "Trailer-style pacing"],
  },
};

const META_GOAL_ALIASES: Record<string, MetaCampaignGoal> = {
  conversions: "conversion",
  leads: "lead_generation",
  lead: "lead_generation",
  app_install: "app_installs",
};

export function normalizeMetaGoal(goal: string): MetaCampaignGoal {
  const cleaned = (goal || "").toLowerCase().trim().replace(/\s+/g, "_");
  if (cleaned in META_GOAL_PROFILES) return cleaned as MetaCampaignGoal;
  if (cleaned in META_GOAL_ALIASES) return META_GOAL_ALIASES[cleaned];
  return "awareness";
}

function corpus(extraction: MetaExtractionSignals): string {
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

function isMobileFirst(width: number, height: number): boolean {
  return height > width || Math.abs(width - height) < 80;
}

function inferThumbStop(
  extraction: MetaExtractionSignals,
  width: number,
  height: number,
): "strong" | "moderate" | "weak" {
  const text = corpus(extraction);
  const hasFace = /\b(face|person|people|human|smile|model|doctor|patient)\b/.test(text);
  const hasMotion = /\b(motion|dynamic|reels|video|action|fast)\b/.test(text);
  const hasEmotion = extraction.emotional_cues.length > 0;
  const highContrast = extraction.brand_presence === "high" || extraction.readability !== "low";
  const score =
    (hasEmotion ? 25 : 0) +
    (hasFace ? 20 : 0) +
    (hasMotion ? 15 : 0) +
    (highContrast ? 15 : 0) +
    (extraction.text_density !== "high" ? 15 : 0) +
    (isMobileFirst(width, height) ? 10 : 0);
  if (score >= 65) return "strong";
  if (score >= 40) return "moderate";
  return "weak";
}

function inferSocialNative(extraction: MetaExtractionSignals): "authentic" | "mixed" | "banner_like" {
  const text = corpus(extraction);
  const ugc = /\b(ugc|organic|authentic|raw|casual|selfie|reels|tiktok)\b/.test(text);
  if (ugc || (extraction.emotional_cues.length > 0 && extraction.text_density !== "high")) return "authentic";
  if (extraction.text_density === "high" || extraction.readability === "low") return "banner_like";
  return "mixed";
}

function scoreMetric(label: string, score: number): { label: string; score: number } {
  return { label, score: clampScore(score) };
}

function detectVerticalSignals(vertical: string, extraction: MetaExtractionSignals): string[] {
  const key = vertical in META_VERTICAL_SIGNALS ? vertical : "unknown";
  if (key === "unknown") return [];
  const text = corpus(extraction);
  const profile = META_VERTICAL_SIGNALS[key];
  return profile.signals.filter((signal) => {
    const tokens = signal.toLowerCase().split(/\s+/).filter((t) => t.length > 4);
    return tokens.some((t) => text.includes(t)) || extraction.emotional_cues.length > 0;
  });
}

function buildGoalMetrics(
  goal: MetaCampaignGoal,
  extraction: MetaExtractionSignals,
  ctx: {
    thumbStop: "strong" | "moderate" | "weak";
    socialNative: "authentic" | "mixed" | "banner_like";
    ctaPressure: string;
    urgencyLevel: MetaSignalLevel;
    width: number;
    height: number;
  },
): Array<{ label: string; score: number }> {
  const text = corpus(extraction);
  const profile = META_GOAL_PROFILES[goal];
  const thumbBase = ctx.thumbStop === "strong" ? 82 : ctx.thumbStop === "moderate" ? 58 : 35;
  const brandScore = extraction.brand_presence === "high" ? 85 : extraction.brand_presence === "moderate" ? 62 : 38;
  const emotionScore =
    extraction.emotional_cues.length >= 2 ? 88 : extraction.emotional_cues.length === 1 ? 68 : 40;
  const ctaScore = extraction.cta?.trim()
    ? ctx.ctaPressure === "aggressive"
      ? 88
      : ctx.ctaPressure === "moderate"
        ? 72
        : 55
    : 25;
  const trustScore =
    extraction.trust_markers.length >= 2 ? 90 : extraction.trust_markers.length === 1 ? 70 : 42;
  const urgencyScore =
    extraction.urgency_signals.length > 0 || ctx.urgencyLevel === "high"
      ? 85
      : ctx.urgencyLevel === "moderate"
        ? 62
        : 35;
  const offerScore = hasPattern(text, [
    /\b(\d+%|off|discount|sale|deal|save|free|limited|offer)\b/,
  ])
    ? 82
    : 40;
  const curiosityScore = extraction.headline?.trim()
    ? hasPattern(text, [/\b(secret|why|how|won't believe|discover|revealed|mystery|\?)\b/])
      ? 85
      : 65
    : 38;
  const nativeScore =
    ctx.socialNative === "authentic" ? 88 : ctx.socialNative === "mixed" ? 58 : 32;
  const mobileScore = isMobileFirst(ctx.width, ctx.height) ? 85 : 45;
  const appUiScore = hasPattern(text, [/\b(app|ui|screen|dashboard|install|download)\b/]) ? 82 : 42;
  const reelsScore =
    ctx.height > ctx.width && extraction.text_density !== "high" ? 80 : 52;

  const metricMap: Record<string, number> = {};

  switch (goal) {
    case "awareness":
      metricMap["Thumb-stop score"] = thumbBase;
      metricMap["Emotional impact score"] = emotionScore;
      metricMap["Brand recall score"] = brandScore;
      metricMap["Scroll interruption score"] = thumbBase;
      metricMap["Visual memorability"] = (thumbBase + brandScore) / 2;
      metricMap["Reels compatibility"] = reelsScore;
      break;
    case "conversion":
      metricMap["Purchase intent score"] = (emotionScore + offerScore) / 2;
      metricMap["Offer attractiveness"] = offerScore;
      metricMap["CTA dominance"] = ctaScore;
      metricMap["Visual persuasion score"] = (thumbBase + emotionScore) / 2;
      metricMap["Shopping urgency"] = urgencyScore;
      metricMap["Social proof strength"] = trustScore;
      break;
    case "traffic":
      metricMap["Curiosity score"] = curiosityScore;
      metricMap["Click probability"] = (curiosityScore + ctaScore) / 2;
      metricMap["Headline power"] = extraction.headline?.trim() ? curiosityScore : 35;
      metricMap["Thumb-stop rate"] = thumbBase;
      metricMap["Link curiosity strength"] = (curiosityScore + nativeScore) / 2;
      break;
    case "app_installs":
      metricMap["Install intent"] = (appUiScore + ctaScore) / 2;
      metricMap["Mobile optimization"] = mobileScore;
      metricMap["App UI clarity"] = appUiScore;
      metricMap["Feature understanding"] = extraction.primary_message?.trim() ? 72 : 45;
      metricMap["App desirability"] = (emotionScore + appUiScore) / 2;
      break;
    case "lead_generation":
      metricMap["Trust score"] = trustScore;
      metricMap["Form motivation"] = (trustScore + offerScore) / 2;
      metricMap["Lead magnet strength"] = offerScore;
      metricMap["Emotional persuasion"] = emotionScore;
      metricMap["Signup confidence"] = (trustScore + ctaScore) / 2;
      break;
    case "engagement":
      metricMap["Shareability score"] = (nativeScore + emotionScore) / 2;
      metricMap["Viral probability"] = nativeScore;
      metricMap["Emotional engagement"] = emotionScore;
      metricMap["Comment potential"] = hasPattern(text, [/\b(\?|tag|comment|share|poll)\b/]) ? 82 : 48;
      metricMap["Save-worthy value"] = (emotionScore + thumbBase) / 2;
      break;
    case "retargeting":
      metricMap["Re-engagement strength"] = (brandScore + urgencyScore) / 2;
      metricMap["Return intent"] = (urgencyScore + ctaScore) / 2;
      metricMap["Urgency effectiveness"] = urgencyScore;
      metricMap["Familiarity score"] = brandScore;
      metricMap["Conversion reminder quality"] = (offerScore + trustScore) / 2;
      break;
  }

  return profile.metrics.map((label) =>
    scoreMetric(label, metricMap[label] ?? 50),
  );
}

function detectGoalSignals(
  goal: MetaCampaignGoal,
  extraction: MetaExtractionSignals,
  ctx: { thumbStop: "strong" | "moderate" | "weak"; socialNative: "authentic" | "mixed" | "banner_like"; width: number; height: number },
): { detected: string[]; missing: string[]; avoided: string[] } {
  const text = corpus(extraction);
  const detected: string[] = [];
  const missing: string[] = [];
  const avoided: string[] = [];
  const profile = META_GOAL_PROFILES[goal];

  const add = (cond: boolean, signal: string, miss?: string) => {
    if (cond) detected.push(signal);
    else if (miss) missing.push(miss);
  };

  switch (goal) {
    case "awareness":
      add(ctx.thumbStop !== "weak", "Scroll-stop visual interruption present", "Strong scroll-stop hook in first frame");
      add(extraction.brand_presence !== "low", "Brand visibility supports recall", "Brand not prominent in first seconds");
      add(extraction.emotional_cues.length > 0, `Emotional trigger: ${extraction.emotional_cues[0]}`, "Emotional hook for fast-scroll attention");
      add(ctx.socialNative !== "banner_like", "Social-native / organic feed feel", "Feels banner-like rather than Instagram-native");
      add(extraction.text_density !== "high", "Minimal reading effort", "Heavy text overlay hurts awareness delivery");
      if (extraction.cta && /\b(buy|shop now|order)\b/i.test(extraction.cta)) {
        avoided.push("Hard conversion CTA pressure on awareness creative");
      }
      if (extraction.text_density === "high") avoided.push("Heavy text overlay");
      break;
    case "conversion":
      add(!!extraction.cta?.trim(), "Action CTA present", "Clear Shop Now / Buy CTA missing");
      add(
        hasPattern(text, [/\b(\d+%|off|discount|sale|deal|save|free|limited)\b/]) || extraction.urgency_signals.length > 0,
        "Offer or urgency visible",
        "Discount / offer not visible",
      );
      add(extraction.trust_markers.length > 0, "Social proof detected", "Reviews / testimonials / UGC trust missing");
      add(
        extraction.visual_elements.length > 0 || /\b(product|item|package)\b/.test(text),
        "Product visual focus",
        "Product not clearly centered",
      );
      if (!extraction.cta?.trim()) avoided.push("Missing conversion CTA");
      if (extraction.trust_markers.length === 0 && ctx.socialNative === "banner_like") {
        avoided.push("No social proof on conversion-focused creative");
      }
      break;
    case "traffic":
      add(extraction.headline?.trim().length > 0, "Thumb-stopping headline present", "Bold curiosity headline missing");
      add(
        hasPattern(text, [/\b(learn|discover|see why|find out|more|visit|curious|\?)\b/]),
        "Click / curiosity motivation",
        "Weak click motivation",
      );
      add(ctx.thumbStop !== "weak", "Visual energy supports thumb-stop", "Low visual energy for traffic");
      add(ctx.socialNative !== "banner_like", "Viral-native social feel", "Reads like display banner not feed content");
      if (ctx.socialNative === "banner_like") avoided.push("Corporate banner-ad feel");
      break;
    case "app_installs":
      add(isMobileFirst(ctx.width, ctx.height), "Mobile-first vertical composition", "Not optimized for vertical mobile");
      add(hasPattern(text, [/\b(app|ui|screen|interface|install|download)\b/]), "App UI or install context visible", "App UI not visible");
      add(!!extraction.primary_message?.trim() || !!extraction.headline?.trim(), "Quick benefit communication", "Core app benefit unclear");
      add(ctx.thumbStop !== "weak", "Dynamic / energetic first frame", "Static frame lacks install energy");
      if (!hasPattern(text, [/\b(app|ui|screen|install|download)\b/])) {
        avoided.push("No app UI or install context in creative");
      }
      break;
    case "lead_generation":
      add(extraction.trust_markers.length > 0, "Trust signals present", "Testimonials / credibility markers missing");
      add(
        hasPattern(text, [/\b(free|consult|demo|trial|ebook|webinar|quote|guide)\b/]),
        "Lead magnet or value offer",
        "Lead magnet value not communicated",
      );
      add(extraction.emotional_cues.length > 0, "Emotional pain / empathy cue", "Emotional resonance for lead capture");
      add(
        hasPattern(text, [/\b(easy|simple|quick|minutes|no credit)\b/]) || extraction.text_density !== "high",
        "Low-friction signup feel",
        "High-friction / dense signup messaging",
      );
      if (extraction.trust_markers.length === 0) avoided.push("No trust-building elements");
      break;
    case "engagement":
      add(extraction.emotional_cues.length > 0, "Emotional storytelling hook", "No emotional hook for engagement");
      add(ctx.socialNative === "authentic", "Social-native shareable format", "Not social-native — low share potential");
      add(
        hasPattern(text, [/\b(\?|tag|comment|share|poll|friend)\b/]) || extraction.headline?.includes("?"),
        "Comment / interaction trigger",
        "No question or comment trigger",
      );
      if (extraction.cta && /\b(shop|buy|order)\b/i.test(extraction.cta)) {
        avoided.push("Hard-sell CTA tone reduces engagement potential");
      }
      break;
    case "retargeting":
      add(
        extraction.urgency_signals.length > 0 || hasPattern(text, [/\b(limited|ends|last|stock|still|reminder|cart)\b/]),
        "Urgency or reminder cues",
        "Urgency / cart reminder missing",
      );
      add(extraction.brand_presence !== "low", "Familiar product / brand reminder", "Weak familiarity for warm audience");
      add(extraction.trust_markers.length > 0, "Trust reinforcement", "Reviews / guarantees missing");
      add(offerVisible(text), "Offer or incentive for return visit", "No compelling return offer");
      if (!extraction.urgency_signals.length && !hasPattern(text, [/\b(still|back|reminder|cart|viewed)\b/])) {
        avoided.push("Generic cold messaging — lacks personalization");
      }
      break;
  }

  // Fill detected from profile when we have strong generic signals
  if (detected.length < 2 && extraction.emotional_cues.length > 0) {
    detected.push(`Emotional cue supports ${profile.focus.toLowerCase()}`);
  }

  return { detected, missing, avoided };
}

function offerVisible(text: string): boolean {
  return hasPattern(text, [/\b(\d+%|off|discount|sale|deal|save|free|offer|back)\b/]);
}

function answerQuestion(
  question: string,
  goal: MetaCampaignGoal,
  extraction: MetaExtractionSignals,
  metrics: Array<{ label: string; score: number }>,
  ctx: { thumbStop: "strong" | "moderate" | "weak"; socialNative: "authentic" | "mixed" | "banner_like" },
): string {
  const avg = metrics.length
    ? metrics.reduce((s, m) => s + m.score, 0) / metrics.length
    : 50;
  const tone = avg >= 70 ? "Yes — " : avg >= 45 ? "Partially — " : "Unlikely — ";

  if (question.includes("stop scrolling")) {
    return `${tone}${ctx.thumbStop === "strong" ? "contrast, emotion, or faces can interrupt the feed." : "the first frame lacks a strong thumb-stop hook."}`;
  }
  if (question.includes("remember")) {
    return `${tone}${extraction.brand_presence === "high" ? "brand identity is visible early for recall." : "brand anchors are too weak for memory after scroll."}`;
  }
  if (question.includes("emotionally attract")) {
    return `${tone}${extraction.emotional_cues.length > 0 ? `emotional cues (${extraction.emotional_cues.slice(0, 2).join(", ")}) land quickly.` : "no fast emotional trigger is detected."}`;
  }
  if (question.includes("buy impulsively") || question.includes("desire")) {
    return `${tone}${extraction.cta ? "CTA and offer structure support impulse." : "missing CTA/offer blocks impulse action."}`;
  }
  if (question.includes("impossible to ignore")) {
    return `${tone}${offerVisible(corpus(extraction)) || extraction.urgency_signals.length > 0 ? "offer/urgency is visible." : "offer is not prominent enough."}`;
  }
  if (question.includes("tap to know") || question.includes("curiosity") || question.includes("clickable")) {
    return `${tone}${extraction.headline?.trim() ? "headline supports curiosity-gap psychology." : "no strong teaser headline for clicks."}`;
  }
  if (question.includes("install")) {
    return `${tone}${hasPattern(corpus(extraction), [/\b(app|install|download|ui)\b/]) ? "app value and UI read clearly on mobile." : "app benefit/UI is not clear enough."}`;
  }
  if (question.includes("useful") || question.includes("modern")) {
    return `${tone}${ctx.socialNative === "authentic" ? "feels contemporary and mobile-native." : "feels dated or overly corporate for app installs."}`;
  }
  if (question.includes("submit") || question.includes("trustworthy") || question.includes("valuable")) {
    return `${tone}${extraction.trust_markers.length > 0 ? "trust cues support form completion." : "trust gap may block lead submission."}`;
  }
  if (question.includes("comment") || question.includes("share")) {
    return `${tone}${ctx.socialNative === "authentic" ? "relatable / native tone invites social reaction." : "promotional tone limits comments and shares."}`;
  }
  if (question.includes("social-native")) {
    return `${tone}${ctx.socialNative === "authentic" ? "matches organic Instagram/Facebook content patterns." : "reads more like a banner than feed-native content."}`;
  }
  if (question.includes("reconnect") || question.includes("return") || question.includes("urgency to act")) {
    return `${tone}${extraction.urgency_signals.length > 0 ? "urgency/familiarity cues can pull warm users back." : "weak urgency and personalization for retargeting."}`;
  }

  return `${tone}signals for ${META_GOAL_PROFILES[goal].focus} are ${avg >= 70 ? "aligned" : avg >= 45 ? "mixed" : "weak"} based on current creative evidence.`;
}

/** Deterministic Meta Ads goal + vertical evaluation (emotion / scroll / social psychology). */
export function buildMetaAdsDynamicEval(context: MetaGoalEvaluationContext): MetaAdsDynamicEval {
  const goal = normalizeMetaGoal(context.goal);
  const profile = META_GOAL_PROFILES[goal];
  const thumbStop = context.thumbStopStrength ?? inferThumbStop(context.extraction, context.width, context.height);
  const socialNative = context.socialNativeStatus ?? inferSocialNative(context.extraction);

  const signalResult = detectGoalSignals(goal, context.extraction, {
    thumbStop,
    socialNative,
    width: context.width,
    height: context.height,
  });

  const metrics = buildGoalMetrics(goal, context.extraction, {
    thumbStop,
    socialNative,
    ctaPressure: context.ctaPressure,
    urgencyLevel: context.urgencyLevel,
    width: context.width,
    height: context.height,
  });

  const verticalSignals = detectVerticalSignals(context.vertical, context.extraction);
  const verticalFallback = META_VERTICAL_SIGNALS[context.vertical]?.signals.slice(0, 3) ?? [];

  return {
    campaign_goal_focus: profile.focus,
    purpose: profile.purpose,
    detected_signals: signalResult.detected.slice(0, 8),
    missing_signals: signalResult.missing.slice(0, 6),
    avoided_elements_found: signalResult.avoided.slice(0, 5),
    metrics,
    best_analyzer_questions: profile.questions.map((question) => ({
      question,
      response: answerQuestion(question, goal, context.extraction, metrics, { thumbStop, socialNative }),
    })),
    vertical_specific_signals:
      verticalSignals.length > 0 ? verticalSignals : verticalFallback,
  };
}

/** Inject only the selected Meta goal rules into the AI system prompt (reduces noise vs. all 7 goals). */
export function buildMetaGoalPromptSection(goal: string, vertical: string): string {
  const metaGoal = normalizeMetaGoal(goal);
  const profile = META_GOAL_PROFILES[metaGoal];
  const verticalBlock = META_VERTICAL_SIGNALS[vertical];
  const verticalLines = verticalBlock
    ? verticalBlock.signals.map((s) => `- ${s}`).join("\n")
    : "- Apply general social-native, mobile-first, emotional-scroll standards.";
  const forbidden = getCrossPlatformForbiddenReminder("meta_ads");

  return `
## ACTIVE META ADS CAMPAIGN GOAL (evaluate ONLY this goal)

Platform mindset: Meta = Facebook + Instagram + Reels + Stories + Feed. NOT intent-based like Google. NOT programmatic banner analysis.
**${forbidden}**
Think: "Will users stop scrolling?" · "Emotional reaction?" · "Native to IG/FB?" · "Natural engagement?"

**Selected goal: ${metaGoal.replace(/_/g, " ")}**
**Focus:** ${profile.focus}
**Purpose:** ${profile.purpose}

**Signals to detect:**
${profile.signalsToDetect.map((s) => `- ${s}`).join("\n")}

**Elements to flag if present (avoided for this goal):**
${profile.avoidElements.map((s) => `- ${s}`).join("\n")}

**Score these metrics in meta_ads_dynamic_eval.metrics (0-100 each):**
${profile.metrics.map((m) => `- ${m}`).join("\n")}

**Answer these in meta_ads_dynamic_eval.best_analyzer_questions:**
${profile.questions.map((q) => `- ${q}`).join("\n")}

**Vertical overlay (${vertical.replace(/_/g, " ")}):**
${verticalLines}
`.trim();
}

export function getMetaGoalPriorities(goal: string): string[] {
  return META_GOAL_PROFILES[normalizeMetaGoal(goal)].aiPriorities;
}

export function buildMetaGoalEmotionalFit(
  goal: string,
  triggers: string[],
  thumbStop: "strong" | "moderate" | "weak",
  socialNative: "authentic" | "mixed" | "banner_like",
): string {
  const metaGoal = normalizeMetaGoal(goal);
  const profile = META_GOAL_PROFILES[metaGoal];
  const hasEmotion = triggers.length > 0 && !triggers.includes("neutral");

  if (metaGoal === "awareness") {
    return thumbStop === "weak" || !hasEmotion
      ? "Awareness on Meta needs a stronger scroll-stop emotion in the first 1–3 seconds."
      : "Emotional interruption supports brand recall while users scroll.";
  }
  if (metaGoal === "conversion") {
    return hasEmotion && thumbStop !== "weak"
      ? "Desire and urgency cues align with impulse conversion psychology on Meta."
      : "Conversion creative needs stronger desire/urgency emotion plus visible offer.";
  }
  if (metaGoal === "traffic") {
    return hasEmotion
      ? "Curiosity emotion supports click motivation from the feed."
      : "Traffic goal needs curiosity or surprise emotion to earn the tap.";
  }
  if (metaGoal === "engagement") {
    return socialNative === "authentic" && hasEmotion
      ? "Relatable emotion matches engagement and share behavior on Meta."
      : "Engagement goal needs more relatable, social-native emotional tone.";
  }
  if (metaGoal === "lead_generation") {
    return hasEmotion
      ? "Empathy/pain-point emotion supports trustworthy lead capture."
      : "Leads creative should pair trust with an emotional pain-point hook.";
  }
  if (metaGoal === "app_installs") {
    return thumbStop !== "weak"
      ? "Energy and clarity emotions support install intent on mobile."
      : "App install creative needs a more energetic, modern first-frame hook.";
  }
  if (metaGoal === "retargeting") {
    return hasEmotion
      ? "Familiarity plus emotional urgency can re-activate warm audiences."
      : "Retargeting needs familiarity reminder plus urgency to return now.";
  }

  return `Refine emotional framing for Meta ${profile.focus.toLowerCase()}.`;
}
