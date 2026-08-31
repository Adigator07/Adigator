import type {
  CampaignHealthIssue,
  CampaignHealthReport,
  CampaignHealthSnapshot,
  HealthIssueCategory,
  HealthSeverity,
} from "@/app/lib/campaignHealth/types";

const CATEGORIES: HealthIssueCategory[] = [
  "status",
  "budget",
  "conversions",
  "tracking",
  "ads",
  "policy",
  "landing_page",
  "settings",
];

function issue(
  id: string,
  category: HealthIssueCategory,
  severity: HealthSeverity,
  title: string,
  detail: string,
  recommendation: string,
  steps: string[],
): CampaignHealthIssue {
  return { id, category, severity, title, detail, recommendation, steps };
}

function gradeFromScore(score: number): CampaignHealthReport["grade"] {
  if (score >= 85) return "healthy";
  if (score >= 70) return "watch";
  if (score >= 50) return "at_risk";
  return "critical";
}

function hasReason(snapshot: CampaignHealthSnapshot, pattern: RegExp): boolean {
  return snapshot.primaryStatusReasons.some((reason) => pattern.test(reason));
}

export function evaluateCampaignHealth(
  snapshot: CampaignHealthSnapshot,
  monitorId = snapshot.campaignId,
): CampaignHealthReport {
  const issues: CampaignHealthIssue[] = [];
  let score = 100;
  const categoryScores = Object.fromEntries(CATEGORIES.map((key) => [key, 100])) as Record<HealthIssueCategory, number>;

  const deduct = (category: HealthIssueCategory, amount: number) => {
    score = Math.max(0, score - amount);
    categoryScores[category] = Math.max(0, categoryScores[category] - amount);
  };

  const status = String(snapshot.status || "").toUpperCase();
  const primary = String(snapshot.primaryStatus || "").toUpperCase();

  if (status === "PAUSED" || primary.includes("PAUSED")) {
    deduct("status", 18);
    issues.push(issue(
      "status-paused",
      "status",
      "high",
      "Campaign is paused",
      `${snapshot.campaignName} is not serving because it is paused.`,
      "Enable the campaign only after confirming budget, ads, and conversion tracking are healthy.",
      [
        "Open Google Ads and review why the campaign was paused.",
        "Confirm budget, ads, and conversion actions are valid.",
        "Enable the campaign during the intended flight dates.",
      ],
    ));
  }

  if (status === "REMOVED" || primary.includes("ENDED") || hasReason(snapshot, /ENDED|REMOVED/)) {
    deduct("status", 40);
    issues.push(issue(
      "status-ended",
      "status",
      "critical",
      "Campaign has ended or been removed",
      "This campaign is no longer eligible to serve impressions.",
      "Create a renewal campaign or extend end dates if the flight should continue.",
      [
        "Confirm the intended end date in Google Ads.",
        "If the campaign should still run, clone or renew it with a new date range.",
        "Re-select the live campaign in Adigator monitoring.",
      ],
    ));
  }

  if (hasReason(snapshot, /BUDGET_CONSTRAINED|BUDGET_EXHAUSTED|LIMITED_BY_BUDGET/) || primary.includes("LIMITED")) {
    deduct("budget", 22);
    issues.push(issue(
      "budget-constrained",
      "budget",
      "critical",
      "Budget is constraining delivery",
      "Google Ads reports this campaign is limited or exhausted by budget, so it may stop serving before the day or month ends.",
      "Increase the budget or redistribute spend so eligible auctions are not missed.",
      [
        "Check remaining daily or shared budget in Google Ads.",
        "Raise the budget or move budget from under-delivering campaigns.",
        "Watch the next health check to confirm LIMITED / BUDGET_CONSTRAINED clears.",
      ],
    ));
  }

  if (!snapshot.budgetAmountMicros || snapshot.budgetAmountMicros <= 0) {
    deduct("budget", 16);
    issues.push(issue(
      "budget-missing",
      "budget",
      "high",
      "No campaign budget is configured",
      "A missing budget prevents Google Ads from serving this campaign reliably.",
      "Assign an explicit daily or shared budget before monitoring for performance.",
      [
        "Open campaign settings and set a daily budget.",
        "If using a shared budget, confirm the shared budget still has funds.",
      ],
    ));
  }

  if (snapshot.costMicrosYesterday > 0 && snapshot.conversions7d > 0 && snapshot.conversionsYesterday === 0) {
    deduct("conversions", 24);
    issues.push(issue(
      "conversions-stopped",
      "conversions",
      "critical",
      "Conversions stopped while spend continued",
      `The campaign spent yesterday but recorded 0 conversions, after ${snapshot.conversions7d} conversions in the last 7 days.`,
      "Inspect conversion actions, tags, and landing-page tracking immediately.",
      [
        "Verify the conversion action is still enabled and receiving pings.",
        "Check Google tag / GTMs on the landing page.",
        "Compare yesterday’s landing-page errors in this report.",
      ],
    ));
  }

  if (snapshot.impressions7d > 200 && snapshot.conversions7d === 0 && snapshot.costMicros7d > 0) {
    deduct("conversions", 12);
    issues.push(issue(
      "conversions-none",
      "conversions",
      "medium",
      "No conversions in the last 7 days",
      "The campaign is delivering but has not recorded conversions this week.",
      "Confirm conversion tracking is firing and that the offer/landing page can convert.",
      [
        "Use Google Tag Assistant or Ads conversion diagnostics.",
        "Validate the landing page CTA and form.",
        "Pause low-intent placements if this is a conversion campaign.",
      ],
    ));
  }

  const tracking = String(snapshot.conversionTrackingStatus || "").toUpperCase();
  if (tracking && /NOT_CONVERSION_TRACKING|CONVERSION_TRACKING_UNSPECIFIED|UNKNOWN/.test(tracking)) {
    deduct("tracking", 18);
    issues.push(issue(
      "tracking-missing",
      "tracking",
      "high",
      "Conversion tracking is not fully configured",
      `Account conversion tracking status is ${snapshot.conversionTrackingStatus}.`,
      "Install a Google tag and import at least one conversion action used by this campaign.",
      [
        "In Google Ads, open Goals → Conversions.",
        "Create or import a primary conversion action.",
        "Confirm the tag fires on thank-you / purchase events.",
      ],
    ));
  }

  if (snapshot.enabledAdCount === 0) {
    deduct("ads", 20);
    issues.push(issue(
      "ads-none",
      "ads",
      "high",
      "No eligible ads are enabled",
      "The campaign has no enabled ads, so it cannot serve even if the campaign status is live.",
      "Enable at least one approved ad or asset group.",
      [
        "Review ad group / asset group statuses.",
        "Enable or recreate ads that are paused or removed.",
      ],
    ));
  }

  if (snapshot.disapprovedAdCount > 0) {
    deduct("ads", 20);
    deduct("policy", 18);
    issues.push(issue(
      "ads-disapproved",
      "policy",
      "critical",
      "Ads are disapproved",
      `${snapshot.disapprovedAdCount} ad(s) are disapproved and will not serve.`,
      "Fix policy issues or appeal disapprovals, then wait for Google review.",
      [
        "Open Ads in Google Ads and read the policy finding.",
        "Edit copy, images, or landing pages to comply.",
        "Resubmit and keep this campaign in Adigator monitoring until approvals return.",
      ],
    ));
  }

  if (snapshot.limitedAdCount > 0) {
    deduct("policy", 12);
    issues.push(issue(
      "ads-limited-policy",
      "policy",
      "high",
      "Ads are limited by policy",
      `${snapshot.limitedAdCount} ad(s) can serve only in restricted ways.`,
      "Update the creative or targeting so policy limits no longer suppress reach.",
      [
        "Review the policy limitation in Google Ads.",
        "Replace restricted claims, landing pages, or age targeting as required.",
      ],
    ));
  }

  if (hasReason(snapshot, /HAS_ADS_DISAPPROVED|HAS_ADS_LIMITED_BY_POLICY|MOST_ADS_UNDER_REVIEW/)) {
    if (!issues.some((item) => item.id.startsWith("ads-"))) {
      deduct("policy", 10);
      issues.push(issue(
        "policy-primary-status",
        "policy",
        "high",
        "Google Ads flagged ad policy or review status",
        `Primary status reasons: ${snapshot.primaryStatusReasons.join(", ") || snapshot.primaryStatus}.`,
        "Resolve policy or review blockers so eligible ads can serve at full strength.",
        ["Open the campaign’s Ads tab and clear each policy or review item."],
      ));
    }
  }

  if (snapshot.landingPageErrors.length > 0) {
    deduct("landing_page", 20);
    const first = snapshot.landingPageErrors[0];
    issues.push(issue(
      "landing-page-error",
      "landing_page",
      "critical",
      "Landing page error detected",
      `${first.url} failed validation (${first.error}). Broken destinations waste spend and can trigger policy issues.`,
      "Fix or replace the destination URL, then confirm the page loads without errors.",
      [
        `Open ${first.url} and confirm it loads.`,
        "Update final URLs on ads or asset groups.",
        "Re-run a health check in Adigator.",
      ],
    ));
  } else if (snapshot.landingUrls.length === 0 && snapshot.enabledAdCount > 0) {
    deduct("landing_page", 8);
    issues.push(issue(
      "landing-page-missing",
      "landing_page",
      "medium",
      "No landing URL was found on ads",
      "Adigator could not read a final URL from enabled ads.",
      "Set final URLs on ads or asset groups so clicks have a destination.",
      ["Add a final URL in Google Ads and sync again."],
    ));
  }

  if (hasReason(snapshot, /NO_AD_GROUPS|MISSING|MISCONFIGURED|BIDDING_STRATEGY/)) {
    deduct("settings", 10);
    issues.push(issue(
      "settings-misconfigured",
      "settings",
      "medium",
      "Campaign settings need attention",
      `Google Ads reported: ${snapshot.primaryStatusReasons.join(", ") || primary}.`,
      "Review bidding, ad groups, and required assets in Google Ads.",
      ["Open campaign settings and resolve the listed primary-status reason."],
    ));
  }

  const uniqueIssues = issues.filter((item, index) => issues.findIndex((candidate) => candidate.id === item.id) === index);
  const recommendations = uniqueIssues.slice(0, 5).map((item) => ({
    title: item.recommendation,
    detail: item.detail,
    steps: item.steps,
  }));

  if (!recommendations.length) {
    recommendations.push({
      title: "Keep monitoring this campaign",
      detail: "No blocking issues were detected on this check. Continue scheduled monitoring so budget, tracking, and policy changes are caught early.",
      steps: [
        "Leave this campaign selected for monitoring.",
        "Review alerts if spend or conversions change suddenly.",
      ],
    });
  }

  return {
    monitorId,
    score: Math.round(score),
    grade: gradeFromScore(score),
    categoryScores,
    issues: uniqueIssues,
    recommendations,
    snapshot,
  };
}

export function diffHealthIssues(previousIds: string[], nextIssues: CampaignHealthIssue[]) {
  const previous = new Set(previousIds);
  const nextIds = nextIssues.map((issue) => issue.id);
  const opened = nextIssues.filter((issue) => !previous.has(issue.id));
  const resolved = previousIds.filter((id) => !nextIds.includes(id));
  return { opened, resolved, nextIds };
}
