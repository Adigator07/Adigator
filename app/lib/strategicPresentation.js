const STRATEGIST_CONTRACT_FIELDS = [
  "main_strategic_problem",
  "attention_analysis",
  "business_consequence",
  "expected_improvement",
  "strategic_recommendations",
  "strategic_alignment_score",
  "campaign_alignment",
  "goal_alignment",
  "vertical_alignment",
  "business_impact",
  "adigator_analysis",
];

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isMeaningfulValue(value) {
  if (hasText(value)) return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return false;
}

function missingContractFields(payload) {
  return STRATEGIST_CONTRACT_FIELDS.filter((field) => !isMeaningfulValue(payload?.[field]));
}

function warnMissingFields(payload, context = "strategic payload") {
  if (process.env.NODE_ENV === "production") return;
  const missingFields = missingContractFields(payload);
  if (missingFields.length === 0) return;
  console.warn(`[strategic contract] Missing fields in ${context}:`, missingFields);
}

function isValidRecommendation(rec) {
  if (!rec || typeof rec !== "object") return false;
  const requiredCoreFields = ["issue", "recommended_change", "priority"];

  return requiredCoreFields.every((field) => {
    if (field === "priority") return ["HIGH", "MEDIUM", "LOW"].includes(rec[field]);
    return hasText(rec[field]);
  });
}

export function isValidStrategicPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  warnMissingFields(payload, "analysis entry");

  const hasMainProblem = hasText(payload.main_strategic_problem);
  const hasBusinessConsequence = hasText(payload.business_consequence);
  const hasAdigatorBlock = payload.adigator_analysis && typeof payload.adigator_analysis === "object";
  const hasAnyContractIntelligence = STRATEGIST_CONTRACT_FIELDS.some((field) =>
    isMeaningfulValue(payload[field])
  );

  return hasAnyContractIntelligence || hasMainProblem || hasBusinessConsequence || hasAdigatorBlock;
}

export function getEntryPayload(entry) {
  if (!entry || typeof entry !== "object") return null;
  return entry.data && typeof entry.data === "object" ? entry.data : entry;
}

export function getCampaignAlignment(payload) {
  const alignment = payload?.campaign_alignment;
  if (alignment && typeof alignment === "object") return alignment;
  return {
    alignment_status: "unknown",
    strategic_conflict: "",
    reasoning: "",
    severity: "low",
  };
}

export function getBusinessImpact(payload) {
  const businessImpact = payload?.business_impact;
  if (businessImpact && typeof businessImpact === "object") return businessImpact;
  return {
    affected_metrics: [],
  };
}

export function getValidatedRecommendations(payload) {
  if (!Array.isArray(payload?.strategic_recommendations)) return [];
  return payload.strategic_recommendations.filter((rec) => isValidRecommendation(rec));
}

export function getStrategicAlignmentScore(payload) {
  const score = Number(payload?.strategic_alignment_score?.value);
  if (!Number.isFinite(score)) return null;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getStrategicRankLabel(payload) {
  if (!isValidStrategicPayload(payload)) {
    return "Needs Strategic Revision";
  }

  const alignment = getCampaignAlignment(payload);
  const status = String(alignment.alignment_status || "unknown").toLowerCase();
  if (status === "misaligned") {
    return "Needs Strategic Revision";
  }

  const score = getStrategicAlignmentScore(payload) ?? 0;
  const goal = String(payload?.goal_alignment?.selected_goal || "awareness").toLowerCase();
  const vertical = String(payload?.vertical_alignment?.selected_vertical || "").toLowerCase();

  if (vertical === "luxury" && score >= 70) return "Strong Premium Positioning";
  if (goal === "conversion" && score >= 70) return "Strong Conversion Readiness";
  if (goal === "awareness" && score >= 70) return "Strong Awareness Alignment";
  if (score >= 70) return "Strong Campaign Alignment";

  return "Needs Strategic Revision";
}

export function compareStrategicEntries(left, right) {
  const leftData = getEntryPayload(left) || {};
  const rightData = getEntryPayload(right) || {};

  const leftGoalAligned = leftData?.goal_alignment?.is_aligned === true;
  const rightGoalAligned = rightData?.goal_alignment?.is_aligned === true;
  const leftVerticalAligned = leftData?.vertical_alignment?.is_aligned === true;
  const rightVerticalAligned = rightData?.vertical_alignment?.is_aligned === true;

  const alignmentTier = (goalAligned, verticalAligned) => {
    if (goalAligned && verticalAligned) return 3;
    if (goalAligned || verticalAligned) return 2;
    return 1;
  };

  const leftTier = alignmentTier(leftGoalAligned, leftVerticalAligned);
  const rightTier = alignmentTier(rightGoalAligned, rightVerticalAligned);

  if (rightTier !== leftTier) return rightTier - leftTier;

  const leftScore = getStrategicAlignmentScore(leftData) ?? -1;
  const rightScore = getStrategicAlignmentScore(rightData) ?? -1;

  const leftStatus = String(getCampaignAlignment(leftData).alignment_status || "unknown").toLowerCase();
  const rightStatus = String(getCampaignAlignment(rightData).alignment_status || "unknown").toLowerCase();

  const statusWeight = {
    aligned: 3,
    partially_aligned: 2,
    unknown: 1,
    misaligned: 0,
  };

  const leftWeight = statusWeight[leftStatus] ?? 1;
  const rightWeight = statusWeight[rightStatus] ?? 1;

  if (rightWeight !== leftWeight) return rightWeight - leftWeight;
  if (rightScore !== leftScore) return rightScore - leftScore;

  return 0;
}

export function getGoalAlignment(payload) {
  const ga = payload?.goal_alignment;
  if (ga && typeof ga === "object") return ga;
  return { is_aligned: null, selected_goal: null, detected_goal: null, reason: "" };
}

export function getVerticalAlignment(payload) {
  const va = payload?.vertical_alignment;
  if (va && typeof va === "object") return va;
  return { is_aligned: null, selected_vertical: null, detected_vertical: null, reason: "", evidence: [], fit_score: null };
}

/** Resolve vertical alignment into aligned / review / misaligned for UI. */
export function resolveVerticalAlignmentStatus(verticalAlignment) {
  const va = verticalAlignment || {};
  const selected = va.selected_vertical;
  const detected = va.detected_vertical;
  const fitScore = typeof va.fit_score === "number" ? va.fit_score : null;
  const detectedDiffers = detected && detected !== "unknown" && selected && detected !== selected;

  if (va.is_aligned === true) {
    return { key: "aligned", label: "Aligned", emoji: "🟢", tone: "emerald" };
  }

  if (va.is_aligned === false || detectedDiffers) {
    if (detectedDiffers && fitScore !== null && fitScore >= 45 && fitScore < 70) {
      return { key: "review", label: "Needs Review", emoji: "🟡", tone: "amber" };
    }
    return { key: "misaligned", label: "Misaligned", emoji: "🔴", tone: "red" };
  }

  if (fitScore !== null) {
    if (fitScore >= 70) {
      return { key: "aligned", label: "Aligned", emoji: "🟢", tone: "emerald" };
    }
    if (fitScore >= 45) {
      return { key: "review", label: "Needs Review", emoji: "🟡", tone: "amber" };
    }
    return { key: "misaligned", label: "Misaligned", emoji: "🔴", tone: "red" };
  }

  return { key: "review", label: "Needs Review", emoji: "🟡", tone: "amber" };
}

export function getExtractionSignals(payload) {
  const signals = payload?.extraction_signals;
  if (!signals || typeof signals !== "object") return null;
  return signals;
}

export function getAdigatorAnalysis(payload) {
  const analysis = payload?.adigator_analysis;
  if (!analysis || typeof analysis !== "object") return null;
  return analysis;
}

export function getCreativeStatusLabel(payload) {
  if (!isValidStrategicPayload(payload)) return "Needs Revision";

  const alignment = getCampaignAlignment(payload);
  const status = String(alignment.alignment_status || "unknown").toLowerCase();

  const goalIsAligned = payload?.goal_alignment?.is_aligned;
  const verticalIsAligned = payload?.vertical_alignment?.is_aligned;

  if (status === "misaligned" || goalIsAligned === false || verticalIsAligned === false) {
    return "Misaligned";
  }
  if (status === "partially_aligned") return "Needs Review";

  const score = getStrategicAlignmentScore(payload) ?? 0;
  if (score >= 70) return "Aligned / Launch Ready";
  if (score >= 45) return "Needs Review";
  return "Misaligned";
}

export function getStrategicRecommendationText(recommendation) {
  if (!recommendation || typeof recommendation !== "object") {
    return "Strategic recommendation unavailable";
  }

  return (
    recommendation.recommended_change ||
    recommendation.action ||
    recommendation.tactical_change ||
    recommendation.issue ||
    "Strategic recommendation unavailable"
  );
}

export function getStrategicFlow(data) {
  const recommendations = getValidatedRecommendations(data);
  const campaignAlignment = getCampaignAlignment(data);
  const adigator = getAdigatorAnalysis(data) || {};

  return {
    mainStrategicProblem: data?.main_strategic_problem || adigator?.main_risk || "Strategic analysis incomplete",
    campaignFit: adigator?.campaign_fit || campaignAlignment.reasoning || "Campaign fit summary unavailable",
    inventoryFit: adigator?.inventory_fit || "Inventory fit summary unavailable",
    businessConsequence: data?.business_consequence || "Strategic analysis incomplete",
    attentionAnalysis: data?.attention_analysis || null,
    strategicRecommendations: recommendations,
    expectedImprovement: data?.expected_improvement || "Strategic analysis incomplete",
    strategicAlignmentSummary:
      data?.strategic_summary ||
      adigator?.formatted_output ||
      campaignAlignment.reasoning ||
      data?.strategic_alignment_score?.rationale ||
      "Strategic alignment summary unavailable",
  };
}
