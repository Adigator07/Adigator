export type ValidationStatus = "PASS" | "WARNING" | "CRITICAL";
export type IssueType = "technical" | "quality" | "policy";
export type IssueSeverity = "low" | "medium" | "high";

export interface ValidationIssue {
  type: IssueType;
  severity: IssueSeverity;
  message: string;
  recommendation: string;
  scorePenalty?: number;
}

export interface CreativeValidationResult {
  fileName: string;
  width: number;
  height: number;
  fileSizeKB: number;
  format: "JPG" | "PNG" | "HTML5" | "UNKNOWN";
  estimatedLoadTimeMs: number;
  status: ValidationStatus;
  issues: ValidationIssue[];
}

export interface ValidationSummary {
  totalIssues: number;
  criticalCount: number;
  warningCount: number;
  inventoryImpactScore: number;
}

export function validateFileSize(fileSizeKB: number): ValidationIssue[] {
  if (fileSizeKB > 300) {
    return [{
      type: "technical",
      severity: "high",
      message: `File size is ${Math.round(fileSizeKB)}KB, above 300KB.`,
      recommendation: "Compress this creative below 300KB to avoid delivery and loading issues.",
      scorePenalty: 25,
    }];
  }

  if (fileSizeKB > 150) {
    return [{
      type: "technical",
      severity: "medium",
      message: `File size is ${Math.round(fileSizeKB)}KB, above 150KB recommended limit.`,
      recommendation: "Optimize compression to improve load speed and viewability.",
      scorePenalty: 10,
    }];
  }

  return [];
}

function deriveStatus(issues: ValidationIssue[]): ValidationStatus {
  if (issues.some((issue) => issue.severity === "high")) return "CRITICAL";
  if (issues.some((issue) => issue.severity === "medium")) return "WARNING";
  return "PASS";
}

function estimateLoadTimeMs(fileSizeKB: number): number {
  const kbPerSecond = 125;
  return Math.round((fileSizeKB / kbPerSecond) * 1000);
}

export function calculateInventoryScore(results: CreativeValidationResult[]): number {
  if (!results.length) return 100;
  const total = results.reduce((acc, result) => {
    const totalPenalty = result.issues.reduce((sum, issue) => sum + (issue.scorePenalty || 0), 0);
    return acc + Math.max(0, 100 - totalPenalty);
  }, 0);
  return Math.max(0, Math.min(100, Math.round(total / results.length)));
}

export function buildValidationSummary(results: CreativeValidationResult[]): ValidationSummary {
  const totalIssues = results.reduce((sum, result) => sum + result.issues.length, 0);
  const criticalCount = results.filter((result) => result.status === "CRITICAL").length;
  const warningCount = results.filter((result) => result.status === "WARNING").length;

  return {
    totalIssues,
    criticalCount,
    warningCount,
    inventoryImpactScore: calculateInventoryScore(results),
  };
}

export async function validateCreativeAsset(params: {
  file: File;
  image: HTMLImageElement;
  platform?: string;
  imageDataUrl: string;
}): Promise<CreativeValidationResult> {
  const { file, image } = params;
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const fileSizeKB = Math.round((file.size / 1024) * 10) / 10;
  const estimatedLoadTimeMs = estimateLoadTimeMs(fileSizeKB);
  const issues = validateFileSize(fileSizeKB);

  return {
    fileName: file.name,
    width,
    height,
    fileSizeKB,
    format: "UNKNOWN",
    estimatedLoadTimeMs,
    status: deriveStatus(issues),
    issues,
  };
}
