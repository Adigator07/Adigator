/**
 * Google Ads creative safe-zone and crop simulation analysis.
 * Optimized for Responsive Display, GDN, Demand Gen, Gmail, and YouTube placements.
 */

import {
  computeCenterCropRect,
  detectElementsFromImageData,
  mergeElementDetections,
  parseCreativeSize,
} from "@/app/lib/metaCreativePlacementAnalysis";
import { uniqueMessages } from "@/app/lib/previewAnalysisUtils";

export { parseCreativeSize, computeCenterCropRect };

export const GOOGLE_SAFE_ZONE_SPECS = {
  responsive_display: {
    id: "responsive_display",
    label: "Responsive Display Ads",
    group: "display",
    aspectRatio: 1200 / 628,
    safeZone: { left: 0.08, top: 0.08, right: 0.92, bottom: 0.88 },
    uiOverlays: [
      { id: "left_crop", left: 0, top: 0, right: 0.07, bottom: 1, label: "Responsive crop edge" },
      { id: "right_crop", left: 0.93, top: 0, right: 1, bottom: 1, label: "Responsive crop edge" },
      { id: "bottom_meta", left: 0, top: 0.88, right: 1, bottom: 1, label: "Dynamic text overlay" },
    ],
  },
  gdn: {
    id: "gdn",
    label: "Google Display Network",
    group: "display",
    aspectRatio: 1200 / 628,
    safeZone: { left: 0.06, top: 0.06, right: 0.94, bottom: 0.90 },
    uiOverlays: [
      { id: "ad_badge", left: 0, top: 0, right: 0.2, bottom: 0.14, label: "Ad badge & close" },
      { id: "publisher_chrome", left: 0, top: 0.90, right: 1, bottom: 1, label: "Publisher footer" },
    ],
  },
  demand_gen: {
    id: "demand_gen",
    label: "Demand Gen Ads",
    group: "demand_gen",
    aspectRatio: 4 / 5,
    safeZone: { left: 0.07, top: 0.10, right: 0.93, bottom: 0.76 },
    uiOverlays: [
      { id: "headline_block", left: 0, top: 0.76, right: 1, bottom: 1, label: "Headline & CTA block" },
      { id: "discover_ui", left: 0.85, top: 0.05, right: 1, bottom: 0.25, label: "Discover action menu" },
    ],
  },
  gmail: {
    id: "gmail",
    label: "Gmail Ads",
    group: "gmail",
    aspectRatio: 1200 / 628,
    safeZone: { left: 0.10, top: 0.14, right: 0.88, bottom: 0.72 },
    uiOverlays: [
      { id: "promo_tab", left: 0, top: 0, right: 1, bottom: 0.14, label: "Promotions tab chrome" },
      { id: "sender_line", left: 0, top: 0.72, right: 1, bottom: 0.86, label: "Sender & subject line" },
      { id: "cta_row", left: 0.65, top: 0.86, right: 1, bottom: 1, label: "Gmail CTA row" },
    ],
  },
  youtube_thumbnail: {
    id: "youtube_thumbnail",
    label: "YouTube Thumbnail Ads",
    group: "youtube",
    aspectRatio: 16 / 9,
    safeZone: { left: 0.06, top: 0.06, right: 0.94, bottom: 0.70 },
    uiOverlays: [
      { id: "title_bar", left: 0, top: 0.70, right: 1, bottom: 0.92, label: "Title overlay" },
      { id: "progress", left: 0, top: 0.92, right: 1, bottom: 1, label: "Progress bar" },
      { id: "duration", left: 0.78, top: 0.58, right: 1, bottom: 0.72, label: "Duration badge" },
    ],
  },
  youtube_in_feed: {
    id: "youtube_in_feed",
    label: "YouTube In-Feed Ads",
    group: "youtube",
    aspectRatio: 16 / 9,
    safeZone: { left: 0.05, top: 0.05, right: 0.72, bottom: 0.92 },
    uiOverlays: [
      { id: "side_meta", left: 0.72, top: 0.12, right: 1, bottom: 0.88, label: "Channel & menu" },
      { id: "sponsored", left: 0, top: 0.92, right: 1, bottom: 1, label: "Sponsored label" },
    ],
  },
};

export const GOOGLE_SAFE_ZONE_IDS = Object.keys(GOOGLE_SAFE_ZONE_SPECS);

export const GOOGLE_SAFE_ZONE_GROUPS = [
  { id: "display", label: "Display", placements: ["responsive_display", "gdn"] },
  { id: "demand_gen", label: "Demand Gen", placements: ["demand_gen"] },
  { id: "gmail", label: "Gmail", placements: ["gmail"] },
  { id: "youtube", label: "YouTube", placements: ["youtube_thumbnail", "youtube_in_feed"] },
];

/** @typedef {{ id: string, type: 'text'|'logo'|'face'|'cta'|'product', label: string, x: number, y: number, width: number, height: number, confidence: number }} GoogleCreativeElement */

export const GOOGLE_CROP_SPECS = {
  landscape_1200x628: {
    id: "landscape_1200x628",
    label: "Landscape",
    sizeLabel: "1200×628",
    width: 1200,
    height: 628,
    category: "landscape",
  },
  landscape_1200x675: {
    id: "landscape_1200x675",
    label: "Landscape",
    sizeLabel: "1200×675",
    width: 1200,
    height: 675,
    category: "landscape",
  },
  square_1200x1200: {
    id: "square_1200x1200",
    label: "Square",
    sizeLabel: "1200×1200",
    width: 1200,
    height: 1200,
    category: "square",
  },
  portrait_960x1200: {
    id: "portrait_960x1200",
    label: "Portrait",
    sizeLabel: "960×1200",
    width: 960,
    height: 1200,
    category: "portrait",
  },
  portrait_1200x1500: {
    id: "portrait_1200x1500",
    label: "Portrait",
    sizeLabel: "1200×1500",
    width: 1200,
    height: 1500,
    category: "portrait",
  },
  youtube_thumbnail: {
    id: "youtube_thumbnail",
    label: "YouTube Thumbnail",
    sizeLabel: "16:9 thumbnail",
    width: 1280,
    height: 720,
    category: "youtube",
  },
  youtube_in_feed: {
    id: "youtube_in_feed",
    label: "YouTube In-Feed",
    sizeLabel: "16:9 in-feed",
    width: 1280,
    height: 720,
    category: "youtube",
  },
  gmail_promo: {
    id: "gmail_promo",
    label: "Gmail Promotional",
    sizeLabel: "Promo preview",
    width: 1200,
    height: 628,
    category: "gmail",
  },
  demand_gen_mobile: {
    id: "demand_gen_mobile",
    label: "Demand Gen Mobile",
    sizeLabel: "Mobile 4:5",
    width: 1080,
    height: 1350,
    category: "demand_gen",
  },
  demand_gen_desktop: {
    id: "demand_gen_desktop",
    label: "Demand Gen Desktop",
    sizeLabel: "Desktop landscape",
    width: 1200,
    height: 628,
    category: "demand_gen",
  },
};

export const GOOGLE_CROP_CATEGORIES = [
  { id: "landscape", label: "Landscape" },
  { id: "square", label: "Square" },
  { id: "portrait", label: "Portrait" },
  { id: "youtube", label: "YouTube" },
  { id: "gmail", label: "Gmail" },
  { id: "demand_gen", label: "Demand Gen" },
];

function rectArea(rect) {
  return Math.max(0, rect.width) * Math.max(0, rect.height);
}

function intersectRects(a, b) {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  return {
    x,
    y,
    width: Math.max(0, right - x),
    height: Math.max(0, bottom - y),
  };
}

function normalizedRectToPixels(rect, imageW, imageH) {
  return {
    x: rect.left * imageW,
    y: rect.top * imageH,
    width: (rect.right - rect.left) * imageW,
    height: (rect.bottom - rect.top) * imageH,
  };
}

function elementToRect(element) {
  return { x: element.x, y: element.y, width: element.width, height: element.height };
}

function rectCenter(rect) {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

function pointInRect(point, rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.width
    && point.y >= rect.y && point.y <= rect.y + rect.height;
}

function rectFullyInside(inner, outer) {
  return inner.x >= outer.x && inner.y >= outer.y
    && inner.x + inner.width <= outer.x + outer.width
    && inner.y + inner.height <= outer.y + outer.height;
}

function overlapRatio(elementRect, zoneRect) {
  const intersection = intersectRects(elementRect, zoneRect);
  const elementArea = rectArea(elementRect);
  if (elementArea <= 0) return 0;
  return rectArea(intersection) / elementArea;
}

export function getGoogleRiskLevel(score) {
  if (score >= 80) return { id: "safe", label: "Safe", tone: "emerald" };
  if (score >= 60) return { id: "moderate", label: "Moderate Risk", tone: "amber" };
  return { id: "high", label: "High Risk", tone: "red" };
}

function normalizeGoogleElementType(type) {
  const value = String(type || "").toLowerCase();
  if (value.includes("logo")) return "logo";
  if (value.includes("product") || value.includes("subject") || value.includes("item")) return "product";
  if (value.includes("face") || value.includes("person")) return "face";
  if (value.includes("cta") || value.includes("button")) return "cta";
  return "text";
}

function formatGoogleElementLabel(type) {
  const normalized = normalizeGoogleElementType(type);
  if (normalized === "logo") return "Logo";
  if (normalized === "product") return "Product / subject";
  if (normalized === "face") return "Face";
  if (normalized === "cta") return "CTA button";
  return "Headline / text";
}

/**
 * @param {ImageData} imageData
 * @param {number} imageW
 * @param {number} imageH
 * @returns {GoogleCreativeElement[]}
 */
export function detectGoogleElementsFromImageData(imageData, imageW, imageH) {
  const base = detectElementsFromImageData(imageData, imageW, imageH);
  return base.map((element) => {
    const areaRatio = (element.width * element.height) / (imageW * imageH);
    const center = rectCenter(elementToRect(element));
    const centered = center.x > imageW * 0.22 && center.x < imageW * 0.78
      && center.y > imageH * 0.18 && center.y < imageH * 0.82;

    if (element.type === "face" && areaRatio >= 0.05) {
      return { ...element, type: "product", label: "Primary subject" };
    }
    if (areaRatio >= 0.07 && centered && !["text", "logo", "cta"].includes(element.type)) {
      return { ...element, type: "product", label: "Product / subject" };
    }
    if (element.type === "text" && element.label === "Headline") {
      return { ...element, label: "Headline" };
    }
    return element;
  });
}

/**
 * @param {Array<{ type: string, label: string, x: number, y: number, width: number, height: number, confidence?: number }>} apiElements
 * @param {number} imageW
 * @param {number} imageH
 */
export function normalizeGoogleApiElements(apiElements, imageW, imageH) {
  if (!Array.isArray(apiElements)) return [];
  return apiElements.map((el, index) => ({
    id: el.id || `vision-${index + 1}`,
    type: normalizeGoogleElementType(el.type),
    label: el.label || formatGoogleElementLabel(el.type),
    x: (el.x ?? 0) * imageW,
    y: (el.y ?? 0) * imageH,
    width: (el.width ?? 0) * imageW,
    height: (el.height ?? 0) * imageH,
    confidence: typeof el.confidence === "number" ? el.confidence : 0.75,
  }));
}

export { mergeElementDetections };

/**
 * @param {GoogleCreativeElement[]} elements
 * @param {string} placementId
 * @param {number} imageW
 * @param {number} imageH
 */
export function evaluateGoogleSafeZone(elements, placementId, imageW, imageH) {
  const spec = GOOGLE_SAFE_ZONE_SPECS[placementId];
  if (!spec || !imageW || !imageH) {
    return {
      score: 0,
      riskLevel: getGoogleRiskLevel(0),
      totalElements: 0,
      elementsAtRisk: [],
      safeElements: [],
      recommendations: [],
    };
  }

  const safeRect = normalizedRectToPixels(spec.safeZone, imageW, imageH);
  const uiRects = (spec.uiOverlays || []).map((overlay) => ({
    ...overlay,
    rect: normalizedRectToPixels(overlay, imageW, imageH),
  }));

  const elementsAtRisk = [];
  const safeElements = [];

  for (const element of elements) {
    const elementRect = elementToRect(element);
    const center = rectCenter(elementRect);
    const insideSafe = rectFullyInside(elementRect, safeRect) || pointInRect(center, safeRect);

    let uiOverlap = null;
    let maxUiOverlap = 0;
    for (const ui of uiRects) {
      const ratio = overlapRatio(elementRect, ui.rect);
      if (ratio > maxUiOverlap) {
        maxUiOverlap = ratio;
        uiOverlap = ui;
      }
    }

    const atRisk = !insideSafe || maxUiOverlap >= 0.12;
    const entry = {
      ...element,
      insideSafe,
      uiOverlap: uiOverlap
        ? { id: uiOverlap.id, label: uiOverlap.label, overlapRatio: maxUiOverlap }
        : null,
      riskReason: !insideSafe ? "outside_safe_zone" : maxUiOverlap >= 0.12 ? "ui_overlay_collision" : null,
    };

    if (atRisk) elementsAtRisk.push(entry);
    else safeElements.push(entry);
  }

  const total = elements.length;
  const riskPenalty = total === 0 ? 45 : (elementsAtRisk.length / total) * 68;
  const uiPenalty = elementsAtRisk.reduce((sum, el) => {
    if (el.uiOverlap?.overlapRatio >= 0.35) return sum + 14;
    if (el.uiOverlap?.overlapRatio >= 0.12) return sum + 7;
    return sum + 3;
  }, 0);

  const score = Math.max(0, Math.min(100, Math.round(100 - riskPenalty - Math.min(uiPenalty, 28))));

  return {
    score,
    riskLevel: getGoogleRiskLevel(score),
    totalElements: total,
    elementsAtRisk,
    safeElements,
    safeRect,
    uiRects,
    recommendations: generateGoogleSafeZoneRecommendations(elementsAtRisk, spec, imageW, imageH, safeRect),
  };
}

function generateGoogleSafeZoneRecommendations(atRiskElements, spec, imageW, imageH, safeRect) {
  const recommendations = [];
  const isMobileHeavy = ["demand_gen", "gmail"].includes(spec.group);

  for (const element of atRiskElements) {
    const elementRect = elementToRect(element);
    const center = rectCenter(elementRect);
    const nearEdge = center.x < imageW * 0.12 || center.x > imageW * 0.88
      || center.y < imageH * 0.1 || center.y > imageH * 0.9;

    if (element.type === "logo" && (nearEdge || element.riskReason === "outside_safe_zone")) {
      recommendations.push({
        severity: "high",
        elementType: element.type,
        message: "Move logo away from crop boundary — Responsive Display may trim edges.",
      });
      continue;
    }

    if (element.type === "text" || element.label?.includes("Headline")) {
      recommendations.push({
        severity: "medium",
        elementType: element.type,
        message: "Increase spacing around headline to survive dynamic text overlays.",
      });
      continue;
    }

    if (element.type === "cta") {
      recommendations.push({
        severity: "high",
        elementType: element.type,
        message: `Reposition CTA — overlaps ${spec.label} UI zone.`,
      });
      continue;
    }

    if (element.type === "product" || element.type === "face") {
      recommendations.push({
        severity: "medium",
        elementType: element.type,
        message: "Center primary subject within the safe zone for consistent cropping.",
      });
      continue;
    }

    const dx = safeRect.x + safeRect.width / 2 - center.x;
    const dy = safeRect.y + safeRect.height / 2 - center.y;
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      recommendations.push({
        severity: "medium",
        elementType: element.type,
        message: `Shift ${element.label.toLowerCase()} toward the safe zone center.`,
      });
    }
  }

  if (isMobileHeavy && atRiskElements.length >= 2) {
    recommendations.push({
      severity: "medium",
      elementType: "layout",
      message: "Improve visibility for mobile placements — tighten layout toward center 70%.",
    });
  }

  if (!recommendations.length && atRiskElements.length) {
    recommendations.push({
      severity: "medium",
      elementType: "layout",
      message: `Rebalance elements for ${spec.label} safe viewing area.`,
    });
  }

  return dedupeRecommendations(recommendations).slice(0, 8);
}

function dedupeRecommendations(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.message)) return false;
    seen.add(item.message);
    return true;
  });
}

/**
 * @param {GoogleCreativeElement[]} elements
 * @param {string} cropId
 * @param {number} imageW
 * @param {number} imageH
 */
export function simulateGoogleCrop(elements, cropId, imageW, imageH) {
  const spec = GOOGLE_CROP_SPECS[cropId];
  if (!spec || !imageW || !imageH) return null;

  const aspectRatio = spec.width / spec.height;
  const cropRect = computeCenterCropRect(imageW, imageH, aspectRatio);
  const sourceArea = imageW * imageH;
  const visibleArea = rectArea(cropRect);
  const croppedAreaPercent = Math.round(((sourceArea - visibleArea) / sourceArea) * 100);
  const visibilityPercent = Math.round((visibleArea / sourceArea) * 100);

  const elementResults = elements.map((element) => {
    const elementRect = elementToRect(element);
    const intersection = intersectRects(elementRect, cropRect);
    const elementArea = rectArea(elementRect);
    const visibleRatio = elementArea > 0 ? rectArea(intersection) / elementArea : 0;

    let status = "fully_visible";
    if (visibleRatio < 0.05) status = "completely_hidden";
    else if (visibleRatio < 0.95) status = "partially_cropped";

    return { ...element, visibleRatio, status, visiblePercent: Math.round(visibleRatio * 100) };
  });

  const hiddenCount = elementResults.filter((el) => el.status === "completely_hidden").length;
  const partialCount = elementResults.filter((el) => el.status === "partially_cropped").length;
  const visibleCount = elementResults.filter((el) => el.status === "fully_visible").length;

  let suitabilityScore = 100;
  suitabilityScore -= hiddenCount * 24;
  suitabilityScore -= partialCount * 11;
  if (croppedAreaPercent > 30) suitabilityScore -= 14;
  else if (croppedAreaPercent > 18) suitabilityScore -= 7;
  suitabilityScore = Math.max(0, Math.min(100, Math.round(suitabilityScore)));

  const label = `${spec.label} (${spec.sizeLabel})`;

  return {
    cropId,
    label,
    sizeLabel: spec.sizeLabel,
    category: spec.category,
    aspectRatio,
    cropRect,
    croppedAreaPercent,
    visibilityPercent,
    suitabilityScore,
    elementResults,
    visibleCount,
    partialCount,
    hiddenCount,
    warnings: generateGoogleCropWarnings(elementResults, label),
    suggestions: generateGoogleCropSuggestions(elementResults, spec, croppedAreaPercent),
  };
}

export function simulateAllGoogleCrops(elements, imageW, imageH) {
  return Object.keys(GOOGLE_CROP_SPECS)
    .map((id) => simulateGoogleCrop(elements, id, imageW, imageH))
    .filter(Boolean);
}

function generateGoogleCropWarnings(elementResults, label) {
  const warnings = [];
  for (const element of elementResults) {
    if (element.status === "completely_hidden") {
      warnings.push(`${element.label} not visible in ${label}.`);
    } else if (element.status === "partially_cropped") {
      warnings.push(`${element.label} partially cropped in ${label}.`);
    }
  }
  return uniqueMessages(warnings, 5);
}

function generateGoogleCropSuggestions(elementResults, spec, croppedAreaPercent) {
  const suggestions = [];
  const hidden = elementResults.filter((el) => el.status !== "fully_visible");
  const addedTypes = new Set();

  if (croppedAreaPercent >= 20) {
    suggestions.push(`Expect ${croppedAreaPercent}% crop for ${spec.sizeLabel} — design for center-weighted layout.`);
  }

  for (const element of hidden) {
    if (element.type === "logo" && !addedTypes.has("logo")) {
      addedTypes.add("logo");
      suggestions.push("Move logo inward — GDN and Responsive Display trim horizontal edges.");
    } else if (element.type === "cta" && !addedTypes.has("cta")) {
      addedTypes.add("cta");
      suggestions.push("Keep CTA inside center 70% for Gmail and Demand Gen previews.");
    } else if (element.type === "product" && !addedTypes.has("product")) {
      addedTypes.add("product");
      suggestions.push("Center product/subject to survive portrait and landscape recomposition.");
    } else if (element.type === "text" && !addedTypes.has("text")) {
      addedTypes.add("text");
      suggestions.push("Reduce headline length or increase padding for YouTube thumbnail crops.");
    }
  }

  if (spec.category === "demand_gen" && hidden.length && !addedTypes.has("demand_gen")) {
    addedTypes.add("demand_gen");
    suggestions.push("Test both Demand Gen mobile (4:5) and desktop landscape crops before launch.");
  }

  if (!suggestions.length) {
    suggestions.push(`${spec.sizeLabel} crop preserves all detected elements.`);
  }

  return uniqueMessages(suggestions, 4);
}
