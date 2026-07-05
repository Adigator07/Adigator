import type {
  CampaignBrain,
  CreativeBrain,
  LandingPageBrain,
  LaunchReadiness,
  ValidationBrain,
} from "@/app/lib/brains/types";
import type { EngineResult } from "@/app/lib/validation/engineContracts";
import { getAnalysisPayloadFromBrain } from "@/app/lib/brains/creativeBrainPersistence";

export type AlignmentInput = {
  campaignBrainId: string;
  creativeBrainIds: string[];
  landingBrainId: string;
  campaignBrain: CampaignBrain;
  creativeBrains: CreativeBrain[];
  landingBrain: LandingPageBrain;
};

export type AlignmentConflict = {
  id: string;
  severity: "low" | "medium" | "high";
  message: string;
  recommendation: string;
};

function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function tokensOverlap(a: string, b: string): boolean {
  const na = normalizeToken(a);
  const nb = normalizeToken(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  const aWords = na.split(" ").filter((w) => w.length > 2);
  const bWords = new Set(nb.split(" ").filter((w) => w.length > 2));
  return aWords.some((w) => bWords.has(w));
}

function goalToIntent(goal: string): string[] {
  const g = normalizeToken(goal);
  if (g.includes("awareness")) return ["information", "brand"];
  if (g.includes("consideration")) return ["lead_capture", "information", "demo"];
  if (g.includes("conversion")) return ["purchase", "lead_capture", "app_install"];
  return [];
}

function deriveLaunchReadiness(score: number, conflictCount: number): LaunchReadiness {
  if (conflictCount >= 4 || score < 45) return "not_ready";
  if (conflictCount >= 2 || score < 65) return "needs_work";
  if (score >= 75 && conflictCount === 0) return "ready";
  return "needs_work";
}

/**
 * Alignment Engine — compares Campaign, Creative, and Landing Page Brains.
 * Deterministic rule-based alignment extracted from monolith alignment concepts.
 */
export function alignBrains(input: AlignmentInput): {
  validationBrain: Omit<ValidationBrain, "id" | "createdAt">;
  conflicts: AlignmentConflict[];
} {
  const conflicts: AlignmentConflict[] = [];
  const primaryCreative = input.creativeBrains[0];
  const creativePayload = primaryCreative
    ? getAnalysisPayloadFromBrain(primaryCreative)
    : null;
  const extraction = primaryCreative?.visualAnalysis?.extraction as { cta?: string } | undefined;
  const creativeCta = String(
    creativePayload?.cta_text
    || extraction?.cta
    || primaryCreative?.extractedText
    || "",
  );
  const creativeHeadline = String(
    creativePayload?.extracted_text
    || primaryCreative?.extractedText
    || "",
  );

  const campaign = input.campaignBrain;
  const landing = input.landingBrain;

  if (campaign.cta && landing.cta && !tokensOverlap(campaign.cta, landing.cta)) {
    conflicts.push({
      id: "cta_campaign_landing_mismatch",
      severity: "high",
      message: "Campaign CTA does not align with landing page primary CTA.",
      recommendation: "Align ad CTA language with the landing page button or headline action.",
    });
  }

  if (creativeCta && landing.cta && !tokensOverlap(creativeCta, landing.cta)) {
    conflicts.push({
      id: "cta_creative_landing_mismatch",
      severity: "high",
      message: "Creative CTA does not match landing page call-to-action.",
      recommendation: "Update creative or landing page so the promised action matches the destination.",
    });
  }

  if (campaign.offer && landing.offer && !tokensOverlap(campaign.offer, landing.offer)) {
    conflicts.push({
      id: "offer_mismatch",
      severity: "medium",
      message: "Campaign offer messaging differs from landing page offer signals.",
      recommendation: "Ensure the offer promoted in ads appears on the landing page.",
    });
  }

  const expectedIntents = goalToIntent(campaign.campaignGoal);
  if (expectedIntents.length > 0 && landing.pageIntent && !expectedIntents.includes(landing.pageIntent)) {
    conflicts.push({
      id: "goal_landing_intent_mismatch",
      severity: "medium",
      message: `Landing page intent (${landing.pageIntent}) may not support campaign goal (${campaign.campaignGoal}).`,
      recommendation: "Adjust landing page structure or campaign goal for funnel consistency.",
    });
  }

  if (campaign.campaignGoal.includes("conversion") && !landing.conversionElements.length) {
    conflicts.push({
      id: "conversion_elements_missing",
      severity: "high",
      message: "Conversion goal selected but landing page lacks clear conversion elements.",
      recommendation: "Add forms, buy buttons, or strong CTAs on the landing page.",
    });
  }

  if (campaign.campaignGoal.includes("lead") && !landing.conversionElements.includes("form")) {
    const hasFormSignal = landing.trustSignals.includes("form") || landing.conversionElements.some((e) => /form/i.test(e));
    if (!hasFormSignal) {
      conflicts.push({
        id: "lead_form_missing",
        severity: "medium",
        message: "Lead generation goal but no form detected on landing page.",
        recommendation: "Add a lead capture form to the destination page.",
      });
    }
  }

  if (creativeHeadline && landing.headline && !tokensOverlap(creativeHeadline, landing.headline)) {
    conflicts.push({
      id: "headline_mismatch",
      severity: "low",
      message: "Creative headline differs from landing page H1/title.",
      recommendation: "Consider message match between ad and landing headline for better quality score.",
    });
  }

  const urlHealth = (landing.seoSignals as { urlHealth?: { flags?: Array<{ severity: string }> } } | undefined)
    ?.urlHealth;
  const urlErrors = urlHealth?.flags?.filter((f) => f.severity === "error").length ?? 0;
  if (urlErrors > 0) {
    conflicts.push({
      id: "landing_url_errors",
      severity: "high",
      message: "Landing page URL health check reported errors.",
      recommendation: "Resolve URL, SSL, or availability issues before launch.",
    });
  }

  const alignmentStatus = conflicts.length === 0
    ? "aligned"
    : conflicts.filter((c) => c.severity === "high").length > 0
      ? "misaligned"
      : "partially_aligned";

  const highCount = conflicts.filter((c) => c.severity === "high").length;
  const mediumCount = conflicts.filter((c) => c.severity === "medium").length;
  const baseScore = 88 - highCount * 18 - mediumCount * 8 - conflicts.filter((c) => c.severity === "low").length * 3;
  const overallScore = Math.max(0, Math.min(100, baseScore));
  const launchReadiness = deriveLaunchReadiness(overallScore, conflicts.length);

  const validationResults = {
    alignmentStatus,
    conflictCount: conflicts.length,
    conflicts,
    campaignBrainId: input.campaignBrainId,
    creativeBrainIds: input.creativeBrainIds,
    landingBrainId: input.landingBrainId,
    scores: {
      overall: overallScore,
      messageMatch: conflicts.some((c) => c.id.includes("headline")) ? 70 : 90,
      ctaMatch: conflicts.some((c) => c.id.includes("cta")) ? 55 : 92,
      offerMatch: conflicts.some((c) => c.id === "offer_mismatch") ? 60 : 88,
    },
  };

  return {
    conflicts,
    validationBrain: {
      campaignBrainId: input.campaignBrainId,
      creativeBrainIds: input.creativeBrainIds,
      landingBrainId: input.landingBrainId,
      validationResults,
      overallScore,
      launchReadiness,
      recommendations: conflicts.map((c) => c.recommendation).slice(0, 8),
      warningFlags: conflicts.map((c) => c.message).slice(0, 8),
      optimizationSuggestions: conflicts
        .filter((c) => c.severity !== "low")
        .map((c) => c.recommendation)
        .slice(0, 5),
    },
  };
}

export function createAlignmentEngine() {
  return {
    engineId: "alignment" as const,
    async align(input: AlignmentInput): Promise<EngineResult<ValidationBrain>> {
      try {
        const { validationBrain } = alignBrains(input);
        const id = typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `vb-${Date.now()}`;
        return {
          status: "success",
          data: {
            ...validationBrain,
            id,
            createdAt: new Date().toISOString(),
          },
          retriesUsed: 0,
        };
      } catch (error) {
        return {
          status: "failed",
          data: null,
          error: error instanceof Error ? error.message : String(error),
          retriesUsed: 0,
        };
      }
    },
  };
}
