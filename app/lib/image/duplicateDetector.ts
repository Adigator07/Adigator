import type { CreativeValidationInput, DuplicatePair, ValidationFlag } from "@/app/types/validation";

export async function hashFileContent(file: Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function hammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) return Infinity;
  let distance = 0;
  for (let i = 0; i < hash1.length; i += 1) {
    if (hash1[i] !== hash2[i]) distance += 1;
  }
  return distance;
}

export function detectDuplicates(
  creatives: CreativeValidationInput[],
): { flags: ValidationFlag[]; pairs: DuplicatePair[] } {
  const flags: ValidationFlag[] = [];
  const pairs: DuplicatePair[] = [];

  for (let i = 0; i < creatives.length; i += 1) {
    for (let j = i + 1; j < creatives.length; j += 1) {
      const a = creatives[i];
      const b = creatives[j];

      if (a.contentHash && b.contentHash && a.contentHash === b.contentHash) {
        pairs.push({
          creativeAId: a.id,
          creativeBId: b.id,
          creativeAName: a.name,
          creativeBName: b.name,
          distance: 0,
          type: "exact",
        });
        flags.push({
          id: `dup_exact_${a.id}_${b.id}`,
          severity: "error",
          module: "creative",
          platform: "all",
          message: `Exact duplicate: "${a.name}" and "${b.name}" are identical files.`,
          recommendation: "Remove duplicate assets to avoid wasted spend and ad disapproval.",
        });
        continue;
      }

      const sameSize = a.size && b.size && a.size === b.size;
      const similarWeight =
        a.fileSize && b.fileSize && Math.abs(a.fileSize - b.fileSize) < 2048;

      if (
        a.perceptualHash &&
        b.perceptualHash &&
        hammingDistance(a.perceptualHash, b.perceptualHash) <= 10
      ) {
        pairs.push({
          creativeAId: a.id,
          creativeBId: b.id,
          creativeAName: a.name,
          creativeBName: b.name,
          distance: hammingDistance(a.perceptualHash, b.perceptualHash),
          type: "near",
        });
        flags.push({
          id: `dup_near_${a.id}_${b.id}`,
          severity: "warning",
          module: "creative",
          platform: "all",
          message: `Near-duplicate detected: "${a.name}" and "${b.name}" appear visually similar.`,
          recommendation: "Review side-by-side — resize/recompress variants may not add inventory value.",
        });
      } else if (sameSize && similarWeight && a.name === b.name) {
        flags.push({
          id: `dup_suspect_${a.id}_${b.id}`,
          severity: "warning",
          module: "creative",
          platform: "all",
          message: `"${a.name}" and "${b.name}" share size and file weight — possible duplicate.`,
          recommendation: "Confirm these are intentionally different assets.",
        });
      }
    }
  }

  if (creatives.length > 1 && pairs.length === 0) {
    flags.push({
      id: "dup_none",
      severity: "pass",
      module: "creative",
      platform: "all",
      message: "No duplicate creatives detected in this upload set.",
    });
  }

  return { flags, pairs };
}

export function detectWrongCreativeFlags(
  creatives: CreativeValidationInput[],
  campaignName: string,
  vertical?: string,
): ValidationFlag[] {
  const flags: ValidationFlag[] = [];
  const deprecatedPattern = /(old|v1|dont_use|deprecated|archive|backup|test)/i;

  for (const creative of creatives) {
    if (deprecatedPattern.test(creative.name)) {
      flags.push({
        id: `wrong_filename_${creative.id}`,
        severity: "warning",
        module: "alignment",
        platform: "all",
        message: `Filename "${creative.name}" suggests a deprecated asset.`,
        recommendation: "Confirm this is the current approved creative before launch.",
      });
    }
  }

  if (campaignName && vertical) {
    const campaignLower = campaignName.toLowerCase();
    const verticalLower = vertical.toLowerCase();
    if (
      campaignLower.includes("auto") &&
      verticalLower.includes("health")
    ) {
      flags.push({
        id: "campaign_vertical_mismatch",
        severity: "warning",
        module: "alignment",
        platform: "all",
        message: "Campaign name and selected vertical may not align.",
        recommendation: "Verify campaign naming matches the selected industry vertical.",
      });
    }
  }

  return flags;
}

export function convertLegacyValidationIssues(
  creative: CreativeValidationInput,
  platform: "programmatic" | "meta" | "google",
): ValidationFlag[] {
  const issues = creative.validation?.issues || [];
  return issues.map((issue, index) => ({
    id: `legacy_${creative.id}_${index}`,
    severity: issue.severity === "high" ? "error" : issue.severity === "medium" ? "warning" : "pass",
    module: "creative" as const,
    platform,
    message: issue.message || "Creative validation issue",
    recommendation: issue.recommendation,
    detail: issue.type,
  }));
}
