const STRATEGIST_CONTRACT_FIELDS = [
  "main_strategic_problem",
  "why_audience_may_resist",
  "attention_analysis",
  "behavioral_response",
  "business_consequence",
  "expected_improvement",
  "strategic_recommendations",
  "strategic_alignment_score",
  "campaign_alignment",
  "goal_alignment",
  "vertical_alignment",
  "business_impact",
];

const REQUIRED_BEHAVIORAL_FIELDS = [
  "perceived_message",
  "emotional_state",
  "likely_objection",
  "trust_gap",
  "identity_alignment",
  "commitment_readiness",
  "resistance_trigger",
  "likely_behavior",
  "curiosity_vs_intent_balance",
  "risk_aversion",
  "confidence_building",
  "commitment_pressure",
];

const BEHAVIORAL_FALLBACKS = {
  perceived_message: "Perception analysis unavailable",
  emotional_state: "Emotional state analysis unavailable",
  likely_objection: "Objection modeling unavailable",
  trust_gap: "Trust gap analysis unavailable",
  identity_alignment: "Identity alignment analysis unavailable",
  commitment_readiness: "Commitment readiness analysis unavailable",
  resistance_trigger: "Resistance trigger analysis unavailable",
  likely_behavior: "Behavioral likelihood analysis unavailable",
  curiosity_vs_intent_balance: "Curiosity-intent balance analysis unavailable",
  risk_aversion: "Risk aversion analysis unavailable",
  confidence_building: "Confidence building pathway unavailable",
  commitment_pressure: "Commitment pressure analysis unavailable",
};

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

function hasAnyMeaningfulBehavioralField(behavioral) {
  if (!behavioral || typeof behavioral !== "object") return false;
  return REQUIRED_BEHAVIORAL_FIELDS.some((field) => hasText(behavioral[field]));
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

function buildBehavioralResponseWithFallback(payload) {
  const behavioral = payload?.behavioral_response;
  return REQUIRED_BEHAVIORAL_FIELDS.reduce((acc, field) => {
    acc[field] = hasText(behavioral?.[field]) ? behavioral[field] : BEHAVIORAL_FALLBACKS[field];
    return acc;
  }, {});
}

function isValidRecommendation(rec) {
  if (!rec || typeof rec !== "object") return false;
  const requiredCoreFields = [
    "issue",
    "recommended_change",
    "priority",
  ];

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
  const hasBehavioralReasoning = hasAnyMeaningfulBehavioralField(payload.behavioral_response);
  const hasAnyContractIntelligence = STRATEGIST_CONTRACT_FIELDS.some((field) =>
    isMeaningfulValue(payload[field])
  );

  return hasAnyContractIntelligence || hasMainProblem || hasBusinessConsequence || hasBehavioralReasoning;
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

export function getBehavioralResponse(payload) {
  return buildBehavioralResponseWithFallback(payload);
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

  if (vertical === "luxury" && score >= 70) {
    return "Strong Premium Positioning";
  }
  if (goal === "conversion" && score >= 70) {
    return "Strong Conversion Readiness";
  }
  if (goal === "awareness" && score >= 70) {
    return "Strong Awareness Alignment";
  }
  if (score >= 70) {
    return "Strong Campaign Alignment";
  }

  return "Needs Strategic Revision";
}

export function compareStrategicEntries(left, right) {
  const leftData = getEntryPayload(left) || {};
  const rightData = getEntryPayload(right) || {};

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
  const behavioral = getBehavioralResponse(data);
  const recommendations = getValidatedRecommendations(data);
  const campaignAlignment = getCampaignAlignment(data);

  return {
    mainStrategicProblem: data?.main_strategic_problem || "Strategic analysis incomplete",
    audienceResistance: data?.why_audience_may_resist || "Strategic analysis incomplete",
    businessConsequence: data?.business_consequence || "Strategic analysis incomplete",
    attentionAnalysis: data?.attention_analysis || null,
    behavioralResponse: behavioral,
    strategicRecommendations: recommendations,
    expectedImprovement: data?.expected_improvement || "Strategic analysis incomplete",
    strategicAlignmentSummary:
      data?.strategic_summary ||
      campaignAlignment.reasoning ||
      data?.strategic_alignment_score?.rationale ||
      "Strategic alignment summary unavailable",
  };
}
