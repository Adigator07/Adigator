/**
 * Reliable image dimension reading + IAB size normalization for creative validation.
 * Handles EXIF orientation and near-match snapping for native/display exports.
 */

export const SIZE_TOLERANCE_PX = 4;

/** Canonical sizes — kept in sync with creativeValidation.js matrices. */
const ALL_KNOWN_CREATIVE_SIZES = [
  // Google Ads
  "300x250", "336x280", "728x90", "970x90", "970x250", "160x600", "300x600",
  "468x60", "250x250", "200x200", "320x50", "320x100", "320x480", "480x320",
  "1200x628", "1200x1200", "1080x1080", "960x1200", "1200x1500",
  // Meta Ads
  "1080x1350", "1080x1920",
  // Programmatic extras
  "1080x1350",
];

const knownSizeSet = new Set(ALL_KNOWN_CREATIVE_SIZES);

/** All canonical sizes used across Google, Meta, and Programmatic matrices. */
export function getAllKnownCreativeSizes() {
  return [...knownSizeSet];
}

function withinTolerance(a, b, tolerance = SIZE_TOLERANCE_PX) {
  return Math.abs(a - b) <= tolerance;
}

/**
 * Map detected pixel dimensions to the nearest supported IAB/platform size.
 * Corrects small export drift (±few px) and swapped width/height from orientation.
 */
export function normalizeCreativeDimensions(width, height, options = {}) {
  const tolerance = options.tolerance ?? SIZE_TOLERANCE_PX;
  const known = knownSizeSet;
  const rawW = Math.max(1, Math.round(Number(width) || 0));
  const rawH = Math.max(1, Math.round(Number(height) || 0));
  const rawSize = `${rawW}x${rawH}`;

  if (known.has(rawSize)) {
    return {
      width: rawW,
      height: rawH,
      size: rawSize,
      detectedWidth: rawW,
      detectedHeight: rawH,
      normalized: false,
    };
  }

  const swappedSize = `${rawH}x${rawW}`;
  if (known.has(swappedSize)) {
    return {
      width: rawH,
      height: rawW,
      size: swappedSize,
      detectedWidth: rawW,
      detectedHeight: rawH,
      normalized: true,
      normalizationReason: "orientation_swap",
    };
  }

  let bestMatch = null;
  let bestDistance = Infinity;

  for (const candidate of known) {
    const [cw, ch] = candidate.split("x").map(Number);
    const directDistance = Math.abs(rawW - cw) + Math.abs(rawH - ch);
    const swapDistance = Math.abs(rawW - ch) + Math.abs(rawH - cw);

    if (withinTolerance(rawW, cw, tolerance) && withinTolerance(rawH, ch, tolerance)) {
      if (directDistance < bestDistance) {
        bestDistance = directDistance;
        bestMatch = {
          width: cw,
          height: ch,
          size: candidate,
          normalizationReason: "dimension_snap",
        };
      }
    }

    if (withinTolerance(rawW, ch, tolerance) && withinTolerance(rawH, cw, tolerance)) {
      if (swapDistance < bestDistance) {
        bestDistance = swapDistance;
        bestMatch = {
          width: ch,
          height: cw,
          size: candidate,
          normalizationReason: "orientation_snap",
        };
      }
    }
  }

  if (bestMatch) {
    return {
      ...bestMatch,
      detectedWidth: rawW,
      detectedHeight: rawH,
      normalized: true,
    };
  }

  return {
    width: rawW,
    height: rawH,
    size: rawSize,
    detectedWidth: rawW,
    detectedHeight: rawH,
    normalized: false,
  };
}

/** Read display-oriented dimensions from a File/Blob (respects EXIF orientation when supported). */
export async function readImageDimensionsFromBlob(blob) {
  if (!(blob instanceof Blob)) {
    throw new Error("Expected a Blob or File for dimension reading.");
  }

  let bitmap;
  try {
    bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
  } catch {
    bitmap = await createImageBitmap(blob);
  }

  try {
    return normalizeCreativeDimensions(bitmap.width, bitmap.height);
  } finally {
    if (typeof bitmap.close === "function") bitmap.close();
  }
}
