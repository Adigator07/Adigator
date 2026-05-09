import { DATASET_SOURCES } from "./taxonomy";
import type {
  CampaignGoal,
  IntelligenceProfilePatch,
  VerticalKey,
} from "./types";
import { loadDatasetProfiles } from "./dataset-loader";

// Load all 48 profiles from behavioral intelligence dataset
const { GOAL_BASELINES: LOADED_GOALS, VERTICAL_BASELINES: LOADED_VERTICALS, PROFILE_OVERRIDES: LOADED_OVERRIDES } = loadDatasetProfiles();

export const GOAL_BASELINES: Record<CampaignGoal, IntelligenceProfilePatch> = LOADED_GOALS;

// Fallback static data (for reference/backup only - datasets take priority)
const FALLBACK_GOALS: Record<CampaignGoal, IntelligenceProfilePatch> = {
  awareness: {
    source: [DATASET_SOURCES.awareness],
    expectedEmotions: {
      primary: ["curiosity", "recognition", "affinity"],
      secondary: ["inspiration", "belonging"],
      avoid: ["pressure", "confusion", "transactional urgency"],
      intensity: "moderate",
    },
    ctaExpectations: {
      strength: "soft",
      examples: ["Learn More", "Discover", "Explore", "Watch Now"],
      discouraged: ["Buy Now", "Claim Before It Ends"],
      required: false,
      visibilityPriority: "medium",
    },
    layoutExpectations: {
      density: "minimal",
      readingPattern: "hero-first",
      preferredHierarchy: ["brand", "hero visual", "one memorable idea", "soft CTA"],
      whitespace: "generous",
      safeAreaRules: ["Keep brand mark visible", "Avoid crowding the hero visual"],
    },
    scoringPreferences: {
      weights: {
        brandRecall: 0.22,
        ctaClarity: 0.08,
        emotionalResonance: 0.2,
        trustSignals: 0.1,
        visualClarity: 0.18,
        offerClarity: 0.07,
        mobileLegibility: 0.15,
      },
      penalties: ["missing brand cue", "too many message units", "low visual contrast"],
      boosts: ["distinctive brand asset", "clear emotional hook", "simple single-message layout"],
    },
    creativeBehaviors: [
      {
        id: "awareness-single-idea",
        description: "Creative should communicate one memorable brand idea.",
        priority: "high",
        positiveSignals: ["single headline", "recognizable brand asset", "hero image"],
        negativeSignals: ["multiple offers", "dense disclaimers", "competing CTAs"],
      },
    ],
    emotionalTriggers: ["novelty", "aspiration", "identity", "curiosity"],
    mobilePreferences: {
      minimumTextSize: "large",
      thumbZoneCta: false,
      maxMessageUnits: 2,
      preferredFormats: ["320x100", "300x250", "320x480"],
      rules: ["Lead with image and brand", "Keep headline under eight words"],
    },
    designPsychologyRules: [
      {
        id: "mere-exposure",
        principle: "Repeated brand cues improve recall.",
        recommendation: "Use consistent colors, logo placement, and brand mnemonic.",
        appliesTo: ["awareness"],
      },
    ],
    notes: ["Awareness profiles optimize for recall before action."],
  },
  consideration: {
    source: [DATASET_SOURCES.consideration],
    expectedEmotions: {
      primary: ["trust", "confidence", "interest"],
      secondary: ["clarity", "control"],
      avoid: ["skepticism", "overwhelm"],
      intensity: "subtle",
    },
    ctaExpectations: {
      strength: "medium",
      examples: ["View Details", "Compare Now", "See Features", "Try Demo"],
      discouraged: ["Buy Now", "Last Chance"],
      required: true,
      visibilityPriority: "high",
    },
    layoutExpectations: {
      density: "information-rich",
      readingPattern: "f-pattern",
      preferredHierarchy: ["problem", "benefit", "proof", "CTA"],
      whitespace: "moderate",
      safeAreaRules: ["Separate proof points from CTA", "Keep value proposition above fold"],
    },
    scoringPreferences: {
      weights: {
        brandRecall: 0.1,
        ctaClarity: 0.14,
        emotionalResonance: 0.1,
        trustSignals: 0.2,
        visualClarity: 0.16,
        offerClarity: 0.16,
        mobileLegibility: 0.14,
      },
      penalties: ["unsupported claim", "missing differentiator", "unclear product category"],
      boosts: ["comparison proof", "feature-to-benefit mapping", "social proof"],
    },
    creativeBehaviors: [
      {
        id: "consideration-proof-path",
        description: "Creative should help users evaluate the product with proof and clarity.",
        priority: "high",
        positiveSignals: ["benefit bullets", "ratings", "case result", "demo CTA"],
        negativeSignals: ["vague superlatives", "no proof", "no next step"],
      },
    ],
    emotionalTriggers: ["trust", "competence", "risk reduction", "control"],
    mobilePreferences: {
      minimumTextSize: "medium",
      thumbZoneCta: true,
      maxMessageUnits: 4,
      preferredFormats: ["300x250", "320x100", "300x600"],
      rules: ["Chunk proof points", "Use one tappable CTA", "Avoid dense paragraphs"],
    },
    designPsychologyRules: [
      {
        id: "cognitive-ease",
        principle: "Clear information hierarchy reduces evaluation friction.",
        recommendation: "Use visible grouping for problem, proof, and next step.",
        appliesTo: ["consideration"],
      },
    ],
    notes: ["Consideration profiles balance persuasion with proof."],
  },
  conversion: {
    source: [DATASET_SOURCES.conversion],
    expectedEmotions: {
      primary: ["urgency", "desire", "confidence"],
      secondary: ["relief", "reward"],
      avoid: ["hesitation", "ambiguity", "distrust"],
      intensity: "high",
    },
    ctaExpectations: {
      strength: "direct",
      examples: ["Buy Now", "Get Started", "Sign Up", "Claim Offer"],
      discouraged: ["Explore", "Maybe Later", "Read More"],
      required: true,
      visibilityPriority: "critical",
    },
    layoutExpectations: {
      density: "direct-response",
      readingPattern: "z-pattern",
      preferredHierarchy: ["offer", "value", "proof", "CTA", "urgency"],
      whitespace: "compact",
      safeAreaRules: ["CTA must remain uncropped", "Offer and price must stay legible"],
    },
    scoringPreferences: {
      weights: {
        brandRecall: 0.07,
        ctaClarity: 0.22,
        emotionalResonance: 0.09,
        trustSignals: 0.13,
        visualClarity: 0.14,
        offerClarity: 0.22,
        mobileLegibility: 0.13,
      },
      penalties: ["missing CTA", "unclear offer", "weak contrast around CTA", "no trust cue"],
      boosts: ["clear discount", "visible price/value exchange", "strong action verb"],
    },
    creativeBehaviors: [
      {
        id: "conversion-action-path",
        description: "Creative should make the next action obvious and low-friction.",
        priority: "critical",
        positiveSignals: ["direct CTA", "offer clarity", "urgency cue", "trust cue"],
        negativeSignals: ["soft CTA", "hidden button", "no value exchange"],
      },
    ],
    emotionalTriggers: ["scarcity", "reward", "loss aversion", "instant benefit"],
    mobilePreferences: {
      minimumTextSize: "large",
      thumbZoneCta: true,
      maxMessageUnits: 3,
      preferredFormats: ["300x250", "320x100", "320x480", "300x600"],
      rules: ["Place CTA in lower-middle or lower-right area", "Use high contrast", "Keep offer visible at small size"],
    },
    designPsychologyRules: [
      {
        id: "action-fluency",
        principle: "Users act faster when action and reward are visually adjacent.",
        recommendation: "Place CTA close to the offer and reinforce with contrast.",
        appliesTo: ["conversion"],
      },
    ],
    notes: ["Conversion profiles optimize for action clarity and offer comprehension."],
  },
};

export const VERTICAL_BASELINES: Record<VerticalKey, IntelligenceProfilePatch> = LOADED_VERTICALS;

// Profile overrides for specific goal+vertical combinations (empty by default, can be populated for A/B tests)
export const PROFILE_OVERRIDES: Record<string, IntelligenceProfilePatch> = LOADED_OVERRIDES;
