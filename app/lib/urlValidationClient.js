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

  const trimmedUrl = String(landingUrl || "").trim();
  const submittedUrl = String(urlValidation.submitted_url || "").trim();

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
  creatives,
  getCreativeBlob,
}) {
  const trimmedUrl = String(url || "").trim();
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

  const payloadCreatives = [];
  const sourceCreatives = Array.isArray(creatives) ? creatives.slice(0, 3) : [];

  for (const creative of sourceCreatives) {
    let imageBase64 = "";
    if (typeof getCreativeBlob === "function") {
      try {
        const blob = await getCreativeBlob(creative);
        if (blob) {
          imageBase64 = await blobToBase64(blob);
        }
      } catch {
        // Continue without image for this creative.
      }
    }

    payloadCreatives.push({
      id: creative.id,
      name: creative.name,
      size: creative.size,
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
      creatives: payloadCreatives,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "URL validation request failed.");
  }

  return data;
}
