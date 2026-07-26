import type {
  CampaignReadinessReport,
  CreativeValidationInput,
  ModuleResult,
  ReadinessLevel,
  ValidationFlag,
  ValidationPlatform,
} from "@/app/types/validation";
import { PROGRAMMATIC_OBJECTIVE_REQUIREMENTS, FILE_SIZE_LIMITS } from "@/app/constants/programmaticSpecs";
import { META_OBJECTIVE_REQUIREMENTS, META_TEXT_RULES } from "@/app/constants/metaSpecs";
import {
  GOOGLE_OBJECTIVE_REQUIREMENTS,
  RDA_ASSET_REQUIREMENTS,
  RDA_PREVIEW_LAYOUTS,
} from "@/app/constants/googleSpecs";
import {
  convertLegacyValidationIssues,
  detectDuplicates,
  detectWrongCreativeFlags,
} from "@/app/lib/image/duplicateDetector";
import type { UrlHealthResult } from "@/app/lib/url/healthCheck";
import { validateUtmParams } from "@/app/lib/url/utmValidator";

function parseSize(size?: string) {
  if (!size) return null;
  const [w, h] = size.split("x").map(Number);
  if (!w || !h) return null;
  return { width: w, height: h, ratio: w / h };
}

export function calculateReadinessScore(flags: ValidationFlag[]): {
  score: number;
  level: ReadinessLevel;
} {
  let score = 100;
  for (const flag of flags) {
    if (flag.severity === "error") score -= 15;
    if (flag.severity === "warning") score -= 5;
  }
  score = Math.max(0, score);
  let level: ReadinessLevel = "ready";
  if (score < 60) level = "not_ready";
  else if (score < 85) level = "review_needed";
  return { score, level };
}

function moduleFromFlags(flags: ValidationFlag[], label: string, error?: string): ModuleResult {
  const hasError = flags.some((f) => f.severity === "error");
  const hasWarning = flags.some((f) => f.severity === "warning");
  return {
    label,
    flags,
    status: error ? "skipped" : hasError ? "error" : hasWarning ? "warning" : "pass",
    error,
  };
}

export function validateProgrammaticCreatives(
  creatives: CreativeValidationInput[],
): ValidationFlag[] {
  const flags: ValidationFlag[] = [];
  for (const creative of creatives) {
    flags.push(...convertLegacyValidationIssues(creative, "programmatic"));
    const dims = parseSize(creative.size);
    const mime = String(creative.mimeType || "").toLowerCase();
    const assetKind = mime === "image/gif"
      ? "animated_gif"
      : mime === "application/zip" || mime === "application/x-zip-compressed"
        ? "html5_zip"
        : "static_image";
    const weightLimit = FILE_SIZE_LIMITS[assetKind];
    if (dims && creative.fileSize && creative.fileSize > weightLimit) {
      flags.push({
        id: `prog_weight_${creative.id}`,
        severity: "error",
        module: "creative",
        platform: "programmatic",
        message: `"${creative.name}" exceeds the ${Math.round(weightLimit / 1024)}KB programmatic ${assetKind.replace(/_/g, " ")} limit (${Math.round(creative.fileSize / 1024)}KB).`,
        recommendation: `Compress to ≤${Math.round(weightLimit / 1024)}KB before launch.`,
      });
    }
  }
  if (creatives.every((c) => c.validation?.valid)) {
    flags.push({
      id: "prog_creatives_pass",
      severity: "pass",
      module: "creative",
      platform: "programmatic",
      message: "All creatives pass platform dimension and format checks.",
    });
  }
  return flags;
}

/**
 * Video creative validation flags. Reads the video-native validation issues produced by
 * `buildVideoUploadValidation` — NO banner/RDA/dimension/display logic is applied.
 */
export function validateVideoCreatives(
  creatives: CreativeValidationInput[],
  platform: "meta" | "google" | "programmatic",
): ValidationFlag[] {
  const flags: ValidationFlag[] = [];
  const platformLabel =
    platform === "google" ? "Google" : platform === "programmatic" ? "Programmatic" : "Meta";
  for (const creative of creatives) {
    const issues = creative.validation?.issues || [];
    if (!issues.length && creative.validation?.valid !== false) {
      flags.push({
        id: `video_ok_${creative.id}`,
        severity: "pass",
        module: "creative",
        platform,
        message: `"${creative.name}" passes ${platformLabel} video ad specs.`,
      });
      continue;
    }
    for (const [index, issue] of issues.entries()) {
      flags.push({
        id: `video_${creative.id}_${index}`,
        severity: issue.severity === "high" ? "error" : "warning",
        module: "creative",
        platform,
        message: issue.message || `"${creative.name}" video validation issue`,
        recommendation: issue.recommendation,
        detail: issue.type,
      });
    }
  }
  return flags;
}

export function validateMetaCreatives(
  creatives: CreativeValidationInput[],
  headlines?: string[],
  descriptions?: string[],
): ValidationFlag[] {
  const flags: ValidationFlag[] = [];
  for (const creative of creatives) {
    flags.push(...convertLegacyValidationIssues(creative, "meta"));
    const dims = parseSize(creative.size);
    if (dims) {
      const isStoryRatio = dims.ratio >= 0.5 && dims.ratio <= 0.6;
      const isFeedRatio = dims.ratio >= 0.9 && dims.ratio <= 2.0;
      if (!isStoryRatio && !isFeedRatio) {
        flags.push({
          id: `meta_ratio_${creative.id}`,
          severity: "warning",
          module: "placement",
          platform: "meta",
          message: `"${creative.name}" aspect ratio may crop poorly on Feed or Stories.`,
          recommendation: "Use 1:1, 4:5, or 9:16 assets for Meta placements.",
        });
      } else {
        flags.push({
          id: `meta_ratio_ok_${creative.id}`,
          severity: "pass",
          module: "placement",
          platform: "meta",
          message: `"${creative.name}" fits common Meta placement ratios.`,
        });
      }
    }
  }

  for (const [i, headline] of (headlines || []).entries()) {
    if (headline.length > META_TEXT_RULES.headline_max) {
      flags.push({
        id: `meta_headline_len_${i}`,
        severity: "warning",
        module: "creative",
        platform: "meta",
        message: `Headline ${i + 1} exceeds ${META_TEXT_RULES.headline_max} chars — will truncate in feed.`,
        recommendation: `Shorten to ≤${META_TEXT_RULES.headline_max} characters.`,
      });
    }
  }

  for (const [i, desc] of (descriptions || []).entries()) {
    if (desc.length > META_TEXT_RULES.description_max) {
      flags.push({
        id: `meta_desc_len_${i}`,
        severity: "warning",
        module: "creative",
        platform: "meta",
        message: `Description ${i + 1} exceeds ${META_TEXT_RULES.description_max} chars.`,
        recommendation: `Shorten to ≤${META_TEXT_RULES.description_max} characters.`,
      });
    }
  }

  return flags;
}

export function validateGoogleCreatives(
  creatives: CreativeValidationInput[],
  headlines?: string[],
  descriptions?: string[],
): ValidationFlag[] {
  const flags: ValidationFlag[] = [];
  for (const creative of creatives) {
    flags.push(...convertLegacyValidationIssues(creative, "google"));
  }

  const hasLandscape = creatives.some((c) => {
    const d = parseSize(c.size);
    return d && d.ratio >= 1.85 && d.ratio <= 1.98;
  });
  const hasSquare = creatives.some((c) => {
    const d = parseSize(c.size);
    return d && d.ratio >= 0.95 && d.ratio <= 1.05;
  });

  if (!hasLandscape) {
    flags.push({
      id: "google_rda_no_landscape",
      severity: "warning",
      module: "creative",
      platform: "google",
      message: "No landscape RDA asset (1.91:1) detected.",
      recommendation: "Upload a 1200×628 or 600×314 landscape image for Responsive Display Ads.",
    });
  } else {
    flags.push({
      id: "google_rda_landscape_ok",
      severity: "pass",
      module: "creative",
      platform: "google",
      message: "Landscape RDA-compatible asset present.",
    });
  }

  if (!hasSquare) {
    flags.push({
      id: "google_rda_no_square",
      severity: "warning",
      module: "creative",
      platform: "google",
      message: "No square RDA asset (1:1) detected.",
      recommendation: "Upload a square image for additional GDN inventory.",
    });
  }

  const headlineCount = (headlines || []).filter(Boolean).length;
  if (headlineCount < 3) {
    flags.push({
      id: "google_rda_headline_count",
      severity: "warning",
      module: "creative",
      platform: "google",
      message: `Only ${headlineCount} headline(s) provided — RDA recommends at least 3.`,
      recommendation: "Add more short headlines (≤30 chars) for ad combination testing.",
    });
  }

  for (const [i, headline] of (headlines || []).entries()) {
    if (headline.length > RDA_ASSET_REQUIREMENTS.headlines.short.max_chars) {
      flags.push({
        id: `google_headline_len_${i}`,
        severity: "warning",
        module: "creative",
        platform: "google",
        message: `Headline ${i + 1} exceeds ${RDA_ASSET_REQUIREMENTS.headlines.short.max_chars} chars.`,
      });
    }
  }

  const descCount = (descriptions || []).filter(Boolean).length;
  if (descCount < 2) {
    flags.push({
      id: "google_rda_desc_count",
      severity: "warning",
      module: "creative",
      platform: "google",
      message: "Fewer than 2 descriptions — RDA recommends at least 2.",
    });
  }

  const missingLayouts = RDA_PREVIEW_LAYOUTS.filter((layout) => {
    const uses = layout.uses as readonly string[];
    if (uses.includes("image_landscape") && !hasLandscape) return true;
    if (uses.includes("image_square") && !hasSquare) return true;
    return false;
  });

  if (missingLayouts.length > 0) {
    flags.push({
      id: "google_rda_layout_gaps",
      severity: "warning",
      module: "placement",
      platform: "google",
      message: `${missingLayouts.length} RDA layout(s) cannot render fully with current assets.`,
      detail: missingLayouts.map((l) => l.name).join(", "),
      recommendation: "Add missing landscape/square assets to maximize GDN coverage.",
    });
  }

  return flags;
}

export function validateCampaignAlignment(
  platform: ValidationPlatform,
  objective: string,
  urlHealth: UrlHealthResult | null,
  _campaignName: string,
  _vertical?: string,
  _creativeNames?: string[],
): ValidationFlag[] {
  const flags: ValidationFlag[] = [];
  const objKey = objective?.toLowerCase().replace(/\s+/g, "_") || "awareness";

  if (platform === "programmatic" || platform === "all") {
    const req = PROGRAMMATIC_OBJECTIVE_REQUIREMENTS[objKey] || PROGRAMMATIC_OBJECTIVE_REQUIREMENTS.awareness;
    if (req.required.includes("url") && !urlHealth?.finalUrl) {
      flags.push({
        id: "align_prog_url_required",
        severity: "error",
        module: "alignment",
        platform: "programmatic",
        message: "Landing page URL required for this campaign objective.",
        recommendation: req.note,
      });
    }
    if (req.required.includes("form_or_phone") && urlHealth) {
      if (!urlHealth.hasForm && !urlHealth.hasPhone) {
        flags.push({
          id: "align_prog_lead_gen",
          severity: "error",
          module: "alignment",
          platform: "programmatic",
          message: "Lead generation objective requires a form or phone number on landing page.",
          recommendation: req.note,
        });
      } else {
        flags.push({
          id: "align_prog_lead_gen_ok",
          severity: "pass",
          module: "alignment",
          platform: "programmatic",
          message: "Landing page supports lead generation (form or phone detected).",
        });
      }
    }
    if (req.required.includes("product_or_cta") && urlHealth && !urlHealth.hasBuySignal) {
      flags.push({
        id: "align_prog_conversion",
        severity: "warning",
        module: "alignment",
        platform: "programmatic",
        message: "No buy/shop CTA detected on landing page for conversion objective.",
        recommendation: req.note,
      });
    }
  }

  if (platform === "meta" || platform === "all") {
    const req = META_OBJECTIVE_REQUIREMENTS[objKey] || META_OBJECTIVE_REQUIREMENTS.awareness;
    if (req.required.includes("url") && !urlHealth?.finalUrl) {
      flags.push({
        id: "align_meta_url_required",
        severity: "warning",
        module: "alignment",
        platform: "meta",
        message: "Landing page URL recommended for this Meta objective.",
        recommendation: req.note,
      });
    }
    if (req.required.includes("app_store_url") && urlHealth && !urlHealth.hasAppStoreLink) {
      flags.push({
        id: "align_meta_app",
        severity: "error",
        module: "alignment",
        platform: "meta",
        message: "App install objective requires App Store or Play Store link.",
        recommendation: req.note,
      });
    }
  }

  if (platform === "google" || platform === "all") {
    const req = GOOGLE_OBJECTIVE_REQUIREMENTS[objKey] || GOOGLE_OBJECTIVE_REQUIREMENTS.awareness;
    if (req.url_required && !urlHealth?.finalUrl) {
      flags.push({
        id: "align_google_url_required",
        severity: "error",
        module: "alignment",
        platform: "google",
        message: "Final URL required for this Google Ads objective.",
        recommendation: req.note,
      });
    }
    if (req.landing_page_needs.includes("form") && urlHealth && !urlHealth.hasForm) {
      flags.push({
        id: "align_google_form",
        severity: "error",
        module: "alignment",
        platform: "google",
        message: "Lead objective requires a visible form on the landing page.",
        recommendation: req.note,
      });
    }
    if (req.landing_page_needs.includes("app_store_link") && urlHealth && !urlHealth.hasAppStoreLink) {
      flags.push({
        id: "align_google_app",
        severity: "error",
        module: "alignment",
        platform: "google",
        message: "App promotion requires App Store or Play Store URL.",
        recommendation: req.note,
      });
    }
  }

  // Category keyword heuristics removed: they caused false "vertical not aligned"
  // warnings that contradicted Step 3 Analysis for the same landing page.

  return flags;
}

export function buildCampaignReadinessReport(params: {
  sessionId: string;
  platform: "programmatic" | "google_ads" | "meta_ads";
  objective: string;
  campaignName: string;
  vertical?: string;
  creatives: CreativeValidationInput[];
  urlHealth: UrlHealthResult | null;
  headlines?: string[];
  descriptions?: string[];
}): CampaignReadinessReport {
  const platformKey: ValidationPlatform =
    params.platform === "google_ads"
      ? "google"
      : params.platform === "meta_ads"
        ? "meta"
        : "programmatic";

  // Video creatives are validated by the video-native pipeline and must never run through
  // the image/display (Responsive Display) validators.
  const videoCreatives = params.creatives.filter((c) => c.mediaType === "video");
  const displayCreatives = params.creatives.filter((c) => c.mediaType !== "video");

  const displayFlags =
    displayCreatives.length === 0
      ? []
      : platformKey === "google"
        ? validateGoogleCreatives(displayCreatives, params.headlines, params.descriptions)
        : platformKey === "meta"
          ? validateMetaCreatives(displayCreatives, params.headlines, params.descriptions)
          : validateProgrammaticCreatives(displayCreatives);

  const videoFlags =
    videoCreatives.length === 0
      ? []
      : validateVideoCreatives(
          videoCreatives,
          platformKey === "google" ? "google" : platformKey === "programmatic" ? "programmatic" : "meta",
        );

  const creativeFlags = [...displayFlags, ...videoFlags];

  const { flags: dupFlags } = detectDuplicates(params.creatives);
  const wrongFlags = detectWrongCreativeFlags(
    params.creatives,
    params.campaignName,
    params.vertical,
  );

  const urlFlags = [
    ...(params.urlHealth?.flags || []),
    ...(params.urlHealth?.finalUrl ? validateUtmParams(params.urlHealth.finalUrl) : []),
  ];

  const landingFlags = params.urlHealth
    ? urlFlags.filter((f) => f.module === "landing_page")
    : [];

  const alignmentFlags = validateCampaignAlignment(
    platformKey,
    params.objective,
    params.urlHealth,
    params.campaignName,
    params.vertical,
    params.creatives.map((c) => c.name),
  );

  const allFlags = [
    ...creativeFlags,
    ...dupFlags,
    ...wrongFlags,
    ...urlFlags.filter((f) => f.module === "url"),
    ...landingFlags,
    ...alignmentFlags,
  ];

  const { score, level } = calculateReadinessScore(allFlags);

  const errors = allFlags.filter((f) => f.severity === "error").length;
  const warnings = allFlags.filter((f) => f.severity === "warning").length;

  const topRecommendations = allFlags
    .filter((f) => f.severity !== "pass" && f.recommendation)
    .slice(0, 5)
    .map((f) => f.recommendation as string);

  const summary =
    level === "ready"
      ? `Campaign readiness score ${score}/100 — ready for launch with ${warnings} warning(s).`
      : level === "review_needed"
        ? `Campaign readiness score ${score}/100 — review ${warnings} warning(s) before launch.`
        : `Campaign readiness score ${score}/100 — ${errors} blocking issue(s) must be resolved.`;

  return {
    session_id: params.sessionId,
    platform: params.platform,
    timestamp: new Date().toISOString(),
    overall_score: score,
    readiness_level: level,
    flags: allFlags,
    modules: {
      creative_validation: moduleFromFlags(
        [...creativeFlags, ...wrongFlags],
        "Creative Validation",
      ),
      url_health: moduleFromFlags(
        urlFlags.filter((f) => f.module === "url"),
        "URL Health",
        !params.urlHealth?.finalUrl ? undefined : undefined,
      ),
      landing_page: moduleFromFlags(landingFlags, "Landing Page"),
      campaign_alignment: moduleFromFlags(alignmentFlags, "Campaign Alignment"),
      duplicate_detection: moduleFromFlags(dupFlags, "Duplicate Detection"),
      ...(platformKey === "meta"
        ? {
            placement_simulation: moduleFromFlags(
              creativeFlags.filter((f) => f.module === "placement"),
              "Placement Simulation",
            ),
          }
        : {}),
      ...(platformKey === "google"
        ? {
            asset_coverage: moduleFromFlags(
              creativeFlags.filter((f) => f.module === "placement" || f.id.startsWith("google_rda")),
              "RDA Asset Coverage",
            ),
          }
        : {}),
    },
    summary,
    top_recommendations: topRecommendations,
  };
}
