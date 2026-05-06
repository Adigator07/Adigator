export interface ImageSignalInput {
  brightness: number;
  contrast: number;
  isBlurry: boolean;
  laplacianVariance: number;
  edgeDensity: number;
}

export interface ImageSignalResult {
  brightness: number;
  contrast: number;
  blurScore: number;
  imageQuality: number;
  visibility: number;
  isBlurry: boolean;
  hasGoodContrast: boolean;
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function analyzeImageSignals(input: ImageSignalInput): ImageSignalResult {
  const blurScore = clamp(Math.round((input.laplacianVariance / 300) * 100));
  const qualityPenalty = input.isBlurry ? 22 : 0;
  const contrastPenalty = input.contrast < 30 ? 18 : input.contrast < 40 ? 8 : 0;
  const brightnessPenalty = input.brightness < 22 || input.brightness > 92 ? 10 : 0;

  const imageQuality = clamp(100 - qualityPenalty - contrastPenalty - brightnessPenalty);
  const visibility = clamp(Math.round(input.contrast * 0.6 + input.brightness * 0.25 + input.edgeDensity * 100 * 0.15));

  return {
    brightness: clamp(Math.round(input.brightness)),
    contrast: clamp(Math.round(input.contrast)),
    blurScore,
    imageQuality,
    visibility,
    isBlurry: input.isBlurry,
    hasGoodContrast: input.contrast >= 40,
  };
}
