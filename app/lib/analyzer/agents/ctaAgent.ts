import { normalizeOCRText } from '../utils/textUtils';

export interface CTADetectionResult {
  score: number;
  detected: boolean;
  ctaType: "awareness" | "consideration" | "conversion" | "none";
  phrases: string[];
  position: string;
  confidence: "high" | "medium" | "low" | "none";
  matchType: "high_intent" | "medium_intent" | "verb_urgency" | "button_style" | "none";
  verdict?: string;
}

// ── Funnel-Stage Phrase Banks ──────────────────────────────────────────────────

const CONVERSION_PHRASES: string[] = [
  "buy now", "order now", "shop now", "get now", "get it now",
  "sign up", "sign up now", "register now", "download now",
  "claim offer", "claim now", "subscribe now", "add to cart",
  "checkout now", "redeem now", "grab yours", "apply now",
  "book now", "start now", "get yours", "purchase now",
];

const CONSIDERATION_PHRASES: string[] = [
  "try now", "try free", "get started", "start free", "start today",
  "join now", "join free", "book demo", "request demo", "get demo",
  "check it out", "see plans", "compare plans", "view pricing",
  "get access", "unlock now", "schedule now", "contact us", "talk to us",
  "install now", "launch now", "upgrade now",
];

const AWARENESS_PHRASES: string[] = [
  "learn more", "know more", "find out more", "discover more",
  "explore now", "explore", "discover", "see how", "see why",
  "watch now", "watch video", "read more", "read story",
  "see it in action", "take a look", "view demo", "meet us",
];

// Soft awareness verbs (used as fallback with lower confidence)
const AWARENESS_VERBS: string[] = [
  "learn", "explore", "discover", "see", "watch", "find", "know",
];

const URGENCY_WORDS: string[] = [
  "now", "today", "fast", "instantly", "hurry", "limited",
  "last chance", "deadline", "expires", "only", "exclusive", "quick",
];

const OFFER_PATTERNS = [/%/, /\$\d+/, /£\d+/, /€\d+/, /\d+\s*off/i, /half\s*price/i];

// ── Helpers ───────────────────────────────────────────────────────────────────

function hasWordBoundaryMatch(text: string, word: string): boolean {
  try {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
  } catch { return false; }
}

function hasPhraseMatch(text: string, phrase: string): boolean {
  if (hasWordBoundaryMatch(text, phrase)) return true;
  const words = phrase.split(' ');
  if (words.length < 2) return false;
  let from = 0;
  for (const w of words) {
    const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const idx = text.slice(from).search(new RegExp(`\\b${escaped}\\b`, 'i'));
    if (idx === -1) return false;
    from += idx + w.length;
  }
  return true;
}

function normalizeForCTA(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\r?\n/g, ' ')
    .replace(/[^a-z0-9%$£€\s]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function detectMergedPhrase(text: string): { phrase: string; type: "conversion" | "consideration" | "awareness" } | null {
  const merged = text.toLowerCase().replace(/\s+/g, '');
  const map: Array<{ keys: string[]; phrase: string; type: "conversion" | "consideration" | "awareness" }> = [
    { keys: ["buynow"], phrase: "buy now", type: "conversion" },
    { keys: ["shopnow"], phrase: "shop now", type: "conversion" },
    { keys: ["ordernow"], phrase: "order now", type: "conversion" },
    { keys: ["getnow"], phrase: "get now", type: "conversion" },
    { keys: ["downloadnow"], phrase: "download now", type: "conversion" },
    { keys: ["subscribenow"], phrase: "subscribe now", type: "conversion" },
    { keys: ["signupnow", "signup"], phrase: "sign up now", type: "conversion" },
    { keys: ["addtocart"], phrase: "add to cart", type: "conversion" },
    { keys: ["checkoutnow"], phrase: "checkout now", type: "conversion" },
    { keys: ["claimoffer", "claimnow"], phrase: "claim offer", type: "conversion" },
    { keys: ["getstarted"], phrase: "get started", type: "consideration" },
    { keys: ["startnow", "startfree"], phrase: "start now", type: "consideration" },
    { keys: ["joinnow", "joinfree"], phrase: "join now", type: "consideration" },
    { keys: ["trynow", "tryfree"], phrase: "try now", type: "consideration" },
    { keys: ["booknow", "bookaademo", "bookdemo"], phrase: "book now", type: "consideration" },
    { keys: ["learnmore"], phrase: "learn more", type: "awareness" },
    { keys: ["findoutmore"], phrase: "find out more", type: "awareness" },
    { keys: ["discovermorenow", "discovermore"], phrase: "discover more", type: "awareness" },
    { keys: ["watchnow"], phrase: "watch now", type: "awareness" },
    { keys: ["explorenow"], phrase: "explore now", type: "awareness" },
  ];
  for (const entry of map) {
    if (entry.keys.some(k => merged.includes(k))) return { phrase: entry.phrase, type: entry.type };
  }
  return null;
}

function isLowQualityOCR(text: string): boolean {
  const nws = text.replace(/\s/g, '');
  if (nws.length < 4) return true;
  const alpha = (nws.match(/[a-zA-Z]/g) || []).length;
  const alnum = (nws.match(/[a-zA-Z0-9]/g) || []).length;
  if (alnum / nws.length < 0.5) return true;
  if (alpha / nws.length < 0.4) return true;
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.filter(w => /^[a-zA-Z]{2,}$/.test(w)).length === 0;
}

function isInLongSentence(text: string, word: string): boolean {
  const sentences = text.split(/[.!?\n;|]+/);
  for (const sent of sentences) {
    if (!hasWordBoundaryMatch(sent, word)) continue;
    if (sent.trim().split(/\s+/).length > 8) return true;
  }
  return false;
}

function buildResult(
  score: number, detected: boolean,
  ctaType: CTADetectionResult["ctaType"],
  phrases: string[], fullText: string,
  topText: string, bottomText: string,
  confidence: CTADetectionResult["confidence"],
  matchType: CTADetectionResult["matchType"],
  verdict: string,
): CTADetectionResult {
  const normBottom = bottomText.toLowerCase();
  const normTop = topText.toLowerCase();
  const primary = phrases[0]?.replace(/^(verb:|urgency:|caps:)/, '') ?? '';
  let position = "middle";
  if (primary && normBottom.includes(primary.split(' ')[0])) position = "bottom";
  else if (primary && normTop.includes(primary.split(' ')[0])) position = "top";
  else if (score > 0) position = "bottom";
  return { score, detected, ctaType, phrases, position, confidence, matchType, verdict };
}

// ── Main Agent ────────────────────────────────────────────────────────────────

export function runCtaAgent(
  fullText: string,
  topText: string,
  bottomText: string,
  goal: string = "conversion"
): CTADetectionResult {
  const NO_CTA: CTADetectionResult = {
    score: 0, detected: false, ctaType: "none",
    phrases: [], position: "unknown",
    confidence: "none", matchType: "none",
    verdict: "No CTA detected.",
  };

  if (!fullText || fullText.trim().length < 3) return NO_CTA;

  const normalized = normalizeForCTA(fullText);
  const libNorm = normalizeOCRText(fullText);
  const lowQuality = isLowQualityOCR(fullText);

  console.log("CTA RAW TEXT:", fullText);
  console.log("CTA NORMALIZED:", normalized);

  // Goal-alignment bonus/penalty helper
  const goalBonus = (detectedType: string): number => {
    if (detectedType === goal) return 15;
    if (detectedType !== "none" && detectedType !== goal) return -10;
    return 0;
  };

  // ── PASS 1: CONVERSION (high intent) ──────────────────────────────────────
  let match = CONVERSION_PHRASES.find(p => hasPhraseMatch(normalized, p) || hasPhraseMatch(libNorm, p));
  if (!match) {
    const merged = detectMergedPhrase(fullText);
    if (merged?.type === "conversion") match = merged.phrase;
  }
  if (match) {
    const base = 80;
    const offer = OFFER_PATTERNS.some(p => p.test(fullText)) ? 10 : 0;
    const bonus = goalBonus("conversion");
    const score = Math.max(0, Math.min(100, base + offer + bonus));
    console.log("CTA MATCH:", { matchedPhrase: match, matchType: "high_intent", ctaType: "conversion", decision: "detected=true" });
    return buildResult(score, true, "conversion", [match], fullText, topText, bottomText, "high", "high_intent",
      "Conversion CTA detected — strong action intent.");
  }

  // ── PASS 2: CONSIDERATION (medium intent) ─────────────────────────────────
  const consid = CONSIDERATION_PHRASES.find(p => hasPhraseMatch(normalized, p) || hasPhraseMatch(libNorm, p));
  const considMerged = !consid ? detectMergedPhrase(fullText) : null;
  const considMatch = consid || (considMerged?.type === "consideration" ? considMerged.phrase : null);
  if (considMatch && !isInLongSentence(fullText, considMatch.split(' ')[0])) {
    const base = 60;
    const offer = OFFER_PATTERNS.some(p => p.test(fullText)) ? 8 : 0;
    const bonus = goalBonus("consideration");
    const score = Math.max(0, Math.min(80, base + offer + bonus));
    console.log("CTA MATCH:", { matchedPhrase: considMatch, matchType: "medium_intent", ctaType: "consideration", decision: "detected=true" });
    return buildResult(score, true, "consideration", [considMatch], fullText, topText, bottomText, "high", "medium_intent",
      "Consideration CTA detected — engagement intent.");
  }

  // ── PASS 3: AWARENESS (soft intent) ──────────────────────────────────────
  const aware = AWARENESS_PHRASES.find(p => hasPhraseMatch(normalized, p) || hasPhraseMatch(libNorm, p));
  const awareMerged = !aware ? detectMergedPhrase(fullText) : null;
  const awareMatch = aware || (awareMerged?.type === "awareness" ? awareMerged.phrase : null);
  if (awareMatch && !isInLongSentence(fullText, awareMatch.split(' ')[0])) {
    const base = 45;
    const bonus = goalBonus("awareness");
    const score = Math.max(0, Math.min(60, base + bonus));
    console.log("CTA MATCH:", { matchedPhrase: awareMatch, matchType: "medium_intent", ctaType: "awareness", decision: "detected=true" });
    return buildResult(score, true, "awareness", [awareMatch], fullText, topText, bottomText, "medium", "medium_intent",
      "Awareness CTA detected — informational intent.");
  }

  // ── PASS 4: VERB + URGENCY (any funnel, combined only) ────────────────────
  if (!lowQuality) {
    const convVerb = ["buy", "shop", "order", "grab", "claim", "subscribe", "register", "apply", "checkout", "redeem"];
    const considVerb = ["try", "start", "join", "book", "access", "unlock", "install", "upgrade", "get"];
    const awareVerb = AWARENESS_VERBS;

    const urgency = URGENCY_WORDS.find(w => hasWordBoundaryMatch(normalized, w));
    if (urgency) {
      const cv = convVerb.find(v => hasWordBoundaryMatch(normalized, v) && !isInLongSentence(fullText, v));
      if (cv) {
        const bonus = goalBonus("conversion");
        const score = Math.max(0, Math.min(75, 55 + bonus));
        return buildResult(score, true, "conversion", [`verb:${cv}`, `urgency:${urgency}`], fullText, topText, bottomText, "medium", "verb_urgency",
          "Conversion intent detected via action verb + urgency.");
      }
      const av = considVerb.find(v => hasWordBoundaryMatch(normalized, v) && !isInLongSentence(fullText, v));
      if (av) {
        const bonus = goalBonus("consideration");
        const score = Math.max(0, Math.min(60, 42 + bonus));
        return buildResult(score, true, "consideration", [`verb:${av}`, `urgency:${urgency}`], fullText, topText, bottomText, "medium", "verb_urgency",
          "Consideration intent detected via engagement verb + urgency.");
      }
      const wv = awareVerb.find(v => hasWordBoundaryMatch(normalized, v) && !isInLongSentence(fullText, v));
      if (wv) {
        const bonus = goalBonus("awareness");
        const score = Math.max(0, Math.min(45, 30 + bonus));
        return buildResult(score, true, "awareness", [`verb:${wv}`, `urgency:${urgency}`], fullText, topText, bottomText, "low", "verb_urgency",
          "Soft awareness CTA detected.");
      }
    }

    // ── PASS 5: Standalone awareness verb (low confidence, no urgency needed) ──
    if (goal === "awareness") {
      const loneAwareVerb = awareVerb.find(v => hasWordBoundaryMatch(normalized, v) && !isInLongSentence(fullText, v));
      if (loneAwareVerb) {
        const score = Math.max(0, Math.min(35, 20 + goalBonus("awareness")));
        return buildResult(score, true, "awareness", [`verb:${loneAwareVerb}`], fullText, topText, bottomText, "low", "verb_urgency",
          "Soft awareness signal — consider adding a clearer phrase.");
      }
    }

    // ── PASS 6: ALL CAPS button style ─────────────────────────────────────────
    const capsSegments = fullText
      .split(/[\n|!.?;]/)
      .map(s => s.trim())
      .filter(s => s.length >= 2 && s.length <= 25 && s === s.toUpperCase() && /^[A-Z][A-Z\s%$€£]+$/.test(s));
    if (capsSegments.length > 0) {
      const cp = capsSegments[0];
      if (cp.split(/\s+/).length <= 3) {
        return buildResult(25, true, "conversion", [`caps:"${cp}"`], fullText, topText, bottomText, "low", "button_style",
          "Possible CTA style detected (weak signal).");
      }
    }
  }

  // No CTA — small offer-only score
  const offerOnly = OFFER_PATTERNS.some(p => p.test(fullText));
  console.log("CTA MATCH:", { matchedPhrase: null, matchType: "none", decision: "detected=false" });
  return { ...NO_CTA, score: offerOnly ? 10 : 0 };
}
