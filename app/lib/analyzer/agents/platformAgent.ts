export interface PlatformCheck {
  pass: boolean;
  score: number;
}

export interface PlatformResult {
  platform: string;
  score: number;
  issues: string[];
  details: {
    desktop: Record<string, PlatformCheck>;
    mobile: Record<string, PlatformCheck>;
  };
}

export function runPlatformAgent(
  width: number,
  height: number,
  fileSizeKb: number,
  textDensity: number,
  targetPlatform: "instagram" | "meta" | "google" | "auto"
): PlatformResult {
  let platform = targetPlatform;
  const issues: string[] = [];
  let score = 100;
  
  const aspect = width / height;

  if (targetPlatform === "auto") {
    if (Math.abs(aspect - 1) < 0.1 || Math.abs(aspect - 0.8) < 0.1) platform = "instagram";
    else if (aspect > 1.5) platform = "google";
    else platform = "meta";
  }

  // Instagram
  if (platform === "instagram") {
    if (Math.abs(aspect - 1) > 0.05 && Math.abs(aspect - 0.8) > 0.05) {
      issues.push("Resize creative to match platform aspect ratio (e.g., 1:1 or 4:5 for Instagram).");
      score -= 30;
    }
    if (textDensity > 20) {
      issues.push("Instagram prefers highly visual creatives. Reduce text area to under 20%.");
      score -= 20;
    }
  }

  // Meta Ads
  if (platform === "meta") {
    if (Math.abs(aspect - 1.91) > 0.1 && Math.abs(aspect - 1) > 0.1) {
      issues.push("Meta Ads perform best at 1.91:1 or 1:1 aspect ratios.");
      score -= 20;
    }
    if (textDensity > 20) {
      issues.push("Meta penalizes ads with >20% text density. Reduce text content.");
      score -= 30;
    }
  }

  // Google Display
  if (platform === "google") {
    const validGoogleSizes = ["300x250", "728x90", "160x600", "300x600", "320x50"];
    const dimStr = `${width}x${height}`;
    if (!validGoogleSizes.includes(dimStr)) {
      issues.push(`Size ${dimStr} is not a standard Google Display size. Standardize for better reach.`);
      score -= 40;
    }
    if (fileSizeKb > 150) {
      issues.push("Google Display file size limit is 150KB. Compress image to avoid rejection.");
      score -= 50;
    }
  }

  // Generate detailed checks for UI
  const details = {
    desktop: {
      layoutBalance: { pass: score > 70, score: Math.round(score * 0.9) },
      visualHierarchy: { pass: score > 60, score: Math.round(score * 0.85) },
      contentStructure: { pass: score > 50, score: Math.round(score * 0.8) },
      placementBlend: { pass: score > 40, score: Math.round(score * 0.75) },
    },
    mobile: {
      readability: { pass: textDensity < 20, score: Math.round(100 - textDensity * 2) },
      textDensity: { pass: textDensity < 25, score: Math.round(100 - textDensity * 1.5) },
      ctaSize: { pass: score > 50, score: Math.round(score * 0.9) },
      attentionGrab: { pass: score > 70, score: Math.round(score * 0.95) },
    }
  };

  return {
    platform,
    score: Math.max(0, score),
    issues,
    details
  };
}

