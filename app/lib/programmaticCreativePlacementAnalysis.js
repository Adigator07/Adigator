/**
 * Programmatic Ads IAB safe-zone and crop simulation analysis.
 */

import {
  computeCenterCropRect,
  detectElementsFromImageData,
  mergeElementDetections,
  parseCreativeSize,
} from "@/app/lib/metaCreativePlacementAnalysis";
import { uniqueMessages } from "@/app/lib/previewAnalysisUtils";

export { parseCreativeSize, computeCenterCropRect };

function buildFormatSpec(id, width, height, group, label) {
  const aspectRatio = width / height;
  const safeZone = deriveIabSafeZone(width, height);
  const uiOverlays = deriveIabUiOverlays(width, height);
  return {
    id,
    label,
    group,
    width,
    height,
    aspectRatio,
    sizeLabel: `${width}×${height}`,
    safeZone,
    uiOverlays,
  };
}

function deriveIabSafeZone(width, height) {
  const aspect = width / height;

  if (aspect >= 4) {
    return { left: 0.04, top: 0.14, right: 0.96, bottom: 0.86 };
  }
  if (aspect >= 2.5) {
    return { left: 0.05, top: 0.12, right: 0.95, bottom: 0.88 };
  }
  if (aspect <= 0.35) {
    return { left: 0.12, top: 0.05, right: 0.88, bottom: 0.95 };
  }
  if (aspect <= 0.55) {
    return { left: 0.08, top: 0.06, right: 0.92, bottom: 0.94 };
  }
  if (height <= 100) {
    return { left: 0.06, top: 0.18, right: 0.94, bottom: 0.82 };
  }
  if (Math.abs(aspect - 1) < 0.05) {
    return { left: 0.08, top: 0.08, right: 0.92, bottom: 0.92 };
  }
  return { left: 0.07, top: 0.08, right: 0.93, bottom: 0.90 };
}

function deriveIabUiOverlays(width, height) {
  const aspect = width / height;
  const overlays = [];

  if (aspect >= 3) {
    overlays.push(
      { id: "left_edge", left: 0, top: 0, right: 0.04, bottom: 1, label: "Publisher gutter" },
      { id: "right_edge", left: 0.96, top: 0, right: 1, bottom: 1, label: "Publisher gutter" },
    );
  }
  if (aspect <= 0.4) {
    overlays.push(
      { id: "top_chrome", left: 0, top: 0, right: 1, bottom: 0.05, label: "Top clip zone" },
      { id: "bottom_chrome", left: 0, top: 0.95, right: 1, bottom: 1, label: "Bottom clip zone" },
    );
  }
  if (height <= 100) {
    overlays.push(
      { id: "ad_label", left: 0, top: 0, right: 0.14, bottom: 1, label: "Ad label" },
      { id: "close_btn", left: 0.88, top: 0, right: 1, bottom: 1, label: "Close / menu" },
    );
  }

  return overlays;
}

export const PROGRAMMATIC_IAB_FORMATS = {
  "300x250": buildFormatSpec("300x250", 300, 250, "standard_display", "Medium Rectangle"),
  "336x280": buildFormatSpec("336x280", 336, 280, "standard_display", "Large Rectangle"),
  "728x90": buildFormatSpec("728x90", 728, 90, "standard_display", "Leaderboard"),
  "970x90": buildFormatSpec("970x90", 970, 90, "standard_display", "Large Leaderboard"),
  "970x250": buildFormatSpec("970x250", 970, 250, "standard_display", "Billboard"),
  "300x600": buildFormatSpec("300x600", 300, 600, "standard_display", "Half Page"),
  "160x600": buildFormatSpec("160x600", 160, 600, "standard_display", "Wide Skyscraper"),
  "320x480": buildFormatSpec("320x480", 320, 480, "mobile", "Mobile Interstitial"),
  "320x100": buildFormatSpec("320x100", 320, 100, "mobile", "Mobile Large Banner"),
  "320x50": buildFormatSpec("320x50", 320, 50, "mobile", "Mobile Banner"),
  native_square: buildFormatSpec("native_square", 1200, 1200, "native", "Native Square"),
  native_landscape: buildFormatSpec("native_landscape", 1200, 628, "native", "Native Landscape"),
  native_portrait: buildFormatSpec("native_portrait", 960, 1200, "native", "Native Portrait"),
};

export const PROGRAMMATIC_IAB_GROUPS = [
  {
    id: "standard_display",
    label: "Standard Display",
    formats: ["300x250", "336x280", "728x90", "970x90", "970x250", "300x600", "160x600"],
  },
  {
    id: "mobile",
    label: "Mobile",
    formats: ["320x480", "300x250", "320x100", "320x50"],
  },
  {
    id: "native",
    label: "Native Ads",
    formats: ["native_square", "native_landscape", "native_portrait"],
  },
];

export const PROGRAMMATIC_CROP_SPECS = {
  "300x250": buildFormatSpec("300x250", 300, 250, "horizontal", "Medium Rectangle"),
  "336x280": buildFormatSpec("336x280", 336, 280, "horizontal", "Large Rectangle"),
  "728x90": buildFormatSpec("728x90", 728, 90, "horizontal", "Leaderboard"),
  "970x250": buildFormatSpec("970x250", 970, 250, "horizontal", "Billboard"),
  "970x90": buildFormatSpec("970x90", 970, 90, "horizontal", "Large Leaderboard"),
  "980x120": buildFormatSpec("980x120", 980, 120, "horizontal", "Panorama"),
  "468x60": buildFormatSpec("468x60", 468, 60, "horizontal", "Banner"),
  "300x300": buildFormatSpec("300x300", 300, 300, "square", "Square"),
  "250x250": buildFormatSpec("250x250", 250, 250, "square", "Square"),
  "200x200": buildFormatSpec("200x200", 200, 200, "square", "Small Square"),
  "160x600": buildFormatSpec("160x600", 160, 600, "vertical", "Wide Skyscraper"),
  "120x600": buildFormatSpec("120x600", 120, 600, "vertical", "Skyscraper"),
  "300x600": buildFormatSpec("300x600", 300, 600, "vertical", "Half Page"),
  "300x1050": buildFormatSpec("300x1050", 300, 1050, "vertical", "Premium Skyscraper"),
  "320x50": buildFormatSpec("320x50", 320, 50, "mobile", "Mobile Banner"),
  "300x50": buildFormatSpec("300x50", 300, 50, "mobile", "Mobile Banner"),
  "320x100": buildFormatSpec("320x100", 320, 100, "mobile", "Mobile Large Banner"),
  "300x100": buildFormatSpec("300x100", 300, 100, "mobile", "Mobile Web Banner"),
  "320x480": buildFormatSpec("320x480", 320, 480, "mobile", "Mobile Interstitial"),
  "480x320": buildFormatSpec("480x320", 480, 320, "mobile", "Mobile Interstitial Landscape"),
  native_landscape: buildFormatSpec("native_landscape", 1200, 628, "native", "Native Landscape"),
  native_portrait: buildFormatSpec("native_portrait", 960, 1200, "native", "Native Portrait"),
  native_square: buildFormatSpec("native_square", 1200, 1200, "native", "Native Square"),
};

export const PROGRAMMATIC_CROP_GROUPS = [
  { id: "all", label: "All formats" },
  { id: "horizontal", label: "Horizontal" },
  { id: "square", label: "Square" },
  { id: "vertical", label: "Vertical" },
  { id: "mobile", label: "Mobile" },
  { id: "native", label: "Native" },
];

function rectArea(rect) {
  return Math.max(0, rect.width) * Math.max(0, rect.height);
}

function intersectRects(a, b) {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  return { x, y, width: Math.max(0, right - x), height: Math.max(0, bottom - y) };
}

function elementToRect(element) {
  return { x: element.x, y: element.y, width: element.width, height: element.height };
}

function normalizedRectToPixels(rect, imageW, imageH) {
  return {
    x: rect.left * imageW,
    y: rect.top * imageH,
    width: (rect.right - rect.left) * imageW,
    height: (rect.bottom - rect.top) * imageH,
  };
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

function overlapRatio(a, b) {
  const intersection = intersectRects(a, b);
  const areaA = rectArea(a);
  if (areaA <= 0) return 0;
  return rectArea(intersection) / areaA;
}

function iou(a, b) {
  const intersection = intersectRects(elementToRect(a), elementToRect(b));
  const union = rectArea(elementToRect(a)) + rectArea(elementToRect(b)) - rectArea(intersection);
  return union > 0 ? rectArea(intersection) / union : 0;
}

export function getProgrammaticRiskLevel(score) {
  if (score >= 80) return { id: "safe", label: "Safe", tone: "emerald" };
  if (score >= 60) return { id: "moderate", label: "Moderate Risk", tone: "amber" };
  return { id: "high", label: "High Risk", tone: "red" };
}

function normalizeProgrammaticElementType(type) {
  const value = String(type || "").toLowerCase();
  if (value.includes("logo") || value.includes("brand")) return value.includes("brand") ? "brand" : "logo";
  if (value.includes("product")) return "product";
  if (value.includes("face") || value.includes("person")) return "face";
  if (value.includes("cta") || value.includes("button")) return "cta";
  if (value.includes("headline")) return "text";
  if (value.includes("body")) return "text";
  return "text";
}

function formatProgrammaticElementLabel(type, fallback) {
  const normalized = normalizeProgrammaticElementType(type);
  if (fallback && fallback !== normalized) return fallback;
  if (normalized === "logo") return "Logo";
  if (normalized === "brand") return "Brand element";
  if (normalized === "product") return "Product image";
  if (normalized === "face") return "Face";
  if (normalized === "cta") return "CTA button";
  return "Headline / text";
}

/**
 * @param {ImageData} imageData
 * @param {number} imageW
 * @param {number} imageH
 */
export function detectProgrammaticElementsFromImageData(imageData, imageW, imageH) {
  const base = detectElementsFromImageData(imageData, imageW, imageH);
  return base.map((element) => {
    const areaRatio = (element.width * element.height) / (imageW * imageH);
    const center = rectCenter(elementToRect(element));
    const centered = center.x > imageW * 0.2 && center.x < imageW * 0.8
      && center.y > imageH * 0.15 && center.y < imageH * 0.85;

    if (element.type === "logo") return { ...element, label: "Logo" };
    if (element.type === "face") return { ...element, label: "Face" };
    if (element.type === "cta") return { ...element, label: "CTA button" };
    if (element.label === "Headline") return { ...element, type: "text", label: "Headline" };
    if (areaRatio >= 0.06 && centered) {
      return { ...element, type: "product", label: "Product image" };
    }
    if (areaRatio < 0.02 && (center.x < imageW * 0.2 || center.y < imageH * 0.2)) {
      return { ...element, type: "brand", label: "Brand element" };
    }
    return { ...element, type: "text", label: element.label || "Body text" };
  });
}

export function normalizeProgrammaticApiElements(apiElements, imageW, imageH) {
  if (!Array.isArray(apiElements)) return [];
  return apiElements.map((el, index) => ({
    id: el.id || `vision-${index + 1}`,
    type: normalizeProgrammaticElementType(el.type),
    label: el.label || formatProgrammaticElementLabel(el.type),
    x: (el.x ?? 0) * imageW,
    y: (el.y ?? 0) * imageH,
    width: (el.width ?? 0) * imageW,
    height: (el.height ?? 0) * imageH,
    confidence: typeof el.confidence === "number" ? el.confidence : 0.75,
  }));
}

export { mergeElementDetections };

function transformElementsToCropSpace(elements, cropRect, formatW, formatH) {
  const scaleX = formatW / cropRect.width;
  const scaleY = formatH / cropRect.height;

  return elements.map((element) => {
    const elementRect = elementToRect(element);
    const intersection = intersectRects(elementRect, cropRect);
    const elementArea = rectArea(elementRect);
    const visibleRatio = elementArea > 0 ? rectArea(intersection) / elementArea : 0;

    return {
      ...element,
      x: (intersection.x - cropRect.x) * scaleX,
      y: (intersection.y - cropRect.y) * scaleY,
      width: intersection.width * scaleX,
      height: intersection.height * scaleY,
      visibleRatio,
      cropStatus: visibleRatio < 0.05 ? "completely_hidden" : visibleRatio < 0.95 ? "partially_cropped" : "fully_visible",
    };
  }).filter((el) => el.width > 0 && el.height > 0);
}

function detectEdgeProximityViolations(elements, canvasW, canvasH, threshold = 0.05) {
  return elements.filter((element) => {
    const rect = elementToRect(element);
    const marginX = canvasW * threshold;
    const marginY = canvasH * threshold;
    return rect.x < marginX
      || rect.y < marginY
      || rect.x + rect.width > canvasW - marginX
      || rect.y + rect.height > canvasH - marginY;
  });
}

export function detectOverlappingElements(elements, minOverlap = 0.12) {
  const overlaps = [];
  for (let i = 0; i < elements.length; i += 1) {
    for (let j = i + 1; j < elements.length; j += 1) {
      const ratio = iou(elements[i], elements[j]);
      if (ratio >= minOverlap) {
        overlaps.push({
          a: elements[i],
          b: elements[j],
          overlapRatio: ratio,
        });
      }
    }
  }
  return overlaps;
}

function computeFormatCompatibilityScore(sourceW, sourceH, formatSpec) {
  if (!sourceW || !sourceH) return 0;
  const sourceAspect = sourceW / sourceH;
  const targetAspect = formatSpec.aspectRatio;
  const aspectDiff = Math.abs(sourceAspect - targetAspect) / targetAspect;
  const exactMatch = sourceW === formatSpec.width && sourceH === formatSpec.height;
  if (exactMatch) return 100;
  if (aspectDiff < 0.05) return 92;
  if (aspectDiff < 0.15) return 78;
  if (aspectDiff < 0.35) return 62;
  if (aspectDiff < 0.6) return 45;
  return 28;
}

/**
 * @param {Array} elements
 * @param {string} formatId
 * @param {number} sourceW
 * @param {number} sourceH
 */
export function evaluateProgrammaticSafeZone(elements, formatId, sourceW, sourceH) {
  const spec = PROGRAMMATIC_IAB_FORMATS[formatId];
  if (!spec || !sourceW || !sourceH) {
    return emptySafeZoneResult();
  }

  const cropRect = computeCenterCropRect(sourceW, sourceH, spec.aspectRatio);
  const formatElements = transformElementsToCropSpace(elements, cropRect, spec.width, spec.height);
  const safeRect = normalizedRectToPixels(spec.safeZone, spec.width, spec.height);
  const uiRects = (spec.uiOverlays || []).map((overlay) => ({
    ...overlay,
    rect: normalizedRectToPixels(overlay, spec.width, spec.height),
  }));

  const elementsAtRisk = [];
  const safeElements = [];
  const croppedElements = formatElements.filter((el) => el.cropStatus !== "fully_visible");
  const edgeViolations = detectEdgeProximityViolations(formatElements, spec.width, spec.height);
  const overlaps = detectOverlappingElements(formatElements);

  for (const element of formatElements) {
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

    const edgeViolation = edgeViolations.some((ev) => ev.id === element.id);
    const atRisk = !insideSafe || maxUiOverlap >= 0.1 || edgeViolation || element.cropStatus !== "fully_visible";

    const entry = {
      ...element,
      insideSafe,
      edgeViolation,
      uiOverlap: uiOverlap ? { id: uiOverlap.id, label: uiOverlap.label, overlapRatio: maxUiOverlap } : null,
      riskReason: element.cropStatus !== "fully_visible"
        ? "cropped"
        : !insideSafe
          ? "outside_safe_zone"
          : edgeViolation
            ? "edge_proximity"
            : maxUiOverlap >= 0.1
              ? "ui_overlay"
              : null,
    };

    if (atRisk) elementsAtRisk.push(entry);
    else safeElements.push(entry);
  }

  const total = formatElements.length;
  const riskPenalty = total === 0 ? 50 : (elementsAtRisk.length / total) * 65;
  const cropPenalty = croppedElements.length * 8;
  const overlapPenalty = overlaps.length * 6;
  const score = Math.max(0, Math.min(100, Math.round(100 - riskPenalty - Math.min(cropPenalty + overlapPenalty, 30))));

  const compatibilityScore = computeFormatCompatibilityScore(sourceW, sourceH, spec);

  return {
    score,
    riskLevel: getProgrammaticRiskLevel(score),
    compatibilityScore,
    totalElements: total,
    elementsAtRisk,
    safeElements,
    croppedElements,
    edgeViolations,
    overlaps,
    safeRect,
    uiRects,
    cropRect,
    formatSpec: spec,
    recommendations: generateProgrammaticSafeZoneRecommendations({
      elementsAtRisk,
      croppedElements,
      overlaps,
      edgeViolations,
      spec,
    }),
  };
}

function emptySafeZoneResult() {
  return {
    score: 0,
    riskLevel: getProgrammaticRiskLevel(0),
    compatibilityScore: 0,
    totalElements: 0,
    elementsAtRisk: [],
    safeElements: [],
    croppedElements: [],
    edgeViolations: [],
    overlaps: [],
    recommendations: [],
  };
}

function generateProgrammaticSafeZoneRecommendations(ctx) {
  const { elementsAtRisk, croppedElements, overlaps, edgeViolations, spec } = ctx;
  const recommendations = [];

  for (const element of elementsAtRisk) {
    if (element.type === "logo" && (element.edgeViolation || element.riskReason === "cropped")) {
      recommendations.push({
        severity: "high",
        message: `Move logo away from ${spec.sizeLabel} crop boundary.`,
      });
    } else if (element.type === "text" || element.label?.includes("Headline")) {
      recommendations.push({
        severity: "medium",
        message: `Increase spacing around headline for ${spec.label}.`,
      });
    } else if (element.type === "cta") {
      recommendations.push({
        severity: "high",
        message: `Reposition CTA — overlaps risky zone in ${spec.label}.`,
      });
    } else if (element.type === "product" || element.type === "face") {
      recommendations.push({
        severity: "medium",
        message: "Center primary subject within the IAB safe zone.",
      });
    } else if (element.type === "brand") {
      recommendations.push({
        severity: "medium",
        message: "Keep brand elements inside the center safe area.",
      });
    }
  }

  if (croppedElements.length) {
    recommendations.push({
      severity: "high",
      message: `${croppedElements.length} element(s) cropped when fitted to ${spec.sizeLabel}.`,
    });
  }

  if (overlaps.length) {
    recommendations.push({
      severity: "medium",
      message: `${overlaps.length} overlapping element pair(s) — reduce density for ${spec.label}.`,
    });
  }

  if (edgeViolations.length && spec.group === "mobile") {
    recommendations.push({
      severity: "medium",
      message: "Improve visibility for mobile placements — add padding from edges.",
    });
  }

  return dedupeMessages(recommendations).slice(0, 8);
}

function dedupeMessages(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.message)) return false;
    seen.add(item.message);
    return true;
  });
}

function computeReadabilityScore(elementResults) {
  const textElements = elementResults.filter((el) => el.type === "text");
  if (!textElements.length) return 75;
  const avgVisible = textElements.reduce(
    (sum, el) => sum + (el.visibleRatio ?? (el.visiblePercent != null ? el.visiblePercent / 100 : 1)),
    0,
  ) / textElements.length;
  return Math.round(Math.max(0, Math.min(100, avgVisible * 100 - (textElements.filter((el) => el.cropStatus === "partially_cropped").length * 12))));
}

function computeElementTypeVisibility(elementResults, type) {
  const matches = elementResults.filter((el) => el.type === type);
  if (!matches.length) return null;
  const avg = matches.reduce((sum, el) => sum + (el.visibleRatio ?? 1), 0) / matches.length;
  return Math.round(avg * 100);
}

/**
 * @param {Array} elements
 * @param {string} cropId
 * @param {number} sourceW
 * @param {number} sourceH
 */
export function simulateProgrammaticCrop(elements, cropId, sourceW, sourceH) {
  const spec = PROGRAMMATIC_CROP_SPECS[cropId];
  if (!spec || !sourceW || !sourceH) return null;

  const cropRect = computeCenterCropRect(sourceW, sourceH, spec.aspectRatio);
  const sourceArea = sourceW * sourceH;
  const visibleArea = rectArea(cropRect);
  const croppedAreaPercent = Math.round(((sourceArea - visibleArea) / sourceArea) * 100);
  const visibilityPercent = Math.round((visibleArea / sourceArea) * 100);

  const elementResults = transformElementsToCropSpace(elements, cropRect, spec.width, spec.height).map((el) => ({
    ...el,
    visiblePercent: Math.round((el.visibleRatio ?? 1) * 100),
    status: el.cropStatus,
  }));

  const hiddenCount = elementResults.filter((el) => el.status === "completely_hidden").length;
  const partialCount = elementResults.filter((el) => el.status === "partially_cropped").length;
  const visibleCount = elementResults.filter((el) => el.status === "fully_visible").length;

  let suitabilityScore = 100;
  suitabilityScore -= hiddenCount * 25;
  suitabilityScore -= partialCount * 12;
  if (croppedAreaPercent > 35) suitabilityScore -= 15;
  suitabilityScore = Math.max(0, Math.min(100, Math.round(suitabilityScore)));

  const readabilityScore = computeReadabilityScore(elementResults);
  const ctaVisibility = computeElementTypeVisibility(elementResults, "cta");
  const logoVisibility = computeElementTypeVisibility(elementResults, "logo")
    ?? computeElementTypeVisibility(elementResults, "brand");

  return {
    cropId,
    label: spec.label,
    sizeLabel: spec.sizeLabel,
    category: spec.group,
    aspectRatio: spec.aspectRatio,
    formatWidth: spec.width,
    formatHeight: spec.height,
    cropRect,
    croppedAreaPercent,
    visibilityPercent,
    suitabilityScore,
    readabilityScore,
    ctaVisibility,
    logoVisibility,
    elementResults,
    visibleCount,
    partialCount,
    hiddenCount,
    warnings: generateProgrammaticCropWarnings(elementResults, spec),
    suggestions: generateProgrammaticCropSuggestions(elementResults, spec, croppedAreaPercent),
  };
}

export function simulateAllProgrammaticCrops(elements, sourceW, sourceH) {
  return Object.keys(PROGRAMMATIC_CROP_SPECS)
    .map((id) => simulateProgrammaticCrop(elements, id, sourceW, sourceH))
    .filter(Boolean);
}

function generateProgrammaticCropWarnings(elementResults, spec) {
  const warnings = [];
  for (const element of elementResults) {
    if (element.status === "completely_hidden") {
      warnings.push(`${element.label} hidden in ${spec.sizeLabel}.`);
    } else if (element.status === "partially_cropped") {
      warnings.push(`${element.label} partially cropped in ${spec.sizeLabel}.`);
    }
  }
  return uniqueMessages(warnings, 5);
}

function generateProgrammaticCropSuggestions(elementResults, spec, croppedAreaPercent) {
  const suggestions = [];
  const hidden = elementResults.filter((el) => el.status !== "fully_visible");
  const addedTypes = new Set();

  if (croppedAreaPercent >= 20) {
    suggestions.push(`${croppedAreaPercent}% of source cropped for ${spec.sizeLabel} — use center-weighted layout.`);
  }

  for (const element of hidden) {
    if ((element.type === "logo" || element.type === "brand") && !addedTypes.has("logo")) {
      addedTypes.add("logo");
      suggestions.push("Move logo/brand mark inward for leaderboard and skyscraper crops.");
    } else if (element.type === "cta" && !addedTypes.has("cta")) {
      addedTypes.add("cta");
      suggestions.push("Ensure CTA stays visible in mobile banner formats (320×50, 320×100).");
    } else if (element.type === "text" && !addedTypes.has("text")) {
      addedTypes.add("text");
      suggestions.push("Shorten copy for narrow horizontal inventory.");
    }
  }

  if (!suggestions.length) {
    suggestions.push(`${spec.sizeLabel} preserves all detected elements.`);
  }

  return uniqueMessages(suggestions, 4);
}
