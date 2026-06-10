"use client";

/**
 * Shared helpers for platform preview studios.
 */

export function filterCreativesByVertical(creatives, selectedVertical) {
  if (!Array.isArray(creatives)) return [];
  if (!selectedVertical) return creatives;

  const filtered = creatives.filter(
    (creative) => !creative?.vertical
      || creative.vertical === selectedVertical
      || creative.vertical.toLowerCase() === selectedVertical.toLowerCase(),
  );

  // If AI returned a different vertical label, still show previews rather than an empty studio.
  return filtered.length > 0 ? filtered : creatives;
}

export function enrichCreativesWithUploadedImages(creatives, imageUrls = []) {
  if (!Array.isArray(creatives) || !creatives.length) return [];
  const urls = (imageUrls || []).filter(Boolean);
  if (!urls.length) return creatives;

  return creatives.map((creative, index) => ({
    ...creative,
    imageUrl: creative?.imageUrl || urls[index % urls.length],
  }));
}

export function parseSize(size) {
  if (!size) return null;
  const normalized = String(size).trim().toLowerCase();
  if (normalized === "9:16") return { width: 1080, height: 1920, label: "9:16" };
  if (normalized === "16:9") return { width: 1280, height: 720, label: "16:9" };
  if (normalized === "1:1") return { width: 1080, height: 1080, label: "1:1" };
  const [width, height] = normalized.split("x").map((value) => Number(value));
  if (!width || !height) return null;
  return { width, height, label: `${width}x${height}` };
}

export function getCreativeAspectRatio(creative) {
  const dims = parseSize(creative?.size);
  if (!dims) return "1 / 1";
  return `${dims.width} / ${dims.height}`;
}

export function isPortraitCreative(creative) {
  const dims = parseSize(creative?.size);
  if (!dims) return false;
  return dims.height / dims.width > 1.05;
}

export function isStoryCreative(creative) {
  const dims = parseSize(creative?.size);
  if (!dims) return creative?.type?.includes("story");
  return dims.height / dims.width >= 1.5;
}

/** Pick the ad slot closest to the creative's aspect ratio. */
export function pickBestAdSlot(creativeSize, slots) {
  const dims = parseSize(creativeSize);
  if (!dims || !slots?.length) return slots?.[0] || null;

  let best = slots[0];
  let bestScore = Infinity;
  const creativeRatio = dims.width / dims.height;

  for (const slot of slots) {
    const slotRatio = slot.width / slot.height;
    const score = Math.abs(Math.log(creativeRatio / slotRatio));
    if (score < bestScore) {
      bestScore = score;
      best = slot;
    }
  }
  return best;
}

export function dedupeTemplatesByEnvironment(creatives) {
  if (!Array.isArray(creatives)) return [];
  const seen = new Map();
  for (const creative of creatives) {
    const key = creative?.environment || creative?.type || creative?.id;
    if (!key || seen.has(key)) continue;
    seen.set(key, creative);
  }
  return Array.from(seen.values());
}

export function applySourceCreativeToTemplates(templates, sourceCreative) {
  if (!sourceCreative || !Array.isArray(templates)) return templates;
  const imageUrl = sourceCreative.url || sourceCreative.fullUrl || sourceCreative.imageUrl || "";
  const sourceCreativeSize = sourceCreative.sourceCreativeSize
    || (sourceCreative.sourceWidth && sourceCreative.sourceHeight
      ? `${sourceCreative.sourceWidth}x${sourceCreative.sourceHeight}`
      : "")
    || sourceCreative.size
    || sourceCreative.validation?.size
    || "";
  return templates.map((template) => ({
    ...template,
    imageUrl: imageUrl || template.imageUrl,
    pageName: template.pageName || sourceCreative.name || "Brand",
    sourceCreativeSize: sourceCreativeSize || template.size || "",
  }));
}

export async function fetchPreviewTemplates({
  platform,
  brandName,
  vertical,
  targetAudience,
  goal,
  tone,
  keyMessage,
  imageUrls = [],
  placement,
}) {
  const stripUrls = platform === "meta_ads" || platform === "google_ads";
  const safeUrls = (imageUrls || []).filter(Boolean);

  const response = await fetch("/api/preview-templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      platform,
      brandName,
      vertical,
      targetAudience,
      goal,
      tone,
      keyMessage,
      placement,
      imageUrls: stripUrls ? [] : safeUrls,
      imageCount: stripUrls ? safeUrls.length : undefined,
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error || "Failed to generate preview templates");
  }

  return payload.creatives || [];
}
