/**
 * Strip analyzer payloads to the minimum fields needed by /api/preview-engine.
 * Reduces request size without changing preview output.
 */

export function compactAnalyzerOutputForPreview(analyzerOutput) {
  if (!analyzerOutput || typeof analyzerOutput !== "object") return {};

  const signals = analyzerOutput.extraction_signals || analyzerOutput.signals || {};
  const adigator = analyzerOutput.adigator_analysis || {};

  return {
    target_audience: clean(analyzerOutput.target_audience)
      || clean(signals.audience_stage)
      || clean(signals.target_audience)
      || "",
    primary_message: clean(signals.primary_message)
      || clean(signals.topic_summary)
      || clean(analyzerOutput.main_strategic_problem)
      || clean(adigator.primary_message)
      || "",
    platform: clean(signals.platform_context) || "display advertising",
    brand: clean(signals.brand)
      || clean(signals.brand_name)
      || clean(adigator.brand)
      || "",
    product: clean(signals.product)
      || clean(signals.product_or_service)
      || clean(adigator.product)
      || "",
    topic: clean(signals.topic_summary)
      || clean(signals.primary_message)
      || "",
    visual_summary: clean(signals.visual_summary)
      || clean(adigator.visual_elements)
      || "",
    cta: clean(signals.cta)
      || clean(adigator.cta_assessment)
      || "",
    headline: clean(signals.headline)
      || clean(signals.primary_message)
      || "",
    vertical_context: clean(signals.vertical_context)
      || clean(signals.detected_vertical)
      || clean(signals.inferred_vertical)
      || clean(analyzerOutput.vertical_feedback)
      || "",
    detected_vertical: clean(signals.detected_vertical)
      || clean(analyzerOutput.creative_vertical_alignment?.detected_category_id)
      || clean(analyzerOutput.vertical_alignment?.detected_category_id)
      || clean(analyzerOutput.vertical_alignment?.detected_vertical)
      || "",
    product_category: clean(signals.product_category)
      || clean(analyzerOutput.vertical_alignment?.product_category)
      || clean(analyzerOutput.creative_vertical_alignment?.detected_category_label)
      || "",
  };
}

function clean(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed;
}
