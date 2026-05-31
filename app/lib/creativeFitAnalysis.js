/**
 * Detect when uploaded creatives are scaled, cropped, or letterboxed to fit template slots.
 */

import { parseSize } from "@/app/components/PreviewStudio/previewUtils";

const RATIO_TOLERANCE = 0.06;

/** Preview studios never crop user creatives — always preserve aspect ratio. */
export const PREVIEW_CREATIVE_FIT_MODE = "contain";

export function getCreativeSourceSize(creative) {
  return creative?.sourceCreativeSize
    || creative?.sourceSize
    || creative?.size
    || "";
}

export function parseDimensions(size) {
  return parseSize(size);
}

function ratioDelta(sourceRatio, slotRatio) {
  if (!sourceRatio || !slotRatio) return 1;
  return Math.abs(sourceRatio - slotRatio) / slotRatio;
}

export function analyzeCreativeSlotFit(
  sourceSize,
  slotWidth,
  slotHeight,
  fitMode = PREVIEW_CREATIVE_FIT_MODE,
) {
  const source = parseDimensions(sourceSize);
  const slotRatio = slotWidth / slotHeight;
  const effectiveFit = fitMode === "cover" ? PREVIEW_CREATIVE_FIT_MODE : fitMode;

  if (!source) {
    return {
      fitsPerfectly: false,
      requiresAdjustment: false,
      adjustmentType: "unknown",
      message: null,
      fitMode: effectiveFit,
    };
  }

  const sourceRatio = source.width / source.height;
  const delta = ratioDelta(sourceRatio, slotRatio);
  const exactMatch = source.width === slotWidth && source.height === slotHeight;
  const ratioMatch = delta <= RATIO_TOLERANCE;

  if (exactMatch || ratioMatch) {
    return {
      fitsPerfectly: exactMatch,
      requiresAdjustment: false,
      adjustmentType: "none",
      message: null,
      fitMode: effectiveFit,
      source,
      slot: { width: slotWidth, height: slotHeight },
    };
  }

  return {
    fitsPerfectly: false,
    requiresAdjustment: true,
    adjustmentType: "letterbox",
    message: `Creative displayed at original aspect ratio (${source.label}) within the ${slotWidth}×${slotHeight} placement frame.`,
    fitMode: effectiveFit,
    source,
    slot: { width: slotWidth, height: slotHeight },
  };
}

export function analyzeAspectRatioFit(
  sourceSize,
  aspectRatio,
  fitMode = PREVIEW_CREATIVE_FIT_MODE,
) {
  const parts = String(aspectRatio || "1 / 1")
    .split("/")
    .map((value) => Number(value.trim()));
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return analyzeCreativeSlotFit(sourceSize, 1080, 1080, fitMode);
  }

  const slotRatio = parts[0] / parts[1];
  const slotWidth = 1080;
  const slotHeight = Math.round(slotWidth / slotRatio);
  return analyzeCreativeSlotFit(sourceSize, slotWidth, slotHeight, fitMode);
}

export function mergeFitNotices(...notices) {
  const messages = notices
    .flatMap((notice) => {
      if (!notice?.requiresAdjustment) return [];
      return [notice.detailMessage ? `${notice.message} ${notice.detailMessage}` : notice.message];
    })
    .filter(Boolean);

  return [...new Set(messages)];
}

export function getFitNoticeMessage(fit) {
  if (!fit?.requiresAdjustment || !fit.message) return null;
  return fit.detailMessage ? `${fit.message} ${fit.detailMessage}` : fit.message;
}
