import type { CampaignGoal, VerticalKey } from "@/app/lib/intelligence-registry";

export type SignalSource =
  | "ocr"
  | "vision"
  | "layout"
  | "profile"
  | "classifier"
  | "scoring"
  | "platform"
  | "validation";

export type SignalSeverity = "low" | "medium" | "high" | "critical";

export type AnalysisStatus =
  | "success"
  | "partial_analysis"
  | "insufficient_evidence"
  | "pipeline_failure"
  | "ocr_failure"
  | "low_confidence";

export interface SignalAvailability {
  available: boolean;
  confidence: number | null;
  evidence: SignalEvidence[];
  reasonUnavailable?: string;
}

export interface SignalEvidence {
  kind: string;
  value: string | number | boolean;
  ref?: string;
}

export interface IntelligenceSignal {
  id: string;
  type: string;
  source: SignalSource;
  confidence: number;
  available?: boolean;
  reasonUnavailable?: string;
  reasoning: string;
  evidence: SignalEvidence[];
  dependencies: string[];
  scoreImpact: number;
  severity?: SignalSeverity;
}

export interface SignalConflict {
  id: string;
  signalIds: string[];
  type: "contradiction" | "missing_dependency" | "low_evidence";
  severity: SignalSeverity;
  message: string;
}

export interface IntelligenceScore {
  id: string;
  label: string;
  value: number | null;
  confidence: number | null;
  signalIds: string[];
  reasoning: string;
  status?: AnalysisStatus;
  reasonUnavailable?: string;
}

export interface IntelligenceGraph {
  analysisId: string;
  creativeId: string;
  lockedContext: {
    goal: CampaignGoal;
    selectedVertical: VerticalKey;
    detectedVertical: VerticalKey | "unknown";
    profileKey: string;
  };
  asset: {
    hash: string;
    width: number;
    height: number;
    mimeType: string;
    sizeBytes: number;
  };
  signals: IntelligenceSignal[];
  conflicts: SignalConflict[];
  scores: Record<string, IntelligenceScore>;
  recommendations: Array<{
    id: string;
    priority: SignalSeverity;
    category: string;
    recommendation: string;
    reasoning: string;
    signalIds: string[];
    expectedImpact: number;
  }>;
  confidence: {
    overall: number | null;
    ocr: number | null;
    signalCoverage: number | null;
    validation: number | null;
  };
  analysisState?: {
    status: AnalysisStatus;
    reason?: string;
    message?: string;
  };
  signalAvailability?: Record<string, SignalAvailability>;
  audit: {
    pipelineVersion: string;
    analyzedAt: string;
    processingTimeMs: number;
    warnings: string[];
  };
}
