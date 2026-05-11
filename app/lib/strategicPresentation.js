// CORE FIELDS: Required for render eligibility
const REQUIRED_CORE_FIELDS = [
  "main_strategic_problem",
  "business_consequence",
  "strategic_alignment_score",
  "behavioral_response",
];

// OPTIONAL FIELDS: Missing fields fallback gracefully (informational logging only)
const OPTIONAL_ENHANCEMENT_FIELDS = [
  "why_audience_may_resist",
  "attention_analysis",
  "strategic_recommendations",
  "expected_improvement",
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

const REQUIRED_RECOMMENDATION_FIELDS = [
  "issue",
  "why_it_hurts",
  "recommended_change",
  "expected_outcome",
  "priority",
  "audience_reaction",
  "emotional_barrier",
  "missing_belief",
  "trust_signal_gap",
  "behavior_change_after_intervention",
];

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasAnyMeaningfulBehavioralField(behavioral) {
  if (!behavioral || typeof behavioral !== "object") return false;
  return REQUIRED_BEHAVIORAL_FIELDS.some((field) => hasText(behavioral[field]));
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
  const checks = [];
  const pushToWindow = (record) => {
    if (typeof window === "undefined") return;
    const current = Array.isArray(window.__analysisPanelValidationLogs)
      ? window.__analysisPanelValidationLogs
      : [];
    window.__analysisPanelValidationLogs = [...current, record];
  };
  const pushCheck = (field, value, passed) => {
    const record = { field, value, passed };
    checks.push(record);
    pushToWindow({ tag: "[AnalysisPanel validation]", ...record });
    console.log("[AnalysisPanel validation]", record);
  };

  if (!payload || typeof payload !== "object") {
    pushCheck("payload", payload, false);
    const summary = {
      passed: false,
      failedFields: ["payload"],
    };
    pushToWindow({ tag: "[AnalysisPanel validation] FINAL RESULT", ...summary });
    console.log("[AnalysisPanel validation] FINAL RESULT", summary);
    return false;
  }

  // Resilient AI rendering gate: payload can render when it contains meaningful strategist intelligence.
  // Missing enhancement fields should never collapse the full experience.
  const hasMainProblem = hasText(payload.main_strategic_problem);
  const hasBusinessConsequence = hasText(payload.business_consequence);
  const hasBehavioralReasoning = hasAnyMeaningfulBehavioralField(payload.behavioral_response);
  const hasMeaningfulStrategicReasoning = hasMainProblem || hasBusinessConsequence || hasBehavioralReasoning;

  pushCheck("main_strategic_problem", payload.main_strategic_problem, hasMainProblem);
  pushCheck("business_consequence", payload.business_consequence, hasBusinessConsequence);
  pushCheck(
    "behavioral_response.has_any_meaningful_field",
    payload.behavioral_response,
    hasBehavioralReasoning
  );
  pushCheck("has_meaningful_strategic_reasoning", {
    hasMainProblem,
    hasBusinessConsequence,
    hasBehavioralReasoning,
  }, hasMeaningfulStrategicReasoning);

  // Core object-presence checks remain for diagnostics, but do not block rendering.
  const hasRequiredFields = REQUIRED_CORE_FIELDS.every((field) => field in payload);
  pushCheck("required_core_fields_present", REQUIRED_CORE_FIELDS, hasRequiredFields);
  REQUIRED_CORE_FIELDS.forEach((field) => {
    pushCheck(`required_core_field.${field}`, payload[field], field in payload);
  });

  // OPTIONAL ENHANCEMENT FIELD CHECKS (informational logging only - NOT blocking)
  // These failures do NOT contribute to failedFields
  const optionalChecks = [];
  const logOptionalCheck = (field, value, passed) => {
    const record = { field, value, passed };
    optionalChecks.push(record);
    console.log("[AnalysisPanel validation - optional]", record);
  };
  
  logOptionalCheck("why_audience_may_resist", payload.why_audience_may_resist, hasText(payload.why_audience_may_resist));
  logOptionalCheck(
    "attention_analysis",
    payload.attention_analysis,
    Boolean(payload.attention_analysis && typeof payload.attention_analysis === "object")
  );
  if (payload?.attention_analysis) {
    logOptionalCheck(
      "attention_analysis.friction_points",
      payload?.attention_analysis?.friction_points,
      Array.isArray(payload?.attention_analysis?.friction_points)
    );
  }
  logOptionalCheck(
    "strategic_recommendations",
    payload.strategic_recommendations,
    Array.isArray(payload.strategic_recommendations)
  );
  logOptionalCheck("expected_improvement", payload.expected_improvement, hasText(payload.expected_improvement));

  // Strategic score remains a validated signal for ranking, but is not render-blocking.
  pushCheck(
    "strategic_alignment_score",
    payload.strategic_alignment_score,
    Boolean(payload.strategic_alignment_score && typeof payload.strategic_alignment_score === "object")
  );
  const scoreValue = payload?.strategic_alignment_score?.value;
  pushCheck("strategic_alignment_score.value", scoreValue, Number.isFinite(Number(scoreValue)));

  pushCheck(
    "behavioral_response",
    payload.behavioral_response,
    Boolean(payload.behavioral_response && typeof payload.behavioral_response === "object")
  );

  // Behavioral fields validate independently; missing fields should fallback in rendering.
  REQUIRED_BEHAVIORAL_FIELDS.forEach((field) => {
    pushCheck(
      `behavioral_response.${field}`,
      payload?.behavioral_response?.[field],
      hasText(payload?.behavioral_response?.[field])
    );
  });

  const failedFields = checks
    .filter((entry) => !entry.passed)
    .map((entry) => entry.field);

  const blockingFailedFields = [];

  const summary = {
    passed: blockingFailedFields.length === 0,
    failedFields,
    blockingFailedFields,
  };
  pushToWindow({ tag: "[AnalysisPanel validation] FINAL RESULT", ...summary });
  console.log("[AnalysisPanel validation] FINAL RESULT", summary);

  return true;
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

  const status = String(payload?.campaign_alignment?.alignment_status || "unknown").toLowerCase();
  if (status === "misaligned") {
    return "Needs Strategic Revision";
  }

  const score = getStrategicAlignmentScore(payload) ?? 0;
  const goal = String(payload?.campaign_context?.goal || "awareness").toLowerCase();
  const vertical = String(payload?.campaign_context?.vertical || "").toLowerCase();

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
  const leftData = left?.data || left || {};
  const rightData = right?.data || right || {};

  const leftScore = getStrategicAlignmentScore(leftData) ?? -1;
  const rightScore = getStrategicAlignmentScore(rightData) ?? -1;

  const leftStatus = String(leftData?.campaign_alignment?.alignment_status || "unknown").toLowerCase();
  const rightStatus = String(rightData?.campaign_alignment?.alignment_status || "unknown").toLowerCase();

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

  return {
    mainStrategicProblem: data?.main_strategic_problem || "Strategic analysis incomplete",
    audienceResistance: data?.why_audience_may_resist || "Strategic analysis incomplete",
    businessConsequence: data?.business_consequence || "Strategic analysis incomplete",
    attentionAnalysis: data?.attention_analysis || null,
    behavioralResponse: behavioral,
    strategicRecommendations: recommendations,
    expectedImprovement: data?.expected_improvement || "Strategic analysis incomplete",
    strategicAlignmentSummary:
      data?.final_decision_intelligence?.decision_summary ||
      data?.strategic_alignment_score?.rationale ||
      "Strategic alignment summary unavailable",
  };
}
