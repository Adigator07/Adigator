export type ProgrammaticPreviewTemplate = "news" | "blog" | "native_display" | "health";

export type CreativePreviewContext = {
  creativeVertical: string;
  templateId: ProgrammaticPreviewTemplate;
  verticalLabel: string;
};

function cleanVertical(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

/** Resolve the vertical/category for a single creative from its analysis payload. */
export function resolveCreativeVertical(
  analyzerOutput: Record<string, unknown> | null | undefined,
  campaignVertical = "general",
): string {
  if (!analyzerOutput || typeof analyzerOutput !== "object") {
    return campaignVertical || "general";
  }

  const cva = analyzerOutput.creative_vertical_alignment as Record<string, unknown> | undefined;
  const detectedCategoryId = cleanVertical(cva?.detected_category_id);
  if (detectedCategoryId && detectedCategoryId !== "unknown") {
    return detectedCategoryId;
  }

  const va = analyzerOutput.vertical_alignment as Record<string, unknown> | undefined;
  const alignedCategoryId = cleanVertical(va?.detected_category_id);
  if (alignedCategoryId && alignedCategoryId !== "unknown") {
    return alignedCategoryId;
  }

  const signals = (analyzerOutput.extraction_signals || analyzerOutput.signals) as Record<string, unknown> | undefined;
  const fromSignals = cleanVertical(signals?.detected_vertical)
    || cleanVertical(signals?.inferred_vertical)
    || cleanVertical(signals?.vertical_context);
  if (fromSignals) return fromSignals;

  const detectedVertical = cleanVertical(va?.detected_vertical);
  if (detectedVertical && detectedVertical !== "unknown") return detectedVertical;

  const detectedLabel = cleanVertical(cva?.detected_category_label)
    || cleanVertical(va?.detected_category_label)
    || cleanVertical(va?.product_category);
  if (detectedLabel) return detectedLabel;

  return campaignVertical || "general";
}

/** Pick the best programmatic publisher template for an individual creative. */
export function selectProgrammaticTemplateForCreative(
  analyzerOutput: Record<string, unknown> | null | undefined,
  campaignVertical = "general",
): ProgrammaticPreviewTemplate {
  const vertical = resolveCreativeVertical(analyzerOutput, campaignVertical);
  const normalized = vertical.toLowerCase().replace(/[_\s/]+/g, "");

  if (
    normalized.includes("health")
    || normalized.includes("medical")
    || normalized.includes("pharma")
    || normalized.includes("healthcare")
  ) {
    return "health";
  }

  if (
    normalized.includes("travel")
    || normalized.includes("tourism")
    || normalized.includes("hotel")
    || normalized.includes("booking")
  ) {
    return "native_display";
  }

  if (
    normalized.includes("ecommerce")
    || normalized.includes("retail")
    || normalized.includes("shop")
    || normalized.includes("commerce")
    || normalized.includes("food")
    || normalized.includes("restaurant")
  ) {
    return "native_display";
  }

  if (normalized.includes("education") || normalized.includes("edtech")) {
    return "blog";
  }

  if (
    normalized.includes("finance")
    || normalized.includes("banking")
    || normalized.includes("fintech")
    || normalized.includes("news")
    || normalized.includes("media")
  ) {
    return "news";
  }

  return "news";
}

export function resolveCreativePreviewContext(
  analyzerOutput: Record<string, unknown> | null | undefined,
  campaignVertical = "general",
): CreativePreviewContext {
  const creativeVertical = resolveCreativeVertical(analyzerOutput, campaignVertical);
  const templateId = selectProgrammaticTemplateForCreative(analyzerOutput, campaignVertical);

  return {
    creativeVertical,
    templateId,
    verticalLabel: formatVerticalLabel(creativeVertical),
  };
}

export function formatVerticalLabel(vertical: string): string {
  return vertical
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
