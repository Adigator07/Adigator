type ContributionMap = Record<string, number>;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function computeDynamicScore(payload: {
  ctaDetected: boolean;
  ctaStrength: "low" | "medium" | "high";
  hasGoodContrast: boolean;
  hasClearText: boolean;
  isBlurry: boolean;
  hasLowContrast: boolean;
  hasTooMuchText: boolean;
  datasetCalibration: number;
}): { score: number; contributions: ContributionMap } {
  const contributions: ContributionMap = {
    cta: payload.ctaDetected
      ? payload.ctaStrength === "high"
        ? 28
        : payload.ctaStrength === "medium"
          ? 20
          : 12
      : 0,
    contrast: payload.hasGoodContrast ? 18 : payload.hasLowContrast ? -12 : 0,
    clarity: payload.hasClearText ? 18 : -8,
    sharpness: payload.isBlurry ? -15 : 10,
    textDensity: payload.hasTooMuchText ? -12 : 8,
    calibration: clamp(payload.datasetCalibration, -10, 10),
  };

  const total = Object.values(contributions).reduce((sum, value) => sum + value, 35);
  return {
    score: clamp(Math.round(total), 0, 100),
    contributions,
  };
}

function computeSignalConfidence(payload: {
  ctaDetected: boolean;
  textClarityGood: boolean;
  imageQualityGood: boolean;
  contrastGood: boolean;
  layoutGood: boolean;
}): number {
  const signals = [
    payload.ctaDetected,
    payload.textClarityGood,
    payload.imageQualityGood,
    payload.contrastGood,
    payload.layoutGood,
  ];
  const confidence = signals.filter(Boolean).length / signals.length;
  return Number(confidence.toFixed(2));
}

function buildValidationAlerts(payload: {
  fileSizeKB: number;
  size: string;
  supportedSizes: string[];
  isBlurry: boolean;
  contrast: number;
}): string[] {
  const alerts: string[] = [];

  if (payload.fileSizeKB > 5120) {
    alerts.push("File size is high and may affect delivery performance.");
  }

  if (payload.size && payload.supportedSizes.length > 0 && !payload.supportedSizes.includes(payload.size)) {
    alerts.push("Creative size is not in the supported placement list.");
  }

  if (payload.isBlurry) {
    alerts.push("Image appears blurry and may reduce readability.");
  }

  if (payload.contrast < 35) {
    alerts.push("Contrast is low and may hurt accessibility.");
  }

  return alerts;
}

interface AnalyzePayload {
  ctaDetected: boolean;
  ctaStrength: "low" | "medium" | "high";
  hasGoodContrast: boolean;
  hasClearText: boolean;
  isBlurry: boolean;
  hasLowContrast: boolean;
  contrast: number;
  hasTooMuchText: boolean;
  datasetCalibration: number;
  fileSizeKB: number;
  size: string;
  supportedSizes: string[];
  layoutGood: boolean;
  imageQualityGood: boolean;
  textClarityGood: boolean;
}

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as Partial<AnalyzePayload>;

  if (typeof body.ctaDetected !== "boolean" || typeof body.ctaStrength !== "string") {
    return Response.json({ error: "Invalid analysis payload" }, { status: 400 });
  }

  const scoreResult = computeDynamicScore({
    ctaDetected: body.ctaDetected,
    ctaStrength: body.ctaStrength,
    hasGoodContrast: Boolean(body.hasGoodContrast),
    hasClearText: Boolean(body.hasClearText),
    isBlurry: Boolean(body.isBlurry),
    hasLowContrast: Boolean(body.hasLowContrast),
    hasTooMuchText: Boolean(body.hasTooMuchText),
    datasetCalibration: Number(body.datasetCalibration ?? 0),
  });

  const confidence = computeSignalConfidence({
    ctaDetected: body.ctaDetected,
    textClarityGood: Boolean(body.textClarityGood),
    imageQualityGood: Boolean(body.imageQualityGood),
    contrastGood: Boolean(body.hasGoodContrast),
    layoutGood: Boolean(body.layoutGood),
  });

  const issues = buildValidationAlerts({
    fileSizeKB: Number(body.fileSizeKB ?? 0),
    size: String(body.size ?? ""),
    supportedSizes: Array.isArray(body.supportedSizes) ? body.supportedSizes : [],
    isBlurry: Boolean(body.isBlurry),
    contrast: Number(body.contrast ?? 0),
  });

  return Response.json({
    score: scoreResult.score,
    confidence,
    issues,
    contributions: scoreResult.contributions,
  });
}
