export type CampaignGoal = "awareness" | "consideration" | "conversion";
export type CTAStrength = "low" | "medium" | "high";
export type EmotionalLevel = "Low" | "Medium" | "High";

export interface GoalAlignmentInput {
  goal: CampaignGoal;
  cta: {
    detected: boolean;
    strength: CTAStrength;
  };
  emotionalLevel: EmotionalLevel;
  textLength: number;
  clarityScore: number;
  extractedText?: string;
}

export interface GoalAlignmentOutput {
  alignmentScore: number;
  status: "Aligned" | "Partially Aligned" | "Misaligned";
  reasons: string[];
}

const URGENCY_REGEX = /\b(now|today|limited|hurry|ends soon|last chance|expires|only)\b/i;
const VALUE_REGEX = /\b(save|discount|offer|free|benefit|value|trial|bonus|deal|%\s*off)\b/i;
const PRODUCT_VALUE_REGEX = /\b(feature|benefit|quality|trusted|compare|value|how it works|details|plan|pricing)\b/i;

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function statusFromScore(score: number): GoalAlignmentOutput["status"] {
  if (score > 75) {
    return "Aligned";
  }

  if (score >= 50) {
    return "Partially Aligned";
  }

  return "Misaligned";
}

export function analyzeGoalAlignment(input: GoalAlignmentInput): GoalAlignmentOutput {
  let score = 50;
  const reasons: string[] = [];

  const text = input.extractedText ?? "";
  const hasUrgencyWords = URGENCY_REGEX.test(text);
  const hasValueSignal = VALUE_REGEX.test(text);
  const hasProductValueText = PRODUCT_VALUE_REGEX.test(text);
  const clearMessage = input.clarityScore >= 70;
  const shortMessage = input.textLength <= 18;
  const balancedMessage = input.textLength >= 8 && input.textLength <= 34 && input.clarityScore >= 60;

  if (clearMessage) {
    score += 10;
    reasons.push("Message clarity supports the campaign objective");
  }

  if (input.goal === "awareness") {
    if (!input.cta.detected || input.cta.strength === "low") {
      score += 10;
      reasons.push("Message aligns well with awareness objective");
    } else if (input.cta.strength === "high") {
      score -= 8;
      reasons.push("CTA intensity is higher than typical awareness creative");
    }

    if (shortMessage && clearMessage) {
      score += 8;
      reasons.push("Short and clear messaging fits awareness");
    }

    if (input.textLength > 30) {
      score -= 15;
      reasons.push("Too much text for awareness objective");
    }
  }

  if (input.goal === "consideration") {
    if (input.cta.detected && input.cta.strength === "medium") {
      score += 15;
      reasons.push("Medium CTA aligns with consideration goal");
    } else if (!input.cta.detected) {
      score -= 8;
      reasons.push("Consideration creative needs a guiding CTA");
    }

    if (hasProductValueText || hasValueSignal) {
      score += 10;
      reasons.push("Product/value information supports consideration");
    } else {
      score -= 10;
      reasons.push("Missing product or value detail for consideration");
    }

    if (balancedMessage) {
      score += 6;
      reasons.push("Message balance is suitable for consideration");
    } else {
      score -= 6;
      reasons.push("Message is not balanced for consideration");
    }
  }

  if (input.goal === "conversion") {
    if (input.cta.detected && input.cta.strength === "high") {
      score += 20;
      reasons.push("Strong CTA supports conversion objective");
    }

    if (!input.cta.detected) {
      score -= 30;
      reasons.push("No strong CTA for conversion goal");
    } else if (input.cta.strength !== "high") {
      score -= 20;
      reasons.push("No strong CTA for conversion goal");
    }

    if (hasUrgencyWords) {
      score += 10;
      reasons.push("Urgency language supports conversion");
    } else {
      score -= 10;
      reasons.push("Urgency wording is missing for conversion");
    }

    if (hasValueSignal) {
      score += 10;
      reasons.push("Benefit or offer is clear for conversion");
    } else {
      score -= 10;
      reasons.push("Clear benefit or offer is missing for conversion");
    }

    if (input.textLength > 35) {
      score -= 10;
      reasons.push("Creative is too informational for conversion");
    }
  }

  if (input.emotionalLevel === "Low") {
    score -= 10;
    reasons.push("No emotional appeal signal detected");
  }

  const alignmentScore = clamp(score);

  return {
    alignmentScore,
    status: statusFromScore(alignmentScore),
    reasons,
  };
}
