/**
 * Strip analyzer payloads to the minimum fields needed by /api/preview-engine.
 * Reduces request size without changing preview output.
 */

export function compactAnalyzerOutputForPreview(analyzerOutput) {
  if (!analyzerOutput || typeof analyzerOutput !== "object") return {};

  const signals = analyzerOutput.extraction_signals || analyzerOutput.signals || {};

  return {
    target_audience: clean(analyzerOutput.target_audience)
      || clean(signals.audience_stage)
      || "",
    primary_message: clean(signals.primary_message)
      || clean(signals.topic_summary)
      || clean(analyzerOutput.main_strategic_problem)
      || "",
    platform: clean(signals.platform_context) || "display advertising",
    brand: clean(signals.brand) || "",
  };
}

function clean(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed;
}
