import type { IntelligenceProfile } from "@/app/lib/intelligence-registry";
import type { LayoutIntelligenceResult } from "@/app/lib/layout-intelligence/types";
import type { NormalizedOcrResult } from "@/app/lib/ocr-normalization";
import type { IntelligenceSignal } from "../graph/types";
import { makeSignal } from "../graph/signal";

export function emitCtaSignals(
  ocr: NormalizedOcrResult,
  layout: LayoutIntelligenceResult,
  profile: IntelligenceProfile
): IntelligenceSignal[] {
  const signals: IntelligenceSignal[] = [];
  const cta = ocr.ctaDetection;
  const ctaBlock = ocr.schema.cta;
  const visibility = layout.metrics.ctaVisibility;

  if (cta.ctaExists && cta.cta) {
    signals.push(makeSignal({
      type: "cta.present",
      source: "ocr",
      confidence: cta.confidence / 100,
      reasoning: `CTA detected as ${cta.ctaState} with profile-aware OCR evidence.`,
      evidence: [
        { kind: "cta_text", value: cta.cta, ref: cta.candidateBlockId ?? undefined },
        { kind: "cta_state", value: cta.ctaState },
        ...cta.evidence.map((value) => ({ kind: "detector_evidence", value })),
      ],
      scoreImpact: profile.ctaExpectations.required ? 18 : 10,
      severity: "medium",
    }));

    if (ctaBlock?.box) {
      signals.push(makeSignal({
        type: "cta.placement",
        source: "layout",
        confidence: visibility.confidence / 100,
        reasoning: "CTA placement was scored from OCR geometry and attention order.",
        evidence: [
          { kind: "center_y", value: Number(ctaBlock.box.centerY.toFixed(3)), ref: ctaBlock.id },
          { kind: "visibility_score", value: visibility.score },
          ...visibility.signals.map((value) => ({ kind: "layout_signal", value })),
        ],
        dependencies: [],
        scoreImpact: Math.round((visibility.score - 50) / 4),
        severity: visibility.score >= 70 ? "low" : "high",
      }));
    }
  } else {
    signals.push(makeSignal({
      type: "cta.missing",
      source: "ocr",
      confidence: cta.confidence / 100,
      reasoning: profile.ctaExpectations.required
        ? "No CTA passed the profile-aware detection threshold, but this profile requires a CTA."
        : "No explicit CTA passed the detection threshold.",
      evidence: [
        { kind: "required", value: profile.ctaExpectations.required },
        ...cta.evidence.map((value) => ({ kind: "detector_evidence", value })),
      ],
      scoreImpact: profile.ctaExpectations.required ? -24 : -6,
      severity: profile.ctaExpectations.required ? "critical" : "medium",
    }));
  }

  const expected = profile.ctaExpectations.strength;
  if (cta.ctaExists) {
    const soft = cta.ctaState === "implicit" || /learn|discover|explore|view|watch/i.test(cta.cta ?? "");
    const direct = /buy|shop|order|claim|sign|download|book|subscribe|get started/i.test(cta.cta ?? "");
    const aligned =
      expected === "soft" ? soft && !direct :
      expected === "direct" ? direct :
      true;

    signals.push(makeSignal({
      type: aligned ? "cta.goal_aligned" : "cta.goal_mismatch",
      source: "profile",
      confidence: Math.min(0.95, cta.confidence / 100),
      reasoning: `CTA "${cta.cta}" compared against ${profile.goal}/${profile.vertical} expectation: ${expected}.`,
      evidence: [
        { kind: "cta_text", value: cta.cta ?? "" },
        { kind: "expected_strength", value: expected },
      ],
      scoreImpact: aligned ? 10 : -14,
      severity: aligned ? "low" : "high",
    }));
  }

  return signals;
}
