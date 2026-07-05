import type { ValidationFlag } from "@/app/types/validation";
import type { ProgrammaticCampaignSnapshot } from "@/app/lib/programmaticCampaignStore";
import { validateUtmParams } from "@/app/lib/url/utmValidator";
import {
  REQUIRED_UTM_KEYS,
  SUPPORTED_UTM_KEYS,
  buildTrackingUrl,
  emptyUtmParameters,
  getUtmDiff,
  isUtmQueryKey,
  normalizeTrackingValue,
  normalizeUtmParameters,
  parseUtmFromUrl,
  slugifyCampaignName,
  type UtmParameters,
} from "@/app/lib/utmManagement";

const GOAL_MEDIUM_HINTS: Record<string, string[]> = {
  awareness: ["display", "banner", "programmatic", "cpm", "video"],
  consideration: ["video", "content", "native", "social", "display"],
  conversion: ["cpc", "paidsearch", "retargeting", "performance", "display"],
};

const PLATFORM_SOURCE_HINTS: Record<string, string[]> = {
  programmatic: ["programmatic", "dsp", "display", "adigator"],
  google_ads: ["google", "google_ads", "gdn"],
  meta_ads: ["facebook", "meta", "instagram"],
};

export type UrlUtmChange = {
  field: string;
  label: string;
  before: string;
  after: string;
};

export type UrlUtmValidationReport = {
  flags: ValidationFlag[];
  urlChanges: UrlUtmChange[];
  utmChanges: UrlUtmChange[];
  alignmentIssues: string[];
  missingTracking: string[];
  summary: string;
  launchReadinessImpact: string;
};

function detectDuplicateUtmKeys(url: string): string[] {
  if (!url?.trim()) return [];
  try {
    const normalized = url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`;
    const parsed = new URL(normalized);
    const seen = new Set<string>();
    const duplicates: string[] = [];
    parsed.searchParams.forEach((_, key) => {
      if (!isUtmQueryKey(key)) return;
      if (seen.has(key)) duplicates.push(key);
      seen.add(key);
    });
    return duplicates;
  } catch {
    return [];
  }
}

function valuesAlign(actual: string, expectedHints: string[]): boolean {
  const normalizedActual = normalizeTrackingValue(actual);
  if (!normalizedActual) return false;
  return expectedHints.some((hint) => {
    const normalizedHint = normalizeTrackingValue(hint);
    return normalizedActual === normalizedHint
      || normalizedActual.includes(normalizedHint)
      || normalizedHint.includes(normalizedActual);
  });
}

export function buildUrlUtmValidationReport({
  referenceSnapshot,
  destinationUrl,
  utmParameters,
  landingUrl,
  campaignName,
  platform,
  campaignGoal,
  urlValidationResult,
}: {
  referenceSnapshot: ProgrammaticCampaignSnapshot | null;
  destinationUrl: string;
  utmParameters: UtmParameters;
  landingUrl: string;
  campaignName: string;
  platform: string;
  campaignGoal: string;
  urlValidationResult?: Record<string, unknown> | null;
}): UrlUtmValidationReport {
  const flags: ValidationFlag[] = [];
  const alignmentIssues: string[] = [];
  const missingTracking: string[] = [];
  const trackingUrl = landingUrl.trim() || buildTrackingUrl(destinationUrl, utmParameters);

  if (!destinationUrl.trim()) {
    flags.push({
      id: "destination_missing",
      severity: "error",
      module: "url",
      platform: "all",
      message: "Destination URL is required.",
      recommendation: "Enter the base landing page URL before UTM parameters.",
    });
  } else {
    try {
      const normalized = destinationUrl.trim().startsWith("http")
        ? destinationUrl.trim()
        : `https://${destinationUrl.trim()}`;
      // eslint-disable-next-line no-new
      new URL(normalized);
      flags.push({
        id: "destination_format_ok",
        severity: "pass",
        module: "url",
        platform: "all",
        message: "Destination URL format is valid.",
      });
    } catch {
      flags.push({
        id: "destination_invalid",
        severity: "error",
        module: "url",
        platform: "all",
        message: "Destination URL format is invalid.",
        recommendation: "Use a valid absolute URL including protocol (https://).",
      });
    }
  }

  REQUIRED_UTM_KEYS.forEach((key) => {
    if (!utmParameters[key]?.trim()) {
      missingTracking.push(key);
    }
  });

  if (missingTracking.length > 0) {
    flags.push({
      id: "utm_required_missing",
      severity: "error",
      module: "url",
      platform: "all",
      message: `Missing required UTM parameters: ${missingTracking.join(", ")}.`,
      recommendation: "Add all required UTM fields before launch.",
    });
  }

  SUPPORTED_UTM_KEYS.forEach((key) => {
    const value = utmParameters[key]?.trim();
    if (!value) return;
    if (/\s/.test(value)) {
      flags.push({
        id: `utm_space_${key}`,
        severity: "warning",
        module: "url",
        platform: "all",
        message: `${key} contains spaces.`,
        recommendation: "Use underscores or hyphens instead of spaces.",
      });
    }
    if (/[A-Z]/.test(value)) {
      flags.push({
        id: `utm_case_${key}`,
        severity: "warning",
        module: "url",
        platform: "all",
        message: `${key} uses mixed case.`,
        recommendation: "Use lowercase UTM values for consistent reporting.",
      });
    }
  });

  const duplicateKeys = detectDuplicateUtmKeys(trackingUrl);
  if (duplicateKeys.length > 0) {
    flags.push({
      id: "utm_duplicate_keys",
      severity: "error",
      module: "url",
      platform: "all",
      message: `Duplicate UTM parameters detected: ${duplicateKeys.join(", ")}.`,
      recommendation: "Remove duplicate tracking parameters from the final URL.",
    });
  }

  flags.push(...validateUtmParams(trackingUrl));

  const expectedCampaign = slugifyCampaignName(campaignName);
  const actualCampaign = normalizeTrackingValue(utmParameters.utm_campaign || "");
  if (expectedCampaign && actualCampaign && expectedCampaign !== actualCampaign) {
    alignmentIssues.push(`Campaign name "${campaignName}" does not align with utm_campaign "${utmParameters.utm_campaign}".`);
    flags.push({
      id: "utm_campaign_mismatch",
      severity: "warning",
      module: "alignment",
      platform: "all",
      message: `utm_campaign "${utmParameters.utm_campaign}" may not match campaign name "${campaignName}".`,
      recommendation: `Consider aligning utm_campaign with "${expectedCampaign}".`,
    });
  }

  const sourceHints = PLATFORM_SOURCE_HINTS[platform] || PLATFORM_SOURCE_HINTS.programmatic;
  if (utmParameters.utm_source?.trim() && !valuesAlign(utmParameters.utm_source, sourceHints)) {
    alignmentIssues.push(`utm_source "${utmParameters.utm_source}" may not align with platform "${platform}".`);
    flags.push({
      id: "utm_source_mismatch",
      severity: "warning",
      module: "alignment",
      platform: "all",
      message: `utm_source "${utmParameters.utm_source}" may not match platform expectations.`,
      recommendation: `Expected values similar to: ${sourceHints.join(", ")}.`,
    });
  }

  const mediumHints = GOAL_MEDIUM_HINTS[campaignGoal] || GOAL_MEDIUM_HINTS.awareness;
  if (utmParameters.utm_medium?.trim() && !valuesAlign(utmParameters.utm_medium, mediumHints)) {
    alignmentIssues.push(`utm_medium "${utmParameters.utm_medium}" may not align with campaign objective "${campaignGoal}".`);
    flags.push({
      id: "utm_medium_mismatch",
      severity: "warning",
      module: "alignment",
      platform: "all",
      message: `utm_medium "${utmParameters.utm_medium}" may not match campaign objective "${campaignGoal}".`,
      recommendation: `Expected values similar to: ${mediumHints.join(", ")}.`,
    });
  }

  const urlStatus = String(urlValidationResult?.status || "");
  if (urlValidationResult && urlStatus === "failed") {
    flags.push({
      id: "url_accessibility_failed",
      severity: "error",
      module: "url",
      platform: "all",
      message: "Landing page URL failed accessibility checks.",
      recommendation: "Verify the destination URL is live and returns a successful response.",
    });
  } else if (urlValidationResult && (urlStatus === "ok" || urlStatus === "passed" || urlStatus === "success")) {
    flags.push({
      id: "url_accessibility_ok",
      severity: "pass",
      module: "url",
      platform: "all",
      message: "Landing page URL is accessible.",
    });
  }

  const referenceParsed = referenceSnapshot?.landingUrl
    ? parseUtmFromUrl(referenceSnapshot.landingUrl)
    : { destinationUrl: referenceSnapshot?.destinationUrl || "", utmParameters: emptyUtmParameters() };
  const referenceUtms = normalizeUtmParameters(
    referenceSnapshot?.utmParameters || referenceParsed.utmParameters,
  );

  const urlChanges: UrlUtmChange[] = [];
  const previousDestination = referenceParsed.destinationUrl || referenceSnapshot?.destinationUrl || "";
  const previousLanding = referenceSnapshot?.landingUrl || "";
  if (previousDestination.trim() !== destinationUrl.trim()) {
    urlChanges.push({
      field: "destinationUrl",
      label: "Destination URL",
      before: previousDestination.trim() || "Not set",
      after: destinationUrl.trim() || "Not set",
    });
  }
  if (previousLanding.trim() !== trackingUrl.trim()) {
    urlChanges.push({
      field: "landingUrl",
      label: "Tracking URL",
      before: previousLanding.trim() || "Not set",
      after: trackingUrl.trim() || "Not set",
    });
  }

  const utmChanges = getUtmDiff(referenceUtms, utmParameters).map((change) => ({
    field: change.key,
    label: change.label,
    before: change.before,
    after: change.after,
  }));

  const errorCount = flags.filter((flag) => flag.severity === "error").length;
  const warningCount = flags.filter((flag) => flag.severity === "warning").length;

  let summary = "URL and UTM configuration is ready for launch.";
  if (errorCount > 0) {
    summary = `${errorCount} blocking URL/UTM issue(s) and ${warningCount} warning(s) detected.`;
  } else if (warningCount > 0 || alignmentIssues.length > 0) {
    summary = `URL and UTM validation passed with ${warningCount} warning(s) and ${alignmentIssues.length} alignment note(s).`;
  } else if (urlChanges.length > 0 || utmChanges.length > 0) {
    summary = `Updated ${urlChanges.length} URL field(s) and ${utmChanges.length} UTM parameter(s) versus the previous campaign.`;
  }

  let launchReadinessImpact = "Tracking setup appears launch-ready.";
  if (errorCount > 0) {
    launchReadinessImpact = "Resolve blocking URL/UTM issues before launch to avoid attribution gaps.";
  } else if (missingTracking.length > 0) {
    launchReadinessImpact = "Required UTM fields are incomplete and may break campaign attribution.";
  } else if (alignmentIssues.length > 0) {
    launchReadinessImpact = "Tracking parameters work but may misalign reporting with campaign setup.";
  }

  return {
    flags,
    urlChanges,
    utmChanges,
    alignmentIssues,
    missingTracking,
    summary,
    launchReadinessImpact,
  };
}
