import crypto from "node:crypto";
import { extractTextFromImage } from "@/app/lib/ocr";
import { validateImage } from "@/app/lib/vision";
import { normalizeOcr } from "@/app/lib/ocr-normalization/pipeline";
import { detectCta } from "@/app/lib/ocr-normalization/cta-engine";
import { analyzeLayout } from "@/app/lib/layout-intelligence/engine";
import { getIntelligenceProfile, type CampaignGoal, type VerticalKey } from "@/app/lib/intelligence-registry";
import { emitCtaSignals } from "./engines/cta";
import { emitLayoutSignals } from "./engines/layout";
import { analyzeColorFromBuffer, emitColorSignals } from "./engines/color";
import { classifyCreativeVertical, emitVerticalAlignmentSignal } from "./engines/classification";
import { calculateDeterministicScores, calculateGraphConfidence } from "./scoring/deterministic";
import { validateSignals } from "./graph/validator";
import type { AnalysisStatus, IntelligenceGraph, IntelligenceScore, IntelligenceSignal, SignalAvailability, SignalSeverity } from "./graph/types";

export interface AnalyzeIntelligenceInput {
  imageBuffer: Buffer;
  goal: CampaignGoal;
  vertical: VerticalKey;
  mimeType?: string;
  fileSizeBytes?: number;
}

function scoreToPriority(value: number): SignalSeverity {
  if (value <= 45) return "critical";
  if (value <= 60) return "high";
  if (value <= 74) return "medium";
  return "low";
}

function emptyScore(id: string, label: string, reasonUnavailable: string, status: AnalysisStatus = "insufficient_evidence"): IntelligenceScore {
  return {
    id,
    label,
    value: null,
    confidence: null,
    signalIds: [],
    reasoning: "Score unavailable due to insufficient validated evidence.",
    status,
    reasonUnavailable,
  };
}

function emptyScoreSet(reasonUnavailable: string, status: AnalysisStatus = "insufficient_evidence"): Record<string, IntelligenceScore> {
  return {
    visualClarity: emptyScore("visualClarity", "Visual Clarity", reasonUnavailable, status),
    ctaClarity: emptyScore("ctaClarity", "CTA Clarity", reasonUnavailable, status),
    trustSignals: emptyScore("trustSignals", "Trust Signals", reasonUnavailable, status),
    offerClarity: emptyScore("offerClarity", "Offer Clarity", reasonUnavailable, status),
    brandRecall: emptyScore("brandRecall", "Brand Recall", reasonUnavailable, status),
    emotionalResonance: emptyScore("emotionalResonance", "Emotional Resonance", reasonUnavailable, status),
    mobileLegibility: emptyScore("mobileLegibility", "Mobile Legibility", reasonUnavailable, status),
    verticalAlignment: emptyScore("verticalAlignment", "Vertical Alignment", reasonUnavailable, status),
    overall: emptyScore("overall", "Overall Creative Intelligence", reasonUnavailable, status),
  };
}

function deriveAnalysisStatus(graph: IntelligenceGraph): { status: AnalysisStatus; reason?: string; message?: string } {
  const scoreValues = Object.values(graph.scores).map((score) => score.value).filter((value) => Number.isFinite(value));
  const totalScores = Object.keys(graph.scores).length;
  const scoreCoverage = totalScores === 0 ? 0 : scoreValues.length / totalScores;

  if (graph.analysisState?.status === "ocr_failure" || graph.analysisState?.status === "pipeline_failure") {
    return graph.analysisState;
  }

  if (scoreValues.length === 0) {
    return {
      status: "insufficient_evidence",
      reason: "missing_required_signals",
      message: "Insufficient validated signals for deterministic scoring.",
    };
  }

  if (graph.conflicts.some((conflict) => conflict.type === "contradiction" && conflict.severity === "critical")) {
    return {
      status: "partial_analysis",
      reason: "contradictory_graph_states",
      message: "Partial analysis generated with contradictory signals isolated.",
    };
  }

  if (scoreCoverage < 1) {
    return {
      status: "partial_analysis",
      reason: "partial_signal_coverage",
      message: "Partial intelligence available. Some signals are unavailable.",
    };
  }

  if (Number.isFinite(graph.confidence.overall) && (graph.confidence.overall as number) < 0.45) {
    return {
      status: "low_confidence",
      reason: "confidence_below_threshold",
      message: "Signals are present but confidence is below threshold.",
    };
  }

  return {
    status: "success",
    reason: "validated_analysis",
    message: "Validated analysis generated from deterministic signal graph.",
  };
}

function mapSignalAvailability(signals: IntelligenceSignal[]): Record<string, SignalAvailability> {
  return signals.reduce<Record<string, SignalAvailability>>((acc, signal) => {
    const available = signal.available ?? signal.evidence.length > 0;
    acc[signal.id] = {
      available,
      confidence: available ? signal.confidence : null,
      evidence: signal.evidence,
      reasonUnavailable: available ? undefined : (signal.reasonUnavailable ?? "missing_signal_evidence"),
    };
    return acc;
  }, {});
}

function buildRecommendations(graph: Pick<IntelligenceGraph, "signals" | "scores">): IntelligenceGraph["recommendations"] {
  const negativeSignals = graph.signals
    .filter((signal) => signal.scoreImpact < 0)
    .sort((a, b) => a.scoreImpact - b.scoreImpact)
    .slice(0, 8);

  const fromSignals = negativeSignals.map((signal) => ({
    id: `rec:${signal.id}`,
    priority: signal.severity ?? "medium",
    category: signal.type.split(".")[0],
    recommendation: recommendationForSignal(signal),
    reasoning: signal.reasoning,
    signalIds: [signal.id],
    expectedImpact: Math.abs(signal.scoreImpact),
  }));

  const lowScores = Object.values(graph.scores)
    .filter((score) => score.id !== "overall" && Number.isFinite(score.value) && (score.value as number) < 65)
    .map((score) => ({
      id: `rec:score:${score.id}`,
      priority: scoreToPriority(score.value as number),
      category: score.id,
      recommendation: `Improve ${score.label.toLowerCase()} before using this creative at scale.`,
      reasoning: score.reasoning,
      signalIds: score.signalIds,
      expectedImpact: Math.round((70 - (score.value as number)) / 2),
    }));

  const byId = new Map<string, IntelligenceGraph["recommendations"][number]>();
  [...fromSignals, ...lowScores].forEach((rec) => byId.set(rec.id, rec));
  return [...byId.values()].sort((a, b) => b.expectedImpact - a.expectedImpact).slice(0, 10);
}

function recommendationForSignal(signal: IntelligenceSignal): string {
  if (signal.type === "cta.missing") return "Add a profile-appropriate CTA with clear action language and visible placement.";
  if (signal.type === "cta.goal_mismatch") return "Adjust CTA aggression to match the locked campaign goal.";
  if (signal.type === "vertical.mismatch") return "Re-analyze with the detected vertical or replace the creative with one matching the selected vertical.";
  if (signal.type === "clutter.high") return "Reduce competing text blocks, overlap, and crowding to improve scan speed.";
  if (signal.type === "readability.mobile_risk") return "Increase text size and simplify layout for mobile placements.";
  if (signal.type === "hierarchy.weak") return "Strengthen the primary headline or hero element so the first read is unambiguous.";
  if (signal.type === "color.profile_mismatch") return "Adjust palette direction to better match the vertical psychology profile.";
  if (signal.type === "color.contrast_risk") return "Increase foreground/background contrast around message and CTA areas.";
  return "Improve the underlying evidence for this weak signal.";
}

function legacyStrategicScores(graph: IntelligenceGraph) {
  const score = (id: string) => {
    const value = graph.scores[id]?.value;
    return Number.isFinite(value) ? (value as number) : null;
  };
  const confidence = (id: string) => {
    const value = graph.scores[id]?.confidence;
    if (Number.isFinite(value)) return value as number;
    return Number.isFinite(graph.confidence.overall) ? (graph.confidence.overall as number) : null;
  };
  const avg = (...values: Array<number | null>) => {
    const valid = values.filter((value) => Number.isFinite(value)) as number[];
    if (valid.length === 0) return null;
    return Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length);
  };
  return {
    strategyAlignment: { score: score("overall"), confidence: confidence("overall") },
    goalAlignment: { score: avg(score("ctaClarity"), score("emotionalResonance")), confidence: confidence("overall") },
    ctaAlignment: { score: score("ctaClarity"), confidence: confidence("ctaClarity") },
    emotionalAlignment: { score: score("emotionalResonance"), confidence: confidence("emotionalResonance") },
    layoutAlignment: { score: score("visualClarity"), confidence: confidence("visualClarity") },
    mobileReadiness: { score: score("mobileLegibility"), confidence: confidence("mobileLegibility") },
    auctionReadiness: { score: avg(score("visualClarity"), score("ctaClarity"), score("mobileLegibility")), confidence: confidence("overall") },
    trustAlignment: { score: score("trustSignals"), confidence: confidence("trustSignals") },
    visualClarity: { score: score("visualClarity"), confidence: confidence("visualClarity") },
    verticalRelevance: { score: score("verticalAlignment"), confidence: confidence("verticalAlignment") },
    brandAlignment: { score: score("brandRecall"), confidence: confidence("brandRecall") },
    conversionPotential: { score: avg(score("ctaClarity"), score("offerClarity"), score("trustSignals")), confidence: confidence("overall") },
    engagementPotential: { score: avg(score("visualClarity"), score("emotionalResonance"), score("brandRecall")), confidence: confidence("overall") },
    readabilityScore: { score: score("mobileLegibility"), confidence: confidence("mobileLegibility") },
    competitiveStrength: { score: score("overall"), confidence: confidence("overall") },
  };
}

export async function analyzeCreativeIntelligence(input: AnalyzeIntelligenceInput): Promise<IntelligenceGraph & {
  strategicAnalysis: unknown;
  analysisDetails: Record<string, unknown>;
  pipelineVersion: string;
  processingTimeMs: number;
}> {
  const start = Date.now();
  const hash = crypto.createHash("sha256").update(input.imageBuffer).digest("hex");
  const analysisId = `analysis_${hash.slice(0, 16)}_${input.goal}_${input.vertical}`;
  const creativeId = `creative_${hash.slice(0, 16)}`;

  const buildUnavailableResult = (params: {
    validation: { width: number; height: number; format: string };
    profileKey: string;
    status: AnalysisStatus;
    reason: string;
    message: string;
    warnings?: string[];
  }) => {
    const scores = emptyScoreSet(params.reason, params.status);
    const graph: IntelligenceGraph = {
      analysisId,
      creativeId,
      lockedContext: {
        goal: input.goal,
        selectedVertical: input.vertical,
        detectedVertical: "unknown",
        profileKey: params.profileKey,
      },
      asset: {
        hash,
        width: params.validation.width,
        height: params.validation.height,
        mimeType: input.mimeType ?? params.validation.format,
        sizeBytes: input.fileSizeBytes ?? input.imageBuffer.length,
      },
      signals: [],
      conflicts: [],
      scores,
      recommendations: [],
      confidence: {
        overall: null,
        ocr: null,
        signalCoverage: null,
        validation: null,
      },
      analysisState: {
        status: params.status,
        reason: params.reason,
        message: params.message,
      },
      signalAvailability: {},
      audit: {
        pipelineVersion: "2.1.0-intelligence-graph-status-aware",
        analyzedAt: new Date().toISOString(),
        processingTimeMs: Date.now() - start,
        warnings: params.warnings ?? [],
      },
    };

    return {
      ...graph,
      strategicAnalysis: {
        strategyAlignmentScore: null,
        strategyAlignmentExplanation: params.message,
        scores: legacyStrategicScores(graph),
        behavioralGaps: {
          emotionalGaps: [],
          ctaGaps: [],
          layoutGaps: [],
          trustGaps: [],
          urgencyGaps: [],
        },
        auctionReadiness: {
          readinessScore: null,
          risks: [params.message],
          strengths: [],
          criticalIssues: [params.reason],
        },
        recommendations: {
          critical: [],
          high: [],
          medium: [],
          lowPriority: [],
        },
        strengths: {
          primary: "No validated intelligence available.",
          secondary: [],
        },
        weaknesses: {
          primary: params.message,
          secondary: [],
        },
        overallConfidence: null,
        confidenceExplanation: "Confidence unavailable because validated signals are missing.",
        signalsConsistency: null,
        contextNotes: [`Context locked to ${input.goal}/${input.vertical}; scoring withheld due to evidence constraints.`],
        comparisonContext: `Selected vertical: ${input.vertical}.`,
      },
      analysisDetails: {
        graph,
        analysisState: graph.analysisState,
        signalAvailability: graph.signalAvailability,
        ocr: {
          rawText: "",
          cleanedText: "",
          confidence: null,
          blocks: [],
        },
        ctaDetection: {
          ctaExists: false,
          ctaState: "none",
          ctaType: "none",
          cta: null,
          confidence: null,
          candidateBlockId: null,
          evidence: [],
        },
        layoutAnalysis: null,
        colorAnalysis: null,
        classification: {
          detectedVertical: "unknown",
          confidence: null,
        },
        scores: {
          attention: { value: null },
          clarity: { value: null },
          trust: { value: null },
          persuasion: { value: null },
          ctaStrength: { value: null },
          overallScore: null,
          grade: "Analysis Unavailable",
          overallConfidence: null,
        },
        recommendations: [],
      },
      pipelineVersion: graph.audit.pipelineVersion,
      processingTimeMs: graph.audit.processingTimeMs,
    };
  };

  const validation = await validateImage(input.imageBuffer);
  if (!validation.valid) {
    throw new Error(validation.error ?? "Invalid image");
  }

  const profile = getIntelligenceProfile({
    campaignGoal: input.goal,
    vertical: input.vertical,
  });

  let ocrRaw;
  try {
    ocrRaw = await extractTextFromImage(input.imageBuffer.toString("base64"));
  } catch (error) {
    const details = error instanceof Error ? error.message : "OCR provider unavailable";
    return buildUnavailableResult({
      validation,
      profileKey: profile.key,
      status: "ocr_failure",
      reason: "ocr_provider_unavailable",
      message: `OCR processing failed: ${details}`,
      warnings: [details],
    });
  }

  const ocr = normalizeOcr({
    ...ocrRaw,
    imageWidth: validation.width,
    imageHeight: validation.height,
  }, {
    campaignGoal: input.goal,
    vertical: input.vertical,
  });

  if (!ocr.cleanedText.trim() || ocr.cleanedText.length < 5) {
    return buildUnavailableResult({
      validation,
      profileKey: profile.key,
      status: "insufficient_evidence",
      reason: "missing_text_evidence",
      message: "Insufficient validated OCR text. Scoring withheld.",
      warnings: [...ocr.warnings, "OCR text evidence below minimum threshold"],
    });
  }

  const ctaDetection = detectCta(ocr.blocks, profile);
  const ocrWithCta = { ...ocr, ctaDetection };
  const layout = analyzeLayout({ ocr: ocrWithCta, options: { profile } });
  const color = await analyzeColorFromBuffer(input.imageBuffer);
  const classification = classifyCreativeVertical(ocrWithCta);

  const rawSignals = [
    ...classification.signals,
    emitVerticalAlignmentSignal({
      selectedVertical: input.vertical,
      detectedVertical: classification.detectedVertical,
      confidence: classification.confidence,
    }),
    ...emitCtaSignals(ocrWithCta, layout, profile),
    ...emitLayoutSignals(layout, profile),
    ...emitColorSignals(color, profile),
  ];

  const validated = validateSignals(rawSignals);
  const statusAwareSignals = validated.signals.map((signal) => ({
    ...signal,
    available: signal.evidence.length > 0,
    reasonUnavailable: signal.evidence.length > 0 ? undefined : "missing_signal_evidence",
  }));
  const scores = calculateDeterministicScores({
    ocr: ocrWithCta,
    layout,
    profile,
    signals: statusAwareSignals,
  });
  const graphBase: IntelligenceGraph = {
    analysisId,
    creativeId,
    lockedContext: {
      goal: input.goal,
      selectedVertical: input.vertical,
      detectedVertical: classification.detectedVertical,
      profileKey: profile.key,
    },
    asset: {
      hash,
      width: validation.width,
      height: validation.height,
      mimeType: input.mimeType ?? validation.format,
      sizeBytes: input.fileSizeBytes ?? input.imageBuffer.length,
    },
    signals: statusAwareSignals,
    conflicts: validated.conflicts,
    scores,
    recommendations: [],
    confidence: calculateGraphConfidence({
      ocrConfidence: ocrWithCta.confidence,
      signals: statusAwareSignals,
      conflictCount: validated.conflicts.length,
    }),
    signalAvailability: mapSignalAvailability(statusAwareSignals),
    audit: {
      pipelineVersion: "2.1.0-intelligence-graph-status-aware",
      analyzedAt: new Date().toISOString(),
      processingTimeMs: Date.now() - start,
      warnings: ocrWithCta.warnings,
    },
  };

  const graph: IntelligenceGraph = {
    ...graphBase,
    recommendations: buildRecommendations(graphBase),
  };
  graph.analysisState = deriveAnalysisStatus(graph);

  const strategicScores = legacyStrategicScores(graph);
  const overallScore = Number.isFinite(graph.scores.overall.value) ? (graph.scores.overall.value as number) : null;
  const grade = overallScore === null
    ? "Analysis Unavailable"
    : overallScore >= 85
      ? "Elite Creative"
      : overallScore >= 75
        ? "Strong Performer"
        : overallScore >= 60
          ? "Needs Optimization"
          : "High Risk Creative";

  return {
    ...graph,
    strategicAnalysis: {
      strategyAlignmentScore: overallScore,
      strategyAlignmentExplanation: graph.analysisState?.message ?? `Deterministic graph score for locked ${input.goal}/${input.vertical} profile.`,
      scores: strategicScores,
      behavioralGaps: {
        emotionalGaps: graph.signals.filter((s) => s.type.includes("emotion") && s.scoreImpact < 0).map((s) => s.reasoning),
        ctaGaps: graph.signals.filter((s) => s.type.startsWith("cta.") && s.scoreImpact < 0).map((s) => s.reasoning),
        layoutGaps: graph.signals.filter((s) => ["clutter.high", "hierarchy.weak", "density.profile_mismatch"].includes(s.type)).map((s) => s.reasoning),
        trustGaps: [],
        urgencyGaps: [],
      },
      auctionReadiness: {
        readinessScore: strategicScores.auctionReadiness.score,
        risks: graph.signals.filter((s) => s.scoreImpact < 0).map((s) => s.reasoning),
        strengths: graph.signals.filter((s) => s.scoreImpact > 0).slice(0, 5).map((s) => s.reasoning),
        criticalIssues: graph.conflicts.filter((c) => c.severity === "critical").map((c) => c.message),
      },
      recommendations: {
        critical: graph.recommendations.filter((r) => r.priority === "critical").map((r) => r.recommendation),
        high: graph.recommendations.filter((r) => r.priority === "high").map((r) => r.recommendation),
        medium: graph.recommendations.filter((r) => r.priority === "medium").map((r) => r.recommendation),
        lowPriority: graph.recommendations.filter((r) => r.priority === "low").map((r) => r.recommendation),
      },
      strengths: {
        primary: graph.signals.find((s) => s.scoreImpact > 0)?.reasoning ?? "No strong positive signal detected",
        secondary: graph.signals.filter((s) => s.scoreImpact > 0).slice(1, 4).map((s) => s.reasoning),
      },
      weaknesses: {
        primary: graph.signals.find((s) => s.scoreImpact < 0)?.reasoning ?? "No critical weakness detected",
        secondary: graph.signals.filter((s) => s.scoreImpact < 0).slice(1, 4).map((s) => s.reasoning),
      },
      overallConfidence: graph.confidence.overall,
      confidenceExplanation: "Confidence is calculated from OCR confidence, signal coverage, signal confidence, and validation conflicts.",
      signalsConsistency: Number.isFinite(graph.confidence.validation) ? Math.round((graph.confidence.validation as number) * 100) : null,
      contextNotes: [`Context locked to ${input.goal}/${input.vertical}; changing context requires re-analysis.`],
      comparisonContext: `Detected creative vertical: ${classification.detectedVertical}. Selected vertical: ${input.vertical}.`,
    },
    analysisDetails: {
      graph,
      analysisState: graph.analysisState,
      signalAvailability: graph.signalAvailability,
      ocr: ocrWithCta,
      ctaDetection,
      layoutAnalysis: layout,
      colorAnalysis: color,
      classification,
      scores: {
        attention: { value: graph.scores.visualClarity.value },
        clarity: { value: graph.scores.mobileLegibility.value },
        trust: { value: graph.scores.trustSignals.value },
        persuasion: { value: graph.scores.offerClarity.value },
        ctaStrength: { value: graph.scores.ctaClarity.value },
        overallScore,
        grade,
        overallConfidence: graph.confidence.overall,
      },
      recommendations: graph.recommendations.map((rec) => ({
        id: rec.id,
        category: rec.category,
        priority: rec.priority,
        current: rec.reasoning,
        suggested: rec.recommendation,
        reason: rec.reasoning,
        expectedImpact: rec.expectedImpact,
        source: "deterministic",
      })),
    },
    pipelineVersion: graph.audit.pipelineVersion,
    processingTimeMs: graph.audit.processingTimeMs,
  };
}
