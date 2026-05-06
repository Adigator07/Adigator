import { computeSignalConfidence } from "@/app/lib/analyzer/confidenceEngine";
import { computeDynamicScore } from "@/app/lib/analyzer/scoringEngine";
import { buildValidationAlerts } from "@/app/lib/analyzer/validator";

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
