import type { EngineResult } from "@/app/lib/validation/engineContracts";
import type {
  TechnicalValidationInput,
  TechnicalValidationResult,
} from "@/app/lib/validation/engineContracts";
import { checkUrlHealth } from "@/app/lib/url/healthCheck";

const PROGRAMMATIC_MIN_DIMENSION = 300;
const PROGRAMMATIC_MAX_FILE_MB = 20;

/**
 * Technical Validation Engine — 100% deterministic checks (no AI).
 */
export async function runTechnicalValidation(
  input: TechnicalValidationInput,
): Promise<TechnicalValidationResult> {
  const flags: Array<Record<string, unknown>> = [];

  for (const creative of input.creatives) {
    if (creative.width && creative.height) {
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
    if (creative.fileSize && creative.fileSize > PROGRAMMATIC_MAX_FILE_MB * 1024 * 1024) {
      flags.push({
        id: "creative_file_large",
        severity: "warning",
        module: "technical",
        creativeId: creative.id,
        message: `Creative ${creative.name} exceeds ${PROGRAMMATIC_MAX_FILE_MB}MB.`,
      });
    }
    if (creative.format && !["image/jpeg", "image/png", "image/gif", "image/webp"].includes(creative.format)) {
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
