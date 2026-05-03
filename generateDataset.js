/**
 * Adigator Dataset Generator — Upgraded v2
 * ─────────────────────────────────────────
 * Generates a richer labeled ad dataset with:
 *   - Urgency level signals
 *   - Emotional tone classification
 *   - Value proposition tagging
 *   - Persuasion technique labels
 *   - Headline type classification
 *   - CTA position + confidence
 *   - Audience signal hints
 *   - Power word flags
 */

const fs = require("fs");

// ── CTA Pools ──────────────────────────────────────────────────────────────────

const SOFT_CTAS = [
  "Learn More", "Discover More", "Explore Now", "See How It Works",
  "Find Out More", "Read More", "Watch Now", "Take a Look",
  "Get Inspired", "Find Your Match",
];

const MEDIUM_CTAS = [
  "Get Started", "Start Free Trial", "Explore Features", "Compare Plans",
  "Join Now", "Request Demo", "Book a Call", "See Pricing",
  "Try It Free", "View Plans",
];

const HARD_CTAS = [
  "Buy Now", "Shop Now", "Order Today", "Order Now", "Sign Up Now",
  "Download Now", "Claim Offer", "Get Yours", "Add to Cart", "Grab the Deal",
];

const IMPLICIT_CTAS = [
  "Limited Time Offer", "Only Few Left", "Hurry Up", "Offer Ends Soon",
  "Last Chance", "Selling Out Fast", "Don't Miss Out", "Today Only",
];

const NON_CTA_TEXT = [
  "Best Quality Product", "Premium Design", "50% OFF", "Top Rated Brand",
  "New Collection लॉन्च", "Award Winning", "Trusted by Millions",
  "Since 1990", "Made in India 🇮🇳", "Eco-Friendly Choice",
];

// ── Benefit / Value Prop Pools ─────────────────────────────────────────────────

const BENEFITS = [
  "Save Money", "Boost Your Skills", "Improve Your Health",
  "Grow Faster", "Achieve More", "Save Time", "Look Better",
  "Feel Confident", "Work Smarter", "Live Healthier",
];

// ── Emotion map per benefit ────────────────────────────────────────────────────

const BENEFIT_EMOTION = {
  "Save Money":       "trust",
  "Boost Your Skills":"aspiration",
  "Improve Your Health": "fear",
  "Grow Faster":      "excitement",
  "Achieve More":     "aspiration",
  "Save Time":        "trust",
  "Look Better":      "joy",
  "Feel Confident":   "joy",
  "Work Smarter":     "curiosity",
  "Live Healthier":   "fear",
};

// ── Value prop categories ──────────────────────────────────────────────────────

const BENEFIT_VALUE_PROP = {
  "Save Money":       "savings",
  "Boost Your Skills":"skill_growth",
  "Improve Your Health": "wellness",
  "Grow Faster":      "growth",
  "Achieve More":     "achievement",
  "Save Time":        "efficiency",
  "Look Better":      "aesthetics",
  "Feel Confident":   "self_improvement",
  "Work Smarter":     "productivity",
  "Live Healthier":   "wellness",
};

// ── Audience signals per benefit ───────────────────────────────────────────────

const BENEFIT_AUDIENCE = {
  "Save Money":       "bargain-hunter",
  "Boost Your Skills":"professional",
  "Improve Your Health": "health-conscious",
  "Grow Faster":      "entrepreneur",
  "Achieve More":     "ambitious",
  "Save Time":        "busy-professional",
  "Look Better":      "lifestyle",
  "Feel Confident":   "self-improvement",
  "Work Smarter":     "professional",
  "Live Healthier":   "health-conscious",
};

// ── Power words detection ──────────────────────────────────────────────────────

const POWER_WORDS = [
  "free", "save", "now", "today", "only", "best", "top", "new",
  "limited", "exclusive", "guaranteed", "proven", "instant", "award",
  "trusted", "official", "bonus", "fast", "easy", "secret",
];

function detectPowerWords(text) {
  const norm = text.toLowerCase();
  return POWER_WORDS.filter(w => norm.includes(w));
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

function getFunnelStage() {
  const rand = Math.random();
  if (rand < 0.33) return "Awareness";
  if (rand < 0.66) return "Consideration";
  return "Conversion";
}

function getUrgencyLevel(cta_type, text) {
  const norm = text.toLowerCase();
  const hasUrgencyWord = ["now", "today", "soon", "last", "hurry", "fast", "only", "limited", "ends"].some(w => norm.includes(w));

  if (cta_type === "Implicit") return "high";
  if (cta_type === "Hard" && hasUrgencyWord) return "high";
  if (cta_type === "Hard") return "medium";
  if (cta_type === "Medium" && hasUrgencyWord) return "medium";
  if (cta_type === "Medium") return "low";
  if (cta_type === "Soft") return "low";
  return "none";
}

function getPersuasionTechnique(cta_type, text) {
  const norm = text.toLowerCase();
  if (["only few left", "selling out", "limited"].some(p => norm.includes(p))) return "scarcity";
  if (["hurry", "ends soon", "today only", "last chance", "don't miss"].some(p => norm.includes(p))) return "urgency";
  if (["trusted", "rated", "award", "top", "million"].some(p => norm.includes(p))) return "social_proof";
  if (["free", "trial", "demo", "try"].some(p => norm.includes(p))) return "reciprocity";
  if (cta_type === "Hard") return "direct_response";
  if (cta_type === "Medium") return "value_demonstration";
  if (cta_type === "Soft") return "curiosity";
  return "none";
}

function getHeadlineType(cta_type, text, benefit) {
  if (!benefit) {
    if (["rated", "trusted", "award", "million"].some(p => text.toLowerCase().includes(p))) return "social_proof";
    if (["%", "off"].some(p => text.toLowerCase().includes(p))) return "discount_led";
    if (["limited", "hurry", "only", "ends", "last", "selling"].some(p => text.toLowerCase().includes(p))) return "urgency";
    return "brand_statement";
  }
  if (cta_type === "Soft") return "curiosity_led";
  if (cta_type === "Medium") return "benefit_led";
  if (cta_type === "Hard") return "action_led";
  if (cta_type === "Implicit") return "urgency";
  return "informational";
}

function getCTAPosition() {
  // Simulates where the CTA appears in the creative
  const positions = ["headline", "subheadline", "button", "footer", "overlay"];
  const weights =   [0.35,       0.2,           0.3,      0.1,      0.05];
  const rand = Math.random();
  let sum = 0;
  for (let i = 0; i < positions.length; i++) {
    sum += weights[i];
    if (rand < sum) return positions[i];
  }
  return "button";
}

function getCTAConfidence(cta_type, text) {
  // Confidence that this is truly a CTA, based on clarity
  if (cta_type === "None") return 0;
  if (cta_type === "Hard") return parseFloat((0.85 + Math.random() * 0.15).toFixed(2));
  if (cta_type === "Medium") return parseFloat((0.70 + Math.random() * 0.15).toFixed(2));
  if (cta_type === "Soft") return parseFloat((0.55 + Math.random() * 0.15).toFixed(2));
  if (cta_type === "Implicit") return parseFloat((0.45 + Math.random() * 0.20).toFixed(2));
  return 0;
}

function generateCreative(stage) {
  let text = "";
  let cta = null;
  let cta_type = "None";
  let benefit = null;

  const typeRand = Math.random();

  if (typeRand < 0.18) {
    text = random(NON_CTA_TEXT);
  } else if (typeRand < 0.32) {
    text = random(IMPLICIT_CTAS);
    cta = "implicit";
    cta_type = "Implicit";
  } else {
    if (stage === "Awareness") {
      cta = random(SOFT_CTAS);
      cta_type = "Soft";
    } else if (stage === "Consideration") {
      cta = random(MEDIUM_CTAS);
      cta_type = "Medium";
    } else {
      cta = random(HARD_CTAS);
      cta_type = "Hard";
    }
    benefit = random(BENEFITS);
    text = `${cta} – ${benefit}`;
  }

  return { text, cta, cta_type, benefit };
}

function scoreCTA(cta_type) {
  if (cta_type === "None")     return 0;
  if (cta_type === "Soft")     return 4 + Math.random() * 2;
  if (cta_type === "Medium")   return 6 + Math.random() * 2;
  if (cta_type === "Hard")     return 8 + Math.random() * 2;
  if (cta_type === "Implicit") return 5 + Math.random() * 2;
  return 0;
}

function generateScores(stage, cta_type, urgency_level) {
  const urgencyBonus = urgency_level === "high" ? 1 : urgency_level === "medium" ? 0.5 : 0;

  return {
    cta:            Math.min(10, Math.round(scoreCTA(cta_type))),
    text_clarity:   Math.min(10, Math.floor(6 + Math.random() * 4)),
    brand_presence: Math.min(10, Math.floor(3 + Math.random() * 5)),
    brightness:     Math.min(10, Math.floor(6 + Math.random() * 4)),
    contrast:       Math.min(10, Math.floor(6 + Math.random() * 4)),
    goal_alignment: Math.min(10,
      stage === "Conversion"
        ? Math.floor(7 + Math.random() * 3)
        : Math.floor(6 + Math.random() * 4)
    ),
    ad_visibility:  Math.min(10, Math.floor(6 + Math.random() * 4)),
    urgency_score:  Math.min(10, Math.round(urgencyBonus * 3 + Math.random() * 4 + (cta_type === "Implicit" ? 3 : cta_type === "Hard" ? 2 : 0))),
    emotion_score:  Math.min(10, Math.floor(5 + Math.random() * 5)),
  };
}

// ── Generate ───────────────────────────────────────────────────────────────────

function generateDataset(size = 300) {
  const dataset = [];

  for (let i = 1; i <= size; i++) {
    const stage = getFunnelStage();
    const { text, cta, cta_type, benefit } = generateCreative(stage);

    const urgency_level      = getUrgencyLevel(cta_type, text);
    const persuasion_technique = getPersuasionTechnique(cta_type, text);
    const headline_type      = getHeadlineType(cta_type, text, benefit);
    const cta_position       = cta !== null ? getCTAPosition() : null;
    const cta_confidence     = getCTAConfidence(cta_type, text);
    const power_words_found  = detectPowerWords(text);
    const emotion_type       = benefit ? BENEFIT_EMOTION[benefit] : "neutral";
    const value_proposition  = benefit ? BENEFIT_VALUE_PROP[benefit] : "none";
    const target_audience    = benefit ? BENEFIT_AUDIENCE[benefit] : "broad";

    dataset.push({
      id: i,
      creative_text: text,

      // ── CTA Fields ──────────────────────────────────────────────────────────
      cta_detected:    cta !== null,
      cta_text:        cta,
      cta_type,
      cta_position,          // where in the creative
      cta_confidence,        // 0.0–1.0 detection confidence
      cta_action_verb:       // the root verb ("buy", "learn", "shop" …)
        cta && cta !== "implicit"
          ? cta.split(" ")[0].toLowerCase()
          : null,

      // ── Funnel ──────────────────────────────────────────────────────────────
      funnel_stage: stage,

      // ── Language Intelligence ────────────────────────────────────────────────
      urgency_level,               // none | low | medium | high
      emotion_type,                // neutral | trust | fear | joy | aspiration | curiosity | excitement
      value_proposition,           // savings | wellness | growth | productivity | … | none
      persuasion_technique,        // scarcity | urgency | social_proof | reciprocity | direct_response | value_demonstration | curiosity | none
      headline_type,               // action_led | benefit_led | curiosity_led | urgency | social_proof | discount_led | brand_statement
      target_audience,             // bargain-hunter | professional | health-conscious | entrepreneur | …
      power_words_found,           // array of matched power words
      has_power_word: power_words_found.length > 0,
      word_count: text.split(/\s+/).filter(Boolean).length,
      has_benefit_phrase: benefit !== null,
      benefit_phrase: benefit,

      // ── Scores ──────────────────────────────────────────────────────────────
      scores: generateScores(stage, cta_type, urgency_level),

      label_notes: `Auto-generated sample for ${stage}`,
    });
  }

  return dataset;
}

const data = generateDataset(300);
fs.writeFileSync("ad_dataset_v2.json", JSON.stringify(data, null, 2));
console.log(`✅ Dataset v2 generated: ad_dataset_v2.json (${data.length} entries)`);
console.log(`   New fields: urgency_level, emotion_type, value_proposition, persuasion_technique,`);
console.log(`               headline_type, target_audience, power_words_found, cta_position, cta_confidence`);
