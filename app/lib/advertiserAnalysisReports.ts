import { getEntryPayload } from "@/app/lib/strategicPresentation";

export type AdvertiserAnalysisReport = {
  id: string;
  creativeId: string;
  creativeName: string;
  creativeSize?: string;
  analyzedAt: string;
  launchStatus: "ready" | "review" | "misaligned";
  launchStatusLabel: string;
  alignmentScore: number | null;
  summary: string;
  mainRisk: string | null;
  goalAligned: boolean | null;
  verticalAligned: boolean | null;
  briefAligned: boolean | null;
  recommendations: string[];
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function readText(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function readRecommendations(payload: Record<string, unknown>): string[] {
  const raw = payload.strategic_recommendations || payload.recommendations || [];
  if (!Array.isArray(raw)) return [];

  return raw
    .slice(0, 4)
    .map((item) => {
      if (typeof item === "string") return item.trim();
      const record = asRecord(item);
      return readText(record.recommended_change, record.issue, record.message);
    })
    .filter(Boolean);
}

function deriveLaunchStatus(payload: Record<string, unknown>): AdvertiserAnalysisReport["launchStatus"] {
  if (payload.error) return "review";

  const goalAligned = asRecord(payload.goal_alignment).is_aligned;
  const verticalAligned = asRecord(payload.vertical_alignment).is_aligned;
  const briefBlock = asRecord(payload.brief_alignment || payload.briefAlignment);

  if (goalAligned === false || verticalAligned === false || briefBlock.creative_matches_brief === false) {
    return "misaligned";
  }

  if (goalAligned === null && verticalAligned === null && !readText(payload.summary)) {
    return "review";
  }

  return "ready";
}

function launchStatusLabel(status: AdvertiserAnalysisReport["launchStatus"]): string {
  if (status === "ready") return "Launch ready";
  if (status === "misaligned") return "Needs revision";
  return "Review recommended";
}

/** Build dashboard-friendly analysis summaries from stored analyzer entries. */
export function buildAnalysisReportsFromResults(
  analysisResult: Record<string, unknown>[] | null | undefined,
  creatives: Record<string, unknown>[] = [],
  analyzedAt?: string,
): AdvertiserAnalysisReport[] {
  if (!Array.isArray(analysisResult) || !analysisResult.length) return [];

  const timestamp = analyzedAt || new Date().toISOString();

  return analysisResult.map((entry, index) => {
    const entryRecord = asRecord(entry);
    const payload = asRecord(getEntryPayload(entry));
    const creativeRecord = asRecord(entryRecord.creative);
    const matchedCreative = creatives.find((item) => item.id === creativeRecord.id || item.id === entryRecord.creativeId);

    const creativeId = String(
      creativeRecord.id || entryRecord.creativeId || matchedCreative?.id || `creative-${index}`,
    );
    const creativeName = readText(
      creativeRecord.name,
      matchedCreative?.name,
      payload.creative_name,
      `Creative ${index + 1}`,
    );
    const creativeSize = readText(creativeRecord.size, matchedCreative?.size) || undefined;

    const adigator = asRecord(payload.adigator_analysis);
    const summary = readText(
      payload.summary,
      adigator.summary,
      payload.main_strategic_problem,
      payload.attention_analysis,
      payload.business_consequence,
      payload.error ? `Analysis error: ${payload.error}` : "",
      "Analysis completed — open Preview Tool for full report details.",
    );

    const launchStatus = deriveLaunchStatus(payload);
    const goalAlignment = asRecord(payload.goal_alignment);
    const verticalAlignment = asRecord(payload.vertical_alignment);
    const briefAlignment = asRecord(payload.brief_alignment || payload.briefAlignment);

    return {
      id: `${creativeId}-${index}`,
      creativeId,
      creativeName,
      creativeSize,
      analyzedAt: timestamp,
      launchStatus,
      launchStatusLabel: launchStatusLabel(launchStatus),
      alignmentScore: typeof payload.strategic_alignment_score === "number"
        ? Math.round(payload.strategic_alignment_score)
        : null,
      summary,
      mainRisk: readText(adigator.main_risk, payload.main_risk) || null,
      goalAligned: typeof goalAlignment.is_aligned === "boolean" ? goalAlignment.is_aligned : null,
      verticalAligned: typeof verticalAlignment.is_aligned === "boolean" ? verticalAlignment.is_aligned : null,
      briefAligned: typeof briefAlignment.creative_matches_brief === "boolean"
        ? briefAlignment.creative_matches_brief
        : null,
      recommendations: readRecommendations(payload),
    };
  });
}
