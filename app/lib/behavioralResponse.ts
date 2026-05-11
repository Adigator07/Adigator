export type SignalLevel = "low" | "moderate" | "high";
export type CtaPressure = "soft" | "moderate" | "aggressive";
export type CampaignGoal = "awareness" | "consideration" | "conversion";
export type AlignmentStatus = "aligned" | "partially_aligned" | "misaligned";
export type Severity = "low" | "medium" | "high";

export interface BehavioralResponseInputs {
  goal: CampaignGoal;
  vertical: string;
  ctaPressure: CtaPressure;
  urgencyLevel: SignalLevel;
  extraction: {
    headline: string;
    cta: string;
    primary_message: string;
    visual_elements: string[];
    emotional_cues: string[];
    brand_presence: SignalLevel;
    readability: SignalLevel;
    text_density: SignalLevel;
    trust_markers: string[];
    urgency_signals: string[];
    audience_clues: string[];
  };
  psychology: {
    emotional_trigger: string;
    persuasion_style: string;
    psychological_conflict: string;
    trust_signal_strength: string;
    urgency_fit: string;
    audience_resistance: string;
  };
  audienceResponse: {
    likely_perception: string;
    emotional_reaction: string;
    motivation_match: string;
    resistance_reason: string;
    engagement_barrier: string;
  };
  attention: {
    first_focus: string;
    attention_path: string;
    friction_points: string[];
    cta_visibility: string;
    mobile_attention_risk: string;
    attention_retention_risk: string;
  };
  alignment: {
    alignment_status: AlignmentStatus;
    strategic_conflict: string;
    reasoning: string;
    severity: Severity;
  };
}

export interface BehavioralResponse {
  perceived_message: string;
  emotional_state: string;
  likely_objection: string;
  trust_gap: string;
  identity_alignment: string;
  commitment_readiness: string;
  resistance_trigger: string;
  likely_behavior: string;
  curiosity_vs_intent_balance: string;
  risk_aversion: string;
  confidence_building: string;
  commitment_pressure: string;
}

function hasPremiumLanguage(text: string): boolean {
  return /premium|exclusive|luxury|crafted|heritage|signature|refined|elevated/.test(text);
}

function hasDiscountLanguage(text: string): boolean {
  return /discount|save|offer|% off|deal|sale|promo|cheap|limited-time/.test(text);
}

function getIdentityNeed(vertical: string): string {
  switch (vertical) {
    case "luxury":
      return "premium self-association";
    case "finance":
      return "security and control";
    case "healthcare":
      return "safety and reassurance";
    case "travel":
      return "escape and aspiration";
    case "saas":
      return "competence and efficiency";
    case "ecommerce":
      return "value and convenience";
    case "gaming":
      return "status and excitement";
    case "education":
      return "capability and progress";
    case "sports":
      return "performance and momentum";
    default:
      return "practical relevance";
  }
}

function getCuriosityIntentBalance(goal: CampaignGoal, ctaPressure: CtaPressure, urgencyLevel: SignalLevel): string {
  if (goal === "awareness") {
    if (ctaPressure === "aggressive" || urgencyLevel === "high") {
      return "Intent-heavy and likely too early for cold discovery traffic.";
    }

    return "Curiosity-led and appropriate for early-stage evaluation.";
  }

  if (goal === "consideration") {
    if (ctaPressure === "soft") {
      return "Curiosity is slightly over-prioritized, which may underfeed evaluation momentum.";
    }

    return "Balanced between curiosity and intent, with enough pressure to move evaluation forward.";
  }

  if (ctaPressure === "soft") {
    return "Curiosity is too dominant for a conversion-stage audience that already expects a clear next step.";
  }

  return "Intent-led and appropriate for audiences who are already close to decision.";
}

function getCommitmentPressureText(ctaPressure: CtaPressure, urgencyLevel: SignalLevel, goal: CampaignGoal): string {
  if (goal === "awareness" && (ctaPressure === "aggressive" || urgencyLevel === "high")) {
    return "High commitment pressure is being introduced before the audience has enough confidence to absorb it.";
  }

  if (goal === "conversion" && ctaPressure === "soft") {
    return "Commitment pressure is too low to match the audience's likely readiness to act.";
  }

  if (ctaPressure === "moderate") {
    return "Commitment pressure is calibrated enough to invite action without overwhelming the audience.";
  }

  return "Commitment pressure is light, which preserves exploration but may delay decisive action.";
}

function getTrustGap(trustSignalStrength: string, extractionTrustMarkers: string[]): string {
  const strength = trustSignalStrength.toLowerCase();
  if (strength.includes("weak")) {
    return "The ad asks for action before it has established enough proof, familiarity, or certainty.";
  }

  if (strength.includes("partial")) {
    return extractionTrustMarkers.length > 0
      ? "Some proof is visible, but it is not yet strong enough to fully lower skepticism or risk aversion."
      : "The creative signals credibility in tone, but it does not yet anchor that credibility in concrete proof.";
  }

  return "The trust gap is small; hesitation is more likely to come from timing than from credibility.";
}

function getIdentityAlignment(vertical: string, psychologyText: string, audienceText: string): string {
  const identityNeed = getIdentityNeed(vertical);
  if (vertical === "luxury" && hasDiscountLanguage(psychologyText + " " + audienceText)) {
    return "Identity-misaligned: the message leans on price pressure instead of premium self-association.";
  }

  if (hasPremiumLanguage(psychologyText + " " + audienceText)) {
    return `Identity-aligned: the creative supports ${identityNeed} and lets the audience feel like the right kind of buyer.`;
  }

  return `Identity-fit is functional rather than expressive; the audience can see relevance, but not a strong self-image payoff tied to ${identityNeed}.`;
}

function getEmotionalState(goal: CampaignGoal, ctaPressure: CtaPressure, urgencyLevel: SignalLevel, psychologyTrigger: string, trustGap: string): string {
  const trigger = psychologyTrigger && psychologyTrigger !== "neutral" ? psychologyTrigger : "caution";

  if (goal === "awareness" && (ctaPressure === "aggressive" || urgencyLevel === "high")) {
    return `The audience is likely curious but guarded: the message creates tension before trust and relevance have settled.`;
  }

  if (trustGap.toLowerCase().includes("proof") || trustGap.toLowerCase().includes("certainty")) {
    return `The audience is likely cautious and evaluative, with ${trigger} present but filtered through skepticism.`;
  }

  if (ctaPressure === "aggressive") {
    return `The audience is likely alert and action-aware, but the pressure may feel like a request rather than an invitation.`;
  }

  return `The audience is likely ${trigger} and moderately receptive, with enough emotional openness to continue evaluating.`;
}

function getLikelyObjection(params: {
  alignment: BehavioralResponseInputs["alignment"];
  psychology: BehavioralResponseInputs["psychology"];
  audienceResponse: BehavioralResponseInputs["audienceResponse"];
  extraction: BehavioralResponseInputs["extraction"];
  goal: CampaignGoal;
  ctaPressure: CtaPressure;
  urgencyLevel: SignalLevel;
  vertical: string;
}): string {
  const { alignment, psychology, audienceResponse, extraction, goal, ctaPressure, urgencyLevel, vertical } = params;
  const textCorpus = [extraction.headline, extraction.primary_message, extraction.cta, audienceResponse.likely_perception].join(" ").toLowerCase();

  if (alignment.alignment_status === "misaligned" && goal === "awareness" && (ctaPressure === "aggressive" || urgencyLevel === "high")) {
    return "The audience is likely to think the ad is asking for commitment before it has earned relevance or emotional confidence.";
  }

  if (vertical === "luxury" && hasDiscountLanguage(textCorpus)) {
    return "The audience may resist because the creative signals discount behavior instead of premium identity and restrained confidence.";
  }

  if (psychology.trust_signal_strength.toLowerCase().includes("weak")) {
    return "The audience is likely to question credibility and hesitate until the message proves it is safe to trust.";
  }

  if (audienceResponse.engagement_barrier.toLowerCase().includes("effort")) {
    return "The audience is likely to resist because the cognitive effort feels too high for the perceived reward.";
  }

  if (ctaPressure === "aggressive" && goal !== "conversion") {
    return "The audience is likely to feel pushed before it is ready, which can convert curiosity into avoidance.";
  }

  return "The audience is likely to hesitate until the message answers the stage-specific question it is mentally asking.";
}

function getResistanceTrigger(params: {
  attention: BehavioralResponseInputs["attention"];
  alignment: BehavioralResponseInputs["alignment"];
  psychology: BehavioralResponseInputs["psychology"];
  extraction: BehavioralResponseInputs["extraction"];
  goal: CampaignGoal;
  ctaPressure: CtaPressure;
  urgencyLevel: SignalLevel;
}): string {
  const { attention, alignment, psychology, extraction, goal, ctaPressure, urgencyLevel } = params;
  const textCorpus = [extraction.headline, extraction.primary_message, extraction.cta].join(" ").toLowerCase();

  if (attention.friction_points.length > 0) {
    return attention.friction_points[0];
  }

  if (alignment.alignment_status !== "aligned") {
    return alignment.strategic_conflict;
  }

  if (goal === "awareness" && (ctaPressure === "aggressive" || urgencyLevel === "high")) {
    return "Early commitment pressure is triggering resistance before the audience has completed its curiosity phase.";
  }

  if (psychology.trust_signal_strength.toLowerCase().includes("weak")) {
    return "The missing proof and certainty signals are activating risk aversion.";
  }

  if (hasDiscountLanguage(textCorpus) && alignment.strategic_conflict.toLowerCase().includes("luxury")) {
    return "Discount framing is clashing with premium identity expectations.";
  }

  return "The audience is resisting the timing of the ask more than the message itself.";
}

function getCommitmentReadiness(params: {
  alignment: BehavioralResponseInputs["alignment"];
  psychology: BehavioralResponseInputs["psychology"];
  extraction: BehavioralResponseInputs["extraction"];
  goal: CampaignGoal;
  ctaPressure: CtaPressure;
  urgencyLevel: SignalLevel;
}): string {
  const { alignment, psychology, extraction, goal, ctaPressure, urgencyLevel } = params;
  const textCorpus = [extraction.headline, extraction.primary_message, extraction.cta].join(" ").toLowerCase();

  if (alignment.alignment_status === "aligned" && psychology.trust_signal_strength.toLowerCase().includes("solid") && ctaPressure !== "aggressive") {
    return "High readiness: the audience has enough trust and message fit to continue toward action.";
  }

  if (goal === "awareness" && (ctaPressure === "aggressive" || urgencyLevel === "high")) {
    return "Low readiness: the audience is still evaluating relevance and trust, so direct commitment pressure arrives too early.";
  }

  if (psychology.trust_signal_strength.toLowerCase().includes("weak") || hasDiscountLanguage(textCorpus)) {
    return "Low readiness: the audience still needs proof and emotional confidence before it will accept the ask.";
  }

  if (alignment.alignment_status === "partially_aligned") {
    return "Moderate readiness: the audience may move forward if the strongest friction point is removed.";
  }

  return "Moderate readiness: the audience is open, but it still wants reassurance before committing.";
}

function getLikelyBehavior(params: {
  commitmentReadiness: string;
  attention: BehavioralResponseInputs["attention"];
  audienceResponse: BehavioralResponseInputs["audienceResponse"];
  ctaPressure: CtaPressure;
}): string {
  const { commitmentReadiness, attention, audienceResponse, ctaPressure } = params;
  const readiness = commitmentReadiness.toLowerCase();

  if (readiness.includes("low")) {
    return attention.friction_points.length > 0 || ctaPressure === "aggressive"
      ? "The audience is likely to skim, hesitate, and leave before the CTA earns enough attention."
      : "The audience is likely to delay action and continue looking for proof elsewhere.";
  }

  if (readiness.includes("high")) {
    return audienceResponse.engagement_barrier.toLowerCase().includes("effort")
      ? "The audience is likely to move forward, but only if the path to action stays simple and low-friction."
      : "The audience is likely to accept the next step, compare the offer, and click if no new objection appears.";
  }

  return "The audience is likely to keep evaluating, with action possible only after one more reassurance or clarity cue.";
}

function getConfidenceBuilding(params: {
  trustGap: string;
  identityAlignment: string;
  commitmentReadiness: string;
  attention: BehavioralResponseInputs["attention"];
  extraction: BehavioralResponseInputs["extraction"];
}): string {
  const { trustGap, identityAlignment, commitmentReadiness, attention, extraction } = params;

  if (trustGap.toLowerCase().includes("proof")) {
    return "Add concrete proof near the decision point, so certainty grows before the audience is asked to commit.";
  }

  if (identityAlignment.toLowerCase().includes("misaligned")) {
    return "Rebuild the frame around the audience's identity so the message feels like a fit, not a compromise.";
  }

  if (commitmentReadiness.toLowerCase().includes("low")) {
    return "Reduce pressure, clarify the value exchange, and make the next step feel reversible and safe.";
  }

  if (attention.friction_points.length > 0 || extraction.text_density === "high") {
    return "Simplify the message path and isolate the strongest proof point so confidence can build without effort.";
  }

  return "Preserve the current trust cues and sharpen the final proof point so confidence translates into action.";
}

export function buildBehavioralResponse(inputs: BehavioralResponseInputs): BehavioralResponse {
  const psychCorpus = [inputs.psychology.persuasion_style, inputs.psychology.audience_resistance, inputs.audienceResponse.likely_perception].join(" ");
  const trustGap = getTrustGap(inputs.psychology.trust_signal_strength, inputs.extraction.trust_markers);
  const identityAlignment = getIdentityAlignment(inputs.vertical, psychCorpus, inputs.audienceResponse.likely_perception);
  const commitmentPressure = getCommitmentPressureText(inputs.ctaPressure, inputs.urgencyLevel, inputs.goal);
  const curiosityVsIntentBalance = getCuriosityIntentBalance(inputs.goal, inputs.ctaPressure, inputs.urgencyLevel);
  const commitmentReadiness = getCommitmentReadiness(inputs);

  return {
    perceived_message: inputs.audienceResponse.likely_perception,
    emotional_state: getEmotionalState(inputs.goal, inputs.ctaPressure, inputs.urgencyLevel, inputs.psychology.emotional_trigger, trustGap),
    likely_objection: getLikelyObjection({
      alignment: inputs.alignment,
      psychology: inputs.psychology,
      audienceResponse: inputs.audienceResponse,
      extraction: inputs.extraction,
      goal: inputs.goal,
      ctaPressure: inputs.ctaPressure,
      urgencyLevel: inputs.urgencyLevel,
      vertical: inputs.vertical,
    }),
    trust_gap: trustGap,
    identity_alignment: identityAlignment,
    commitment_readiness: commitmentReadiness,
    resistance_trigger: getResistanceTrigger({
      attention: inputs.attention,
      alignment: inputs.alignment,
      psychology: inputs.psychology,
      extraction: inputs.extraction,
      goal: inputs.goal,
      ctaPressure: inputs.ctaPressure,
      urgencyLevel: inputs.urgencyLevel,
    }),
    likely_behavior: getLikelyBehavior({
      commitmentReadiness,
      attention: inputs.attention,
      audienceResponse: inputs.audienceResponse,
      ctaPressure: inputs.ctaPressure,
    }),
    curiosity_vs_intent_balance: curiosityVsIntentBalance,
    risk_aversion: trustGap.toLowerCase().includes("proof")
      ? "Risk aversion is elevated because the audience cannot yet see enough certainty to feel safe acting."
      : commitmentReadiness.toLowerCase().includes("low")
        ? "Risk aversion remains active because the ask feels larger than the current emotional confidence."
        : "Risk aversion is contained and mostly tied to normal comparison behavior.",
    confidence_building: getConfidenceBuilding({
      trustGap,
      identityAlignment,
      commitmentReadiness,
      attention: inputs.attention,
      extraction: inputs.extraction,
    }),
    commitment_pressure: commitmentPressure,
  };
}
