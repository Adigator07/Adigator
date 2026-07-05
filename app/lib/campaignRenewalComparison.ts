import type { ProgrammaticCampaignSnapshot } from "@/app/lib/programmaticCampaignStore";
import { getEntryPayload } from "@/app/lib/strategicPresentation";

export type RenewalConfigChange = {
  field: string;
  label: string;
  before: string;
  after: string;
};

export type CampaignRenewalReport = {
  configChanges: RenewalConfigChange[];
  creativeSummary: {
    previousCount: number;
    currentCount: number;
    added: string[];
    removed: string[];
    retained: string[];
  };
  analysisSummary: string;
  validationImpact: string;
  launchReadinessImpact: string;
};

type CreativeLike = {
  id?: string;
  name?: string;
  validation?: {
    status?: string;
    issues?: Array<{ message?: string }>;
  };
};

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\.[^.]+$/, "").replace(/[-_\s]+/g, "");
}

function issueCount(creatives: CreativeLike[]): number {
  return creatives.reduce((total, creative) => total + (creative.validation?.issues?.length || 0), 0);
}

function averageAlignmentScore(analysis: Array<Record<string, unknown>> | null | undefined): number | null {
  if (!Array.isArray(analysis) || analysis.length === 0) return null;
  const scores = analysis
    .map((entry) => getEntryPayload(entry)?.strategic_alignment_score)
    .filter((score): score is number => typeof score === "number");
  if (!scores.length) return null;
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function compareValue(before: string, after: string, field: string, label: string, changes: RenewalConfigChange[]) {
  if (before.trim() !== after.trim()) {
    changes.push({ field, label, before: before.trim() || "Not set", after: after.trim() || "Not set" });
  }
}

export function buildCampaignRenewalReport({
  referenceSnapshot,
  currentConfig,
  currentCreatives,
  currentAnalysis,
}: {
  referenceSnapshot: ProgrammaticCampaignSnapshot;
  currentConfig: {
    campaignName: string;
    campaignBrief: string;
    vertical: string;
    landingUrl: string;
    campaignGoal: string;
    programmaticAdGroupCount: number | "";
  };
  currentCreatives: CreativeLike[];
  currentAnalysis: Array<Record<string, unknown>> | null | undefined;
}): CampaignRenewalReport {
  const configChanges: RenewalConfigChange[] = [];
  compareValue(referenceSnapshot.campaignName, currentConfig.campaignName, "campaignName", "Campaign name", configChanges);
  compareValue(referenceSnapshot.campaignBrief, currentConfig.campaignBrief, "campaignBrief", "Campaign brief", configChanges);
  compareValue(referenceSnapshot.vertical, currentConfig.vertical, "vertical", "Vertical", configChanges);
  compareValue(referenceSnapshot.landingUrl, currentConfig.landingUrl, "landingUrl", "Landing page URL", configChanges);
  compareValue(referenceSnapshot.campaignGoal || "", currentConfig.campaignGoal || "", "campaignGoal", "Campaign objective", configChanges);

  if (String(referenceSnapshot.programmaticAdGroupCount || "") !== String(currentConfig.programmaticAdGroupCount || "")) {
    configChanges.push({
      field: "adGroupCount",
      label: "Ad group count",
      before: String(referenceSnapshot.programmaticAdGroupCount || "Not set"),
      after: String(currentConfig.programmaticAdGroupCount || "Not set"),
    });
  }

  const previousCreatives = (referenceSnapshot.creatives || []) as CreativeLike[];
  const previousNames = new Set(previousCreatives.map((creative) => normalizeName(String(creative.name || ""))));
  const currentNames = new Set(currentCreatives.map((creative) => normalizeName(String(creative.name || ""))));

  const added = currentCreatives
    .filter((creative) => !previousNames.has(normalizeName(String(creative.name || ""))))
    .map((creative) => creative.name || "Unnamed creative");
  const removed = previousCreatives
    .filter((creative) => !currentNames.has(normalizeName(String(creative.name || ""))))
    .map((creative) => creative.name || "Unnamed creative");
  const retained = currentCreatives
    .filter((creative) => previousNames.has(normalizeName(String(creative.name || ""))))
    .map((creative) => creative.name || "Unnamed creative");

  const previousIssues = issueCount(previousCreatives);
  const currentIssues = issueCount(currentCreatives);
  const previousScore = averageAlignmentScore(referenceSnapshot.analysisResult);
  const currentScore = averageAlignmentScore(currentAnalysis);

  let analysisSummary = "Fresh analysis will be compared against the previous campaign results after validation.";
  if (previousScore !== null && currentScore !== null) {
    if (currentScore > previousScore) {
      analysisSummary = `Average strategic alignment improved from ${previousScore}/100 to ${currentScore}/100.`;
    } else if (currentScore < previousScore) {
      analysisSummary = `Average strategic alignment decreased from ${previousScore}/100 to ${currentScore}/100.`;
    } else {
      analysisSummary = `Average strategic alignment remains at ${currentScore}/100 versus the previous campaign.`;
    }
  } else if (currentScore !== null) {
    analysisSummary = `Renewed campaign average strategic alignment: ${currentScore}/100.`;
  }

  let validationImpact = "Validation posture is comparable to the previous campaign.";
  if (currentIssues < previousIssues) {
    validationImpact = "Renewed creatives resolve validation issues from the previous campaign.";
  } else if (currentIssues > previousIssues) {
    validationImpact = "Renewed creatives introduce more validation issues than the previous campaign.";
  }

  let launchReadinessImpact = "Review updated campaign settings and creatives before launch.";
  if (configChanges.length === 0 && added.length === 0 && removed.length === 0 && currentIssues <= previousIssues) {
    launchReadinessImpact = "Campaign renewal maintains prior configuration with comparable launch readiness.";
  } else if (currentIssues < previousIssues && (currentScore === null || previousScore === null || currentScore >= previousScore)) {
    launchReadinessImpact = "Renewal changes are likely to improve launch readiness versus the previous campaign.";
  } else if (currentIssues > previousIssues || (currentScore !== null && previousScore !== null && currentScore < previousScore)) {
    launchReadinessImpact = "Renewal changes may reduce launch readiness until updated issues are addressed.";
  }

  return {
    configChanges,
    creativeSummary: {
      previousCount: previousCreatives.length,
      currentCount: currentCreatives.length,
      added,
      removed,
      retained,
    },
    analysisSummary,
    validationImpact,
    launchReadinessImpact,
  };
}
