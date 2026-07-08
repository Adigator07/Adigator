import { stripUtmFromUrl } from "./utmManagement";

const URL_VALIDATION_STORAGE_KEY = "adigator_url_validation";

export { URL_VALIDATION_STORAGE_KEY };

export function readStoredUrlValidation() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(URL_VALIDATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeStoredUrlValidation(result) {
  if (typeof window === "undefined") return;
  if (!result) {
    localStorage.removeItem(URL_VALIDATION_STORAGE_KEY);
    return;
  }
  localStorage.setItem(URL_VALIDATION_STORAGE_KEY, JSON.stringify(result));
}

export function clearStoredUrlValidation() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(URL_VALIDATION_STORAGE_KEY);
}

/** Stable fingerprint of the creatives used for URL / analysis session binding. */
export function getCreativeValidationFingerprint(creatives) {
  if (!Array.isArray(creatives) || creatives.length === 0) return "";
  return creatives
    .map((creative) => `${creative.id}:${creative.contentHash || creative.size || ""}`)
    .sort()
    .join("|");
}

export function createSkippedUrlValidation() {
  return {
    status: "skipped",
    submitted_url: "",
    final_url: null,
    summary: "No landing page URL was provided.",
    reasons: [],
    suggestions: ["Add a landing page URL in Step 2 to validate destination alignment."],
    confidence: 0,
    source: "unavailable",
    checked_at: new Date().toISOString(),
  };
}

/**
 * Return URL validation only when it belongs to the current landing URL and creative set.
 * Prevents a previously validated URL from appearing after the field is cleared or creatives change.
 */
export function resolveActiveUrlValidation(landingUrl, urlValidation, creatives) {
  if (!urlValidation || typeof urlValidation !== "object") return null;

  const trimmedUrl = stripUtmFromUrl(String(landingUrl || "").trim());
  const submittedUrl = stripUtmFromUrl(String(urlValidation.submitted_url || "").trim());

  if (!trimmedUrl) {
    return null;
  }

  if (!submittedUrl || submittedUrl !== trimmedUrl) {
    return null;
  }

  const fingerprint = getCreativeValidationFingerprint(creatives);
  if (
    urlValidation.creative_fingerprint
    && fingerprint
    && urlValidation.creative_fingerprint !== fingerprint
  ) {
    return null;
  }

  return urlValidation;
}

async function blobToBase64(blob) {
  if (!blob) return "";
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      resolve(typeof result === "string" ? result : "");
    };
    reader.onerror = () => reject(reader.error || new Error("Failed to read creative blob"));
    reader.readAsDataURL(blob);
  });
}

/**
 * Run OpenAI-backed URL alignment validation for Step 2.
 * Results are persisted for display in Step 3 Overview only.
 */
export async function runUrlValidationRequest({
  url,
  platform,
  objective,
  vertical,
  campaignName,
  adType = "display",
  creatives,
  getCreativeBlob,
}) {
  const isVideoAd = adType === "video";
  const trimmedUrl = stripUtmFromUrl(String(url || "").trim());
  if (!trimmedUrl) {
    return {
      status: "skipped",
      submitted_url: "",
      final_url: null,
      summary: "No landing page URL was provided.",
      reasons: [],
      suggestions: ["Add a landing page URL in Step 2 to validate destination alignment."],
      confidence: 0,
      source: "unavailable",
      checked_at: new Date().toISOString(),
    };
  }

  // Keep well under the server's per-image limit (2.5M chars). Oversized images
  // (e.g. large banners or video source bytes) are dropped so validation still runs.
  const MAX_IMAGE_BASE64_CHARS = 2_000_000;
  const payloadCreatives = [];
  const sourceCreatives = Array.isArray(creatives) ? creatives.slice(0, 3) : [];

  for (const creative of sourceCreatives) {
    let imageBase64 = "";
    // For video ads, getCreativeBlob returns a lightweight poster frame (image) — safe to send.
    // Never send raw video bytes (guarded by the type check below) — they are far too large.
    if (typeof getCreativeBlob === "function" && (isVideoAd || creative?.mediaType !== "video")) {
      try {
        const blob = await getCreativeBlob(creative);
        if (blob && !String(blob.type || "").startsWith("video/")) {
          const encoded = await blobToBase64(blob);
          if (encoded && encoded.length <= MAX_IMAGE_BASE64_CHARS) {
            imageBase64 = encoded;
          }
        }
      } catch {
        // Continue without image for this creative.
      }
    }

    payloadCreatives.push({
      id: creative.id,
      name: creative.name,
      size: creative.size,
      mediaType: creative.mediaType,
      ...(imageBase64 ? { imageBase64 } : {}),
    });
  }

  const response = await fetch("/api/url-validation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: trimmedUrl,
      platform,
      objective,
      vertical,
      campaignName,
      adType,
      creatives: payloadCreatives,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "URL validation request failed.");
  }

  return data;
}
