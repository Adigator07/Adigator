/**
 * Adigator Local AI Agent
 * ─────────────────────────────────────────────────────────────────────────────
 * A pure client-side performance marketing analyst.
 * No API keys. No external calls. Runs entirely in the browser.
 *
 * Scoring Philosophy (out of 10):
 *   9-10 → Exceptional    7-8 → Good    5-6 → Fair    3-4 → Poor    1-2 → Critical
 */

import type { CampaignGoal, Tier } from "./localAnalyzer";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AgentInput {
  goal: CampaignGoal;
  ocrText: string;
  ctaDetected: boolean;
  ctaWord: string;
  ctaStrength: "strong" | "medium" | "none" | string;
  contrast: number;      // 0-100
  brightness: number;    // 0-100
  tier: Tier;
  issues: Array<{ id: string; severity: string; evidence: string }>;
}

export interface AgentReport {
  summary: string;
  funnel_analysis: string;
  breakdown: {
    cta: string;
    text_clarity: string;
    brand_presence: string;
    brightness_contrast: string;
    ad_visibility: string;
    goal_alignment: string;
  };
  scores: {
    cta: number;
    clarity: number;
    brand: number;
    visual_quality: number;
    visibility: number;
    goal_alignment: number;
    overall: number;
  };
  suggestions: string[];
}

// ── Goal-specific knowledge ───────────────────────────────────────────────────

const GOAL_LABELS: Record<CampaignGoal, string> = {
  awareness:     "Awareness (Top Funnel)",
  consideration: "Consideration (Mid Funnel)",
  conversion:    "Conversion (Bottom Funnel)",
};

const GOAL_CTA_IDEAL: Record<CampaignGoal, string[]> = {
  awareness:     ["Learn More", "Discover", "Explore", "Watch Now"],
  consideration: ["View Details", "Compare Now", "See Pricing", "Try Demo"],
  conversion:    ["Buy Now", "Sign Up", "Get Started", "Download", "Claim Offer", "Subscribe"],
};

const GOAL_FOCUS: Record<CampaignGoal, string> = {
  awareness:
    "Awareness ads must stop the scroll, create brand recall, and spark curiosity — not sell. " +
    "The visual and message should feel emotional and light. A soft CTA is acceptable.",
  consideration:
    "Consideration ads must communicate value clearly. Users know the category — they need reasons to choose YOU. " +
    "Focus on benefits, trust signals, and differentiation. A medium-strength CTA is expected.",
  conversion:
    "Conversion ads must drive immediate action. Every element — headline, visual, CTA — must work together to " +
    "remove friction and create urgency. A strong, prominent CTA is mandatory.",
};

// ── Scoring functions ─────────────────────────────────────────────────────────

function scoreCTA(input: AgentInput): number {
  const { ctaDetected, ctaStrength, ctaWord, goal } = input;

  if (!ctaDetected) {
    // For awareness a missing CTA is a warning, not a critical failure
    return goal === "awareness" ? 4 : 1;
  }

  // Check if the CTA matches the ideal set for this goal
  const idealMatch = GOAL_CTA_IDEAL[goal].some(
    (w) => ctaWord.toLowerCase().includes(w.toLowerCase()) || w.toLowerCase().includes(ctaWord.toLowerCase())
  );

  if (ctaStrength === "strong") {
    return idealMatch ? 9 : 7;
  }
  if (ctaStrength === "medium") {
    if (goal === "conversion") return idealMatch ? 5 : 4;
    return idealMatch ? 8 : 6;
  }
  // weak
  if (goal === "conversion") return 2;
  if (goal === "consideration") return 4;
  return 6;
}

function scoreClarity(input: AgentInput): number {
  const { ocrText, issues, tier } = input;

  let score = 8;

  // Penalise high text density for small tiers
  const densityIssue = issues.find((i) => i.id === "density_xs");
  if (densityIssue) score -= 3;

  // Very short text in a medium+ size banner means missing message
  if (ocrText.length < 10 && (tier === "M" || tier === "L" || tier === "XL")) score -= 2;

  // Very long text — too much to read in a banner
  if (ocrText.length > 200) score -= 2;

  // Text size issue flagged
  const textSizeIssue = issues.find((i) => i.id === "text_size");
  if (textSizeIssue) score -= 2;

  return Math.max(1, Math.min(10, score));
}

function scoreBrand(input: AgentInput): number {
  const { ocrText, issues } = input;

  // If brand issue was explicitly flagged
  const noBrand = issues.find((i) => i.id === "no_brand");
  if (noBrand) return 2;

  // Heuristic: if text is very short, brand may not be visible
  if (ocrText.length < 5) return 4;

  // Otherwise assume brand is present — we can't verify visually without AI vision
  return 7;
}

function scoreVisualQuality(input: AgentInput): number {
  const { contrast, issues } = input;

  let score = 8;

  if (contrast < 20) score -= 4;
  else if (contrast < 40) score -= 2;

  const overexposed = issues.find((i) => i.id === "overexposed");
  if (overexposed) score -= 2;

  const contrastLow = issues.find((i) => i.id === "contrast_low");
  if (contrastLow) score -= 2;

  return Math.max(1, Math.min(10, score));
}

function scoreVisibility(input: AgentInput): number {
  const { brightness, contrast, tier } = input;

  let score = 7;

  // Very dark or very bright images lose visibility
  if (brightness < 15 || brightness > 90) score -= 2;

  // Low contrast means it blends into the page
  if (contrast < 30) score -= 2;
  else if (contrast > 60) score += 1;

  // Larger formats naturally score higher for visibility
  if (tier === "XL" || tier === "L") score += 1;
  if (tier === "XS") score -= 1;

  return Math.max(1, Math.min(10, score));
}

function scoreGoalAlignment(input: AgentInput): number {
  const { goal, ctaDetected, ctaStrength, ctaWord, issues } = input;

  let score = 7;

  if (!ctaDetected) {
    if (goal === "conversion") score -= 4;
    else if (goal === "consideration") score -= 2;
    else score -= 1;
  } else {
    const idealMatch = GOAL_CTA_IDEAL[goal].some(
      (w) => ctaWord.toLowerCase().includes(w.toLowerCase()) || w.toLowerCase().includes(ctaWord.toLowerCase())
    );
    if (!idealMatch) score -= 1;
    if (goal === "conversion" && ctaStrength !== "strong") score -= 2;
  }

  // Each high-severity issue hurts goal alignment
  const highIssues = issues.filter((i) => i.severity === "high").length;
  score -= highIssues;

  return Math.max(1, Math.min(10, score));
}

function calcOverall(scores: AgentReport["scores"]): number {
  // Weighted: Goal Alignment × 2, CTA × 1.5, rest × 1
  const weighted =
    (scores.cta * 1.5) +
    (scores.clarity * 1) +
    (scores.brand * 1) +
    (scores.visual_quality * 1) +
    (scores.visibility * 1) +
    (scores.goal_alignment * 2);

  const totalWeight = 1.5 + 1 + 1 + 1 + 1 + 2; // 7.5
  return Math.round((weighted / totalWeight) * 10) / 10;
}

// ── Text generation ───────────────────────────────────────────────────────────

function buildBreakdown(input: AgentInput, scores: AgentReport["scores"]): AgentReport["breakdown"] {
  const { goal, ctaDetected, ctaWord, ctaStrength, contrast, brightness, ocrText, tier, issues } = input;

  const ctaIdeal = GOAL_CTA_IDEAL[goal].slice(0, 3).join(", ");

  const ctaText = !ctaDetected
    ? `No CTA detected. For a ${GOAL_LABELS[goal]} campaign this is a ${goal === "conversion" ? "critical failure" : "significant gap"}. Add a clear action button (e.g. "${GOAL_CTA_IDEAL[goal][0]}").`
    : `CTA "${ctaWord}" detected with ${ctaStrength} strength. ${
        scores.cta >= 7
          ? `This aligns well with the ${goal} goal.`
          : `For ${goal} campaigns, ideal CTAs are: ${ctaIdeal}.`
      }`;

  const clarityText =
    ocrText.length < 5
      ? "Very little or no text detected. Ensure your headline and key message are clearly legible at banner scale."
      : issues.find((i) => i.id === "density_xs")
      ? `Text is too dense for a ${tier} banner. Reduce copy — programmatic banners should have ONE core message.`
      : issues.find((i) => i.id === "text_size")
      ? "Some text appears below the 12px minimum for programmatic legibility. Increase font sizes."
      : `Message appears adequately clear for a ${tier} format. Ensure headline dominates and sub-copy is secondary.`;

  const brandText =
    issues.find((i) => i.id === "no_brand")
      ? "Brand identity is not visible. Programmatic placements require clear logo/brand name — users won't click what they can't identify."
      : ocrText.length < 5
      ? "Cannot confirm brand visibility due to limited OCR text. Verify logo placement manually."
      : "Brand presence assumed. Ensure logo is in a corner, high contrast against background, and always above the fold.";

  const contrastText =
    contrast < 20
      ? `Severely low contrast (${contrast}/100). Text likely unreadable on both light and dark publisher pages. This will kill CTR.`
      : contrast < 40
      ? `Low contrast (${contrast}/100). Text may be difficult to read on light backgrounds common in programmatic inventory.`
      : `Contrast level (${contrast}/100) is acceptable. ${
          issues.find((i) => i.id === "overexposed")
            ? "However, overexposure detected — the bright areas may cause the ad to blend into light-background sites."
            : "Maintain separation between text and background elements."
        }`;

  const visibilityText =
    brightness < 15
      ? "Ad is very dark. It will blend into dark editorial content and lose scroll-stopping power."
      : brightness > 90
      ? "Ad is overexposed. It may appear washed-out or merge with white-background publisher pages."
      : contrast < 30
      ? "Low contrast is reducing the ad's scroll-stopping power. Users won't pause on a banner that doesn't pop."
      : `Visual weight is reasonable. For stronger scroll-stopping power, consider a bold focal point — product, face, or high-contrast typography.`;

  const goalText =
    scores.goal_alignment >= 8
      ? `Strong alignment with the ${goal} goal. Creative elements support the intended funnel stage effectively.`
      : scores.goal_alignment >= 6
      ? `Moderate alignment. The creative has ${goal}-relevant elements but ${!ctaDetected ? "lacks a clear CTA" : "the CTA doesn't perfectly match the goal"}.`
      : `Weak goal alignment. A ${GOAL_LABELS[goal]} creative needs: ${
          goal === "conversion"
            ? "urgency, strong CTA, and friction-free messaging."
            : goal === "consideration"
            ? "clear value proposition, trust elements, and a benefit-focused CTA."
            : "emotional hooks, brand recall, and a curiosity-driven message."
        }`;

  return {
    cta: ctaText,
    text_clarity: clarityText,
    brand_presence: brandText,
    brightness_contrast: contrastText,
    ad_visibility: visibilityText,
    goal_alignment: goalText,
  };
}

function buildSummary(input: AgentInput, scores: AgentReport["scores"]): string {
  const { goal, ctaDetected, issues } = input;
  const highIssues = issues.filter((i) => i.severity === "high").length;

  if (scores.overall >= 8) {
    return `Strong ${goal} creative. Visual quality and CTA alignment are working well. Minor refinements could push this to top-performing territory.`;
  }
  if (scores.overall >= 6) {
    return `Decent foundation for a ${goal} ad, but ${highIssues > 0 ? `${highIssues} critical issue${highIssues > 1 ? "s" : ""} are holding it back` : "there are noticeable gaps"}. ${!ctaDetected ? "Missing CTA is the most urgent fix." : "Focus on goal alignment and visual contrast."}`;
  }
  if (scores.overall >= 4) {
    return `This creative has significant problems for a ${goal} campaign. ${!ctaDetected ? "No CTA is detected — this alone will severely limit performance." : "Low visual quality and misaligned messaging are reducing effectiveness."} Revision is recommended before launch.`;
  }
  return `Critical issues found. This creative is not ready for ${goal} campaign launch. ${highIssues} high-severity problem${highIssues > 1 ? "s" : ""} must be resolved immediately.`;
}

function buildFunnelAnalysis(input: AgentInput, scores: AgentReport["scores"]): string {
  const { goal, ctaDetected, ctaWord, ctaStrength } = input;

  const base = GOAL_FOCUS[goal];

  const ctaPart = !ctaDetected
    ? ` Currently, no CTA is present — this is ${goal === "conversion" ? "a dealbreaker" : "a significant gap"} for this funnel stage.`
    : ` The detected CTA "${ctaWord}" has ${ctaStrength} strength, which is ${
        (goal === "conversion" && ctaStrength === "strong") ||
        (goal === "consideration" && (ctaStrength === "medium" || ctaStrength === "strong")) ||
        goal === "awareness"
          ? "appropriate"
          : "weaker than ideal"
      } for this goal.`;

  const scorePart =
    scores.goal_alignment >= 7
      ? " Overall, the creative is reasonably aligned to this funnel stage."
      : " The creative needs better alignment to serve this funnel stage effectively.";

  return base + ctaPart + scorePart;
}

function buildSuggestions(input: AgentInput, scores: AgentReport["scores"]): string[] {
  const { goal, ctaDetected, contrast, ocrText, issues, tier } = input;
  const suggestions: string[] = [];

  // CTA Suggestion
  if (!ctaDetected) {
    suggestions.push(
      `Add a prominent CTA button. For ${goal} campaigns, use: "${GOAL_CTA_IDEAL[goal].slice(0, 2).join('" or "')}" — make it high-contrast and clearly tappable.`
    );
  } else if (scores.cta < 7) {
    suggestions.push(
      `Upgrade your CTA from "${input.ctaWord}" to a goal-aligned action verb. Best options for ${goal}: ${GOAL_CTA_IDEAL[goal].slice(0, 3).join(", ")}.`
    );
  }

  // Contrast suggestion
  if (contrast < 40) {
    suggestions.push(
      `Increase text-to-background contrast (currently ${contrast}/100). Target a minimum contrast ratio of 4.5:1. Dark text on light bg or light text on dark overlay works best.`
    );
  }

  // Text density / clarity
  if (issues.find((i) => i.id === "density_xs")) {
    suggestions.push(
      `Reduce copy. A ${tier} banner should have ONE headline (max 5-7 words), one supporting line, and your CTA. Everything else is noise.`
    );
  } else if (ocrText.length < 5) {
    suggestions.push(
      `Add a clear headline. Programmatic banners need instant message clarity — the user has < 1.5 seconds to absorb your value proposition.`
    );
  }

  // Goal-specific suggestion
  if (goal === "conversion") {
    suggestions.push(
      `Increase urgency. Add a time or scarcity element: "Limited Offer", "Ends Sunday", or "Only X Left" drives immediate action in conversion ads.`
    );
  } else if (goal === "consideration") {
    suggestions.push(
      `Add a trust or value signal: a stat ("Rated 4.8★"), a benefit headline ("Save 30% vs competitors"), or a social proof cue ("10,000+ customers").`
    );
  } else {
    suggestions.push(
      `Strengthen brand recall: ensure your logo, brand name, or distinctive colour is visible within 0.5 seconds of viewing. Awareness ads live or die by recognition.`
    );
  }

  // Visual suggestion
  if (input.brightness < 15 || input.brightness > 90) {
    suggestions.push(
      `Adjust overall exposure — the ad is ${input.brightness < 15 ? "too dark" : "overexposed"}. It will either disappear into dark editorial content or wash out on white publisher backgrounds.`
    );
  } else if (suggestions.length < 4) {
    suggestions.push(
      `A/B test your CTA button colour. High-contrast colours (orange, green, or white on dark) consistently outperform flat colours in programmatic placements.`
    );
  }

  // Cap at 6 suggestions
  return suggestions.slice(0, 6);
}

// ── Main Agent Function ───────────────────────────────────────────────────────

export function runLocalAgent(input: AgentInput): AgentReport {
  const cta           = scoreCTA(input);
  const clarity       = scoreClarity(input);
  const brand         = scoreBrand(input);
  const visual_quality = scoreVisualQuality(input);
  const visibility    = scoreVisibility(input);
  const goal_alignment = scoreGoalAlignment(input);

  const partialScores = { cta, clarity, brand, visual_quality, visibility, goal_alignment };
  const scores: AgentReport["scores"] = {
    ...partialScores,
    overall: calcOverall({ ...partialScores, overall: 0 }),
  };

  return {
    summary:         buildSummary(input, scores),
    funnel_analysis: buildFunnelAnalysis(input, scores),
    breakdown:       buildBreakdown(input, scores),
    scores,
    suggestions:     buildSuggestions(input, scores),
  };
}
