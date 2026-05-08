/**
 * Preview Engine — Core Selector & Assembler
 * Deterministic logic: maps inputs → environment family, slot type, template name.
 */

import type {
  PreviewEngineInput,
  PreviewEngineOutput,
  EnvironmentFamily,
  SlotType,
  DeviceType,
  ValidationResult,
  GeneratedEnvironment,
} from "./types";

// ── Environment family selector ────────────────────────────────────────────────
export function selectEnvironmentFamily(
  vertical: string,
  goal: string
): EnvironmentFamily {
  const v = vertical.toLowerCase().replace(/[_\s/]+/g, "");
  if (v.includes("news") || v.includes("media") || v.includes("editorial")) return "news";
  if (v.includes("luxury") || v.includes("premium") || v.includes("fashion")) return "luxury";
  if (v.includes("sport")) return "sports";
  if (v.includes("gaming") || v.includes("game")) return "gaming";
  if (v.includes("finance") || v.includes("banking") || v.includes("fintech")) return "finance";
  if (v.includes("travel") || v.includes("hotel") || v.includes("booking")) return "travel";
  if (v.includes("saas") || v.includes("software") || v.includes("enterprise")) return "saas";
  if (
    v.includes("ecommerce") ||
    v.includes("retail") ||
    v.includes("shop") ||
    v.includes("food") ||
    v.includes("restaurant")
  )
    return "commerce";
  if (v.includes("social")) return "social";
  if (v.includes("health") || v.includes("medical")) return "news"; // health ads fit editorial
  if (v.includes("education") || v.includes("edtech")) return "saas";
  if (v.includes("automotive") || v.includes("car")) return "luxury";
  if (goal === "conversion") return "commerce";
  return "news";
}

// ── Slot type selector ─────────────────────────────────────────────────────────
export function selectSlotType(
  creativeSize: string,
  environment: EnvironmentFamily
): SlotType {
  if (!creativeSize || !creativeSize.includes("x")) return "inline";
  const [w, h] = creativeSize.split("x").map(Number);
  if (!w || !h) return "inline";
  const ratio = w / h;

  // Very wide horizontals → leaderboard
  if (ratio >= 5) return "leaderboard";
  // Tall verticals → sidebar
  if (ratio <= 0.4) return "sidebar";

  // Environment-specific overrides
  if (environment === "gaming") return "interstitial";
  if (environment === "saas") return "dashboard-module";
  if (environment === "social") return "feed-card";
  if (environment === "commerce" && Math.abs(ratio - 1) < 0.25) return "product-tile";
  if (environment === "news" && Math.abs(ratio - 1) < 0.25) return "inline";
  if (ratio > 2.5) return "leaderboard";
  if (ratio < 0.6) return "sidebar";
  return "inline";
}

// ── Template name builder ──────────────────────────────────────────────────────
export function buildTemplateName(
  environment: EnvironmentFamily,
  device: DeviceType,
  goal: string
): string {
  const deviceStr = device === "desktop" ? "desktop" : device === "tablet" ? "tablet" : "mobile";
  const goalSlug =
    goal === "conversion" ? "cta" : goal === "consideration" ? "mid" : "editorial";
  return `${environment}-${deviceStr}-${goalSlug}-v1`;
}

// ── Device inferrer ────────────────────────────────────────────────────────────
export function inferDevice(creativeSize?: string): DeviceType {
  if (!creativeSize || !creativeSize.includes("x")) return "desktop";
  const [w] = creativeSize.split("x").map(Number);
  if (w <= 480) return "mobile";
  if (w <= 768) return "tablet";
  return "desktop";
}

// ── Slot descriptions ──────────────────────────────────────────────────────────
const SLOT_DESCRIPTIONS: Record<SlotType, string> = {
  inline: "Placed inline within editorial body content between paragraphs",
  sidebar: "Positioned in the right-rail sidebar alongside main content",
  sticky: "Persistent placement that remains visible while user scrolls",
  "feed-card": "Native sponsored card flowing inside social or content feed",
  interstitial: "Full-screen takeover shown on app or content transition",
  "product-tile": "Sponsored product card embedded inside commerce product grid",
  "native-recommendation": "Editorial recommendation module at bottom of article",
  "dashboard-module": "Feature or upgrade card embedded in SaaS product dashboard",
  leaderboard: "Horizontal banner spanning the top or bottom of content area",
  banner: "Standard display banner in a defined placement zone",
};

// ── Injection notes ────────────────────────────────────────────────────────────
function buildInjectionNotes(slotType: SlotType, size?: string): string {
  if (slotType === "leaderboard")
    return "Full-width placement — maintain 8px vertical margin above and below";
  if (slotType === "sidebar")
    return "Right-rail float — 12px safe margins all sides, keep above the fold";
  if (slotType === "feed-card")
    return "Match host card padding and border-radius; add 'Sponsored' label at top";
  if (slotType === "interstitial")
    return "Center in viewport, constrain max-width, include close/skip affordance";
  if (slotType === "product-tile")
    return "Match product grid card dimensions; label as 'Sponsored' in corner";
  if (slotType === "dashboard-module")
    return "Use same card shadow and border-radius as surrounding dashboard modules";
  return "Insert between content blocks with 16px vertical margin, centered";
}

// ── Responsive state builder ───────────────────────────────────────────────────
function buildResponsiveStates(): PreviewEngineOutput["responsiveStates"] {
  return [
    { device: "desktop", frameSize: "1280×720", notes: "Full layout with sidebar and multi-column grid" },
    { device: "tablet", frameSize: "768×1024", notes: "Single column, sidebar collapsed beneath content" },
    { device: "mobile", frameSize: "375×812", notes: "Stacked layout, full-width ad unit, larger tap targets" },
  ];
}

// ── Validation ─────────────────────────────────────────────────────────────────
function validateConfiguration(
  analyzerOutput: Record<string, unknown>,
  riskFlags: string[]
): ValidationResult {
  const hasCTA = !!(
    analyzerOutput?.ctaPhrase ||
    analyzerOutput?.cta ||
    analyzerOutput?.ctaText ||
    analyzerOutput?.ctaDetected
  );
  const hasLogo = analyzerOutput?.logoPresent !== false;
  const flags = riskFlags.map((f) => f.toLowerCase());
  const crowded = flags.some((f) => f.includes("clutter") || f.includes("crowd") || f.includes("busy"));
  const cropRisk = flags.some((f) => f.includes("crop") || f.includes("edge") || f.includes("cut"));
  const blurry = flags.some((f) => f.includes("blur") || f.includes("sharp"));

  const ctaV = hasCTA ? "pass" : ("warn" as const);
  const logoV = hasLogo ? "pass" : ("warn" as const);
  const textV = crowded || blurry ? "warn" : ("pass" as const);
  const cropV = cropRisk ? "warn" : ("pass" as const);
  const anyWarn = ctaV === "warn" || logoV === "warn" || textV === "warn" || cropV === "warn";

  return {
    ctaVisibility: ctaV,
    logoVisibility: logoV,
    textOverflow: textV,
    croppingRisk: cropV,
    contextFit: "pass",
    overallStatus: anyWarn ? "warning" : "pass",
  };
}

// ── Recommendations builder ────────────────────────────────────────────────────
function buildRecommendations(
  validation: ValidationResult,
  input: PreviewEngineInput
): string[] {
  const recs: string[] = [];
  if (validation.ctaVisibility === "warn")
    recs.push("Add a clear CTA phrase to drive action — audiences need a direction in this environment.");
  if (validation.logoVisibility === "warn")
    recs.push("Ensure your logo is visible in the safe area — brand recognition is critical for recall.");
  if (validation.textOverflow === "warn")
    recs.push("Reduce visual clutter — fewer, larger text elements improve legibility at placement size.");
  if (validation.croppingRisk === "warn")
    recs.push("Move key creative elements toward the center — edge content risks being cropped.");
  if (recs.length === 0)
    recs.push("Creative is well-structured for this environment — safe to launch.");
  return recs;
}

// ── Main assembler ─────────────────────────────────────────────────────────────
export function buildPreviewEngineOutput(
  input: PreviewEngineInput,
  generatedEnv: GeneratedEnvironment
): PreviewEngineOutput {
  const device = input.device ?? inferDevice(input.creativeSize);
  const environment = selectEnvironmentFamily(input.vertical, input.goal);
  const slotType = selectSlotType(input.creativeSize ?? "300x250", environment);
  const primaryTemplate = buildTemplateName(environment, device, input.goal);
  const riskFlags = input.riskFlags ?? [];
  const analyzerOutput = input.analyzerOutput ?? {};

  const creativeAnalysis = {
    creativeType: input.creativeType ?? "display",
    creativeSize: input.creativeSize ?? "300x250",
    detectedElements: [
      input.headline ? "headline" : null,
      input.ctaText ? "cta" : null,
      input.logoPresent !== false ? "logo" : null,
    ].filter(Boolean) as string[],
    riskFlags,
  };

  const creativeMapping = {
    placementType:
      slotType === "leaderboard"
        ? "horizontal-banner"
        : slotType === "sidebar"
        ? "vertical-sidebar"
        : "content-placement",
    slotType,
    slotDescription: SLOT_DESCRIPTIONS[slotType],
    injectionNotes: buildInjectionNotes(slotType, input.creativeSize),
  };

  const validation = validateConfiguration(analyzerOutput, riskFlags);
  const recommendations = buildRecommendations(validation, input);

  return {
    previewDecision: {
      environment,
      primaryTemplate,
      fallbackTemplates: [
        buildTemplateName("news", device, input.goal),
        buildTemplateName("commerce", device, input.goal),
      ].filter((t) => t !== primaryTemplate),
      device,
      reason: `${input.vertical} vertical mapped to ${environment} environment for ${input.goal} goal; ${slotType} slot selected for ${input.creativeSize ?? "300x250"} creative.`,
    },
    generatedEnvironment: generatedEnv,
    creativeAnalysis,
    creativeMapping,
    responsiveStates: buildResponsiveStates(),
    validation,
    recommendations,
    exportTargets: ["PNG", "JPG", "PPTX", "PDF"],
  };
}
