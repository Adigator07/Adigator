/**
 * Detect when uploaded creatives are scaled, cropped, or letterboxed to fit template slots.
 */

import { parseSize } from "@/app/components/PreviewStudio/previewUtils";

const RATIO_TOLERANCE = 0.06;

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

export function analyzeCreativeSlotFit(sourceSize, slotWidth, slotHeight, fitMode = "cover") {
  const source = parseDimensions(sourceSize);
  const slotRatio = slotWidth / slotHeight;

  if (!source) {
    return {
      fitsPerfectly: false,
      requiresAdjustment: false,
      adjustmentType: "unknown",
      message: null,
      fitMode,
    };
  }

  const sourceRatio = source.width / source.height;
  const delta = ratioDelta(sourceRatio, slotRatio);
  const exactMatch = source.width === slotWidth && source.height === slotHeight;
  const ratioMatch = delta <= RATIO_TOLERANCE;

  if (exactMatch) {
    return {
      fitsPerfectly: true,
      requiresAdjustment: false,
      adjustmentType: "none",
      message: null,
      fitMode: "cover",
      source,
      slot: { width: slotWidth, height: slotHeight },
    };
  }

  if (ratioMatch) {
    return {
      fitsPerfectly: false,
      requiresAdjustment: true,
      adjustmentType: "scale",
      message: `Note: This creative has been automatically scaled to fit the ${slotWidth}×${slotHeight} template slot. Original size: ${source.label}.`,
      fitMode: "cover",
      source,
      slot: { width: slotWidth, height: slotHeight },
    };
  }

  if (fitMode === "contain") {
    return {
      fitsPerfectly: false,
      requiresAdjustment: true,
      adjustmentType: "letterbox",
      message: `Note: This creative has been letterboxed to preserve its aspect ratio within the ${slotWidth}×${slotHeight} template slot. Original size: ${source.label}.`,
      fitMode: "contain",
      source,
      slot: { width: slotWidth, height: slotHeight },
    };
  }

  return {
    fitsPerfectly: false,
    requiresAdjustment: true,
    adjustmentType: "crop",
    message: "Note: This creative has been automatically cropped and resized to fit the selected template due to aspect ratio or size differences.",
    detailMessage: `Original: ${source.label} → Template slot: ${slotWidth}×${slotHeight}.`,
    fitMode: "cover",
    source,
    slot: { width: slotWidth, height: slotHeight },
  };
}

export function analyzeAspectRatioFit(sourceSize, aspectRatio, fitMode = "cover") {
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
