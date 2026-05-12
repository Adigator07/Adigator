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

export function getExtractionSignals(payload) {
  const signals = payload?.extraction_signals;
  if (!signals || typeof signals !== "object") return null;
  return signals;
}

export function getCreativeStatusLabel(payload) {
  if (!isValidStrategicPayload(payload)) return "Needs Revision";

  const alignment = getCampaignAlignment(payload);
  const status = String(alignment.alignment_status || "unknown").toLowerCase();

  const goalIsAligned = payload?.goal_alignment?.is_aligned;
  const verticalIsAligned = payload?.vertical_alignment?.is_aligned;

  if (status === "misaligned" || goalIsAligned === false) return "Misaligned";
  if (status === "partially_aligned" || verticalIsAligned === false) return "Moderate Risk";

  const score = getStrategicAlignmentScore(payload) ?? 0;
  if (score >= 70) return "Strong Alignment";
  if (score >= 45) return "Moderate Risk";
  return "Needs Revision";
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

export function generateAudiencePsychology({
  headline = "",
  cta = "",
  visualDescription = "",
  stage = "awareness",
  vertical = "unknown",
}) {
  const stageKey = String(stage || "").toLowerCase();
  const verticalKey = String(vertical || "").toLowerCase();

  // Vertical-specific psychological profiles
  const verticalProfiles = {
    food: {
      emotionalDriver: "appetite and impulse gratification",
      earlyStageDisposition: "curious but uncommitted",
      midStageDisposition: "craving-driven but skeptical about quality",
      lateStageDisposition: "ready to order if friction is removed",
      objectionPattern: "Is this actually good/worth it?",
      ctaReadinessFactor: 0.6,
    },
    automotive: {
      emotionalDriver: "identity, aspiration, and ownership pride",
      earlyStageDisposition: "aspirational but evaluating",
      midStageDisposition: "interested but comparing alternatives",
      lateStageDisposition: "ready to commit if value is proven",
      objectionPattern: "Will this really match my lifestyle/budget?",
      ctaReadinessFactor: 0.5,
    },
    fashion: {
      emotionalDriver: "self-expression and social validation",
      earlyStageDisposition: "visually attracted but hesitant",
      midStageDisposition: "wants it but doubts fit/style alignment",
      lateStageDisposition: "ready to buy if confidence is confirmed",
      objectionPattern: "Will I actually feel good wearing this?",
      ctaReadinessFactor: 0.65,
    },
    saas: {
      emotionalDriver: "clarity, credibility, and workflow efficiency",
      earlyStageDisposition: "intrigued but needs proof",
      midStageDisposition: "evaluating against competitors",
      lateStageDisposition: "ready to try if risk is minimized",
      objectionPattern: "Is this actually better than what I use now?",
      ctaReadinessFactor: 0.4,
    },
    finance: {
      emotionalDriver: "security, certainty, and trust",
      earlyStageDisposition: "cautious and information-seeking",
      midStageDisposition: "risk-evaluating before commitment",
      lateStageDisposition: "ready to act if certainty is guaranteed",
      objectionPattern: "Can I trust this with my money?",
      ctaReadinessFactor: 0.35,
    },
    education: {
      emotionalDriver: "future outcome and career lift",
      earlyStageDisposition: "aspirational but uncertain about value",
      midStageDisposition: "evaluating outcome quality and fit",
      lateStageDisposition: "ready to enroll if success is credible",
      objectionPattern: "Will this actually improve my career?",
      ctaReadinessFactor: 0.45,
    },
    ecommerce: {
      emotionalDriver: "value, convenience, and transaction momentum",
      earlyStageDisposition: "browsing and comparing value",
      midStageDisposition: "deciding between options",
      lateStageDisposition: "ready to purchase if friction is gone",
      objectionPattern: "Is this worth the price and hassle?",
      ctaReadinessFactor: 0.75,
    },
  };

  const profile = verticalProfiles[verticalKey] || {
    emotionalDriver: "relevance and category fit",
    earlyStageDisposition: "curious and exploring",
    midStageDisposition: "evaluating fit and value",
    lateStageDisposition: "ready to commit if confidence is high",
    objectionPattern: "Is this right for me?",
    ctaReadinessFactor: 0.5,
  };

  // Determine stage disposition
  let stageDisposition = profile.earlyStageDisposition;
  let ctaExpectation = "informational only";
  if (stageKey === "consideration" || stageKey === "mid") {
    stageDisposition = profile.midStageDisposition;
    ctaExpectation = "educational or low-friction next step";
  } else if (stageKey === "conversion" || stageKey === "late") {
    stageDisposition = profile.lateStageDisposition;
    ctaExpectation = "transactional or commitment-level action";
  }

  // Analyze CTA pressure
  const aggressiveCtas = [
    "buy now",
    "shop now",
    "order now",
    "apply now",
    "sign up now",
    "claim now",
    "book now",
    "download now",
    "get started",
    "limited time",
  ];
  const isAggressiveCta = aggressiveCtas.some((aggressive) =>
    cta.toLowerCase().includes(aggressive)
  );

  // Generate Likely Behavior
  let likelyBehavior = "";
  if (stageKey === "awareness") {
    if (isAggressiveCta) {
      likelyBehavior = `At awareness stage, users encountering this creative are in a ${profile.emotionalDriver} mindset but feeling pressured by an early CTA. They will likely pause the ad, close it, or scroll past without exploring further because ${stageDisposition.toLowerCase()}. The aggressive ask arrives before the creative can establish why the message matters to them.`;
    } else {
      likelyBehavior = `At awareness stage, users encountering this creative are in a ${profile.emotionalDriver} mindset and ${stageDisposition.toLowerCase()}. If the headline and visual clearly signal relevance, they will pause to evaluate. Most will remain browsing without clicking, unless a specific objection is preemptively answered in the copy itself.`;
    }
  } else if (stageKey === "consideration" || stageKey === "mid") {
    likelyBehavior = `At consideration stage, users are ${stageDisposition.toLowerCase()} and their attention will focus on whether this creative reduces the decision friction. They will mentally compare the offer against alternatives and their existing solutions. If the CTA demands action without resolving their primary doubt, they will abandon the creative and revisit during a later research cycle.`;
  } else {
    likelyBehavior = `At conversion stage, users are ${stageDisposition.toLowerCase()} and the CTA lands in the moment when they are most ready to act. They will commit if the creative removes the last objection between intention and transaction. Hesitation at this stage means they leave and rarely return.`;
  }

  // Add stage tag
  const behaviorTag =
    stageKey === "consideration"
      ? "Consideration → intent gap"
      : stageKey === "conversion"
        ? "Conversion-ready → friction point"
        : "Awareness → consideration bridge";

  // Generate Commitment Pressure
  let commitmentPressure = "";
  const ctaPressureMatch = isAggressiveCta && stageKey === "awareness" ? "too high" : "aligned";

  if (isAggressiveCta && stageKey === "awareness") {
    commitmentPressure = `The CTA "${cta}" demands transaction-level action, but the headline "${headline}" and visual only establish awareness-stage context. The user has not yet internalized why this matters, creating a psychological mismatch. The gap between curiosity and commitment will cause abandonment before any consideration happens.`;
  } else if (isAggressiveCta && (stageKey === "consideration" || stageKey === "mid")) {
    commitmentPressure = `The CTA "${cta}" is well-timed for consideration stage, but the headline "${headline}" does not yet disarm the user's primary objection about ${profile.objectionPattern.toLowerCase()}. The CTA will convert only if the visual or supporting copy sufficiently bridges the trust gap; otherwise, it feels premature.`;
  } else if (!isAggressiveCta && stageKey === "conversion") {
    commitmentPressure = `The CTA "${cta}" is too soft for conversion stage. Users at this funnel moment are ready for a transaction-level ask, but the headline "${headline}" and gentle framing suggest a softer next step. Users may interpret this as indecision or lack of confidence, dampening conversion momentum.`;
  } else {
    commitmentPressure = `The CTA "${cta}" and headline "${headline}" are aligned in intensity and stage appropriateness. The psychological pressure matches the user's readiness, though success depends on whether the visual adequately reinforces the message.`;
  }

  // Add pressure tag
  const pressureTag =
    isAggressiveCta && stageKey === "awareness"
      ? "Too early — CTA fires before desire peaks"
      : !isAggressiveCta && stageKey === "conversion"
        ? "Too late — conversion moment under-activated"
        : "Aligned to stage";

  // Generate Likely Objection
  let likelyObjection = "";
  const objectionInnerMonologue = profile.objectionPattern;

  let whichElementFails = "";
  if (
    !headline.toLowerCase().includes("proof") &&
    !headline.toLowerCase().includes("guarantee") &&
    !headline.toLowerCase().includes("trust")
  ) {
    whichElementFails = "the headline does not preempt doubt";
  } else if (!visualDescription) {
    whichElementFails = "the visual lacks credibility cues";
  } else {
    whichElementFails = "the supporting copy remains vague about the answer";
  }

  let consequence = "";
  if (stageKey === "awareness") {
    consequence =
      "they will scroll past and move to a competitor ad that addresses their silent question immediately.";
  } else if (stageKey === "consideration" || stageKey === "mid") {
    consequence =
      "they will add the product to a consideration list but will not return to convert until another touchpoint answers the question.";
  } else {
    consequence =
      "they will abandon the purchase mid-transaction and the conversion is lost entirely.";
  }

  likelyObjection = `The user's internal monologue is: "${objectionInnerMonologue}" In this creative, ${whichElementFails}, leaving the objection unanswered. Without explicit resolution, ${consequence}`;

  // Add objection tag
  const objectionTag = "Unanswered trigger question";

  return {
    likelyBehavior: `${likelyBehavior} (${behaviorTag})`,
    commitmentPressure: `${commitmentPressure} (${pressureTag})`,
    likelyObjection: `${likelyObjection} (${objectionTag})`,
  };
}
