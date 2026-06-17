/**
 * Platform-aware campaign and creative analysis for Step 3.
 * Derives risk signals, placement compatibility, and launch recommendations
 * from validation data + AI extraction payloads.
 */

import { PLATFORM_SUPPORTED_SIZE_GROUPS } from "./creativeValidation";
import {
  getPlacementColumns,
  getDeviceColumns,
  computePlacementCompatibility as computePlatformPlacements,
  computeDeviceCompatibility,
  getPrimaryPlacementKeys,
  getPlacementLegend,
} from "./placementCompatibility";
import { buildPlatformOverviewSections } from "./campaignOverviewSections";
import { enrichExtractionSignals } from "./creativeExtractionEnrichment";
import {
  buildEnrichedGoalReasonForInsight,
  buildEnrichedVerticalReasonForInsight,
} from "./analyzer/alignmentReasons.js";
import {
  getEntryPayload,
  getExtractionSignals,
  getGoalAlignment,
  getValidatedRecommendations,
  getVerticalAlignment,
  getCampaignAlignment,
} from "./strategicPresentation";

export const LAUNCH_STATUS = {
  ready: { emoji: "🟢", label: "Aligned / Launch Ready", tone: "emerald" },
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

export { getPlacementColumns, getDeviceColumns, getPlacementLegend };

function computePlacementCompatibility(creative, platform, payload) {
  const signals = getExtractionSignals(payload) || {};
  return computePlatformPlacements(creative, platform, signals);
}

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
    ...(groups.programmatic?.high_impact || []),
    "728x90", "970x90", "970x250", "160x600", "300x600",
  ];
  return desktopLists.includes(size);
}

function isNativeCreativeSize(size, platform) {
  const groups = PLATFORM_SUPPORTED_SIZE_GROUPS;
  if (platform === "google_ads") {
    return (groups.google_ads?.responsive_native_assets || []).includes(size);
  }
  if (platform === "meta_ads") {
    return [
      ...(groups.meta_ads?.feed_placements || []),
      ...(groups.meta_ads?.flexible_native_assets || []),
    ].includes(size);
  }
  if (platform === "programmatic") {
    const prog = groups.programmatic || {};
    return new Set(prog.native_responsive_assets || []).has(size);
  }
  return false;
}

function isStrategicallyAligned(goal, vertical) {
  return goal?.is_aligned === true && vertical?.is_aligned === true;
}

/** High-severity upload issues that should block launch — not weight warnings on native assets. */
function hasLaunchBlockingValidation(creative, platform) {
  const validation = creative?.validation;
  if (!validation) return false;

  const nonBlockingTypes = new Set([
    "dimension_normalization",
    "placement_fit",
    "mobile_delivery",
    "google_weight",
    "meta_weight",
    "delivery",
    "technical",
  ]);

  if (Array.isArray(validation.issues) && validation.issues.length > 0) {
    return validation.issues.some((issue) => {
      const severity = issue?.severity;
      if (severity !== "high" && severity !== "critical") return false;
      const type = String(issue?.type || "");
      if (nonBlockingTypes.has(type)) return false;
      if (type === "weight" && isNativeCreativeSize(creative?.size, platform)) return false;
      return true;
    });
  }

  if (validation.status === "CRITICAL" && validation.valid === false) {
    return !isNativeCreativeSize(creative?.size, platform);
  }

  return false;
}

function hasCriticalValidation(creative) {
  return hasLaunchBlockingValidation(creative, "programmatic");
}

function hasValidationIssueType(creative, typePrefix) {
  return Array.isArray(creative?.validation?.issues)
    && creative.validation.issues.some((issue) => String(issue?.type || "").startsWith(typePrefix));
}

function isGenericPositiveMessage(text) {
  if (!text || typeof text !== "string") return true;
  const normalized = text.toLowerCase();
  return (
    normalized.includes("no major strategic conflict")
    || normalized.includes("largely consistent")
    || normalized.includes("no critical fixes required")
    || normalized.includes("ready for launch")
    || normalized.includes("incremental improvement while preserving")
    || normalized.includes("optimization opportunity is primarily incremental")
  );
}

function isMetaFeedNativeSize(size) {
  return PLATFORM_SUPPORTED_SIZE_GROUPS.meta_ads.feed_placements.includes(size);
}

function buildEnrichedGoalReason(goalAlignment, signals, campaignGoal) {
  return buildEnrichedGoalReasonForInsight(goalAlignment, signals, campaignGoal);
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

  if (scores.facebook_feed === "good") {
    items.push({ status: "pass", text: "Facebook Feed — aspect ratio fits in-feed card without awkward crop" });
  } else if (scores.facebook_feed === "warning") {
    items.push({ status: "warn", text: "Facebook Feed may letterbox — re-export as 1080×1080 or 1080×1350" });
  } else {
    items.push({ status: "fail", text: "Facebook Feed not recommended — current ratio breaks feed card layout" });
  }

  if (scores.instagram_feed === "good") {
    items.push({ status: "pass", text: "Instagram Feed — 1:1 or 4:5 ratio supports mobile-first card fit" });
  } else if (scores.instagram_feed === "warning") {
    items.push({ status: "warn", text: "Instagram Feed usable with crop — prefer 1080×1080 or 1080×1350" });
  } else {
    items.push({ status: "fail", text: "Instagram Feed blocked for this aspect ratio" });
  }

  if (scores.stories === "good") {
    items.push({ status: "pass", text: "Stories — 9:16 canvas with safe margins for profile pill and CTA strip" });
  } else if (scores.stories === "warning") {
    items.push({ status: "warn", text: `Stories usable with crop — ${size === "1080x1080" ? "square letterboxes in Stories" : "shift CTA to center safe zone"}` });
  } else {
    items.push({ status: "fail", text: "Stories blocked — export 1080×1920 for full-screen inventory" });
  }

  if (scores.reels === "good") {
    items.push({ status: "pass", text: "Reels — vertical full-bleed supports thumb-stop in first 1–2 seconds" });
  } else if (scores.reels === "warning") {
    items.push({ status: "warn", text: "Reels visibility reduced — vertical crop may shrink hero in first frame" });
  } else {
    items.push({ status: "fail", text: "Reels not viable — needs 9:16 native canvas for short-form inventory" });
  }

  if (scores.messenger === "good") {
    items.push({ status: "pass", text: "Messenger — inbox/card ratio fits sponsored message placements" });
  } else if (scores.messenger === "warning") {
    items.push({ status: "warn", text: "Messenger adaptability limited — square or link-ad ratio preferred" });
  }

  if (signals.text_density === "high") {
    items.push({ status: "warn", text: "Heavy overlay text hurts Reels/Stories completion — move copy to caption" });
  }

  if (Array.isArray(metaEval?.missing_signals) && metaEval.missing_signals[0]) {
    items.push({ status: "warn", text: `Missing Meta placement signal: ${metaEval.missing_signals[0]}` });
  }

  return items.slice(0, 6);
}

function deriveGooglePlacementQa(creative, payload) {
  const scores = computePlacementCompatibility(creative, "google_ads", payload);
  const size = creative?.size || "";
  const signals = getExtractionSignals(payload) || {};
  const googleEval = payload?.ai_analysis?.google_ads_dynamic_eval;
  const deviceScores = computeDeviceCompatibility(creative, "google_ads") || {};
  const items = [];

  if (scores.gdn === "good") {
    items.push({ status: "pass", text: "GDN — IAB size fits publisher & banner rotation without distortion" });
  } else if (scores.gdn === "warning") {
    items.push({ status: "warn", text: "GDN usable with scale limits — verify 300×250 or 728×90 masters" });
  } else {
    items.push({ status: "fail", text: "GDN blocked — dimensions outside core Google Display inventory" });
  }

  if (scores.responsive_display === "good") {
    items.push({ status: "pass", text: "Responsive Display — meets RDA ratio and minimum dimension guidance" });
  } else if (scores.responsive_display === "warning") {
    items.push({ status: "warn", text: "Responsive Display limited — export 600×314+ landscape or 300×300+ square" });
  } else {
    items.push({ status: "fail", text: "Responsive Display not recommended — fails RDA minimum specs" });
  }

  if (scores.demand_gen === "good") {
    items.push({ status: "pass", text: "Demand Gen — native card ratio suits Discover/YouTube feed placements" });
  } else if (scores.demand_gen === "warning") {
    items.push({ status: "warn", text: "Demand Gen may crop — prefer 1200×628 or 1080×1080 native masters" });
  } else {
    items.push({ status: "fail", text: "Demand Gen weak — aspect ratio not suited to feed-style inventory" });
  }

  if (scores.gmail === "good") {
    items.push({ status: "pass", text: "Gmail — size supports Promotions tab and inbox ad rendering" });
  } else if (scores.gmail === "warning") {
    items.push({ status: "warn", text: "Gmail limited — reduce text density for promo tab scan speed" });
  }

  if (deviceScores.mobile === "good") {
    items.push({ status: "pass", text: "Mobile device fit — sized for phone web and in-app display contexts" });
  } else if (deviceScores.mobile === "warning") {
    items.push({ status: "warn", text: "Mobile fit limited — consider 320×50, 300×250, or vertical native exports" });
  }

  if (Array.isArray(googleEval?.missing_signals) && googleEval.missing_signals[0]) {
    items.push({ status: "warn", text: `Missing Google signal: ${googleEval.missing_signals[0]}` });
  }

  return items.slice(0, 6);
}

function deriveProgrammaticPlacementQa(creative, payload) {
  const scores = computePlacementCompatibility(creative, "programmatic", payload);
  const signals = getExtractionSignals(payload) || {};
  const progEval = payload?.ai_analysis?.programmatic_ads_dynamic_eval;
  const items = [];

  if (scores.native_ads === "good") {
    items.push({ status: "pass", text: "Native Ads — ratio suits in-feed content-recommendation modules" });
  } else if (scores.native_ads === "warning") {
    items.push({ status: "warn", text: "Native Ads limited — 1200×628 or 1080×1080 improves card fit" });
  } else {
    items.push({ status: "fail", text: "Native Ads weak — banner aspect won't render cleanly in native units" });
  }

  if (scores.display_banners === "good") {
    items.push({ status: "pass", text: "Display Banners — core IAB size for open-exchange publisher fill" });
  } else if (scores.display_banners === "warning") {
    items.push({ status: "warn", text: "Display Banners usable with scale limits — verify 300×250 or 728×90" });
  } else {
    items.push({ status: "fail", text: "Display Banners blocked — outside standard RTB banner inventory" });
  }

  if (scores.mobile_app === "good") {
    items.push({ status: "pass", text: "Mobile App Inventory — sized for in-app and mobile web placements" });
  } else if (scores.mobile_app === "warning") {
    items.push({ status: "warn", text: "Mobile App limited — 320×50 or 300×250 preferred for app fill" });
  }

  if (scores.open_web === "good") {
    items.push({ status: "pass", text: "Open Web — strong fit for publisher page inline and sidebar rotation" });
  } else if (scores.open_web === "warning") {
    items.push({ status: "warn", text: "Open Web scale may be limited for this format tier" });
  }

  if (signals.text_density === "high" && scores.display_banners !== "good") {
    items.push({ status: "warn", text: "Dense copy reduces scan clarity on small display and mobile slots" });
  }

  if (Array.isArray(progEval?.missing_signals) && progEval.missing_signals[0]) {
    items.push({ status: "warn", text: `Missing programmatic signal: ${progEval.missing_signals[0]}` });
  }

  return items.slice(0, 6);
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
  const feedNative = isMetaFeedNativeSize(size);
  const primaryKeys = getPrimaryPlacementKeys("meta_ads", creative);

  if (vertical?.is_aligned === false) {
    return `Vertical bleed — creative reads as ${vertical.detected_vertical || "another category"}, not ${campaignVertical || vertical.selected_vertical}. Meta's interest targeting may deliver to the wrong audience cluster.`;
  }

  if (goal?.is_aligned === false) {
    const detected = goal.detected_goal || "conversion";
    return `Message tone signals ${detected}-stage intent — emotional hook and CTA pressure don't match your selected ${goal.selected_goal || "campaign"} goal on Meta.`;
  }

  if (hasValidationIssueType(creative, "safe_zone")) {
    return "Story-safe zone violation — headline or CTA sits in Meta's top/bottom UI overlay area, making the ad ineffective when users tap through.";
  }

  if (primaryKeys.some((key) => scores[key] === "bad")) {
    if (scores.facebook_feed === "bad" || scores.instagram_feed === "bad") {
      return "Feed placement not recommended — current aspect ratio breaks Meta in-feed card layout.";
    }
    return "Primary Meta placement blocked — re-export to 1080×1080, 1080×1350, or 1080×1920 for the inventory you plan to run.";
  }

  if (!feedNative) {
    if (signals.text_density === "high" && (scores.stories === "bad" || scores.reels === "bad")) {
      return "Text-heavy overlay plus non-vertical canvas — Meta may suppress delivery in Stories/Reels where UI chrome covers bottom-third CTAs.";
    }
    if (scores.reels === "bad" || scores.stories === "bad") {
      return "Vertical Stories/Reels inventory blocked — export 1080×1920 for full-screen short-form placements.";
    }
  }

  if (feedNative && signals.text_density === "high" && scores.facebook_feed !== "good" && scores.instagram_feed !== "good") {
    return "Heavy text overlay on feed canvas — Meta may throttle delivery; keep copy under ~20% of frame.";
  }

  if (Array.isArray(metaEval?.avoided_elements_found) && metaEval.avoided_elements_found[0]) {
    return metaEval.avoided_elements_found[0];
  }

  const apiRisk = payload?.adigator_analysis?.main_risk || payload?.main_strategic_problem;
  if (apiRisk && !isGenericPositiveMessage(apiRisk)) return apiRisk;

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

  if (size === "1080x1080" && scores.youtube_companion === "bad" && !isNativeCreativeSize(size, "google_ads")) {
    return "Square master fits Demand Gen but not YouTube Companion — export 728×90 or 300×250 for companion slots.";
  }

  if ((size === "728x90" || size === "320x50") && signals.text_density === "high") {
    return "Leaderboard/mobile banner with heavy text — users scan in under 1 second on GDN; message won't land before scroll.";
  }

  if (hasValidationIssueType(creative, "rda") && !isNativeCreativeSize(size, "google_ads")) {
    if (dims && dims.width < 600 && dims.height < 314) {
      return "Responsive Display Asset failure — Google won't expand this creative across all eligible Display Network sizes.";
    }
  }

  if (
    creative?.fileSizeKB
    && creative.fileSizeKB > 150
    && !isNativeCreativeSize(size, "google_ads")
    && sizeInGroups(size, PLATFORM_SUPPORTED_SIZE_GROUPS.google_ads)
  ) {
    return "File size exceeds Google Display 150KB guidance — slower loads can hurt viewability metrics and Quality Score on display placements.";
  }

  if (scores.gdn === "bad" && getPrimaryPlacementKeys("google_ads", creative).includes("gdn")) {
    return `GDN delivery blocked — ${size} is outside core IAB sizes Google expects for news site and banner rotation.`;
  }

  if (goal?.is_aligned === false) {
    return `Message reads ${goal.detected_goal || "conversion"}-stage while campaign targets ${goal.selected_goal || "awareness"} — Search/Display copy should match funnel intent for Quality Score.`;
  }

  if (Array.isArray(googleEval?.avoided_elements_found) && googleEval.avoided_elements_found[0]) {
    return googleEval.avoided_elements_found[0];
  }

  const apiRisk = payload?.adigator_analysis?.main_risk || payload?.main_strategic_problem;
  if (apiRisk && !isGenericPositiveMessage(apiRisk)) return apiRisk;

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

  if (scores.display_banners === "bad" && getPrimaryPlacementKeys("programmatic", creative).includes("display_banners")) {
    return `${size} sits outside core IAB programmatic inventory — expect thin fill and higher CPMs on open exchange.`;
  }

  if (
    creative?.fileSizeKB
    && creative.fileSizeKB > 150
    && !isNativeCreativeSize(size, "programmatic")
  ) {
    return "150KB+ payload slows first render — viewability providers may score below threshold, reducing bid competitiveness in DV360/TTD.";
  }

  if (goal?.is_aligned === false && goal?.detected_goal === "conversion") {
    return `Hard conversion CTA on ${goal.selected_goal || "awareness"}-stage display traffic — cold programmatic users need brand hook before click pressure.`;
  }

  if (intel?.auctionReadiness?.band === "Challenging" || intel?.auctionReadiness?.band === "Watchlist") {
    return "Low auction readiness — format may struggle to win impressions against higher-fill 300×250 and 728×90 competition.";
  }

  if (scores.native_ads === "bad" && scores.display_banners === "warning") {
    return "Neither native nor standard display inventory strong — creative may float in remnant tiers with low viewability.";
  }

  if (Array.isArray(progEval?.avoided_elements_found) && progEval.avoided_elements_found[0]) {
    return progEval.avoided_elements_found[0];
  }

  const apiRisk = payload?.adigator_analysis?.main_risk || payload?.main_strategic_problem;
  if (apiRisk && !isGenericPositiveMessage(apiRisk)) return apiRisk;

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
  if (hasLaunchBlockingValidation(creative, platform)) {
    risks.push("Technical validation failed — dimensions or format not platform-safe");
  }

  const apiRisk = payload?.adigator_analysis?.main_risk || payload?.main_strategic_problem;
  if (apiRisk && !isGenericPositiveMessage(apiRisk) && risks.length < 2) {
    risks.push(apiRisk);
  }

  return risks[0] || null;
}

function deriveRecommendedFix(creative, payload, platform) {
  const recs = getValidatedRecommendations(payload);
  if (recs[0]?.recommended_change) return recs[0].recommended_change;

  const fixes = payload?.adigator_analysis?.recommended_fixes;
  if (Array.isArray(fixes) && fixes[0]) return fixes[0];

  if (platform === "google_ads") {
    const scores = computePlacementCompatibility(creative, "google_ads", payload);
    if (scores.youtube_companion === "bad") {
      return "Export a 728×90 or 300×250 companion banner for YouTube while keeping GDN masters.";
    }
    if (scores.gdn === "bad") {
      return "Re-export to a core Google IAB size (300×250, 728×90, 320×50, or 970×250) before launching GDN campaigns.";
    }
    if (scores.responsive_display === "bad") {
      return "Export a 600×314+ landscape or 300×300+ square asset for Responsive Display Ads.";
    }
    if (creative?.fileSizeKB && creative.fileSizeKB > 150) {
      return "Compress the asset below 150KB to meet Google Display load-speed and viewability standards.";
    }
  }

  if (platform === "programmatic") {
    const scores = computePlacementCompatibility(creative, "programmatic", payload);
    if (scores.display_banners === "bad") {
      return "Re-export to 300×250 or 728×90 for maximum open-exchange fill before launching programmatic line items.";
    }
    if (creative?.fileSizeKB && creative.fileSizeKB > 150) {
      return "Compress below 150KB to protect viewability metrics and improve RTB win rates across DSPs.";
    }
    if (scores.native_ads === "bad") {
      return "Export a 1200×628 or 1080×1080 native master for in-feed and content-recommendation placements.";
    }
  }

  if (hasLaunchBlockingValidation(creative, platform)) {
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

  return null;
}

function deriveLaunchStatus(creative, payload, platform) {
  const goal = getGoalAlignment(payload);
  const vertical = getVerticalAlignment(payload);
  const campaign = getCampaignAlignment(payload);
  const campaignStatus = String(campaign.alignment_status || "unknown").toLowerCase();
  const campaignSeverity = String(campaign.severity || "low").toLowerCase();
  const signals = getExtractionSignals(payload) || {};
  const strategicallyAligned = isStrategicallyAligned(goal, vertical);

  if (hasLaunchBlockingValidation(creative, platform)) return "misaligned";
  if (goal?.is_aligned === false || vertical?.is_aligned === false) return "misaligned";

  const scores = computePlacementCompatibility(creative, platform, payload);
  const primaryKeys = getPrimaryPlacementKeys(platform, creative);
  const primaryScores = primaryKeys.map((key) => scores[key]).filter(Boolean);
  const primaryBad = primaryScores.includes("bad");
  const primaryWarn = primaryScores.includes("warning");

  if (primaryBad) return "misaligned";

  if (
    !strategicallyAligned
    && campaignStatus === "misaligned"
    && campaignSeverity !== "low"
  ) {
    return "misaligned";
  }

  if (
    hasValidationIssueType(creative, "safe_zone")
    && platform === "meta_ads"
    && (primaryKeys.includes("stories") || primaryKeys.includes("reels"))
  ) {
    return "misaligned";
  }

  const textAffectsPrimary =
    signals?.text_density === "high"
    && (primaryWarn || primaryBad);

  const hasMinorIssue =
    primaryWarn
    || textAffectsPrimary
    || hasValidationIssueType(creative, "placement_fit")
    || (
      !strategicallyAligned
      && (campaignStatus === "partially_aligned" || campaignStatus === "misaligned")
    )
    || (
      strategicallyAligned
      && campaignStatus === "partially_aligned"
      && (primaryWarn || textAffectsPrimary)
    );

  if (hasMinorIssue) return "review";

  if (strategicallyAligned && !primaryBad) {
    return "ready";
  }

  if (goal?.is_aligned !== false && vertical?.is_aligned !== false && !primaryBad) {
    return "ready";
  }

  return "review";
}

export function computeCreativeInsight(entry, platform, campaignGoal, campaignVertical) {
  const creative = entry?.creative || {};
  const payload = getEntryPayload(entry) || {};
  const goalAlignment = getGoalAlignment(payload);
  const verticalAlignment = getVerticalAlignment(payload);
  const launchStatusKey = deriveLaunchStatus(creative, payload, platform);
  const placementScores = computePlacementCompatibility(creative, platform, payload);
  const extractionSignals = enrichExtractionSignals(
    getExtractionSignals(payload),
    payload,
    creative,
    platform,
    campaignGoal,
    placementScores,
  );
  let mainRisk = deriveMainRisk(creative, payload, platform, campaignVertical);
  let recommendedFix = deriveRecommendedFix(creative, payload, platform);
  const strategicallyAligned = isStrategicallyAligned(goalAlignment, verticalAlignment);
  const primaryKeys = getPrimaryPlacementKeys(platform, creative);
  const primaryBad = primaryKeys.some((key) => placementScores[key] === "bad");

  if (launchStatusKey === "ready") {
    mainRisk = null;
    recommendedFix = null;
  } else if (strategicallyAligned && !primaryBad && !hasLaunchBlockingValidation(creative, platform)) {
    if (launchStatusKey === "review" && goalAlignment?.is_aligned !== false && verticalAlignment?.is_aligned !== false) {
      const riskFromGoalOrVertical =
        goalAlignment?.is_aligned === false
        || verticalAlignment?.is_aligned === false;
      if (!riskFromGoalOrVertical) {
        mainRisk = null;
      }
    }
  }

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
    verticalAlignment: {
      ...verticalAlignment,
      enrichedReason: buildEnrichedVerticalReasonForInsight(verticalAlignment, extractionSignals),
    },
    extractionSignals,
    technicalQa: deriveTechnicalQa(creative, payload, platform),
    placementQa: derivePlacementQa(creative, payload, platform),
    mainRisk,
    recommendedFix,
    placementScores,
    deviceScores: computeDeviceCompatibility(creative, platform, payload),
  };
}

function countVisualFragmentation(entries) {
  const cues = new Set(
    entries.map((e) => getExtractionSignals(getEntryPayload(e) || {})?.dominant_visual_cue).filter(Boolean),
  );
  return cues.size;
}

export function computeCampaignOverview(entries, platform, campaignGoal, campaignVertical, verticalLabelFn, goalLabelFn) {
  const insights = entries.map((e) => computeCreativeInsight(e, platform, campaignGoal, campaignVertical));
  const launchRisks = [];
  const qaSummary = [];
  const goalText = goalLabelFn?.(campaignGoal || "awareness") || campaignGoal || "awareness";
  const verticalText = verticalLabelFn?.(campaignVertical) || campaignVertical || "general";

  const verticalMisaligned = insights.filter((i) => i.verticalAlignment?.is_aligned === false);
  if (verticalMisaligned.length > 0) {
    const label = verticalLabelFn?.(campaignVertical) || campaignVertical;
    const sample = verticalMisaligned[0];
    const detected = sample.verticalAlignment?.detected_vertical;
    launchRisks.push(
      `⚠️ ${verticalMisaligned.length} creative${verticalMisaligned.length === 1 ? "" : "s"} read as ${detected || "another category"} instead of ${label}`,
    );
  }

  const goalMisaligned = insights.filter((i) => i.goalAlignment?.is_aligned === false);
  if (goalMisaligned.length > 0) {
    const sample = goalMisaligned[0];
    const detected = sample.goalAlignment?.detected_goal_stage || sample.goalAlignment?.detected_goal;
    launchRisks.push(
      `⚠️ ${goalMisaligned.length} creative${goalMisaligned.length === 1 ? "" : "s"} signal ${detected || "different"} intent vs ${goalText} goal`,
    );
  }

  if (platform === "meta_ads") {
    const reelsBlocked = insights.filter((i) => {
      if (i.launchStatusKey === "ready") return false;
      return i.placementScores.reels === "bad" && i.launchStatusKey === "misaligned";
    });
    if (reelsBlocked.length > 0) {
      launchRisks.push(`⚠️ Reels inventory blocked in ${reelsBlocked.length} Meta Ads creative${reelsBlocked.length === 1 ? "" : "s"}`);
    }
    const storyRisk = insights.filter((i) =>
      i.launchStatusKey !== "ready"
      && (i.placementScores.stories === "bad"
        || i.technicalQa.some((t) => t.status === "fail" && /safe.?zone/i.test(t.text))),
    );
    if (storyRisk.length > 0) {
      launchRisks.push(`⚠️ Story-safe zones affected in ${storyRisk.length} creative${storyRisk.length === 1 ? "" : "s"} — text may sit too close to UI overlays`);
    }
  }

  if (platform === "google_ads") {
    const gdnWeak = insights.filter((i) => i.placementScores.gdn === "bad" && i.launchStatusKey !== "ready");
    if (gdnWeak.length > 0) {
      launchRisks.push(`⚠️ GDN inventory mismatch in ${gdnWeak.length} Google Ads creative${gdnWeak.length === 1 ? "" : "s"}`);
    }
  }

  if (platform === "programmatic") {
    const viewWeak = insights.filter((i) => i.placementScores.display_banners === "bad" && i.launchStatusKey !== "ready");
    if (viewWeak.length > 0) {
      launchRisks.push(`⚠️ Display banner compatibility weak in ${viewWeak.length} programmatic creative${viewWeak.length === 1 ? "" : "s"}`);
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

  const textHeavy = insights.filter((i) =>
    i.extractionSignals?.text_density === "high" && i.launchStatusKey !== "ready",
  );
  if (textHeavy.length > 0) {
    launchRisks.push(`⚠️ Text density high in ${textHeavy.length} creative${textHeavy.length === 1 ? "" : "s"}`);
  }

  const mobileSafe = insights.every((i) => !i.technicalQa.some((t) => t.status === "fail" && /mobile/i.test(t.text)));
  if (mobileSafe) qaSummary.push({ status: "pass", text: "Mobile-safe layouts detected" });

  if (platform === "google_ads") {
    const gdnOk = insights.filter((i) => i.placementScores.gdn !== "bad").length;
    if (gdnOk === insights.length) qaSummary.push({ status: "pass", text: "GDN-compatible sizes recognized across set" });
    else if (gdnOk > 0) qaSummary.push({ status: "warn", text: `GDN ready in ${gdnOk}/${insights.length} creatives` });
  }

  if (platform === "meta_ads") {
    const feedOk = insights.filter((i) =>
      i.placementScores.facebook_feed === "good" || i.placementScores.instagram_feed === "good",
    ).length;
    if (feedOk === insights.length) qaSummary.push({ status: "pass", text: "Meta Feed compatible" });
    else if (feedOk > 0) qaSummary.push({ status: "warn", text: `Meta Feed compatible in ${feedOk}/${insights.length} creatives` });
  }

  if (platform === "programmatic") {
    const bannerOk = insights.filter((i) => i.placementScores.display_banners === "good").length;
    if (bannerOk === insights.length) qaSummary.push({ status: "pass", text: "Display banner sizes recognized across set" });
    else if (bannerOk > 0) qaSummary.push({ status: "warn", text: `Display banners ready in ${bannerOk}/${insights.length} creatives` });
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
  else if (reviewCount > 0) campaignLaunchStatus = CAMPAIGN_LAUNCH_STATUS.minor;

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
  const deviceColumns = getDeviceColumns(platform);
  const placementMatrix = insights.map((insight) => ({
    name: insight.creativeName,
    cells: columns.map((col) => ({
      column: col.label,
      status: insight.placementScores[col.id] || "warning",
      emoji: PLACEMENT_EMOJI[insight.placementScores[col.id] || "warning"],
    })),
  }));

  const deviceMatrix = deviceColumns.length
    ? insights.map((insight) => ({
      name: insight.creativeName,
      cells: deviceColumns.map((col) => ({
        column: col.label,
        status: insight.deviceScores?.[col.id] || "warning",
        emoji: PLACEMENT_EMOJI[insight.deviceScores?.[col.id] || "warning"],
      })),
    }))
    : null;

  const overviewCore = {
    hasNoRisk: launchRisks.length === 0 && misalignedCount === 0,
    launchRisks,
    qaSummary,
    placementMatrix,
    placementColumns: columns,
    deviceMatrix,
    deviceColumns,
    placementLegend: getPlacementLegend(platform),
    campaignLaunchStatus,
    recommendationBullets,
    insights,
    readyCount,
    reviewCount,
    misalignedCount,
    totalCount: insights.length,
  };

  const sections = buildPlatformOverviewSections({
    platform,
    insights,
    overview: overviewCore,
    goalText,
    verticalText,
  });

  return {
    ...overviewCore,
    sections,
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

/** Dev verification matrix — aligned goal/vertical creatives should not be red. */
export function runAnalyzerStatusMatrix() {
  const alignedPayload = {
    goal_alignment: { is_aligned: true, selected_goal: "awareness", detected_goal: "awareness" },
    vertical_alignment: { is_aligned: true, selected_vertical: "fashion", detected_vertical: "fashion" },
    campaign_alignment: { alignment_status: "partially_aligned", severity: "medium", strategic_conflict: "Minor tone nuance" },
    extraction_signals: { text_density: "moderate" },
    adigator_analysis: { main_risk: "No major strategic conflict detected." },
  };

  const passValidation = { valid: true, status: "PASS", issues: [] };
  const nativeWeightWarning = {
    valid: true,
    status: "WARNING",
    issues: [{ type: "weight", severity: "medium", message: "Native asset exceeds 150KB banner guidance" }],
  };

  const scenarios = [
    { platform: "meta_ads", size: "1080x1080", expected: "ready", validation: passValidation },
    { platform: "meta_ads", size: "1080x1350", expected: "ready", validation: passValidation },
    { platform: "meta_ads", size: "1080x1920", expected: "ready", validation: passValidation },
    { platform: "google_ads", size: "1080x1080", expected: "ready", validation: passValidation },
    { platform: "google_ads", size: "1200x628", expected: "ready", validation: passValidation },
    { platform: "google_ads", size: "300x250", expected: "ready", validation: passValidation },
    { platform: "programmatic", size: "1200x628", expected: "ready", validation: nativeWeightWarning },
    { platform: "programmatic", size: "1080x1080", expected: "ready", validation: nativeWeightWarning },
    { platform: "programmatic", size: "1080x1350", expected: "ready", validation: nativeWeightWarning },
    { platform: "programmatic", size: "300x250", expected: "ready", validation: passValidation },
  ];

  return scenarios.map(({ platform, size, expected, validation }) => {
    const insight = computeCreativeInsight(
      {
        creative: { id: `test-${platform}-${size}`, size, validation, fileSizeKB: 220 },
        data: alignedPayload,
      },
      platform,
      "awareness",
      "fashion",
    );
    return {
      platform,
      size,
      expected,
      actual: insight.launchStatusKey,
      label: insight.launchStatus.label,
      pass: insight.launchStatusKey === expected,
    };
  });
}
