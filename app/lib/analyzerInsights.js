/**
 * Platform-aware campaign and creative analysis for Step 3.
 * Derives risk signals, placement compatibility, and launch recommendations
 * from validation data + AI extraction payloads.
 */

import { PLATFORM_SUPPORTED_SIZE_GROUPS } from "./creativeValidation";
import {
  getEntryPayload,
  getExtractionSignals,
  getGoalAlignment,
  getValidatedRecommendations,
  getVerticalAlignment,
} from "./strategicPresentation";

export const LAUNCH_STATUS = {
  ready: { emoji: "🟢", label: "Launch Ready", tone: "emerald" },
  review: { emoji: "🟡", label: "Needs Review", tone: "amber" },
  misaligned: { emoji: "🔴", label: "Misaligned", tone: "red" },
};

export const CAMPAIGN_LAUNCH_STATUS = {
  ready: { emoji: "🟢", label: "Ready to Launch", tone: "emerald" },
  minor: { emoji: "🟡", label: "Launch With Minor Fixes", tone: "amber" },
  revision: { emoji: "🔴", label: "Revision Recommended Before Launch", tone: "red" },
};

const PLACEMENT_EMOJI = {
  good: "🟢",
  warning: "🟡",
  bad: "🔴",
};

function parseSize(size) {
  const [width, height] = String(size || "").split("x").map((n) => Number(n));
  if (!width || !height) return null;
  return { width, height, label: `${width}x${height}`, ratio: width / height };
}

function sizeInGroups(size, groups) {
  if (!groups || typeof groups !== "object") return false;
  return Object.values(groups).some((list) => Array.isArray(list) && list.includes(size));
}

function isMobileSize(size) {
  const groups = PLATFORM_SUPPORTED_SIZE_GROUPS;
  const mobileLists = [
    ...(groups.google_ads?.mobile_display || []),
    ...(groups.meta_ads?.story_reels || []),
    ...(groups.programmatic?.mobile_display || []),
    "320x50", "320x100", "320x480", "480x320",
  ];
  return mobileLists.includes(size);
}

function isDesktopSize(size) {
  const groups = PLATFORM_SUPPORTED_SIZE_GROUPS;
  const desktopLists = [
    ...(groups.google_ads?.desktop_display || []),
    ...(groups.programmatic?.standard_display || []),
    "728x90", "970x90", "970x250", "160x600", "300x600",
  ];
  return desktopLists.includes(size);
}

function hasCriticalValidation(creative) {
  const validation = creative?.validation;
  if (!validation) return false;
  if (validation.status === "CRITICAL" || validation.valid === false) return true;
  return Array.isArray(validation.issues)
    && validation.issues.some((issue) => issue?.severity === "high" || issue?.severity === "critical");
}

function hasValidationIssueType(creative, typePrefix) {
  return Array.isArray(creative?.validation?.issues)
    && creative.validation.issues.some((issue) => String(issue?.type || "").startsWith(typePrefix));
}

export function getPlacementColumns(platform) {
  if (platform === "meta_ads") {
    return [
      { id: "feed", label: "Feed" },
      { id: "stories", label: "Stories" },
      { id: "reels", label: "Reels" },
      { id: "mobile", label: "Mobile" },
      { id: "desktop", label: "Desktop" },
    ];
  }
  if (platform === "google_ads") {
    return [
      { id: "display", label: "Display" },
      { id: "youtube", label: "YouTube" },
      { id: "discover", label: "Discover" },
      { id: "shopping", label: "Shopping" },
      { id: "mobile", label: "Mobile" },
      { id: "desktop", label: "Desktop" },
    ];
  }
  return [
    { id: "standard", label: "Standard" },
    { id: "premium", label: "Premium" },
    { id: "mobile_web", label: "Mobile Web" },
    { id: "native", label: "Native" },
    { id: "desktop", label: "Desktop" },
    { id: "mobile", label: "Mobile" },
  ];
}

function metaPlacementScores(size, signals, creative) {
  const dims = parseSize(size);
  const ratio = dims?.ratio || 1;
  const textHigh = signals?.text_density === "high";
  const feedSizes = PLATFORM_SUPPORTED_SIZE_GROUPS.meta_ads.feed_placements;
  const storySizes = PLATFORM_SUPPORTED_SIZE_GROUPS.meta_ads.story_reels;

  let feed = feedSizes.includes(size) ? "good" : ratio >= 0.9 && ratio <= 1.2 ? "warning" : "bad";
  let stories = storySizes.includes(size) ? (textHigh ? "warning" : "good") : ratio > 1.3 ? "warning" : "bad";
  let reels = storySizes.includes(size) ? (textHigh ? "warning" : "good") : ratio >= 0.5 && ratio <= 0.65 ? "warning" : "bad";

  if (hasValidationIssueType(creative, "safe_zone")) stories = "bad";
  if (hasValidationIssueType(creative, "placement_fit")) {
    if (feed === "good") feed = "warning";
    if (reels === "good") reels = "warning";
  }

  const mobile = isMobileSize(size) || ratio <= 0.85 ? "good" : ratio <= 1.1 ? "warning" : "bad";
  const desktop = isDesktopSize(size) || ratio >= 1.5 ? "warning" : ratio >= 1.9 ? "bad" : feed === "good" ? "warning" : "bad";

  return { feed, stories, reels, mobile, desktop };
}

function googlePlacementScores(size, signals, creative) {
  const dims = parseSize(size);
  const ratio = dims?.ratio || 1;
  const groups = PLATFORM_SUPPORTED_SIZE_GROUPS.google_ads;
  const textHigh = signals?.text_density === "high";

  const display = sizeInGroups(size, groups) ? "good" : "bad";
  const youtube = ratio >= 1.6 && ratio <= 1.85 ? "good" : ratio >= 1.3 ? "warning" : "bad";
  const discover = ["1200x628", "1080x1080", "960x1200"].includes(size) ? "good" : ratio >= 1.2 ? "warning" : "bad";
  const shopping = ["1080x1080", "1200x1200", "1200x628"].includes(size) ? "good" : ratio >= 0.9 && ratio <= 1.1 ? "warning" : "bad";
  const mobile = isMobileSize(size) ? "good" : groups.mobile_display.includes(size) ? "good" : "warning";
  const desktop = isDesktopSize(size) ? "good" : groups.desktop_display.includes(size) ? "good" : "warning";

  if (textHigh && display === "good") {
    return { display: "warning", youtube, discover, shopping, mobile, desktop };
  }
  if (hasCriticalValidation(creative)) {
    return { display: "bad", youtube: "warning", discover: "warning", shopping: "warning", mobile: "warning", desktop: "warning" };
  }
  return { display, youtube, discover, shopping, mobile, desktop };
}

function programmaticPlacementScores(size, signals, creative) {
  const groups = PLATFORM_SUPPORTED_SIZE_GROUPS.programmatic;
  const textHigh = signals?.text_density === "high";
  const standard = groups.standard_display.includes(size) ? "good" : "warning";
  const premium = groups.high_impact_premium.includes(size) ? "good" : standard === "good" ? "warning" : "bad";
  const mobileWeb = groups.mobile_display.includes(size) ? "good" : isMobileSize(size) ? "warning" : "bad";
  const native = groups.native_social_display.includes(size) ? "good" : "warning";
  const desktop = isDesktopSize(size) ? "good" : standard === "good" ? "warning" : "bad";
  const mobile = isMobileSize(size) ? "good" : mobileWeb === "good" ? "warning" : "bad";

  if (textHigh && standard === "good") {
    return { standard: "warning", premium, mobile_web: mobileWeb, native, desktop, mobile };
  }
  if (hasCriticalValidation(creative)) {
    return { standard: "bad", premium: "warning", mobile_web: "warning", native: "warning", desktop: "warning", mobile: "warning" };
  }
  return { standard, premium, mobile_web: mobileWeb, native, desktop, mobile };
}

export function computePlacementCompatibility(creative, platform, payload) {
  const size = creative?.size || "";
  const signals = getExtractionSignals(payload) || {};
  let scores;

  if (platform === "meta_ads") scores = metaPlacementScores(size, signals, creative);
  else if (platform === "google_ads") scores = googlePlacementScores(size, signals, creative);
  else scores = programmaticPlacementScores(size, signals, creative);

  return scores;
}

function buildEnrichedGoalReason(goalAlignment, signals, campaignGoal) {
  const parts = [];
  const headline = signals?.headline || "";
  const topic = signals?.topic_summary || signals?.dominant_visual_cue || "";
  const emotional = Array.isArray(signals?.emotional_cues) ? signals.emotional_cues.join(", ") : "";
  const cta = signals?.cta || "";
  const persuasion = signals?.persuasion_style || "";

  if (topic) parts.push(`Message focus: ${topic}`);
  if (emotional) parts.push(`Emotional tone: ${emotional}`);
  if (persuasion) parts.push(`Persuasion style: ${persuasion}`);
  if (headline) parts.push(`Headline signals: "${headline}"`);
  if (cta) parts.push(`CTA layer: "${cta}"`);

  const baseReason = goalAlignment?.reason || "";
  const goalLabel = campaignGoal || goalAlignment?.selected_goal || "campaign goal";

  if (goalAlignment?.is_aligned === true) {
    return parts.length
      ? `Aligned with ${goalLabel} — content, tone, and message work together. ${parts.slice(0, 2).join(". ")}.`
      : baseReason || `Creative messaging supports the ${goalLabel} objective across content and tone.`;
  }

  if (goalAlignment?.is_aligned === false) {
    return baseReason
      || `Content and tone read as ${goalAlignment?.detected_goal || "a different stage"} intent rather than ${goalLabel}. ${parts.slice(0, 2).join(". ")}`;
  }

  return baseReason || parts.join(". ") || "Goal alignment could not be fully determined from available signals.";
}

function deriveMetaTechnicalQa(creative, payload) {
  const items = [];
  const size = creative?.size || "";
  const fileKb = creative?.fileSizeKB;
  const signals = getExtractionSignals(payload) || {};
  const metaEval = payload?.ai_analysis?.meta_ads_dynamic_eval;

  if (size === "1080x1080") {
    items.push({ status: "pass", text: "1080×1080 — Meta Tier-1 square format for Feed, Carousel, and Marketplace grids" });
  } else if (size === "1080x1350") {
    items.push({ status: "pass", text: "1080×1350 (4:5) — mobile-first Feed format with extra vertical storytelling room" });
  } else if (size === "1080x1920") {
    items.push({ status: "pass", text: "1080×1920 (9:16) — full-screen Stories/Reels native canvas" });
  } else if (size === "1200x628") {
    items.push({ status: "warn", text: "1200×628 link-ad ratio — works for Feed link previews but not Stories/Reels inventory" });
  } else {
    items.push({ status: "warn", text: `${size || "Unknown size"} is non-core for Meta — export 1080×1080, 1080×1350, or 1080×1920` });
  }

  if (signals.text_density === "high") {
    items.push({ status: "warn", text: "Heavy text overlay detected — Meta delivery may throttle; keep copy under ~20% of frame" });
  } else if (signals.text_density === "moderate") {
    items.push({ status: "warn", text: "Moderate text overlay — verify CTA and headline sit outside Stories top/bottom 14% safe zones" });
  } else {
    items.push({ status: "pass", text: "Text load is light — aligned with Meta's in-feed and Reels delivery preferences" });
  }

  if (fileKb && fileKb <= 5120) {
    items.push({ status: "pass", text: `File weight (${fileKb}KB) supports fast mobile feed render and thumb-stop retention` });
  } else if (fileKb) {
    items.push({ status: "warn", text: `${fileKb}KB payload may slow first-frame paint in Reels/Stories on slower connections` });
  }

  if (hasValidationIssueType(creative, "safe_zone")) {
    items.push({ status: "fail", text: "CTA or headline likely overlaps Meta UI chrome — move action elements to center 70% of frame" });
  }

  if (Array.isArray(metaEval?.avoided_elements_found) && metaEval.avoided_elements_found.length > 0) {
    items.push({ status: "warn", text: `Meta audit flag: ${metaEval.avoided_elements_found[0]}` });
  } else if (Array.isArray(metaEval?.detected_signals) && metaEval.detected_signals.length > 0) {
    items.push({ status: "pass", text: `Social-native signal present: ${metaEval.detected_signals[0]}` });
  }

  return items.slice(0, 5);
}

function deriveTechnicalQaGeneric(creative, payload, platform) {
  const items = [];
  const validation = creative?.validation;
  const size = creative?.size;
  const fileKb = creative?.fileSizeKB;

  if (!hasCriticalValidation(creative) && validation?.valid !== false) {
    items.push({ status: "pass", text: "Dimensions pass platform validation checks" });
  } else {
    items.push({ status: "warn", text: "Dimension or format issues detected — review validation flags" });
  }

  if (fileKb && fileKb <= 150) {
    items.push({ status: "pass", text: "File size optimized for delivery" });
  } else   if (fileKb) {
    items.push({ status: "warn", text: `File size ${fileKb}KB may affect load speed` });
  }

  const adigatorRisks = payload?.adigator_analysis?.technical_risks;
  if (Array.isArray(adigatorRisks) && adigatorRisks.some((r) => String(r).toLowerCase() !== "none")) {
    items.push({ status: "warn", text: adigatorRisks.find((r) => String(r).toLowerCase() !== "none") });
  }

  return items;
}

function deriveTechnicalQa(creative, payload, platform) {
  if (platform === "meta_ads") return deriveMetaTechnicalQa(creative, payload);
  if (platform === "google_ads") return deriveGoogleTechnicalQa(creative, payload);
  if (platform === "programmatic") return deriveProgrammaticTechnicalQa(creative, payload);
  return deriveTechnicalQaGeneric(creative, payload, platform);
}

function deriveProgrammaticTechnicalQa(creative, payload) {
  const items = [];
  const size = creative?.size || "";
  const fileKb = creative?.fileSizeKB;
  const signals = getExtractionSignals(payload) || {};
  const intel = creative?.validation?.intelligence;
  const progEval = payload?.ai_analysis?.programmatic_ads_dynamic_eval;
  const enterpriseQa = payload?.enterprise_qa;
  const groups = PLATFORM_SUPPORTED_SIZE_GROUPS.programmatic;

  if (intel?.iabCompatibility?.compatible) {
    items.push({
      status: "pass",
      text: `${size} (${intel.sizeLabel || "IAB"}) — ${intel.iabCompatibility.standard || "core"} programmatic format with open-exchange fill`,
    });
  } else if (sizeInGroups(size, groups)) {
    items.push({ status: "pass", text: `${size} recognized in programmatic IAB inventory matrix` });
  } else {
    items.push({ status: "warn", text: `${size || "Unknown"} is non-core — prioritize 300×250, 728×90, 336×280, or 320×50 for RTB scale` });
  }

  const dspCount = intel?.dspCompatibility?.count ?? creative?.dspCompatibility?.count;
  if (typeof dspCount === "number" && dspCount >= 5) {
    items.push({ status: "pass", text: `DSP-ready across ${dspCount} major buyers (DV360, TTD, Xandr-class demand)` });
  } else if (typeof dspCount === "number" && dspCount > 0) {
    items.push({ status: "warn", text: `Limited DSP coverage (${dspCount} partners) — may restrict programmatic scale and deal access` });
  }

  const auctionBand = intel?.auctionReadiness?.band || creative?.auctionReadiness?.band;
  if (auctionBand === "Excellent" || auctionBand === "Strong") {
    items.push({ status: "pass", text: `${auctionBand} auction readiness — competitive bid density expected on open exchange` });
  } else if (auctionBand) {
    items.push({ status: "warn", text: `${auctionBand} auction readiness — thinner bid competition vs 300×250 / 728×90 leaders` });
  }

  if (fileKb && fileKb <= 150) {
    items.push({ status: "pass", text: `File weight (${fileKb}KB) meets display viewability and RTB load-speed guidance` });
  } else if (fileKb) {
    items.push({ status: "fail", text: `${fileKb}KB exceeds 150KB banner guidance — hurts viewability scores and win rate in RTB` });
  }

  if (signals.text_density === "high" && (size === "320x50" || size === "728x90" || size === "320x100")) {
    items.push({ status: "fail", text: "Heavy copy on leaderboard/mobile banner — peripheral scan fails in under 1 second" });
  } else if (signals.text_density === "high") {
    items.push({ status: "warn", text: "High text density — display inventory favors one-message clarity to survive banner blindness" });
  } else {
    items.push({ status: "pass", text: "Copy load supports quick peripheral recognition on cluttered publisher pages" });
  }

  if (enterpriseQa?.banner_blindness_risk === "HIGH") {
    items.push({ status: "fail", text: "High banner-blindness risk — creative blends into generic display patterns users skip" });
  }

  if (hasValidationIssueType(creative, "inventory")) {
    items.push({ status: "fail", text: "Size outside supported programmatic matrix — line items may reject or under-fill" });
  }

  if (Array.isArray(progEval?.avoided_elements_found) && progEval.avoided_elements_found[0]) {
    items.push({ status: "warn", text: `Programmatic audit: ${progEval.avoided_elements_found[0]}` });
  } else if (Array.isArray(progEval?.detected_signals) && progEval.detected_signals[0]) {
    items.push({ status: "pass", text: `Attention signal: ${progEval.detected_signals[0]}` });
  }

  return items.slice(0, 5);
}

function deriveGoogleTechnicalQa(creative, payload) {
  const items = [];
  const size = creative?.size || "";
  const fileKb = creative?.fileSizeKB;
  const signals = getExtractionSignals(payload) || {};
  const googleEval = payload?.ai_analysis?.google_ads_dynamic_eval;
  const groups = PLATFORM_SUPPORTED_SIZE_GROUPS.google_ads;
  const tier1 = new Set(["300x250", "728x90", "160x600", "300x600", "320x50", "970x250", "1200x628", "1200x1200", "1080x1080"]);
  const dims = parseSize(size);

  if (tier1.has(size)) {
    items.push({ status: "pass", text: `${size} — Google Tier-1 display size with broad Search/Display/YouTube companion coverage` });
  } else if (sizeInGroups(size, groups)) {
    items.push({ status: "pass", text: `${size} — recognized in Google Display & Mobile inventory set` });
  } else {
    items.push({ status: "warn", text: `${size || "Unknown"} is non-core for Google Ads — prefer 300×250, 728×90, 320×50, 970×250, or 1200×628` });
  }

  if (dims && dims.width >= 600 && dims.height >= 314) {
    items.push({ status: "pass", text: "Meets Responsive Display Ad minimum landscape asset guidance (600×314+)" });
  } else if (dims && dims.width >= 300 && dims.height >= 300) {
    items.push({ status: "warn", text: "Square asset may work for RDA but lacks ideal landscape ratio for YouTube/Display expansion" });
  } else if (dims) {
    items.push({ status: "fail", text: "Below Google RDA minimum dimensions — may not serve across Display Network placements" });
  }

  if (fileKb && fileKb <= 150) {
    items.push({ status: "pass", text: `File weight (${fileKb}KB) meets Google Display 150KB guidance for fast viewability` });
  } else if (fileKb) {
    items.push({ status: "warn", text: `${fileKb}KB exceeds 150KB Display recommendation — may reduce viewability score and load speed` });
  }

  if (signals.text_density === "high" && (size === "320x50" || size === "320x100")) {
    items.push({ status: "fail", text: "Heavy text on mobile leaderboard (320×50/320×100) — message will be unreadable at scan speed" });
  } else if (signals.text_density === "high") {
    items.push({ status: "warn", text: "High text density — Google Display favors clear hierarchy; reduce copy for small IAB slots" });
  } else {
    items.push({ status: "pass", text: "Text load supports quick scan behavior on Search and Display surfaces" });
  }

  if (hasValidationIssueType(creative, "rda")) {
    items.push({ status: "fail", text: "Responsive Display asset ratio fails Google minimum specs — re-export landscape or square master" });
  }

  if (Array.isArray(googleEval?.avoided_elements_found) && googleEval.avoided_elements_found[0]) {
    items.push({ status: "warn", text: `Google audit flag: ${googleEval.avoided_elements_found[0]}` });
  } else if (Array.isArray(googleEval?.detected_signals) && googleEval.detected_signals[0]) {
    items.push({ status: "pass", text: `Intent signal detected: ${googleEval.detected_signals[0]}` });
  }

  return items.slice(0, 5);
}

function deriveMetaPlacementQa(creative, payload) {
  const scores = computePlacementCompatibility(creative, "meta_ads", payload);
  const size = creative?.size || "";
  const signals = getExtractionSignals(payload) || {};
  const metaEval = payload?.ai_analysis?.meta_ads_dynamic_eval;
  const items = [];

  if (scores.feed === "good") {
    items.push({ status: "pass", text: "Instagram & Facebook Feed — aspect ratio fits in-feed card without awkward crop" });
  } else if (scores.feed === "warning") {
    items.push({ status: "warn", text: "Feed may letterbox or crop — re-export as 1080×1080 or 1080×1350 for cleaner card fit" });
  } else {
    items.push({ status: "fail", text: "Feed placement not recommended — current ratio breaks Meta feed card layout" });
  }

  if (scores.stories === "good") {
    items.push({ status: "pass", text: "Stories — 9:16 canvas with safe margins for profile pill, swipe-up, and reply UI" });
  } else if (scores.stories === "warning") {
    items.push({ status: "warn", text: "Stories usable but copy/CTA may sit under top profile bar or bottom CTA strip — shift to center safe zone" });
  } else {
    items.push({ status: "fail", text: `Stories blocked — ${size === "1080x1080" ? "square assets letterbox in Stories and lose immersion" : "needs 1080×1920 for full-screen Stories inventory"}` });
  }

  if (scores.reels === "good") {
    items.push({ status: "pass", text: "Reels — vertical full-bleed format supports thumb-stop in first 1–2 seconds" });
  } else if (scores.reels === "warning") {
    items.push({ status: "warn", text: "Reels visibility reduced — vertical crop will shrink hero product/face in first frame" });
  } else {
    items.push({ status: "fail", text: "Reels not viable — square/landscape creative loses ~35% of Meta short-form inventory" });
  }

  if (signals.text_density === "high") {
    items.push({ status: "warn", text: "Heavy overlay text hurts Reels/Stories completion — lead with visual hook, move copy to caption" });
  }

  if (Array.isArray(metaEval?.missing_signals) && metaEval.missing_signals[0]) {
    items.push({ status: "warn", text: `Missing Meta placement signal: ${metaEval.missing_signals[0]}` });
  }

  return items.slice(0, 5);
}

function deriveGooglePlacementQa(creative, payload) {
  const scores = computePlacementCompatibility(creative, "google_ads", payload);
  const size = creative?.size || "";
  const signals = getExtractionSignals(payload) || {};
  const googleEval = payload?.ai_analysis?.google_ads_dynamic_eval;
  const items = [];

  if (scores.display === "good") {
    items.push({ status: "pass", text: "Display Network — IAB size fits premium publisher & GDN banner slots without distortion" });
  } else if (scores.display === "warning") {
    items.push({ status: "warn", text: "Display usable with crop risk — verify 300×250 or 728×90 masters for news site placements" });
  } else {
    items.push({ status: "fail", text: "Display Network blocked — current dimensions not in Google supported display inventory" });
  }

  if (scores.youtube === "good") {
    items.push({ status: "pass", text: "YouTube — 16:9-friendly ratio suits in-stream skippable and bumper companion frames" });
  } else if (scores.youtube === "warning") {
    items.push({ status: "warn", text: "YouTube may letterbox — export 1280×720 or 1920×1080 for full player fill" });
  } else {
    items.push({ status: "fail", text: `YouTube weak — ${size === "1080x1080" || size === "300x250" ? "square/banner assets don't fill video player viewport" : "aspect ratio not suited to video placements"}` });
  }

  if (scores.discover === "good") {
    items.push({ status: "pass", text: "Discover — card ratio supports Google Discover feed cards on mobile" });
  } else if (scores.discover === "warning") {
    items.push({ status: "warn", text: "Discover card may crop hero — use 1200×628 or 960×1200 for native card fit" });
  } else {
    items.push({ status: "fail", text: "Discover placement not recommended for this aspect ratio" });
  }

  if (scores.shopping === "good") {
    items.push({ status: "pass", text: "Shopping — square/product ratio aligns with Merchant Center image requirements" });
  } else if (scores.shopping === "warning") {
    items.push({ status: "warn", text: "Shopping may crop product — square 1080×1080 or 1200×1200 preferred" });
  } else {
    items.push({ status: "fail", text: "Shopping grid incompatible — product may clip in Shopping SERP tiles" });
  }

  if (signals.text_density === "high" && scores.mobile !== "good") {
    items.push({ status: "warn", text: "Dense copy on mobile display sizes hurts AdMob/ mobile web scan clarity" });
  }

  if (Array.isArray(googleEval?.missing_signals) && googleEval.missing_signals[0]) {
    items.push({ status: "warn", text: `Missing Google signal: ${googleEval.missing_signals[0]}` });
  }

  return items.slice(0, 5);
}

function deriveProgrammaticPlacementQa(creative, payload) {
  const scores = computePlacementCompatibility(creative, "programmatic", payload);
  const signals = getExtractionSignals(payload) || {};
  const progEval = payload?.ai_analysis?.programmatic_ads_dynamic_eval;
  const intel = creative?.validation?.intelligence;
  const items = [];

  if (scores.standard === "good") {
    items.push({ status: "pass", text: "Standard IAB display — fits news, finance, and lifestyle publisher inline/sidebar slots" });
  } else if (scores.standard === "warning") {
    items.push({ status: "warn", text: "Standard display usable with scale limits — verify 300×250 or 728×90 for broad RTB fill" });
  } else {
    items.push({ status: "fail", text: "Standard display weak — size outside core open-exchange banner inventory" });
  }

  if (scores.premium === "good") {
    items.push({ status: "pass", text: "Premium/high-impact — eligible for billboard (970×250) and large sidebar packages" });
  } else if (scores.premium === "warning") {
    items.push({ status: "warn", text: "Premium packages may down-tier — export 970×250 or 300×600 for high-CPM sections" });
  } else {
    items.push({ status: "fail", text: "Not premium-eligible — unlikely to win above-the-fold homepage or takeover bids" });
  }

  if (scores.mobile_web === "good") {
    items.push({ status: "pass", text: "Mobile web — sized for sticky banners and in-app mobile browser placements" });
  } else if (scores.mobile_web === "warning") {
    items.push({ status: "warn", text: "Mobile web may crop — 320×50 or 300×250 preferred for mobile publisher fill" });
  } else {
    items.push({ status: "fail", text: "Mobile web blocked — format too large or wrong orientation for mobile slots" });
  }

  if (scores.native === "good") {
    items.push({ status: "pass", text: "Native/social-display — ratio suits content-recommendation and in-feed native units" });
  } else if (scores.native === "warning") {
    items.push({ status: "warn", text: "Native adaptability limited — 1200×628 or 1080×1080 improves in-feed card fit" });
  } else {
    items.push({ status: "fail", text: "Native placement weak — banner aspect won't render cleanly in content modules" });
  }

  if (intel?.premiumPlacement?.eligible === false && scores.premium !== "good") {
    items.push({ status: "warn", text: "Standard-only inventory tier — premium publisher PMP deals may filter this format" });
  }

  if (signals.text_density === "high" && scores.mobile_web !== "good") {
    items.push({ status: "warn", text: "Dense copy on mobile web sizes reduces scan clarity in sticky and interstitial slots" });
  }

  if (Array.isArray(progEval?.missing_signals) && progEval.missing_signals[0]) {
    items.push({ status: "warn", text: `Missing programmatic signal: ${progEval.missing_signals[0]}` });
  }

  return items.slice(0, 5);
}

function derivePlacementQa(creative, payload, platform) {
  if (platform === "meta_ads") return deriveMetaPlacementQa(creative, payload);
  if (platform === "google_ads") return deriveGooglePlacementQa(creative, payload);
  if (platform === "programmatic") return deriveProgrammaticPlacementQa(creative, payload);

  const items = [];
  const scores = computePlacementCompatibility(creative, platform, payload);
  const columns = getPlacementColumns(platform);
  const signals = getExtractionSignals(payload) || {};

  columns.forEach((col) => {
    const level = scores[col.id];
    if (level === "good") items.push({ status: "pass", text: `${col.label} placement compatible` });
    else if (level === "warning") items.push({ status: "warn", text: `${col.label} placement usable with adjustments` });
    else items.push({ status: "fail", text: `${col.label} placement weak for current dimensions` });
  });

  if (signals?.text_density === "high") {
    items.push({ status: "warn", text: "Text density may reduce Stories/Reels and small-slot effectiveness" });
  }

  const evalBlock = payload?.ai_analysis?.meta_ads_dynamic_eval
    || payload?.ai_analysis?.google_ads_dynamic_eval
    || payload?.ai_analysis?.programmatic_ads_dynamic_eval;

  if (Array.isArray(evalBlock?.missing_signals) && evalBlock.missing_signals.length > 0) {
    items.push({ status: "warn", text: `Missing placement signal: ${evalBlock.missing_signals[0]}` });
  }

  return items.slice(0, 5);
}

function deriveMetaMainRisk(creative, payload, campaignVertical) {
  const size = creative?.size || "";
  const scores = computePlacementCompatibility(creative, "meta_ads", payload);
  const signals = getExtractionSignals(payload) || {};
  const goal = getGoalAlignment(payload);
  const vertical = getVerticalAlignment(payload);
  const metaEval = payload?.ai_analysis?.meta_ads_dynamic_eval;

  if (vertical?.is_aligned === false) {
    return `Vertical bleed — creative reads as ${vertical.detected_vertical || "another category"}, not ${campaignVertical || vertical.selected_vertical}. Meta's interest targeting may deliver to the wrong audience cluster.`;
  }

  if (size === "1080x1080" && (scores.stories === "bad" || scores.reels === "bad")) {
    return "Square format wins Feed but forfeits Stories/Reels — you lose full-screen Meta inventory where CPMs are often lower and engagement is higher.";
  }

  if (signals.text_density === "high" && (scores.stories !== "good" || scores.reels !== "good")) {
    return "Text-heavy overlay plus non-vertical canvas — Meta may suppress delivery in Stories/Reels where UI chrome covers bottom-third CTAs.";
  }

  if (hasValidationIssueType(creative, "safe_zone")) {
    return "Story-safe zone violation — headline or CTA sits in Meta's top/bottom UI overlay area, making the ad ineffective when users tap through.";
  }

  if (scores.reels === "bad" || scores.reels === "warning") {
    return "Reels thumb-stop risk — first-frame hook may not fill vertical viewport, reducing scroll-stop power in Instagram's highest-growth surface.";
  }

  if (goal?.is_aligned === false) {
    const detected = goal.detected_goal || "conversion";
    return `Message tone signals ${detected}-stage intent — emotional hook and CTA pressure don't match your selected ${goal.selected_goal || "campaign"} goal on Meta.`;
  }

  if (Array.isArray(metaEval?.avoided_elements_found) && metaEval.avoided_elements_found[0]) {
    return metaEval.avoided_elements_found[0];
  }

  if (payload?.adigator_analysis?.main_risk) return payload.adigator_analysis.main_risk;
  if (payload?.main_strategic_problem) return payload.main_strategic_problem;

  return null;
}

function deriveGoogleMainRisk(creative, payload, campaignVertical) {
  const size = creative?.size || "";
  const scores = computePlacementCompatibility(creative, "google_ads", payload);
  const signals = getExtractionSignals(payload) || {};
  const goal = getGoalAlignment(payload);
  const vertical = getVerticalAlignment(payload);
  const googleEval = payload?.ai_analysis?.google_ads_dynamic_eval;
  const dims = parseSize(size);

  if (vertical?.is_aligned === false) {
    return `Vertical mismatch — creative cues read as ${vertical.detected_vertical || "another industry"}, not ${campaignVertical || vertical.selected_vertical}. Google audience signals may misalign with keyword/theme targeting.`;
  }

  if (size === "1080x1080" && scores.youtube === "bad") {
    return "Square master wins Shopping/Discover but loses YouTube in-stream — video placements will letterbox and reduce brand impact in skippable ads.";
  }

  if ((size === "728x90" || size === "320x50") && signals.text_density === "high") {
    return "Leaderboard/mobile banner with heavy text — users scan in under 1 second on GDN; message won't land before scroll.";
  }

  if (hasValidationIssueType(creative, "rda") || (dims && dims.width < 600 && dims.height < 314)) {
    return "Responsive Display Asset failure — Google won't expand this creative across all eligible Display Network sizes.";
  }

  if (creative?.fileSizeKB && creative.fileSizeKB > 150 && sizeInGroups(size, PLATFORM_SUPPORTED_SIZE_GROUPS.google_ads)) {
    return "File size exceeds Google Display 150KB guidance — slower loads can hurt viewability metrics and Quality Score on display placements.";
  }

  if (scores.display === "bad") {
    return `Display Network delivery blocked — ${size} is outside core IAB sizes Google expects for news site and GDN banner rotation.`;
  }

  if (goal?.is_aligned === false) {
    return `Message reads ${goal.detected_goal || "conversion"}-stage while campaign targets ${goal.selected_goal || "awareness"} — Search/Display copy should match funnel intent for Quality Score.`;
  }

  if (Array.isArray(googleEval?.avoided_elements_found) && googleEval.avoided_elements_found[0]) {
    return googleEval.avoided_elements_found[0];
  }

  if (payload?.adigator_analysis?.main_risk) return payload.adigator_analysis.main_risk;
  if (payload?.main_strategic_problem) return payload.main_strategic_problem;

  return null;
}

function deriveProgrammaticMainRisk(creative, payload, campaignVertical) {
  const size = creative?.size || "";
  const scores = computePlacementCompatibility(creative, "programmatic", payload);
  const signals = getExtractionSignals(payload) || {};
  const goal = getGoalAlignment(payload);
  const vertical = getVerticalAlignment(payload);
  const progEval = payload?.ai_analysis?.programmatic_ads_dynamic_eval;
  const enterpriseQa = payload?.enterprise_qa;
  const intel = creative?.validation?.intelligence;

  if (vertical?.is_aligned === false) {
    return `Publisher-context mismatch — creative reads ${vertical.detected_vertical || "off-category"} vs ${campaignVertical || vertical.selected_vertical}. Contextual and vertical PMP deals may under-deliver.`;
  }

  if (enterpriseQa?.banner_blindness_risk === "HIGH") {
    return "Banner blindness risk is high — creative matches generic display patterns users ignore in news and finance page clutter.";
  }

  if ((size === "728x90" || size === "320x50" || size === "320x100") && signals.text_density === "high") {
    return "Leaderboard/mobile banner overloaded with text — peripheral vision won't decode the offer before scroll in RTB environments.";
  }

  if (scores.standard === "bad") {
    return `${size} sits outside core IAB programmatic inventory — expect thin fill and higher CPMs on open exchange.`;
  }

  if (creative?.fileSizeKB && creative.fileSizeKB > 150) {
    return "150KB+ payload slows first render — viewability providers may score below threshold, reducing bid competitiveness in DV360/TTD.";
  }

  if (goal?.is_aligned === false && goal?.detected_goal === "conversion") {
    return `Hard conversion CTA on ${goal.selected_goal || "awareness"}-stage display traffic — cold programmatic users need brand hook before click pressure.`;
  }

  if (intel?.auctionReadiness?.band === "Challenging" || intel?.auctionReadiness?.band === "Watchlist") {
    return "Low auction readiness — format may struggle to win impressions against higher-fill 300×250 and 728×90 competition.";
  }

  if (scores.premium === "bad" && scores.standard === "warning") {
    return "Neither standard nor premium inventory strong — creative may float in remnant tiers with low viewability.";
  }

  if (Array.isArray(progEval?.avoided_elements_found) && progEval.avoided_elements_found[0]) {
    return progEval.avoided_elements_found[0];
  }

  if (payload?.adigator_analysis?.main_risk) return payload.adigator_analysis.main_risk;
  if (payload?.main_strategic_problem) return payload.main_strategic_problem;

  return null;
}

function deriveMainRisk(creative, payload, platform, campaignVertical) {
  if (platform === "meta_ads") return deriveMetaMainRisk(creative, payload, campaignVertical);
  if (platform === "google_ads") return deriveGoogleMainRisk(creative, payload, campaignVertical);
  if (platform === "programmatic") return deriveProgrammaticMainRisk(creative, payload, campaignVertical);
  const goal = getGoalAlignment(payload);
  const vertical = getVerticalAlignment(payload);
  const signals = getExtractionSignals(payload) || {};
  const risks = [];

  if (vertical?.is_aligned === false) {
    risks.push(`Vertical mismatch — reads as ${vertical.detected_vertical || "another category"} vs selected ${campaignVertical || vertical.selected_vertical}`);
  }
  if (goal?.is_aligned === false) {
    risks.push(`Goal mismatch — message tone fits ${goal.detected_goal || "different"} intent more than selected goal`);
  }
  if (hasCriticalValidation(creative)) {
    risks.push("Technical validation failed — dimensions or format not platform-safe");
  }
  if (payload?.adigator_analysis?.main_risk) {
    risks.push(payload.adigator_analysis.main_risk);
  }
  if (payload?.main_strategic_problem && risks.length < 2) {
    risks.push(payload.main_strategic_problem);
  }

  return risks[0] || null;
}

function deriveRecommendedFix(creative, payload, platform) {
  const recs = getValidatedRecommendations(payload);
  if (recs[0]?.recommended_change) return recs[0].recommended_change;

  const fixes = payload?.adigator_analysis?.recommended_fixes;
  if (Array.isArray(fixes) && fixes[0]) return fixes[0];

  if (platform === "google_ads") {
    const size = creative?.size || "";
    const scores = computePlacementCompatibility(creative, "google_ads", payload);
    if (scores.youtube === "bad") {
      return "Export a 1280×720 (16:9) variant for YouTube in-stream while keeping 300×250 or 728×90 for Display Network.";
    }
    if (scores.display === "bad") {
      return "Re-export to a core Google IAB size (300×250, 728×90, 320×50, or 970×250) before launching Display campaigns.";
    }
    if (creative?.fileSizeKB && creative.fileSizeKB > 150) {
      return "Compress the asset below 150KB to meet Google Display load-speed and viewability standards.";
    }
  }

  if (platform === "programmatic") {
    const scores = computePlacementCompatibility(creative, "programmatic", payload);
    if (scores.standard === "bad") {
      return "Re-export to 300×250 or 728×90 for maximum open-exchange fill before launching programmatic line items.";
    }
    if (creative?.fileSizeKB && creative.fileSizeKB > 150) {
      return "Compress below 150KB to protect viewability metrics and improve RTB win rates across DSPs.";
    }
    if (scores.premium === "bad" && scores.standard === "good") {
      return "Add a 970×250 billboard variant to unlock premium publisher inventory and high-impact packages.";
    }
    if (scores.native === "bad") {
      return "Export a 1200×628 or 1080×1080 native master for in-feed and content-recommendation placements.";
    }
  }

  if (hasCriticalValidation(creative)) {
    return "Resize or re-export to a supported platform dimension, then re-upload before launch.";
  }

  const goal = getGoalAlignment(payload);
  if (goal?.is_aligned === false) {
    return "Adjust headline, visual story, and emotional tone to match the selected campaign goal before scaling spend.";
  }

  const vertical = getVerticalAlignment(payload);
  if (vertical?.is_aligned === false) {
    return `Reframe visuals and copy toward ${vertical.selected_vertical || "the selected vertical"} cues before launch.`;
  }

  return "No critical fixes required — optional polish may still improve placement performance.";
}

function deriveLaunchStatus(creative, payload, platform) {
  const goal = getGoalAlignment(payload);
  const vertical = getVerticalAlignment(payload);

  if (goal?.is_aligned === false || vertical?.is_aligned === false || hasCriticalValidation(creative)) {
    return "misaligned";
  }

  const scores = computePlacementCompatibility(creative, platform, payload);
  const badCount = Object.values(scores).filter((v) => v === "bad").length;
  const warnCount = Object.values(scores).filter((v) => v === "warning").length;
  const signals = getExtractionSignals(payload) || {};

  if (badCount >= 2 || (goal?.is_aligned === false)) return "misaligned";
  if (badCount >= 1 || warnCount >= 2 || signals?.text_density === "high") return "review";
  if (goal?.is_aligned === true && vertical?.is_aligned === true) return "ready";
  return "review";
}

export function computeCreativeInsight(entry, platform, campaignGoal, campaignVertical) {
  const creative = entry?.creative || {};
  const payload = getEntryPayload(entry) || {};
  const goalAlignment = getGoalAlignment(payload);
  const verticalAlignment = getVerticalAlignment(payload);
  const extractionSignals = getExtractionSignals(payload);
  const launchStatusKey = deriveLaunchStatus(creative, payload, platform);
  const placementScores = computePlacementCompatibility(creative, platform, payload);

  return {
    creativeId: creative.id,
    creativeName: creative.name || "Untitled Creative",
    creativeUrl: creative.url,
    launchStatus: LAUNCH_STATUS[launchStatusKey],
    launchStatusKey,
    goalAlignment: {
      ...goalAlignment,
      enrichedReason: buildEnrichedGoalReason(goalAlignment, extractionSignals, campaignGoal),
    },
    verticalAlignment,
    extractionSignals,
    technicalQa: deriveTechnicalQa(creative, payload, platform),
    placementQa: derivePlacementQa(creative, payload, platform),
    mainRisk: deriveMainRisk(creative, payload, platform, campaignVertical),
    recommendedFix: deriveRecommendedFix(creative, payload, platform),
    placementScores,
  };
}

function countVisualFragmentation(entries) {
  const cues = new Set(
    entries.map((e) => getExtractionSignals(getEntryPayload(e) || {})?.dominant_visual_cue).filter(Boolean),
  );
  return cues.size;
}

export function computeCampaignOverview(entries, platform, campaignGoal, campaignVertical, verticalLabelFn) {
  const insights = entries.map((e) => computeCreativeInsight(e, platform, campaignGoal, campaignVertical));
  const launchRisks = [];
  const qaSummary = [];

  const verticalMisaligned = insights.filter((i) => i.verticalAlignment?.is_aligned === false);
  if (verticalMisaligned.length > 0) {
    const label = verticalLabelFn?.(campaignVertical) || campaignVertical;
    launchRisks.push(`⚠️ ${verticalMisaligned.length} creative${verticalMisaligned.length === 1 ? "" : "s"} mismatched with the ${label} vertical`);
  }

  const goalMisaligned = insights.filter((i) => i.goalAlignment?.is_aligned === false);
  if (goalMisaligned.length > 0) {
    launchRisks.push(`⚠️ ${goalMisaligned.length} creative${goalMisaligned.length === 1 ? "" : "s"} misaligned with campaign goal`);
  }

  if (platform === "meta_ads") {
    const reelsWeak = insights.filter((i) => i.placementScores.reels === "bad" || i.placementScores.reels === "warning");
    if (reelsWeak.length > 0) {
      launchRisks.push(`⚠️ Reels visibility weak in ${reelsWeak.length} Meta Ads creative${reelsWeak.length === 1 ? "" : "s"}`);
    }
    const storyRisk = insights.filter((i) =>
      i.placementScores.stories === "bad"
      || i.technicalQa.some((t) => /safe.?zone/i.test(t.text)),
    );
    if (storyRisk.length > 0) {
      launchRisks.push(`⚠️ Story-safe zones affected in ${storyRisk.length} creative${storyRisk.length === 1 ? "" : "s"} — text may sit too close to UI overlays`);
    }
  }

  if (platform === "google_ads") {
    const displayWeak = insights.filter((i) => i.placementScores.display === "bad");
    if (displayWeak.length > 0) {
      launchRisks.push(`⚠️ Display inventory mismatch in ${displayWeak.length} Google Ads creative${displayWeak.length === 1 ? "" : "s"}`);
    }
  }

  if (platform === "programmatic") {
    const viewWeak = insights.filter((i) => i.placementScores.standard === "bad");
    if (viewWeak.length > 0) {
      launchRisks.push(`⚠️ Standard IAB compatibility weak in ${viewWeak.length} programmatic creative${viewWeak.length === 1 ? "" : "s"}`);
    }
    const blindnessRisk = insights.filter((i) =>
      i.technicalQa.some((t) => /banner.?blindness/i.test(t.text)),
    );
    if (blindnessRisk.length > 0) {
      launchRisks.push(`⚠️ Banner blindness risk elevated in ${blindnessRisk.length} creative${blindnessRisk.length === 1 ? "" : "s"} — may underperform on news/finance inventory`);
    }
  }

  const fragmented = countVisualFragmentation(entries);
  if (fragmented > 2) {
    launchRisks.push("⚠️ Visual consistency fragmented across the campaign");
  }

  const textHeavy = insights.filter((i) => i.extractionSignals?.text_density === "high");
  if (textHeavy.length > 0) {
    launchRisks.push(`⚠️ Text density high in ${textHeavy.length} creative${textHeavy.length === 1 ? "" : "s"}`);
  }

  const mobileSafe = insights.every((i) => !i.technicalQa.some((t) => t.status === "fail" && /mobile/i.test(t.text)));
  if (mobileSafe) qaSummary.push({ status: "pass", text: "Mobile-safe layouts detected" });

  if (platform === "meta_ads") {
    const feedOk = insights.filter((i) => i.placementScores.feed === "good").length;
    if (feedOk === insights.length) qaSummary.push({ status: "pass", text: "Meta Feed compatible" });
    else if (feedOk > 0) qaSummary.push({ status: "warn", text: `Meta Feed compatible in ${feedOk}/${insights.length} creatives` });
  }

  if (platform === "google_ads") {
    const displayOk = insights.filter((i) => i.placementScores.display !== "bad").length;
    if (displayOk === insights.length) qaSummary.push({ status: "pass", text: "Google Display sizes recognized" });
  }

  if (platform === "programmatic") {
    const standardOk = insights.filter((i) => i.placementScores.standard === "good").length;
    if (standardOk === insights.length) qaSummary.push({ status: "pass", text: "Core IAB programmatic sizes recognized across set" });
    else if (standardOk > 0) qaSummary.push({ status: "warn", text: `Standard display ready in ${standardOk}/${insights.length} creatives` });
  }

  if (textHeavy.length > 0) {
    qaSummary.push({ status: "warn", text: `Text density high in ${textHeavy.length} creative${textHeavy.length === 1 ? "" : "s"}` });
  }

  const storyCtaWeak = insights.filter((i) =>
    platform === "meta_ads"
    && i.placementScores.stories !== "good"
    && i.extractionSignals?.cta,
  );
  if (storyCtaWeak.length > 0) {
    qaSummary.push({ status: "warn", text: "CTA visibility weak in Stories placements" });
  }

  const optimizedFiles = insights.filter((i) => {
    const kb = entries.find((e) => e.creative?.id === i.creativeId)?.creative?.fileSizeKB;
    return kb && kb <= 150;
  }).length;
  if (optimizedFiles === insights.length && insights.length > 0) {
    qaSummary.push({ status: "pass", text: "File sizes optimized" });
  } else if (optimizedFiles > 0) {
    qaSummary.push({ status: "warn", text: `${optimizedFiles}/${insights.length} creatives under 150KB` });
  }

  const misalignedCount = insights.filter((i) => i.launchStatusKey === "misaligned").length;
  const reviewCount = insights.filter((i) => i.launchStatusKey === "review").length;
  const readyCount = insights.filter((i) => i.launchStatusKey === "ready").length;

  let campaignLaunchStatus = CAMPAIGN_LAUNCH_STATUS.ready;
  if (misalignedCount > 0) campaignLaunchStatus = CAMPAIGN_LAUNCH_STATUS.revision;
  else if (reviewCount > 0 || launchRisks.length > 0) campaignLaunchStatus = CAMPAIGN_LAUNCH_STATUS.minor;

  const recommendationBullets = [];
  if (readyCount > 0) {
    recommendationBullets.push(`${readyCount} creative${readyCount === 1 ? " is" : "s are"} platform-safe and ${campaignGoal || "campaign"}-aligned.`);
  }
  if (verticalMisaligned.length > 0) {
    recommendationBullets.push(`${verticalMisaligned.length} creative${verticalMisaligned.length === 1 ? " requires" : "s require"} vertical correction before launch.`);
  }
  if (reviewCount > 0 && misalignedCount === 0) {
    recommendationBullets.push(`${reviewCount} creative${reviewCount === 1 ? " needs" : "s need"} minor placement or copy adjustments.`);
  }
  if (recommendationBullets.length === 0 && launchRisks.length === 0) {
    recommendationBullets.push("All creatives pass platform checks — ready for launch.");
  }

  const columns = getPlacementColumns(platform);
  const placementMatrix = insights.map((insight) => ({
    name: insight.creativeName,
    cells: columns.map((col) => ({
      column: col.label,
      status: insight.placementScores[col.id] || "warning",
      emoji: PLACEMENT_EMOJI[insight.placementScores[col.id] || "warning"],
    })),
  }));

  return {
    hasNoRisk: launchRisks.length === 0 && misalignedCount === 0,
    launchRisks,
    qaSummary,
    placementMatrix,
    placementColumns: columns,
    campaignLaunchStatus,
    recommendationBullets,
    insights,
    readyCount,
    reviewCount,
    misalignedCount,
    totalCount: insights.length,
  };
}

export function placementEmoji(status) {
  return PLACEMENT_EMOJI[status] || PLACEMENT_EMOJI.warning;
}

export function qaItemIcon(status) {
  if (status === "pass") return "✓";
  if (status === "warn") return "⚠️";
  return "✕";
}
