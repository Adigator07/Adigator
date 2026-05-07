import { PLATFORM_SIZES } from "./localAnalyzer";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeStatus(issues) {
  if (issues.some((issue) => issue.severity === "high")) return "CRITICAL";
  if (issues.some((issue) => issue.severity === "medium")) return "WARNING";
  return "PASS";
}

export async function validateCreativeAsset({ file, image, platform }) {
  const size = `${image?.width || 0}x${image?.height || 0}`;
  const supportedSizes = [
    ...(PLATFORM_SIZES[platform]?.desktop || []),
    ...(PLATFORM_SIZES[platform]?.mobile || []),
  ];
  const issues = [];

  if (!supportedSizes.includes(size)) {
    issues.push({
      type: "inventory",
      severity: "high",
      message: `${size} is not supported for ${platform}.`,
      recommendation: "Use one of the supported placement sizes shown in setup.",
      scorePenalty: 40,
    });
  }

  if ((file?.size || 0) > 5 * 1024 * 1024) {
    issues.push({
      type: "weight",
      severity: "medium",
      message: "File size is larger than 5MB.",
      recommendation: "Compress the asset before uploading for faster review and delivery.",
      scorePenalty: 12,
    });
  }

  if ((image?.width || 0) < 300 || (image?.height || 0) < 250) {
    issues.push({
      type: "resolution",
      severity: "medium",
      message: "Resolution is low for modern display placements.",
      recommendation: "Export at a larger source size to improve rendering clarity.",
      scorePenalty: 10,
    });
  }

  const score = clamp(100 - issues.reduce((sum, issue) => sum + (issue.scorePenalty || 0), 0), 0, 100);

  return {
    valid: issues.every((issue) => issue.severity !== "high"),
    score,
    issues,
    status: normalizeStatus(issues),
    size,
    supportedSizes,
  };
}

export function buildValidationSummary(validations = []) {
  const issueList = validations.flatMap((validation) => validation?.issues || []);
  const criticalCount = issueList.filter((issue) => issue.severity === "high").length;
  const warningCount = issueList.filter((issue) => issue.severity === "medium").length;
  const totalPenalty = issueList.reduce((sum, issue) => sum + (issue.scorePenalty || 0), 0);

  return {
    totalIssues: issueList.length,
    criticalCount,
    warningCount,
    inventoryImpactScore: clamp(100 - totalPenalty, 0, 100),
  };
}