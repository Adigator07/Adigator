import type { IntelligenceSignal, SignalEvidence, SignalSource, SignalSeverity } from "./types";

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

function evidenceKey(evidence: SignalEvidence[]): string {
  return evidence
    .map((item) => `${item.kind}:${String(item.value).toLowerCase()}`)
    .sort()
    .join("|");
}

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, Number(value.toFixed(3))));
}

export function makeSignal(input: {
  type: string;
  source: SignalSource;
  confidence: number;
  reasoning: string;
  evidence: SignalEvidence[];
  dependencies?: string[];
  scoreImpact?: number;
  severity?: SignalSeverity;
}): IntelligenceSignal {
  const evidenceHash = slug(evidenceKey(input.evidence) || "no-evidence");
  const id = `${input.source}:${slug(input.type)}:${evidenceHash}`;

  return {
    id,
    type: input.type,
    source: input.source,
    confidence: clampConfidence(input.confidence),
    reasoning: input.reasoning,
    evidence: input.evidence,
    dependencies: input.dependencies ?? [],
    scoreImpact: Math.round(input.scoreImpact ?? 0),
    severity: input.severity,
  };
}
