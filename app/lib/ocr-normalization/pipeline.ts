import {
  getIntelligenceProfile,
  normalizeCampaignGoal,
  normalizeVertical,
  type CampaignGoal,
  type VerticalKey,
} from "../intelligence-registry";
import { classifyTextBlocks } from "./classifier";
import { detectCta } from "./cta-engine";
import { buildInitialBlocks } from "./grouping";
import { applyHierarchy } from "./hierarchy";
import { buildNormalizedSchema } from "./schema";
import { cleanOcrText } from "./text";
import type { NormalizedOcrResult, RawOcrInput } from "./types";

export interface NormalizeOcrOptions {
  campaignGoal: string;
  vertical: string;
}

export function normalizeOcr(
  input: RawOcrInput,
  options: NormalizeOcrOptions
): NormalizedOcrResult {
  const campaignGoal: CampaignGoal = normalizeCampaignGoal(options.campaignGoal);
  const vertical: VerticalKey = normalizeVertical(options.vertical);
  const intelligenceProfile = getIntelligenceProfile({ campaignGoal, vertical });
  const warnings: string[] = [];

  const { blocks: initialBlocks, imageSize } = buildInitialBlocks(input);
  if (initialBlocks.length === 0) {
    warnings.push("No OCR text blocks were provided or inferred.");
  }
  if (!input.blocks?.length) {
    warnings.push("OCR coordinates unavailable; hierarchy and CTA confidence are reduced.");
  }

  const { blocks: hierarchicalBlocks, hierarchy } = applyHierarchy(initialBlocks);
  const classifiedBlocks = classifyTextBlocks(hierarchicalBlocks, intelligenceProfile);
  const ctaDetection = detectCta(classifiedBlocks, intelligenceProfile);
  const schema = buildNormalizedSchema(classifiedBlocks, ctaDetection);

  return {
    rawText: input.text,
    cleanedText: cleanOcrText(input.text),
    confidence: input.confidence ?? 0,
    imageSize,
    blocks: classifiedBlocks,
    hierarchy,
    schema,
    ctaDetection,
    context: {
      campaignGoal,
      vertical,
      intelligenceProfile,
    },
    warnings,
  };
}
