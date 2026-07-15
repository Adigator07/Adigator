/**
 * Persist campaign readiness reports so Step 2 survives refresh / back navigation.
 */

const READINESS_STORAGE_KEY = "adigator_campaign_readiness";

export function readStoredReadinessReport() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(READINESS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeStoredReadinessReport(report) {
  if (typeof window === "undefined") return;
  if (!report) {
    localStorage.removeItem(READINESS_STORAGE_KEY);
    return;
  }
  try {
    localStorage.setItem(READINESS_STORAGE_KEY, JSON.stringify(report));
  } catch {
    // Ignore quota errors; readiness can be re-run.
  }
}

export function clearStoredReadinessReport() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(READINESS_STORAGE_KEY);
}

export function readinessMatchesSession(report, { url, fingerprint, platform, objective } = {}) {
  if (!report || typeof report !== "object") return false;
  const meta = report._session || {};
  if (platform && meta.platform && meta.platform !== platform) return false;
  if (objective && meta.objective && meta.objective !== objective) return false;
  if (fingerprint && meta.creativeFingerprint && meta.creativeFingerprint !== fingerprint) return false;
  if (url) {
    const storedUrl = String(meta.url || "").trim().toLowerCase();
    const currentUrl = String(url || "").trim().toLowerCase();
    if (storedUrl && currentUrl && storedUrl !== currentUrl) return false;
  }
  return true;
}

export function withReadinessSession(report, session) {
  if (!report || typeof report !== "object") return report;
  return {
    ...report,
    _session: {
      url: session?.url || "",
      creativeFingerprint: session?.creativeFingerprint || "",
      platform: session?.platform || "",
      objective: session?.objective || "",
      savedAt: new Date().toISOString(),
    },
  };
}
