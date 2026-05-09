import type { IntelligenceSignal, SignalConflict } from "./types";

function conflictId(type: string, ids: string[]): string {
  return `conflict:${type}:${ids.sort().join("+")}`;
}

export function dedupeSignals(signals: IntelligenceSignal[]): IntelligenceSignal[] {
  const byId = new Map<string, IntelligenceSignal>();

  signals.forEach((signal) => {
    const existing = byId.get(signal.id);
    if (!existing || signal.confidence > existing.confidence) {
      byId.set(signal.id, signal);
    }
  });

  return [...byId.values()];
}

export function validateSignals(signals: IntelligenceSignal[]): {
  signals: IntelligenceSignal[];
  conflicts: SignalConflict[];
} {
  const deduped = dedupeSignals(signals);
  const ids = new Set(deduped.map((signal) => signal.id));
  const conflicts: SignalConflict[] = [];

  deduped.forEach((signal) => {
    if (signal.evidence.length === 0) {
      conflicts.push({
        id: conflictId("low-evidence", [signal.id]),
        signalIds: [signal.id],
        type: "low_evidence",
        severity: "high",
        message: `Signal ${signal.id} has no evidence and should not influence scoring.`,
      });
    }

    const missing = signal.dependencies.filter((dependency) => !ids.has(dependency));
    if (missing.length > 0) {
      conflicts.push({
        id: conflictId("missing-dependency", [signal.id, ...missing]),
        signalIds: [signal.id],
        type: "missing_dependency",
        severity: "medium",
        message: `Signal ${signal.id} references missing dependencies: ${missing.join(", ")}`,
      });
    }
  });

  const ctaPresent = deduped.filter((signal) => signal.type === "cta.present" && signal.scoreImpact > 0);
  const ctaMissing = deduped.filter((signal) => signal.type === "cta.missing" && signal.scoreImpact < 0);
  if (ctaPresent.length > 0 && ctaMissing.length > 0) {
    conflicts.push({
      id: conflictId("cta-contradiction", [...ctaPresent, ...ctaMissing].map((signal) => signal.id)),
      signalIds: [...ctaPresent, ...ctaMissing].map((signal) => signal.id),
      type: "contradiction",
      severity: "critical",
      message: "CTA signals contradict each other: present and missing were both emitted.",
    });
  }

  return { signals: deduped, conflicts };
}
