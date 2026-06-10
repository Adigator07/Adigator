/**
 * Meta Ads creative safe-zone and crop simulation analysis.
 * Safe zones follow Meta placement UI overlay conventions (approximate industry guidance).
 */

import { uniqueMessages } from "@/app/lib/previewAnalysisUtils";

export const META_PLACEMENT_SPECS = {
  facebook_feed: {
    id: "facebook_feed",
    label: "Facebook Feed",
    group: "feed",
    aspectRatio: 1,
    safeZone: { left: 0.05, top: 0.05, right: 0.95, bottom: 0.82 },
    uiOverlays: [
      { id: "caption", left: 0, top: 0.82, right: 1, bottom: 1, label: "Caption & engagement bar" },
    ],
  },
  instagram_feed: {
    id: "instagram_feed",
    label: "Instagram Feed",
    group: "feed",
    aspectRatio: 4 / 5,
    safeZone: { left: 0.06, top: 0.08, right: 0.94, bottom: 0.88 },
    uiOverlays: [
      { id: "caption", left: 0, top: 0.88, right: 1, bottom: 1, label: "Caption truncation zone" },
    ],
  },
  instagram_stories: {
    id: "instagram_stories",
    label: "Instagram Stories",
    group: "story",
    aspectRatio: 9 / 16,
    safeZone: { left: 0.08, top: 0.14, right: 0.92, bottom: 0.78 },
    uiOverlays: [
      { id: "top_profile", left: 0, top: 0, right: 1, bottom: 0.14, label: "Profile & progress bar" },
      { id: "bottom_cta", left: 0, top: 0.78, right: 1, bottom: 1, label: "Swipe-up / reply UI" },
    ],
  },
  instagram_reels: {
    id: "instagram_reels",
    label: "Instagram Reels",
    group: "reels",
    aspectRatio: 9 / 16,
    safeZone: { left: 0.1, top: 0.12, right: 0.9, bottom: 0.72 },
    uiOverlays: [
      { id: "top_bar", left: 0, top: 0, right: 1, bottom: 0.12, label: "Reels top bar" },
      { id: "right_actions", left: 0.82, top: 0.35, right: 1, bottom: 0.75, label: "Action buttons" },
      { id: "bottom_caption", left: 0, top: 0.72, right: 0.82, bottom: 1, label: "Caption & CTA overlay" },
    ],
  },
  facebook_reels: {
    id: "facebook_reels",
    label: "Facebook Reels",
    group: "reels",
    aspectRatio: 9 / 16,
    safeZone: { left: 0.1, top: 0.12, right: 0.9, bottom: 0.72 },
    uiOverlays: [
      { id: "top_bar", left: 0, top: 0, right: 1, bottom: 0.12, label: "Reels top bar" },
      { id: "right_actions", left: 0.82, top: 0.35, right: 1, bottom: 0.75, label: "Action buttons" },
      { id: "bottom_caption", left: 0, top: 0.72, right: 0.82, bottom: 1, label: "Caption & CTA overlay" },
    ],
  },
};

export const META_PLACEMENT_IDS = Object.keys(META_PLACEMENT_SPECS);

export const META_SAFE_ZONE_GROUPS = [
  { id: "feed", label: "Feed", placements: ["facebook_feed", "instagram_feed"] },
  { id: "story", label: "Story", placements: ["instagram_stories"] },
  { id: "reels", label: "Reels", placements: ["instagram_reels", "facebook_reels"] },
];

/** @typedef {{ id: string, type: 'text'|'logo'|'face'|'cta', label: string, x: number, y: number, width: number, height: number, confidence: number }} CreativeElement */

/**
 * @param {number} sourceW
 * @param {number} sourceH
 * @param {number} targetAspect width/height
 */
export function computeCenterCropRect(sourceW, sourceH, targetAspect) {
  if (!sourceW || !sourceH || !targetAspect) {
    return { x: 0, y: 0, width: sourceW || 0, height: sourceH || 0 };
  }

  const sourceAspect = sourceW / sourceH;

  if (sourceAspect > targetAspect) {
    const cropH = sourceH;
    const cropW = sourceH * targetAspect;
    return {
      x: (sourceW - cropW) / 2,
      y: 0,
      width: cropW,
      height: cropH,
    };
  }

  const cropW = sourceW;
  const cropH = sourceW / targetAspect;
  return {
    x: 0,
    y: (sourceH - cropH) / 2,
    width: cropW,
    height: cropH,
  };
}

function rectArea(rect) {
  return Math.max(0, rect.width) * Math.max(0, rect.height);
}

function intersectRects(a, b) {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  const width = Math.max(0, right - x);
  const height = Math.max(0, bottom - y);
  return { x, y, width, height };
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
  return {
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
  };
}

function rectCenter(rect) {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}

function pointInRect(point, rect) {
  return (
    point.x >= rect.x
    && point.x <= rect.x + rect.width
    && point.y >= rect.y
    && point.y <= rect.y + rect.height
  );
}

function rectFullyInside(inner, outer) {
  return (
    inner.x >= outer.x
    && inner.y >= outer.y
    && inner.x + inner.width <= outer.x + outer.width
    && inner.y + inner.height <= outer.y + outer.height
  );
}

function overlapRatio(elementRect, zoneRect) {
  const intersection = intersectRects(elementRect, zoneRect);
  const elementArea = rectArea(elementRect);
  if (elementArea <= 0) return 0;
  return rectArea(intersection) / elementArea;
}

/**
 * @param {CreativeElement[]} elements
 * @param {string} placementId
 * @param {number} imageW
 * @param {number} imageH
 */
export function evaluateSafeZone(elements, placementId, imageW, imageH) {
  const spec = META_PLACEMENT_SPECS[placementId];
  if (!spec || !imageW || !imageH) {
    return {
      score: 0,
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
    const insideSafe = rectFullyInside(elementRect, safeRect)
      || pointInRect(center, safeRect);

    let uiOverlap = null;
    let maxUiOverlap = 0;
    for (const ui of uiRects) {
      const ratio = overlapRatio(elementRect, ui.rect);
      if (ratio > maxUiOverlap) {
        maxUiOverlap = ratio;
        uiOverlap = ui;
      }
    }

    const atRisk = !insideSafe || maxUiOverlap >= 0.15;
    const entry = {
      ...element,
      insideSafe,
      uiOverlap: uiOverlap
        ? { id: uiOverlap.id, label: uiOverlap.label, overlapRatio: maxUiOverlap }
        : null,
      riskReason: !insideSafe
        ? "outside_safe_zone"
        : maxUiOverlap >= 0.15
          ? "ui_overlay_collision"
          : null,
    };

    if (atRisk) elementsAtRisk.push(entry);
    else safeElements.push(entry);
  }

  const total = elements.length;
  const riskPenalty = total === 0 ? 40 : (elementsAtRisk.length / total) * 70;
  const uiPenalty = elementsAtRisk.reduce((sum, el) => {
    if (el.uiOverlap?.overlapRatio >= 0.35) return sum + 15;
    if (el.uiOverlap?.overlapRatio >= 0.15) return sum + 8;
    return sum + 3;
  }, 0);

  const score = Math.max(0, Math.min(100, Math.round(100 - riskPenalty - Math.min(uiPenalty, 25))));

  return {
    score,
    totalElements: total,
    elementsAtRisk,
    safeElements,
    safeRect,
    uiRects,
    recommendations: generateSafeZoneRecommendations(elementsAtRisk, spec, imageW, imageH, safeRect),
  };
}

/**
 * @param {CreativeElement[]} elements
 * @param {string} placementId
 * @param {number} imageW
 * @param {number} imageH
 */
export function simulatePlacementCrop(elements, placementId, imageW, imageH) {
  const spec = META_PLACEMENT_SPECS[placementId];
  if (!spec || !imageW || !imageH) {
    return null;
  }

  const cropRect = computeCenterCropRect(imageW, imageH, spec.aspectRatio);
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

    return {
      ...element,
      visibleRatio,
      status,
      visiblePercent: Math.round(visibleRatio * 100),
    };
  });

  const hiddenCount = elementResults.filter((el) => el.status === "completely_hidden").length;
  const partialCount = elementResults.filter((el) => el.status === "partially_cropped").length;
  const visibleCount = elementResults.filter((el) => el.status === "fully_visible").length;

  let suitabilityScore = 100;
  suitabilityScore -= hiddenCount * 22;
  suitabilityScore -= partialCount * 10;
  if (croppedAreaPercent > 35) suitabilityScore -= 12;
  else if (croppedAreaPercent > 20) suitabilityScore -= 6;
  suitabilityScore = Math.max(0, Math.min(100, Math.round(suitabilityScore)));

  return {
    placementId,
    label: spec.label,
    aspectRatio: spec.aspectRatio,
    cropRect,
    croppedAreaPercent,
    visibilityPercent,
    suitabilityScore,
    elementResults,
    visibleCount,
    partialCount,
    hiddenCount,
    warnings: generateCropWarnings(elementResults, spec.label),
    suggestions: generateCropSuggestions(elementResults, spec, croppedAreaPercent),
  };
}

/**
 * @param {CreativeElement[]} elements
 * @param {number} imageW
 * @param {number} imageH
 */
export function simulateAllPlacements(elements, imageW, imageH) {
  return META_PLACEMENT_IDS.map((id) => simulatePlacementCrop(elements, id, imageW, imageH)).filter(Boolean);
}

function generateSafeZoneRecommendations(atRiskElements, spec, imageW, imageH, safeRect) {
  const recommendations = [];

  for (const element of atRiskElements) {
    const elementRect = elementToRect(element);
    const center = rectCenter(elementRect);

    if (element.riskReason === "ui_overlay_collision" && element.uiOverlap) {
      recommendations.push({
        severity: element.uiOverlap.overlapRatio >= 0.35 ? "high" : "medium",
        elementType: element.type,
        elementLabel: element.label,
        message: `${element.label} overlaps ${element.uiOverlap.label} in ${spec.label}.`,
      });
      continue;
    }

    const dx = safeRect.x + safeRect.width / 2 - center.x;
    const dy = safeRect.y + safeRect.height / 2 - center.y;

    const moveX = Math.abs(dx) > 8 ? `${Math.round(Math.abs(dx))}px ${dx > 0 ? "right" : "left"}` : null;
    const moveY = Math.abs(dy) > 8 ? `${Math.round(Math.abs(dy))}px ${dy > 0 ? "downward" : "upward"}` : null;

    if (element.type === "logo" && moveY) {
      recommendations.push({
        severity: "medium",
        elementType: element.type,
        elementLabel: element.label,
        message: `Move logo ${moveY}.`,
      });
    } else if (element.type === "cta" && element.uiOverlap) {
      recommendations.push({
        severity: "high",
        elementType: element.type,
        elementLabel: element.label,
        message: `CTA overlaps ${spec.label.includes("Reels") ? "Reels" : spec.label} interface area.`,
      });
    } else if (element.type === "text") {
      if (center.y < safeRect.y) {
        recommendations.push({
          severity: "medium",
          elementType: element.type,
          elementLabel: element.label,
          message: "Headline is too close to the edge — shift into the center safe zone.",
        });
      } else if (moveX || moveY) {
        recommendations.push({
          severity: "medium",
          elementType: element.type,
          elementLabel: element.label,
          message: `Reposition ${element.label.toLowerCase()}${moveY ? ` ${moveY}` : ""}${moveX && moveY ? " and" : ""}${moveX ? ` ${moveX}` : ""}.`.replace(/\s+/g, " ").trim(),
        });
      }
    } else if (moveY || moveX) {
      recommendations.push({
        severity: "medium",
        elementType: element.type,
        elementLabel: element.label,
        message: `Move ${element.label.toLowerCase()} toward the safe zone center${moveY ? ` (${moveY})` : ""}.`,
      });
    }
  }

  if (!recommendations.length && atRiskElements.length) {
    recommendations.push({
      severity: "medium",
      elementType: "general",
      elementLabel: "Layout",
      message: `Rebalance key elements toward the ${spec.label} center safe area.`,
    });
  }

  return recommendations.slice(0, 8);
}

function generateCropWarnings(elementResults, placementLabel) {
  const warnings = [];
  for (const element of elementResults) {
    if (element.status === "completely_hidden") {
      warnings.push(`${element.label} not visible in ${placementLabel} crop.`);
    } else if (element.status === "partially_cropped") {
      warnings.push(`${element.label} partially hidden in ${placementLabel}.`);
    }
  }
  return uniqueMessages(warnings, 6);
}

function generateCropSuggestions(elementResults, spec, croppedAreaPercent) {
  const suggestions = [];
  const hidden = elementResults.filter((el) => el.status !== "fully_visible");
  const addedTypes = new Set();

  if (croppedAreaPercent >= 25) {
    suggestions.push(`Source aspect differs from ${spec.label} (${spec.aspectRatio.toFixed(2)}:1) — expect ${croppedAreaPercent}% crop.`);
  }

  for (const element of hidden) {
    if (element.type === "logo" && !addedTypes.has("logo")) {
      addedTypes.add("logo");
      suggestions.push(`Center the logo or add padding — logo cropped in ${spec.label}.`);
    } else if (element.type === "cta" && !addedTypes.has("cta")) {
      addedTypes.add("cta");
      suggestions.push(`Raise CTA above bottom UI band for ${spec.label}.`);
    } else if (element.type === "text" && !addedTypes.has("text")) {
      addedTypes.add("text");
      suggestions.push(`Shorten headline or move copy inward for ${spec.label}.`);
    }
  }

  if (!suggestions.length) {
    suggestions.push(`${spec.label} crop preserves all detected elements.`);
  }

  return uniqueMessages(suggestions, 4);
}

function luminance(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function isSkinTone(r, g, b) {
  return r > 60 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 12 && r - b > 15;
}

function mergeGridRegions(grid, cols, rows, threshold) {
  const visited = new Set();
  const regions = [];

  function key(c, r) {
    return `${c},${r}`;
  }

  function flood(c, r) {
    const stack = [[c, r]];
    const cells = [];
    while (stack.length) {
      const [cc, rr] = stack.pop();
      const k = key(cc, rr);
      if (visited.has(k) || cc < 0 || rr < 0 || cc >= cols || rr >= rows) continue;
      if ((grid[rr * cols + cc] || 0) < threshold) continue;
      visited.add(k);
      cells.push([cc, rr]);
      stack.push([cc + 1, rr], [cc - 1, rr], [cc, rr + 1], [cc, rr - 1]);
    }
    return cells;
  }

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const k = key(c, r);
      if (visited.has(k)) continue;
      if ((grid[r * cols + c] || 0) < threshold) continue;
      const cells = flood(c, r);
      if (cells.length >= 2) regions.push(cells);
    }
  }

  return regions;
}

function classifyRegion(cells, cols, imageW, imageH) {
  const minC = Math.min(...cells.map(([c]) => c));
  const maxC = Math.max(...cells.map(([c]) => c));
  const minR = Math.min(...cells.map(([, r]) => r));
  const maxR = Math.max(...cells.map(([, r]) => r));

  const cellW = imageW / cols;
  const cellH = imageH / Math.ceil((imageH / imageW) * cols);

  const x = minC * cellW;
  const y = minR * cellH;
  const width = (maxC - minC + 1) * cellW;
  const height = (maxR - minR + 1) * cellH;
  const areaRatio = (width * height) / (imageW * imageH);
  const centerY = y + height / 2;
  const relY = centerY / imageH;
  const relX = (x + width / 2) / imageW;
  const aspect = width / Math.max(height, 1);

  if (areaRatio < 0.015 && relX < 0.35 && relY < 0.35) {
    return { type: "logo", label: "Logo", confidence: 0.62 };
  }
  if (relY > 0.68 && aspect > 1.4 && areaRatio >= 0.01 && areaRatio < 0.12) {
    return { type: "cta", label: "CTA button", confidence: 0.58 };
  }
  if (aspect > 1.2 && areaRatio >= 0.012 && relY < 0.55) {
    return { type: "text", label: relY < 0.25 ? "Headline" : "Body text", confidence: 0.55 };
  }
  if (areaRatio >= 0.04 && relY >= 0.15 && relY <= 0.75 && aspect >= 0.65 && aspect <= 1.35) {
    return { type: "face", label: "Face / subject", confidence: 0.5 };
  }
  if (areaRatio >= 0.008) {
    return { type: "text", label: "Text block", confidence: 0.45 };
  }
  return null;
}

/**
 * Heuristic element detection from ImageData (client-side OCR/visual proxy).
 * @param {ImageData} imageData
 * @param {number} imageW
 * @param {number} imageH
 * @returns {CreativeElement[]}
 */
export function detectElementsFromImageData(imageData, imageW, imageH) {
  const cols = 24;
  const rows = Math.max(16, Math.round(cols * (imageH / imageW)));
  const cellW = Math.ceil(imageW / cols);
  const cellH = Math.ceil(imageH / rows);
  const scores = new Array(cols * rows).fill(0);
  const skinScores = new Array(cols * rows).fill(0);
  const { data } = imageData;

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      let sum = 0;
      let sumSq = 0;
      let count = 0;
      let skinCount = 0;

      const startX = c * cellW;
      const startY = r * cellH;
      const endX = Math.min(imageW, startX + cellW);
      const endY = Math.min(imageH, startY + cellH);

      for (let y = startY; y < endY; y += 2) {
        for (let x = startX; x < endX; x += 2) {
          const idx = (y * imageW + x) * 4;
          const red = data[idx];
          const green = data[idx + 1];
          const blue = data[idx + 2];
          const lum = luminance(red, green, blue);
          sum += lum;
          sumSq += lum * lum;
          count += 1;
          if (isSkinTone(red, green, blue)) skinCount += 1;
        }
      }

      if (count > 0) {
        const mean = sum / count;
        const variance = Math.max(0, sumSq / count - mean * mean);
        scores[r * cols + c] = Math.sqrt(variance) + (mean > 180 || mean < 40 ? 8 : 0);
        skinScores[r * cols + c] = skinCount / count;
      }
    }
  }

  const threshold = percentile(scores.filter((v) => v > 0), 72);
  const regions = mergeGridRegions(scores, cols, rows, threshold);
  const elements = [];
  let index = 0;

  for (const cells of regions) {
    const classified = classifyRegion(cells, cols, imageW, imageH);
    if (!classified) continue;

    const minC = Math.min(...cells.map(([c]) => c));
    const maxC = Math.max(...cells.map(([c]) => c));
    const minR = Math.min(...cells.map(([, r]) => r));
    const maxR = Math.max(...cells.map(([, r]) => r));

    const x = minC * cellW;
    const y = minR * cellH;
    const width = (maxC - minC + 1) * cellW;
    const height = (maxR - minR + 1) * cellH;

    const avgSkin = average(cells.map(([c, r]) => skinScores[r * cols + c]));
    const type = classified.type === "face" && avgSkin < 0.08 ? "text" : classified.type;
    const label = type === "face" ? "Face / subject" : classified.label;

    elements.push({
      id: `heuristic-${index += 1}`,
      type,
      label,
      x,
      y,
      width,
      height,
      confidence: classified.confidence,
    });
  }

  return dedupeElements(elements);
}

/**
 * Merge API vision elements (normalized 0-1 coords) with heuristics.
 * @param {Array<{ type: string, label: string, x: number, y: number, width: number, height: number, confidence?: number }>} apiElements normalized
 * @param {number} imageW
 * @param {number} imageH
 */
export function normalizeApiElements(apiElements, imageW, imageH) {
  if (!Array.isArray(apiElements)) return [];
  return apiElements.map((el, index) => ({
    id: el.id || `vision-${index + 1}`,
    type: normalizeElementType(el.type),
    label: el.label || formatElementLabel(el.type),
    x: (el.x ?? 0) * imageW,
    y: (el.y ?? 0) * imageH,
    width: (el.width ?? 0) * imageW,
    height: (el.height ?? 0) * imageH,
    confidence: typeof el.confidence === "number" ? el.confidence : 0.75,
  }));
}

export function mergeElementDetections(primary, secondary) {
  const merged = [...primary];
  for (const candidate of secondary) {
    const duplicate = merged.some((existing) => iou(existing, candidate) > 0.45);
    if (!duplicate) merged.push(candidate);
  }
  return dedupeElements(merged);
}

function normalizeElementType(type) {
  const value = String(type || "").toLowerCase();
  if (value.includes("logo")) return "logo";
  if (value.includes("face") || value.includes("person")) return "face";
  if (value.includes("cta") || value.includes("button")) return "cta";
  return "text";
}

function formatElementLabel(type) {
  const value = normalizeElementType(type);
  if (value === "logo") return "Logo";
  if (value === "face") return "Face / subject";
  if (value === "cta") return "CTA button";
  return "Text block";
}

function iou(a, b) {
  const intersection = intersectRects(elementToRect(a), elementToRect(b));
  const union = rectArea(elementToRect(a)) + rectArea(elementToRect(b)) - rectArea(intersection);
  return union > 0 ? rectArea(intersection) / union : 0;
}

function dedupeElements(elements) {
  const sorted = [...elements].sort((a, b) => b.confidence - a.confidence);
  const kept = [];
  for (const element of sorted) {
    if (kept.some((existing) => iou(existing, element) > 0.5)) continue;
    kept.push(element);
  }
  return kept.slice(0, 12);
}

function percentile(values, pct) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.floor((pct / 100) * sorted.length));
  return sorted[index];
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function parseCreativeSize(size) {
  if (!size || typeof size !== "string") return null;
  const match = size.match(/(\d+)\s*[x×]\s*(\d+)/i);
  if (!match) return null;
  return { width: Number(match[1]), height: Number(match[2]) };
}
