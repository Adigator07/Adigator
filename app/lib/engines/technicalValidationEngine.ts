import type { EngineResult } from "@/app/lib/validation/engineContracts";
import type {
  TechnicalValidationInput,
  TechnicalValidationResult,
} from "@/app/lib/validation/engineContracts";
import { checkUrlHealth } from "@/app/lib/url/healthCheck";
import { FILE_SIZE_LIMITS } from "@/app/constants/programmaticSpecs";
import { DEMAND_GEN_IMAGE_REQUIREMENTS } from "@/app/constants/googleSpecs";

const PROGRAMMATIC_MIN_DIMENSION = 300;
const GENERIC_MAX_FILE_BYTES = 20 * 1024 * 1024;

type TechnicalCreative = TechnicalValidationInput["creatives"][number];
type ProgrammaticAssetKind = keyof typeof FILE_SIZE_LIMITS;

export function resolveProgrammaticAssetKind(creative: TechnicalCreative): ProgrammaticAssetKind {
  if (creative.assetKind && creative.assetKind in FILE_SIZE_LIMITS) return creative.assetKind;
  const format = String(creative.format || "").toLowerCase();
  if (format === "image/gif") return "animated_gif";
  if (format === "application/zip" || format === "application/x-zip-compressed") return "html5_zip";
  if (/rich.?media/.test(format)) return "rich_media";
  return "static_image";
}

export function getTechnicalFileSizeLimit(
  platform: string,
  creative: TechnicalCreative,
  campaignType?: string,
): number {
  if (platform === "programmatic") {
    return FILE_SIZE_LIMITS[resolveProgrammaticAssetKind(creative)];
  }
  if (platform === "google_ads" && campaignType === "demand_gen") {
    return DEMAND_GEN_IMAGE_REQUIREMENTS.max_file_size_bytes;
  }
  return GENERIC_MAX_FILE_BYTES;
}

/**
 * Technical Validation Engine — 100% deterministic checks (no AI).
 */
export async function runTechnicalValidation(
  input: TechnicalValidationInput,
): Promise<TechnicalValidationResult> {
  const flags: Array<Record<string, unknown>> = [];

  for (const creative of input.creatives) {
    if (input.platform === "programmatic" && creative.width && creative.height) {
      if (creative.width < PROGRAMMATIC_MIN_DIMENSION || creative.height < PROGRAMMATIC_MIN_DIMENSION) {
        flags.push({
          id: "creative_dimension_small",
          severity: "warning",
          module: "technical",
          creativeId: creative.id,
          message: `Creative ${creative.name} is below ${PROGRAMMATIC_MIN_DIMENSION}px on one axis.`,
        });
      }
    }
    const fileSizeLimit = getTechnicalFileSizeLimit(input.platform, creative, input.campaignType);
    if (creative.fileSize && creative.fileSize > fileSizeLimit) {
      const assetKind = input.platform === "programmatic"
        ? resolveProgrammaticAssetKind(creative).replace(/_/g, " ")
        : input.campaignType === "demand_gen"
          ? "Demand Gen image"
          : "creative";
      flags.push({
        id: "creative_file_weight_exceeded",
        severity: input.platform === "programmatic" ? "error" : "warning",
        module: "technical",
        creativeId: creative.id,
        limitBytes: fileSizeLimit,
        actualBytes: creative.fileSize,
        assetKind,
        message: `Creative ${creative.name} exceeds the ${Math.round(fileSizeLimit / 1024)}KB ${assetKind} limit.`,
      });
    }
    const supportedFormats = input.platform === "programmatic"
      ? ["image/jpeg", "image/png", "image/gif", "image/webp", "application/zip", "application/x-zip-compressed"]
      : input.platform === "google_ads" && input.campaignType === "demand_gen"
        ? [...DEMAND_GEN_IMAGE_REQUIREMENTS.allowed_mime_types]
        : ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (creative.format && !supportedFormats.includes(creative.format)) {
      flags.push({
        id: "creative_format_unsupported",
        severity: "error",
        module: "technical",
        creativeId: creative.id,
        message: `Unsupported image format for ${creative.name}.`,
      });
    }
  }

  if (input.landingUrl?.trim()) {
    const health = await checkUrlHealth(input.landingUrl);
    for (const flag of health.flags) {
      flags.push({ ...flag, module: flag.module || "technical" });
    }
  } else if (input.platform !== "programmatic") {
    flags.push({
      id: "landing_url_missing",
      severity: "warning",
      module: "technical",
      message: "No landing page URL provided for technical validation.",
    });
  }

  if (input.utmParameters) {
    const missing = ["utm_source", "utm_medium", "utm_campaign"].filter(
      (key) => !String(input.utmParameters?.[key] || "").trim(),
    );
    if (missing.length > 0) {
      flags.push({
        id: "utm_incomplete",
        severity: "warning",
        module: "technical",
        message: `Missing recommended UTM parameters: ${missing.join(", ")}.`,
      });
    }
  }

  const errorCount = flags.filter((f) => f.severity === "error").length;
  const warningCount = flags.filter((f) => f.severity === "warning").length;
  const passed = errorCount === 0;
  const score = Math.max(0, 100 - errorCount * 25 - warningCount * 8);

  return { passed, flags, score };
}

export function createTechnicalValidationEngine() {
  return {
    engineId: "technical" as const,
    async validate(input: TechnicalValidationInput): Promise<EngineResult<TechnicalValidationResult>> {
      try {
        const data = await runTechnicalValidation(input);
        return {
          status: data.passed ? "success" : "degraded",
          data,
          retriesUsed: 0,
        };
      } catch (error) {
        return {
          status: "failed",
          data: null,
          error: error instanceof Error ? error.message : String(error),
          retriesUsed: 0,
        };
      }
    },
  };
}
