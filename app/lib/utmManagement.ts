export const SUPPORTED_UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export type UtmParameterKey = (typeof SUPPORTED_UTM_KEYS)[number];
export type UtmParameters = Record<UtmParameterKey, string>;

export const REQUIRED_UTM_KEYS: UtmParameterKey[] = ["utm_source", "utm_medium", "utm_campaign"];

export function emptyUtmParameters(): UtmParameters {
  return {
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
    utm_content: "",
    utm_term: "",
  };
}

/** True for standard and custom tracking keys such as utm_source, utm_id, utm_custom. */
export function isUtmQueryKey(key: string): boolean {
  return /^utm_/i.test(String(key || "").trim());
}

function normalizeUrlInput(url: string): URL | null {
  if (!url?.trim()) return null;
  try {
    const normalized = url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`;
    return new URL(normalized);
  } catch {
    return null;
  }
}

function formatDestinationUrl(parsed: URL): string {
  parsed.search = parsed.searchParams.toString() ? `?${parsed.searchParams.toString()}` : "";
  return `${parsed.origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
}

function removeAllUtmParams(parsed: URL, utmParameters: UtmParameters): void {
  SUPPORTED_UTM_KEYS.forEach((key) => {
    const value = parsed.searchParams.get(key);
    if (value) utmParameters[key] = value;
  });

  [...parsed.searchParams.keys()]
    .filter((key) => isUtmQueryKey(key))
    .forEach((key) => parsed.searchParams.delete(key));
}

export function normalizeUtmParameters(input: Record<string, string> | null | undefined): UtmParameters {
  const base = emptyUtmParameters();
  if (!input) return base;
  SUPPORTED_UTM_KEYS.forEach((key) => {
    if (typeof input[key] === "string") {
      base[key] = input[key];
    }
  });
  return base;
}

export function normalizeTrackingValue(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_-]/g, "");
}

export function slugifyCampaignName(name: string): string {
  return normalizeTrackingValue(name);
}

export function parseUtmFromUrl(url: string): { destinationUrl: string; utmParameters: UtmParameters } {
  const utmParameters = emptyUtmParameters();
  if (!url?.trim()) {
    return { destinationUrl: "", utmParameters };
  }

  const parsed = normalizeUrlInput(url);
  if (!parsed) {
    return { destinationUrl: url.trim(), utmParameters };
  }

  removeAllUtmParams(parsed, utmParameters);
  return { destinationUrl: formatDestinationUrl(parsed), utmParameters };
}

/** Return the landing page URL without any utm_* query parameters. */
export function stripUtmFromUrl(url: string): string {
  return parseUtmFromUrl(url).destinationUrl;
}

export function buildTrackingUrl(destinationUrl: string, utmParameters: Record<string, string>): string {
  const trimmedDestination = destinationUrl.trim();
  if (!trimmedDestination) return "";

  try {
    const parsed = normalizeUrlInput(trimmedDestination);
    if (!parsed) return trimmedDestination;

    removeAllUtmParams(parsed, emptyUtmParameters());

    SUPPORTED_UTM_KEYS.forEach((key) => {
      const value = String(utmParameters[key] || "").trim();
      if (value) parsed.searchParams.set(key, value);
    });

    return parsed.toString();
  } catch {
    return trimmedDestination;
  }
}

export function getUtmDiff(
  before: UtmParameters,
  after: UtmParameters,
): Array<{ key: UtmParameterKey; label: string; before: string; after: string }> {
  const labels: Record<UtmParameterKey, string> = {
    utm_source: "UTM Source",
    utm_medium: "UTM Medium",
    utm_campaign: "UTM Campaign",
    utm_content: "UTM Content",
    utm_term: "UTM Term",
  };

  return SUPPORTED_UTM_KEYS
    .filter((key) => (before[key] || "").trim() !== (after[key] || "").trim())
    .map((key) => ({
      key,
      label: labels[key],
      before: before[key]?.trim() || "Not set",
      after: after[key]?.trim() || "Not set",
    }));
}
