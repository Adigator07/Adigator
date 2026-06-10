/**
 * Platform-specific enrichment for Creative Extraction Signals (Step 3 Creative Analysis).
 * Google, Meta, and Programmatic each use dedicated logo/CTA detection logic.
 */

import { getEntryPayload } from "./strategicPresentation";

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function hasSafeZoneIssue(creative) {
  return Array.isArray(creative?.validation?.issues)
    && creative.validation.issues.some((issue) => String(issue?.type || "").includes("safe_zone"));
}

function logoMentionedInCorpus(signals) {
  const corpus = [
    signals?.dominant_visual_cue,
    signals?.hierarchy_observations,
    signals?.layout_structure,
    ...(Array.isArray(signals?.visual_elements) ? signals.visual_elements : []),
  ].join(" ").toLowerCase();
  return /logo|wordmark|brand mark|brand icon|emblem|monogram/.test(corpus);
}

function findEvalSignal(evalBlock, pattern) {
  if (!evalBlock?.detected_signals) return null;
  return evalBlock.detected_signals.find((s) => pattern.test(String(s)));
}

function findEvalAvoided(evalBlock, pattern) {
  if (!evalBlock?.avoided_elements_found) return null;
  return evalBlock.avoided_elements_found.find((s) => pattern.test(String(s)));
}

function normalizeCtaText(signals, payload) {
  const fromSignals = signals?.cta?.trim();
  if (fromSignals) return fromSignals;
  const fromOcr = payload?.cta_text?.trim();
  if (fromOcr && fromOcr !== "unavailable") return fromOcr;
  return "";
}

function presenceLabel(detected, partial = false) {
  if (detected && !partial) return "detected";
  if (detected && partial) return "partial";
  return "not_detected";
}

function buildGoogleLogoDetection(signals, creative, payload, placementScores) {
  const googleEval = payload?.ai_analysis?.google_ads_dynamic_eval;
  const size = creative?.size || "";
  const brandPresence = signals?.brand_presence || "moderate";
  const evalLogo = findEvalSignal(googleEval, /logo|brand/i);
  const corpusLogo = logoMentionedInCorpus(signals);
  const detected = brandPresence !== "low" || corpusLogo || Boolean(evalLogo);
  const partial = brandPresence === "moderate" && !corpusLogo;

  let prominence = brandPresence === "high" ? "high" : brandPresence === "moderate" ? "moderate" : "low";
  if (evalLogo && /prominent|strong|visible/i.test(evalLogo)) prominence = "high";

  let positioning;
  if (/728x90|970x90|970x250/.test(size)) {
    positioning = "Leaderboard/billboard — anchor logo in left third; avoid crowding headline on GDN scan path";
  } else if (/320x50|320x100/.test(size)) {
    positioning = "Mobile leaderboard — compact logo mark only; pair with 3–5 word value prop max";
  } else if (/160x600|300x600/.test(size)) {
    positioning = "Skyscraper — top 15–20% logo zone; preserve mid-frame for offer/CTA on Display";
  } else if (/1200x628|1200x1200|1080x1080/.test(size)) {
    positioning = "RDA/Demand Gen master — upper-left or center-weighted for responsive crop across Display & YouTube";
  } else {
    positioning = "Google Display asset — upper quadrant placement survives RDA recomposition";
  }

  let visibilityScore = brandPresence === "high" ? 88 : brandPresence === "moderate" ? 65 : 38;
  if (placementScores?.responsive_display === "bad") visibilityScore -= 18;
  if (placementScores?.gdn === "bad") visibilityScore -= 12;
  if (hasSafeZoneIssue(creative)) visibilityScore -= 10;
  visibilityScore = clampScore(visibilityScore);

  let recommendation;
  if (!detected) {
    recommendation = "Add visible logo for brand recall on GDN and Responsive Display — Google rewards instant brand recognition in auction quality.";
  } else if (prominence === "low") {
    recommendation = "Increase logo size/contrast for Performance Max and YouTube companion — brand clarity affects ad strength signals.";
  } else if (/320x50|320x100/.test(size)) {
    recommendation = "Verify logo legibility at mobile leaderboard scale — simplify to icon-only if text competes with CTA.";
  } else {
    recommendation = "Logo placement supports Google Display, RDA, and Demand Gen — maintain contrast on white publisher backgrounds.";
  }

  const summary = detected
    ? `Logo ${partial ? "partially " : ""}detected (${prominence} prominence). ${evalLogo ? `Signal: ${evalLogo}.` : `Brand presence: ${brandPresence}.`}`
    : "No confident logo detection — brand mark may be absent or too subtle for Display scan behavior.";

  return {
    presence: presenceLabel(detected, partial),
    prominence,
    positioning,
    visibility_score: visibilityScore,
    summary,
    recommendation,
  };
}

function buildGoogleCtaDetection(signals, creative, payload, campaignGoal, placementScores) {
  const googleEval = payload?.ai_analysis?.google_ads_dynamic_eval;
  const ctaText = normalizeCtaText(signals, payload);
  const detected = Boolean(ctaText);
  const size = creative?.size || "";
  const textHigh = signals?.text_density === "high";
  const ctaStrength = payload?.ai_analysis?.scores?.cta_strength ?? payload?.ai_analysis?.scores?.ctaStrength;
  const evalCta = findEvalSignal(googleEval, /cta|button|action|shop|buy|learn/i);
  const avoidedCta = findEvalAvoided(googleEval, /cta|weak|missing/i);

  let visibility = "low";
  if (detected && !textHigh) visibility = "high";
  else if (detected && textHigh && !/320x50|320x100/.test(size)) visibility = "moderate";
  else if (detected) visibility = "partial";

  let effectivenessScore = detected ? 55 : 20;
  if (typeof ctaStrength === "number") effectivenessScore = ctaStrength;
  else if (evalCta) effectivenessScore += 15;
  if (campaignGoal === "conversion" || campaignGoal === "lead_generation") {
    if (/shop|buy|order|get|start|sign up|book/i.test(ctaText)) effectivenessScore += 12;
    else effectivenessScore -= 8;
  }
  if (textHigh && /320x50|320x100|728x90/.test(size)) effectivenessScore -= 15;
  if (placementScores?.responsive_display === "good") effectivenessScore += 5;
  if (avoidedCta) effectivenessScore -= 12;
  effectivenessScore = clampScore(effectivenessScore);

  let recommendation;
  if (!detected) {
    recommendation = "Add explicit CTA for Google Display/RDA — even awareness campaigns benefit from 'Learn More' or 'Shop Now' in asset groups.";
  } else if (visibility === "partial" || visibility === "low") {
    recommendation = "Simplify surrounding copy — CTA must dominate on mobile leaderboard (320×50) and narrow GDN slots.";
  } else if (campaignGoal === "conversion") {
    recommendation = "CTA text aligns with conversion goal — test stronger action verbs in Responsive Display ad copy extensions.";
  } else {
    recommendation = "CTA visibility supports Demand Gen and GDN — pair with matching final URL and extension assets.";
  }

  const summary = detected
    ? `CTA "${ctaText}" detected (${visibility} visibility, effectiveness ${effectivenessScore}/100).`
    : "No CTA text extracted — Google Display and RDA require clear action path for quality score.";

  return {
    presence: presenceLabel(detected, visibility === "partial"),
    text: ctaText || null,
    visibility,
    effectiveness_score: effectivenessScore,
    summary,
    recommendation,
  };
}

function buildMetaLogoDetection(signals, creative, payload, placementScores) {
  const metaEval = payload?.ai_analysis?.meta_ads_dynamic_eval;
  const size = creative?.size || "";
  const brandPresence = signals?.brand_presence || "moderate";
  const evalLogo = findEvalSignal(metaEval, /logo|brand/i);
  const detected = brandPresence !== "low" || logoMentionedInCorpus(signals) || Boolean(evalLogo);
  const partial = brandPresence === "moderate";

  let prominence = brandPresence === "high" ? "high" : brandPresence === "moderate" ? "moderate" : "low";

  let positioning;
  if (/1080x1920/.test(size)) {
    positioning = "Stories/Reels — center 60% vertical safe zone; avoid top 14% (profile) and bottom 20% (CTA strip)";
  } else if (/1080x1350/.test(size)) {
    positioning = "Instagram Feed 4:5 — logo top-left or center; leave lower third for caption overlay";
  } else if (/1080x1080/.test(size)) {
    positioning = "Feed/Carousel square — upper-left brand anchor; survives Feed card crop";
  } else {
    positioning = "Meta placement — keep logo inside center 70% for Feed, Story, and Reels UI overlays";
  }

  let visibilityScore = brandPresence === "high" ? 86 : brandPresence === "moderate" ? 64 : 36;
  if (placementScores?.reels === "bad" || placementScores?.stories === "bad") visibilityScore -= 14;
  if (hasSafeZoneIssue(creative)) visibilityScore -= 15;
  if (signals?.text_density === "high") visibilityScore -= 8;
  visibilityScore = clampScore(visibilityScore);

  let recommendation;
  if (!detected) {
    recommendation = "Add recognizable brand mark — Meta Feed and Reels rely on fast brand association for recall and trust.";
  } else if (hasSafeZoneIssue(creative)) {
    recommendation = "Move logo out of Meta UI overlay zones (Stories top bar, Reels right rail, Feed caption area).";
  } else if (placementScores?.reels === "bad") {
    recommendation = "Re-export 1080×1920 with logo centered — square assets letterbox and shrink brand in Reels.";
  } else {
    recommendation = "Logo visibility supports Feed and Reels delivery — maintain contrast against social-native backgrounds.";
  }

  const summary = detected
    ? `Logo detected (${prominence} prominence) for Meta Feed/Stories/Reels contexts.`
    : "Logo not confidently detected — may hurt brand recall in fast-scroll Feed and Reels inventory.";

  return {
    presence: presenceLabel(detected, partial),
    prominence,
    positioning,
    visibility_score: visibilityScore,
    summary,
    recommendation,
  };
}

function buildMetaCtaDetection(signals, creative, payload, campaignGoal, placementScores) {
  const metaEval = payload?.ai_analysis?.meta_ads_dynamic_eval;
  const ctaText = normalizeCtaText(signals, payload);
  const detected = Boolean(ctaText);
  const textHigh = signals?.text_density === "high";
  const size = creative?.size || "";
  const evalCta = findEvalSignal(metaEval, /cta|button|swipe|shop/i);

  let visibility = detected ? (textHigh ? "moderate" : "high") : "low";
  if (/1080x1920/.test(size) && textHigh) visibility = "partial";

  let effectivenessScore = detected ? 58 : 18;
  const ctaStrength = payload?.ai_analysis?.scores?.cta_strength ?? payload?.ai_analysis?.scores?.ctaStrength;
  if (typeof ctaStrength === "number") effectivenessScore = ctaStrength;
  if (campaignGoal === "conversion" && /shop|buy|order|get offer/i.test(ctaText)) effectivenessScore += 10;
  if (placementScores?.stories === "good" || placementScores?.reels === "good") effectivenessScore += 6;
  if (textHigh) effectivenessScore -= 12;
  if (findEvalAvoided(metaEval, /cta|text overlay|aggressive/i)) effectivenessScore -= 10;
  effectivenessScore = clampScore(effectivenessScore);

  let recommendation;
  if (!detected) {
    recommendation = "Add in-frame or primary-text CTA — Meta conversion campaigns need explicit action in Feed and Reels.";
  } else if (textHigh) {
    recommendation = "Reduce in-image CTA text — Meta may throttle delivery; move action to caption/headline fields.";
  } else if (placementScores?.stories !== "good") {
    recommendation = "Raise CTA above Stories bottom 20% safe zone or rely on 'Swipe Up' / link sticker pattern.";
  } else {
    recommendation = "CTA supports Meta objective — test 'Shop Now' vs 'Learn More' by placement (Feed vs Reels).";
  }

  const summary = detected
    ? `CTA "${ctaText}" detected (${visibility} visibility). ${evalCta ? `Meta signal: ${evalCta}.` : ""}`
    : "No CTA detected — Stories/Reels and Feed need clear action for conversion objectives.";

  return {
    presence: presenceLabel(detected, visibility === "partial"),
    text: ctaText || null,
    visibility,
    effectiveness_score: effectivenessScore,
    summary,
    recommendation,
  };
}

function buildProgrammaticLogoDetection(signals, creative, payload, placementScores) {
  const progEval = payload?.ai_analysis?.programmatic_ads_dynamic_eval;
  const enterpriseQa = payload?.enterprise_qa;
  const size = creative?.size || "";
  const brandPresence = signals?.brand_presence || "moderate";
  const evalLogo = findEvalSignal(progEval, /logo|brand|recogn/i);
  const detected = brandPresence !== "low" || logoMentionedInCorpus(signals) || Boolean(evalLogo);

  let prominence = brandPresence === "high" ? "high" : brandPresence === "moderate" ? "moderate" : "low";

  let positioning;
  if (/728x90|970x90|970x250/.test(size)) {
    positioning = "Horizontal IAB — left-anchor logo for peripheral recognition on news/finance pages";
  } else if (/160x600|300x600/.test(size)) {
    positioning = "Skyscraper — top logo block; mid-unit reserved for message and CTA";
  } else if (/320x50|320x100/.test(size)) {
    positioning = "Mobile banner — icon-only logo; minimal pixels available on RTB mobile web";
  } else if (/1200x628|1080x1080|1200x1200/.test(size)) {
    positioning = "Native/responsive — logo in card header zone for content-recommendation modules";
  } else {
    positioning = "Programmatic display — center-weighted brand block reduces banner-blindness skip rate";
  }

  let visibilityScore = brandPresence === "high" ? 84 : brandPresence === "moderate" ? 60 : 34;
  if (enterpriseQa?.banner_blindness_risk === "HIGH") visibilityScore -= 18;
  if (placementScores?.display_banners === "bad") visibilityScore -= 12;
  if (placementScores?.native_ads === "bad" && /1200x628|1080x1080/.test(size)) visibilityScore -= 10;
  visibilityScore = clampScore(visibilityScore);

  let recommendation;
  if (!detected) {
    recommendation = "Add high-contrast logo — programmatic display depends on instant brand recognition to beat banner blindness.";
  } else if (enterpriseQa?.banner_blindness_risk === "HIGH") {
    recommendation = "Strengthen logo contrast and size — generic layouts are skipped on cluttered publisher pages.";
  } else if (prominence === "low") {
    recommendation = "Increase logo prominence for DV360/TTD open exchange — brand block improves viewability attention scores.";
  } else {
    recommendation = "Logo supports IAB and native inventory — maintain legibility at 300×250 and 728×90 downstream crops.";
  }

  const summary = detected
    ? `Logo detected (${prominence} prominence) for programmatic IAB/native delivery.`
    : "Logo not detected — RTB inventory may underperform without peripheral brand anchor.";

  return {
    presence: presenceLabel(detected, prominence === "moderate"),
    prominence,
    positioning,
    visibility_score: visibilityScore,
    summary,
    recommendation,
  };
}

function buildProgrammaticCtaDetection(signals, creative, payload, campaignGoal, placementScores) {
  const progEval = payload?.ai_analysis?.programmatic_ads_dynamic_eval;
  const enterpriseQa = payload?.enterprise_qa;
  const ctaText = normalizeCtaText(signals, payload);
  const detected = Boolean(ctaText);
  const size = creative?.size || "";
  const textHigh = signals?.text_density === "high";

  let visibility = detected ? (textHigh ? "moderate" : "high") : "low";
  if (/320x50|728x90/.test(size) && textHigh) visibility = "low";

  let effectivenessScore = detected ? 52 : 16;
  const ctaStrength = payload?.ai_analysis?.scores?.cta_strength;
  if (typeof ctaStrength === "number") effectivenessScore = ctaStrength;
  if (findEvalSignal(progEval, /cta|action|click/i)) effectivenessScore += 10;
  if (enterpriseQa?.banner_blindness_risk === "HIGH") effectivenessScore -= 15;
  if (placementScores?.display_banners === "good") effectivenessScore += 8;
  effectivenessScore = clampScore(effectivenessScore);

  let recommendation;
  if (!detected) {
    recommendation = "Add CTA button/text — programmatic banners need one clear action for sub-second peripheral scans.";
  } else if (/320x50|320x100/.test(size)) {
    recommendation = "Use 2–3 word CTA only on mobile leaderboard — full sentences fail at RTB mobile scale.";
  } else if (textHigh) {
    recommendation = "Reduce copy density — CTA must visually dominate on 728×90 and 300×250 IAB units.";
  } else {
    recommendation = "CTA supports display CTR — test contrasting button color for native and banner line items.";
  }

  const summary = detected
    ? `CTA "${ctaText}" detected (${visibility} visibility, effectiveness ${effectivenessScore}/100).`
    : "No CTA extracted — display inventory requires explicit action path for measurable CTR.";

  return {
    presence: presenceLabel(detected, visibility === "partial"),
    text: ctaText || null,
    visibility,
    effectiveness_score: effectivenessScore,
    summary,
    recommendation,
  };
}

function mergeBaseSignals(raw, payload) {
  const adigator = payload?.adigator_analysis || {};
  const creativeType = adigator.creative_type || payload?.creative_type_detection?.primary_type;

  return {
    ...raw,
    primary_message: raw?.primary_message || raw?.strategic_interpretation || "",
    emotional_cues: Array.isArray(raw?.emotional_cues) ? raw.emotional_cues : [],
    visual_elements: Array.isArray(raw?.visual_elements) ? raw.visual_elements : [],
    topic_summary:
      raw?.topic_summary
      || raw?.primary_message
      || raw?.strategic_interpretation
      || raw?.hierarchy_observations
      || "",
    persuasion_style:
      raw?.persuasion_style
      || raw?.advertising_behavior
      || creativeType
      || "",
    platform_context: raw?.platform_context || payload?.platform_context || "",
    objective_context: raw?.objective_context || payload?.goal_alignment?.selected_goal || "",
  };
}

/**
 * @param {object|null} rawSignals
 * @param {object} payload
 * @param {object} creative
 * @param {string} platform
 * @param {string} campaignGoal
 * @param {object} placementScores
 */
export function enrichExtractionSignals(rawSignals, payload, creative, platform, campaignGoal, placementScores) {
  if (!rawSignals) return null;

  const base = mergeBaseSignals(rawSignals, payload);

  if (platform === "google_ads") {
    return {
      ...base,
      logo_detection: buildGoogleLogoDetection(base, creative, payload, placementScores),
      cta_detection: buildGoogleCtaDetection(base, creative, payload, campaignGoal, placementScores),
    };
  }

  if (platform === "meta_ads") {
    return {
      ...base,
      logo_detection: buildMetaLogoDetection(base, creative, payload, placementScores),
      cta_detection: buildMetaCtaDetection(base, creative, payload, campaignGoal, placementScores),
    };
  }

  return {
    ...base,
    logo_detection: buildProgrammaticLogoDetection(base, creative, payload, placementScores),
    cta_detection: buildProgrammaticCtaDetection(base, creative, payload, campaignGoal, placementScores),
  };
}

export function enrichInsightExtractionSignals(insight, entry, platform, campaignGoal) {
  const payload = getEntryPayload(entry) || {};
  const creative = entry?.creative || {};
  return enrichExtractionSignals(
    insight.extractionSignals,
    payload,
    creative,
    platform,
    campaignGoal,
    insight.placementScores,
  );
}
