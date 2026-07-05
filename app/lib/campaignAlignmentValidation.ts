import { evaluateBriefSettingsAlignment } from "@/app/lib/campaignBriefValidation";
import { getBriefAlignment, getEntryPayload } from "@/app/lib/strategicPresentation";

export type AlignmentStatusKey = "aligned" | "partial" | "misaligned";

export type AlignmentScoreBlock = {
  score: number;
  status: AlignmentStatusKey;
  label: string;
  reason: string;
  recommendations: string[];
};

export type CampaignAlignmentReport = {
  campaignBriefAlignment: AlignmentScoreBlock;
  creativeMessagingAlignment: AlignmentScoreBlock;
  landingPageAlignment: AlignmentScoreBlock;
  overall: AlignmentScoreBlock;
  generatedAt: string;
  sourceFingerprint: string;
};

const STATUS_LABELS: Record<AlignmentStatusKey, string> = {
  aligned: "Aligned",
  partial: "Partial Alignment",
  misaligned: "Misaligned",
};

function scoreToStatus(score: number): AlignmentStatusKey {
  if (score >= 80) return "aligned";
  if (score >= 55) return "partial";
  return "misaligned";
}

function average(nums: number[]): number {
  if (!nums.length) return 0;
  return Math.round(nums.reduce((sum, value) => sum + value, 0) / nums.length);
}

function buildBlock(
  score: number,
  reason: string,
  recommendations: string[],
  label: string,
): AlignmentScoreBlock {
  const clamped = Math.max(0, Math.min(100, score));
  return {
    score: clamped,
    status: scoreToStatus(clamped),
    label,
    reason,
    recommendations: recommendations.filter(Boolean).slice(0, 4),
  };
}

export function buildCampaignAlignmentFingerprint(params: {
  campaignBrief: string;
  campaignIntent?: string;
  campaignGoal?: string;
  campaignVertical?: string;
  landingUrl?: string;
  analysisCount?: number;
  urlCheckedAt?: string;
}): string {
  return [
    params.campaignBrief.trim(),
    params.campaignIntent?.trim() || "",
    params.campaignGoal || "",
    params.campaignVertical || "",
    params.landingUrl?.trim() || "",
    params.analysisCount || 0,
    params.urlCheckedAt || "",
  ].join("|");
}

export function computeCampaignAlignmentReport(params: {
  campaignBrief: string;
  campaignIntent?: string;
  campaignGoal: string;
  campaignVertical: string;
  platform: "google_ads" | "meta_ads" | "programmatic";
  analysisEntries: Record<string, unknown>[];
  urlValidation?: Record<string, unknown> | null;
}): CampaignAlignmentReport | null {
  const brief = params.campaignBrief?.trim();
  if (!brief) return null;

  const entries = Array.isArray(params.analysisEntries) ? params.analysisEntries : [];
  const briefAlignments = entries
    .map((entry) => getBriefAlignment(getEntryPayload(entry) || {}))
    .filter((item) => item?.brief_provided);

  const settings = evaluateBriefSettingsAlignment({
    brief,
    selectedGoal: params.campaignGoal || "awareness",
    selectedVertical: params.campaignVertical || "technology",
    platform: params.platform,
  });

  const briefScores: number[] = [];
  const briefRecs: string[] = [];
  let briefReason = "Campaign brief is active and guides validation.";

  if (settings.goal_settings_check.is_aligned === false) {
    briefScores.push(45);
    briefReason = settings.goal_settings_check.explanation;
    briefRecs.push("Align the campaign goal in Step 1 with the objective described in the brief.");
  } else if (settings.goal_settings_check.is_aligned === true) {
    briefScores.push(92);
  } else {
    briefScores.push(70);
  }

  if (settings.vertical_settings_check.is_aligned === false) {
    briefScores.push(45);
    briefReason = settings.vertical_settings_check.explanation;
    briefRecs.push("Update the selected vertical or revise the brief so category language matches.");
  } else if (settings.vertical_settings_check.is_aligned === true) {
    briefScores.push(90);
  } else {
    briefScores.push(68);
  }

  for (const ba of briefAlignments) {
    if (typeof ba.alignment_score === "number") {
      briefScores.push(ba.alignment_score);
    } else if (ba.creative_matches_brief === true) {
      briefScores.push(88);
    } else if (ba.creative_matches_brief === false) {
      briefScores.push(42);
      briefReason = ba.summary || "Creative messaging does not fully support the campaign brief.";
    }
    briefRecs.push(...(ba.recommendations || []));
  }

  const campaignBriefAlignment = buildBlock(
    average(briefScores.length ? briefScores : [75]),
    briefReason,
    briefRecs,
    "Campaign Brief Alignment",
  );

  const creativeScores: number[] = [];
  const creativeRecs: string[] = [];
  let creativeReason = "Creative messaging aligns with the campaign brief and objective.";

  for (const entry of entries) {
    const payload = getEntryPayload(entry) || {};
    const ba = getBriefAlignment(payload);
    const vertical = payload.vertical_alignment as Record<string, unknown> | undefined;
    const goal = payload.goal_alignment as Record<string, unknown> | undefined;
    const signals = payload.extraction_signals as Record<string, unknown> | undefined;

    if (ba?.brief_provided) {
      if (ba.creative_matches_brief === true) creativeScores.push(90);
      else if (ba.creative_matches_brief === false) {
        creativeScores.push(38);
        creativeReason = ba.summary || "Creative visuals or copy diverge from the brief.";
        for (const item of ba.misaligned_elements || []) {
          if (item && typeof item === "object" && "element" in item) {
            creativeRecs.push(`Resolve ${String((item as { element: string }).element)} mismatch between brief and creative.`);
          }
        }
      } else if (typeof ba.alignment_score === "number") {
        creativeScores.push(ba.alignment_score);
      }

      if (ba.missing_from_creative?.length) {
        creativeRecs.push(`Add missing brief elements to the creative: ${ba.missing_from_creative.slice(0, 2).join(", ")}.`);
      }
    }

    if (vertical?.is_aligned === false) {
      creativeScores.push(40);
      creativeReason = String(vertical.reason || vertical.recommendation || creativeReason);
      creativeRecs.push(String(vertical.recommendation || "Adjust creative category cues to match the selected vertical."));
    } else if (vertical?.is_aligned === true) {
      creativeScores.push(88);
    }

    if (goal?.is_aligned === false) {
      creativeScores.push(45);
      creativeReason = String(goal.reason || goal.enrichedReason || creativeReason);
      creativeRecs.push("Align CTA tone and urgency with the campaign goal stated in the brief.");
    } else if (goal?.is_aligned === true) {
      creativeScores.push(86);
    }

    if (signals?.cta && params.campaignGoal === "conversion" && !String(signals.cta).trim()) {
      creativeScores.push(50);
      creativeRecs.push("Strengthen the creative CTA to support conversion objectives.");
    }
  }

  const creativeMessagingAlignment = buildBlock(
    average(creativeScores.length ? creativeScores : [72]),
    creativeReason,
    creativeRecs,
    "Creative Messaging Alignment",
  );

  const urlVal = params.urlValidation;
  let landingScore = 72;
  let landingReason = "Landing page validation has not been run yet.";
  const landingRecs: string[] = [];

  if (urlVal) {
    const status = String(urlVal.status || "").toLowerCase();
    const confidence = typeof urlVal.confidence === "number" ? urlVal.confidence : null;

    if (status === "aligned" || status === "ok" || status === "passed" || status === "success") {
      landingScore = confidence ?? 88;
      landingReason = String(urlVal.summary || "Landing page content supports the campaign brief and creative offer.");
    } else if (status === "skipped" || status === "pending") {
      landingScore = 65;
      landingReason = "Landing page was not validated — run URL validation in Step 2 or Step 3.";
      landingRecs.push("Validate the landing page URL to confirm offer and CTA alignment.");
    } else {
      landingScore = confidence ?? 42;
      landingReason = String(
        urlVal.misalignment_reason || urlVal.summary || "Landing page content does not match the campaign brief or creative.",
      );
      landingRecs.push(...(Array.isArray(urlVal.suggestions) ? urlVal.suggestions : []));
    }

    if (urlVal.page_about && brief && !String(urlVal.page_about).toLowerCase().includes(brief.slice(0, 12).toLowerCase())) {
      landingRecs.push("Ensure landing page headlines reference the same product or offer as the campaign brief.");
    }
  } else {
    landingRecs.push("Add and validate a landing page URL to complete brief ↔ landing page alignment.");
  }

  const landingPageAlignment = buildBlock(
    landingScore,
    landingReason,
    landingRecs,
    "Landing Page Alignment",
  );

  const overallScore = Math.round(
    campaignBriefAlignment.score * 0.3
    + creativeMessagingAlignment.score * 0.4
    + landingPageAlignment.score * 0.3,
  );

  const overallReason = overallScore >= 80
    ? "Campaign brief, creative messaging, and landing page tell a consistent story."
    : overallScore >= 55
      ? "Some alignment gaps remain between the brief, creatives, and landing page."
      : "Critical misalignment detected across brief, creative, and/or landing page.";

  const overallRecs = [
    ...campaignBriefAlignment.recommendations,
    ...creativeMessagingAlignment.recommendations,
    ...landingPageAlignment.recommendations,
  ].filter((item, index, list) => list.indexOf(item) === index).slice(0, 5);

  const fingerprint = buildCampaignAlignmentFingerprint({
    campaignBrief: brief,
    campaignIntent: params.campaignIntent,
    campaignGoal: params.campaignGoal,
    campaignVertical: params.campaignVertical,
    landingUrl: String(urlVal?.submitted_url || ""),
    analysisCount: entries.length,
    urlCheckedAt: String(urlVal?.checked_at || ""),
  });

  return {
    campaignBriefAlignment,
    creativeMessagingAlignment,
    landingPageAlignment,
    overall: buildBlock(overallScore, overallReason, overallRecs, "Overall Campaign Alignment"),
    generatedAt: new Date().toISOString(),
    sourceFingerprint: fingerprint,
  };
}

export function alignmentStatusColor(status: AlignmentStatusKey): string {
  switch (status) {
    case "aligned":
      return "emerald";
    case "partial":
      return "amber";
    default:
      return "red";
  }
}

export { STATUS_LABELS as ALIGNMENT_STATUS_LABELS };
