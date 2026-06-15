import type { ValidationFlag } from "@/app/types/validation";

const REQUIRED_UTMS = ["utm_source", "utm_medium", "utm_campaign"] as const;

export function validateUtmParams(url: string): ValidationFlag[] {
  const flags: ValidationFlag[] = [];

  if (!url?.trim()) return flags;

  let parsed: URL;
  try {
    const normalized = url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`;
    parsed = new URL(normalized);
  } catch {
    return flags;
  }

  const missing = REQUIRED_UTMS.filter((p) => !parsed.searchParams.has(p));
  if (missing.length === REQUIRED_UTMS.length) {
    flags.push({
      id: "utm_all_missing",
      severity: "warning",
      module: "url",
      platform: "all",
      message: "No UTM parameters detected on landing page URL.",
      recommendation: "Add utm_source, utm_medium, and utm_campaign for attribution tracking.",
    });
  } else if (missing.length > 0) {
    flags.push({
      id: "utm_partial",
      severity: "warning",
      module: "url",
      platform: "all",
      message: `Missing UTM parameters: ${missing.join(", ")}.`,
      recommendation: "Complete UTM tagging for full campaign attribution.",
    });
  } else {
    flags.push({
      id: "utm_complete",
      severity: "pass",
      module: "url",
      platform: "all",
      message: "Required UTM parameters present (source, medium, campaign).",
    });
  }

  for (const param of [...parsed.searchParams.entries()]) {
    const [key, value] = param;
    if (!key.startsWith("utm_")) continue;
    if (/\s/.test(value)) {
      flags.push({
        id: `utm_space_${key}`,
        severity: "warning",
        module: "url",
        platform: "all",
        message: `UTM parameter "${key}" contains spaces.`,
        recommendation: "Use underscores or hyphens instead of spaces in UTM values.",
      });
    }
    if (value !== value.toLowerCase() && /[A-Z]/.test(value)) {
      flags.push({
        id: `utm_case_${key}`,
        severity: "warning",
        module: "url",
        platform: "all",
        message: `UTM parameter "${key}" uses mixed case.`,
        recommendation: "Use lowercase UTM values for consistent reporting.",
      });
    }
  }

  return flags;
}
