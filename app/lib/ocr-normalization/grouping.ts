import { boxFromVertices, inferImageSize, normalizeBox } from "./geometry";
import { cleanOcrText, isAllCapsPhrase, normalizeText, tokenize } from "./text";
import type { NormalizedTextBlock, RawOcrInput } from "./types";

function rawLinesFromText(text: string): string[] {
  return text
    .split(/\n+/)
    .map(cleanOcrText)
    .filter((line) => line.length > 0);
}

export function buildInitialBlocks(input: RawOcrInput): {
  blocks: NormalizedTextBlock[];
  imageSize: { width: number; height: number };
} {
  const rawBlocks = input.blocks?.filter((block) => cleanOcrText(block.text).length > 0) ?? [];
  const imageSize = inferImageSize(rawBlocks, input.imageWidth, input.imageHeight);

  if (rawBlocks.length > 0) {
    return {
      imageSize,
      blocks: rawBlocks.map((block, index) => {
        const text = cleanOcrText(block.text);
        const tokens = tokenize(text);
        const box = normalizeBox(boxFromVertices(block.boundingBox?.vertices), imageSize.width, imageSize.height);

        return {
          id: block.id ?? `ocr-block-${index}`,
          rawText: block.text,
          text,
          normalizedText: normalizeText(text),
          tokens,
          confidence: block.confidence ?? input.confidence ?? 0.8,
          box,
          lineIndex: index,
          role: "unknown",
          roleConfidence: 0,
          hierarchyScore: 0,
          features: {
            wordCount: tokens.length,
            charCount: text.replace(/\s/g, "").length,
            isAllCaps: isAllCapsPhrase(text),
            hasPrice: false,
            hasDiscount: false,
            hasCtaPhrase: false,
            hasEmotionalSignal: false,
            hasTrustSignal: false,
            hasLegalSignal: false,
            buttonLikelihood: 0,
          },
        };
      }),
    };
  }

  const lines = rawLinesFromText(input.text);
  return {
    imageSize,
    blocks: lines.map((line, index) => {
      const tokens = tokenize(line);
      return {
        id: `ocr-line-${index}`,
        rawText: line,
        text: line,
        normalizedText: normalizeText(line),
        tokens,
        confidence: input.confidence ?? 0.65,
        box: null,
        lineIndex: index,
        role: "unknown",
        roleConfidence: 0,
        hierarchyScore: 0,
        features: {
          wordCount: tokens.length,
          charCount: line.replace(/\s/g, "").length,
          isAllCaps: isAllCapsPhrase(line),
          hasPrice: false,
          hasDiscount: false,
          hasCtaPhrase: false,
          hasEmotionalSignal: false,
          hasTrustSignal: false,
          hasLegalSignal: false,
          buttonLikelihood: 0,
        },
      };
    }),
  };
}
